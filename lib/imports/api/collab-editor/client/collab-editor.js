import { Meteor } from 'meteor/meteor';
import { ProseMirror } from './../../../prosemirror/dist/edit'
import './../../../prosemirror/dist/inputrules/autoinput'
import './../../../prosemirror/dist/menu/tooltipmenu'
import './../../../prosemirror/dist/menu/menubar'
import './../../../prosemirror/dist/collab'
import { defaultSchema } from './../../../prosemirror/dist/model/defaultschema';
import { Step } from './../../../prosemirror/dist/transform';

import { getSingleDoc } from './../../documents/both/methods';

export default class CollabEditor {
  constructor(proseMirrorOptions) {
    // get the single document from the server. proof of concept just has one doc in the db
    // for simplicity
    getSingleDoc.call((err, documentNode) => {
      if (err) {
        console.error('CollabEditor error getting single doc:', err);
      }
      console.log('CollabEditor got single doc:', documentNode);

      this.docId = documentNode._id;
      this.editor = new ProseMirror({
        ...proseMirrorOptions,
        collab: { version: 0 },
        doc: defaultSchema.nodeFromJSON(documentNode)
      });
      this.collab = this.editor.mod.collab;
      this.streamerClient = new Meteor.Streamer('prosemirror-steps');

      // when authortiy tells us
      this.streamerClient.on('authorityNewSteps', this.receieveStepsFromAuthority.bind(this));

      // respond to collab send event
      this.collab.on('mustSend', this.sendStepsToAuthority.bind(this));
    });
  }

  sendStepsToAuthority() {
    const data = this.collab.sendableSteps();
    console.log('CollabEditor sendStepsToAuthority(), data=', data);
    // convert to JSON so we can send it over the wire
    const steps = data.steps.map((step) => {
      return step.toJSON();
    });
    this.streamerClient.emit('clientSubmitSteps', {
      version: data.version,
      steps,
      clientId: data.clientID   // renaming ID to Id to follow Meteor paradigm (i.e. Meteor.userId())
    });
  }
  receieveStepsFromAuthority(res) {
    // parse it
    let newData = JSON.parse(res);
    let { steps, clientIds } = newData;
    // convert steps to Step instances
    const stepObjects = steps.map((step) => {
      return Step.fromJSON(defaultSchema, step);
    });
    console.log('received new steps from authority');
    this.collab.receive(stepObjects, clientIds);

    console.log('---collab hasSendableSteps()?', this.collab.hasSendableSteps());
  }
}
