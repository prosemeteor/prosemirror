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
    this.streamerClient = new Meteor.Streamer('prosemirror-steps');

    // streamer doc request test
    this.streamerClient.emit('docRequest', 'idofdoc');
    this.streamerClient.on('docResponse', (doc) => {
      console.log('client got received docResponse from server:', doc);
    });

    // respond to collab send event
    this.collab.on('mustSend', () => {
      const data = this.collab.sendableSteps();
      console.log('CollabEditor send(), data=', data);
      // convert to JSON so we can send it over the wire
      const steps = data.steps.map((step) => {
        return step.toJSON();
      });
      this.streamerClient.emit('clientSubmitSteps', {
        version: data.version,
        steps,
        clientId: data.clientID   // renaming ID to Id to follow Meteor paradigm (i.e. Meteor.userId())
      });
    });
  }
}
