import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ProseMeteorEditor } from 'meteor/prosemeteor:prosemirror'

import './main.html';

Template.prosemeteor.onCreated(function helloOnCreated() {
  this.msg = new ReactiveVar("");
  if(ProseMeteorEditor) {
    this.msg.set("Prosemirror has loaded successfully");
  } else {
    this.msg.set("Prosemirror has NOT loaded successfully");
  };
});

Template.prosemeteor.helpers({
  msg() {
    return Template.instance().msg.get();
  },
});


Template.prosemeteor.onRendered(function helloOnCreated() {
  let editor = new ProseMeteorEditor({
    place: document.querySelector(".full"),
    menuBar: true,
    autoInput: true,
    tooltipMenu: {selectedBlockMenu: true},
    doc: "Placeholder content",
    docFormat: "html",
  });
  // above should use plugin from Prosemeteor package with option enabled
  // prosemeteor plugin takes the desired document id as a parameter
  // that plugin that wraps the Prosemeteor instance with the collab module as the website demo does:
  // https://github.com/ProseMirror/website/blob/master/src/demo/collab/client/collab.js#L50

});
