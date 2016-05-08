import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Prosemirror } from 'meteor/prosemeteor:prosemirror'

console.log(Prosemirror)

import './main.html';

Template.prosemeteor.onCreated(function helloOnCreated() {
  this.msg = new ReactiveVar("");
  if(Prosemirror) {
    this.msg.set("Prosemirror has loaded successfully");
  } else {
    this.msg.set("Prosemirror has NOT loaded successfully");
  };
  console.log(this.msg.get());
});


Template.prosemeteor.onRendered(function helloOnCreated() {
  console.log(document.querySelector(".full"));
  let editor = new Prosemirror({
    place: document.querySelector(".full"),
    menuBar: true,
    autoInput: true,
    tooltipMenu: {selectedBlockMenu: true},
    doc: "Placeholder content",
    docFormat: "html"
  });

});

Template.prosemeteor.helpers({
  msg() {
    return Template.instance().msg.get();
  },
});