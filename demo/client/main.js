import { ProseMeteorEditor } from 'meteor/prosemeteor:prosemirror';
import { Meteor } from 'meteor/meteor';

Meteor.startup(function() {
  let editor1 = new ProseMeteorEditor({
    docId: 'proofOfConceptDocId1',
    proseMirrorOptions: {
      place: document.getElementById('prosemeteor-poc-1'),
      menuBar: true,
      autoInput: true,
      tooltipMenu: {selectedBlockMenu: true}
    }
  });

  let editor2 = new ProseMeteorEditor({
    docId: 'proofOfConceptDocId2',
    proseMirrorOptions: {
      place: document.getElementById('prosemeteor-poc-2'),
      menuBar: true,
      autoInput: true,
      tooltipMenu: {selectedBlockMenu: true}
    }
  });
});


//
//
// import './main.html';
//
// Template.prosemeteor.onCreated(function onCreated() {
//   this.msg = new ReactiveVar("");
//   if(ProseMeteorEditor) {
//     this.msg.set("Prosemirror has loaded successfully");
//   } else {
//     this.msg.set("Prosemirror has NOT loaded successfully");
//   };
// });
//
// Template.prosemeteor.helpers({
//   msg() {
//     return Template.instance().msg.get();
//   },
// });
//
//
// Template.prosemeteor.onRendered(function onRendered() {
//   let editor = new ProseMeteorEditor({
//     docId: 'proofOfConceptDocId1',
//     proseMirrorOptions: {
//       place: document.querySelector(".full"),
//       menuBar: true,
//       autoInput: true,
//       tooltipMenu: {selectedBlockMenu: true}
//     }
//   });
//   // above should use plugin from Prosemeteor package with option enabled
//   // prosemeteor plugin takes the desired document id as a parameter
//   // that plugin that wraps the Prosemeteor instance with the collab module as the website demo does:
//   // https://github.com/ProseMirror/website/blob/master/src/demo/collab/client/collab.js#L50
//
// });
