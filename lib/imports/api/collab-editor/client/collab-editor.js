import { Meteor } from 'meteor/meteor';
import { ProseMirror } from './../../../prosemirror/dist/edit';
import './../../../prosemirror/dist/inputrules/autoinput';
import './../../../prosemirror/dist/menu/tooltipmenu';
import './../../../prosemirror/dist/menu/menubar';
import './../../../prosemirror/dist/collab';
import { defaultSchema } from './../../../prosemirror/dist/model/defaultschema';
import { Step } from './../../../prosemirror/dist/transform';

// share a global streamerClient across all CollabEditors
const streamerClient = new Meteor.Streamer('prosemirror-pipe');

export default class CollabEditor {
  constructor({ docId, proseMirrorOptions }) {
    this.docId = docId;
    this.proseMirrorOptions = proseMirrorOptions;
    this.streamerClient = streamerClient;
    this.setupEditor();
  }

  /**
  * Gets the latest doc state and creates an editor with it.
  */
  setupEditor() {
    let self = this;

    // tell the AuthorityManager to open the doc
    Meteor.call('ProseMeteor.openDoc', {
      docId: self.docId
    }, function(err) {
      if (err) {
        console.error('CollabEditor authority openDoc error:', err);
        // TODO: handle error
      }
      // the authority is ready. get the latest doc state
      Meteor.call('ProseMeteor.latestDocState', {
        docId: self.docId
      }, function (err, latestDocState) {
        if (err) {
          console.error('CollabEditor get latestDocState error:', err);
          // TODO: handle error
        }
        console.log('CollabEditor got latestDocState:', latestDocState);

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
  createEditor({ version, docJSON }) {
    console.log('Creating collab editor with doc version: ' + version);
    this.editor = new ProseMirror({
      ...this.proseMirrorOptions,
      collab: {
        version
      },
      doc: defaultSchema.nodeFromJSON(docJSON)
    });
    this.collab = this.editor.mod.collab;

    // respond to collab send event by sending local steps to authority
    this.collab.on('mustSend', this.sendStepsToAuthority.bind(this));

    // when authortiy tells us there's new steps, receieve them
    this.streamerClient.on('authorityNewSteps', this.receieveNewStepsFromAuthority.bind(this));
  }

  sendStepsToAuthority() {
    const data = this.collab.sendableSteps();
    console.log('CollabEditor sendStepsToAuthority(), data=', data);
    // convert to JSON so we can send it over the wire
    const stepsJSON = data.steps.map((step) => {
      return step.toJSON();
    });

    let self = this;

    Meteor.call('ProseMeteor.clientSubmitSteps', {
      docId: self.docId,
      version: data.version,
      stepsJSON,
      clientId: data.clientID   // renaming ID to Id to follow Meteor paradigm (i.e. Meteor.userId())
    });
  }

  receieveNewStepsFromAuthority() {
    let self = this;
    // get the steps since local version from authority
    Meteor.call('ProseMeteor.stepsSince', {
      docId: self.docId,
      version: self.collab.version
    }, function (err, newData) {
      if (err) {
        console.error('CollabEditor get steps from Authority since v' + self.collab.version + ' error:', err);
        // TODO: handle error
      }
      let parsedNewData = JSON.parse(newData);
      console.log('CollabEditor got steps from Authority since v' + self.collab.version);

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
  //   Meteor.call('ProseMeteor.latestDocState', {
  //     docId: this.docId
  //   }, function (err, latestDocState) {
  //     if (err) {
  //       console.error('CollabEditor get latestDocState error:', err);
  //       // TODO: handle error
  //     }
  //     console.log('CollabEditor got latestDocState:', latestDocState);
  //
  //     // create an editor with the latest state
  //     self.createEditor(latestDocState)
  //   });
  // }
}
