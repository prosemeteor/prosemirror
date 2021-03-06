import { Meteor } from 'meteor/meteor';
import { ProseMirror } from 'prosemirror/dist/edit';
import 'prosemirror/dist/inputrules/autoinput';
import 'prosemirror/dist/menu/tooltipmenu';
import 'prosemirror/dist/menu/menubar';
import 'prosemirror/dist/collab';
import { defaultSchema } from 'prosemirror/dist/model/defaultschema';
import { Step } from 'prosemirror/dist/transform';
import { StreamerManager } from './streamer-manager';
import { generateEventName } from './../../streamer-util/both/streamer-util';
import { STREAMER_EVENTS } from './../../streamer-util/both/event-names';

// share streamerManager across all class instances
const streamerManager = new StreamerManager('prosemirror-pipe');

export default class CollabEditor {
  constructor ({
    docId,
    groupId = null,
    proseMirrorOptions,
    onDocActivityTimeout = () => {},     // default doc activity timeout callback to no-op
    onAuthenticationError = () => {}               // default auth error callback to no-op
  }) {
    this.docId = docId;
    this.groupId = groupId;
    this.proseMirrorOptions = proseMirrorOptions;
    this.streamerManager = streamerManager;
    this.streamerClient = undefined;
    this.ddpConnection = undefined;
    this.isEditing = true;

    // bind class methods
    this.setupEditor = this.setupEditor.bind(this);
    this.createEditor = this.createEditor.bind(this);
    this.sendStepsToAuthority = this.sendStepsToAuthority.bind(this);
    this.receiveNewStepsFromAuthority = this.receiveNewStepsFromAuthority.bind(this);
    this.handleDocActivityTimeout = this.handleDocActivityTimeout.bind(this);
    this.handleAuthenticationError = this.handleAuthenticationError.bind(this);
    this.onDocActivityTimeout = onDocActivityTimeout;
    this.onAuthenticationError = onAuthenticationError;

    this.setupEditor();
  }

  /**
  * Gets the latest doc state and creates an editor with it.
  */
  setupEditor () {
    let self = this;

    // tell the AuthorityManager to open the doc
    Meteor.call('ProseMeteor.openDoc', {
      docId: self.docId,
      groupId: self.groupId
    }, (err, authorityUrl) => {
      if (err) {
        console.error('CollabEditor authority openDoc error:', err);
        // TODO: handle error
        throw err;
      }
      console.log(`${this.docId}: CollabEditor opened doc and creating ddp connection to authority url ${authorityUrl}`);
      const streamer = this.streamerManager.get(authorityUrl);
      self.ddpConnection = streamer.ddpConnection;
      self.streamerClient = streamer.streamerClient;
      console.log(`${this.docId}: CollabEditor stored ddp connection successfully`);

      // listen for and handle auth error. listener creation needs to happen before editor
      // setup because setup will fail if not authenticated
      const authenticationErrorEventName = generateEventName({
        name: STREAMER_EVENTS.AUTHORITY_AUTHENTICATION_ERROR,
        params: {
          docId: this.docId
        }
      });
      this.streamerClient.on(authenticationErrorEventName, this.handleAuthenticationError);

      // the authority is ready. get the latest doc state
      self.ddpConnection.call('ProseMeteor.latestDocState', {
        docId: self.docId
      }, (err, latestDocState) => {
        if (err) {
          console.error(`${this.docId} CollabEditor get latestDocState error: ${err}`);
          // TODO: handle error
        }
        if (!latestDocState) {
          // auth error happened and will be reported with another event
          return;
        }
        console.log(`${this.docId}: CollabEditor got latestDocState: ${JSON.stringify(latestDocState, null, 2)}`);

        // create an editor with the latest state
        self.createEditor(latestDocState);
      });
    });
  }

  /**
  * Creates a ProseMirror editor instance.
  * @param {Object} params
  * @param {Number} params.version     the doc's current version
  * @param {Object} params.docJSON     the doc's state represented as JS object
  */
  createEditor ({ version, docJSON }) {
    console.log(`${this.docId}: Creating collab editor for doc ${this.docId} with version: ${version}`);
    this.editor = new ProseMirror({
      ...this.proseMirrorOptions,
      collab: {
        version
      },
      doc: defaultSchema.nodeFromJSON(docJSON)
    });
    this.collab = this.editor.mod.collab;

    // respond to collab send event by sending local steps to authority
    this.collab.on('mustSend', this.sendStepsToAuthority);

    const newStepsEventName = generateEventName({
      name: STREAMER_EVENTS.AUTHORITY_NEW_STEPS,
      params: {
        docId: this.docId
      }
    });
    const docActivityTimeoutEventName = generateEventName({
      name: STREAMER_EVENTS.AUTHORITY_DOC_ACTIVITY_TIMEOUT,
      params: {
        docId: this.docId
      }
    });
    // when authority notifies client that there's new steps, receive them
    this.streamerClient.on(newStepsEventName, this.receiveNewStepsFromAuthority);
    // when authority notifies client of doc activity time out, handle it
    this.streamerClient.on(docActivityTimeoutEventName, this.handleDocActivityTimeout);
  }

  /**
   * Sends new steps to Authority.
   */
  sendStepsToAuthority () {
    if (!this.isEditing) {
      return;
    }
    const data = this.collab.sendableSteps();
    console.log(`${this.docId}: CollabEditor sendStepsToAuthority(), data=${JSON.stringify(data, null, 2)}`);
    // convert to JSON so we can send it over the wire
    const stepsJSON = data.steps.map((step) => {
      return step.toJSON();
    });

    this.ddpConnection.call('ProseMeteor.clientSubmitSteps', {
      docId: this.docId,
      version: data.version,
      stepsJSON,
      clientId: data.clientID   // renaming ID to Id to follow Meteor paradigm (i.e. Meteor.userId())
    });
  }

  /**
   * Requests new steps from the Authority and applies them to local state.
   */
  receiveNewStepsFromAuthority () {
    if (!this.isEditing) {
      return;
    }
    let self = this;
    // get the steps since local version from authority
    this.ddpConnection.call('ProseMeteor.stepsSince', {
      docId: self.docId,
      version: self.collab.version
    }, function (err, newData) {
      if (err) {
        console.error(`${self.docId} CollabEditor get steps from Authority since v${self.collab.version}, error: ${err}`);
        // TODO: handle error
      }
      let parsedNewData = JSON.parse(newData);
      console.log(`${self.docId}: CollabEditor got steps from Authority since v${self.collab.version}`);

      let { steps, clientIds } = parsedNewData;
      // convert steps to Step instances
      const stepObjects = steps.map((step) => {
        return Step.fromJSON(defaultSchema, step);
      });
      // apply steps to local doc
      self.collab.receive(stepObjects, clientIds);

      // if there are any local steps not sent up, send them
      if (self.collab.hasSendableSteps()) {
        self.sendStepsToAuthority();
      }
    });
  }

  /**
   * Handle the Authority doc activity timeout. Calls handler function.
   */
  handleDocActivityTimeout () {
    this.isEditing = false;
    this.onDocActivityTimeout({ docId: this.docId });
  }

  /**
   * Handle Authority authentication. Calls handler function.
   */
  handleAuthenticationError ({ userId, type, docId }) {
    this.onAuthenticationError({ userId, type, docId });
  }
}
