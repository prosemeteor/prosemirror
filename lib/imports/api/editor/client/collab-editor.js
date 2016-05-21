import { Meteor } from 'meteor/meteor';
import { ProseMirror } from './../../../prosemirror/dist/edit'
import './../../../prosemirror/dist/inputrules/autoinput'
import './../../../prosemirror/dist/menu/tooltipmenu'
import './../../../prosemirror/dist/menu/menubar'
import './../../../prosemirror/dist/collab'



export default class CollabEditor {
  constructor(proseMirrorOptions) {
    this.editor = new ProseMirror({
      ...proseMirrorOptions,
      collab: { version: 0 }
    });
    this.collab = this.editor.mod.collab;
    this.streamer = new Meteor.Streamer('prosemirror-steps');

    // streamer doc request test
    this.streamer.on('docResponse', (doc) => {
      console.log('client got received docResponse from server:', doc);
    });
    this.streamer.emit('docRequest', 'idofdoc');

    this.streamer.on('authorityNewSteps', () => {
      console.log('authority got new steps');

    });

    // respond to collab send event
    this.collab.on('mustSend', () => {
      const data = this.collab.sendableSteps();
      console.log('CollabEditor send(), data=', data);
      // convert to JSON so we can send it over the wire
      const steps = data.steps.map((step) => {
        return step.toJSON();
      });
      this.streamer.emit('clientSubmitSteps', {
        version: data.version,
        steps,
        clientId: data.clientID   // renaming ID to Id to follow Meteor paradigm (i.e. Meteor.userId())
      });
    });
  }
}
