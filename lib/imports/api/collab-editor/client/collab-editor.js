import { Meteor } from 'meteor/meteor';
import { ProseMirror } from './../../../prosemirror/dist/edit';
import './../../../prosemirror/dist/inputrules/autoinput';
import './../../../prosemirror/dist/menu/tooltipmenu';
import './../../../prosemirror/dist/menu/menubar';
import './../../../prosemirror/dist/collab';
import { defaultSchema } from './../../../prosemirror/dist/model/defaultschema';
import { Step } from './../../../prosemirror/dist/transform';
import { StreamerManager } from './streamer-manager';

// share streamerManager across all class instances
const streamerManager = new StreamerManager('prosemirror-pipe');

export default class CollabEditor {
  constructor ({ docId, groupId = null, proseMirrorOptions }) {
    this.docId = docId;
    this.groupId = groupId;
    this.proseMirrorOptions = proseMirrorOptions;
    this.streamerManager = streamerManager;
    this.streamerClient = undefined;
    this.ddpConnection = undefined;

    // bind class methods
    this.setupEditor = this.setupEditor.bind(this);
    this.createEditor = this.createEditor.bind(this);
    this.sendStepsToAuthority = this.sendStepsToAuthority.bind(this);
    this.receieveNewStepsFromAuthority = this.receieveNewStepsFromAuthority.bind(this);

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
      }
      console.log(`${this.docId}: CollabEditor opened doc and creating ddp connection to authority url ${authorityUrl}`);
      const streamer = this.streamerManager.get(authorityUrl);
      self.ddpConnection = streamer.ddpConnection;
      self.streamerClient = streamer.streamerClient;
      console.log(`${this.docId}: CollabEditor stored ddp connection successfully`);
      // the authority is ready. get the latest doc state
      self.ddpConnection.call('ProseMeteor.latestDocState', {
        docId: self.docId
      }, (err, latestDocState) => {
        if (err) {
          console.error(`${this.docId} CollabEditor get latestDocState error: ${err}`);
          // TODO: handle error
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
    console.log(`${this.docId}: Creating collab editor with doc version: ${version}`);
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

    // when authortiy tells us there's new steps, receieve them
    this.streamerClient.on('authorityNewSteps', this.receieveNewStepsFromAuthority);
  }

  sendStepsToAuthority () {
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

  receieveNewStepsFromAuthority () {
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
}
