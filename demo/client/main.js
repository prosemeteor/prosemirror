import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Prosemirror } from 'meteor/prosemeteor:prosemirror'


import './main.html';

Template.prosemeteor.onCreated(function helloOnCreated() {
  this.msg = new ReactiveVar("");
  if(Prosemirror) {
    this.msg.set("Prosemirror has loaded successfully");
  } else {
    this.msg.set("Prosemirror has NOT loaded successfully");
  };
  console.log(this.msg.get());

  let editor = new Prosemirror({
    place: document.body,
    menuBar: true
  });

});

Template.prosemeteor.helpers({
  msg() {
    return Template.instance().msg.get();
  },
});