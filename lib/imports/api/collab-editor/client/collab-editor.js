import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import { ProseMirror } from './../../../prosemirror/dist/edit'
import './../../../prosemirror/dist/inputrules/autoinput'
import './../../../prosemirror/dist/menu/tooltipmenu'
import './../../../prosemirror/dist/menu/menubar'
import './../../../prosemirror/dist/collab'
import { defaultSchema } from './../../../prosemirror/dist/model/defaultschema';
import { Step } from './../../../prosemirror/dist/transform';

import { getLatestDocSnapshot } from './../../documents/both/methods';

export default class CollabEditor {
  constructor({ docId, proseMirrorOptions }) {
    this.docId = docId;
    this.proseMirrorOptions = proseMirrorOptions;
    this.streamerClient = new Meteor.Streamer('prosemirror-steps');

    // request the latest doc state via http method
    HTTP.get('latestDocState/' + this.docId, {}, (err, response) => {
      if (err) {
        console.error('CollabEditor get latestDocState error:', err);
      }
      let latestDocState = JSON.parse(response.content);
      console.log('CollabEditor got latestDocState:', latestDocState);
      this.createEditor(latestDocState)
    });
  }

  createEditor({ version, docJSON }) {
    console.log('client got latestDocStateResponse, constructing ProseMirror');

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
    this.streamerClient.on('authorityNewSteps', this.receieveStepsFromAuthority.bind(this));

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
