import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Prosemirror } from 'meteor/prosemeteor:prosemirror'
import { Prosepipe } from 'meteor/prosemeteor:prosemirror'


import './main.html';
export const Documents = new Mongo.Collection('Documents');

Template.prosemeteor.onCreated(function helloOnCreated() {
  
  this.msg = new ReactiveVar("");
  if(Prosemirror) {
    this.msg.set("Prosemirror has loaded successfully");
  } else {
    this.msg.set("Prosemirror has NOT loaded successfully");
  };

});



Template.prosemeteor.onRendered(function helloOnCreated() {
  let editor = new Prosemirror({
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
  
  // for now we'll just get the document manually

  Prosepipe.emit('docRequest', 'idofdoc');
  Prosepipe.on('docResponse', (doc) => {
    console.log(doc);
  });


  // editor.setDoc(editor.schema.nodeFromJSON(data.doc))
  // editor.setOption("collab", {version: data.version})
  // this.collab = this.pm.mod.collab




  // const collab = editor.mod.collab

  function send() {
    var data = collab.sendableSteps()
    authority.receiveSteps(data.version, data.steps, data.clientID)
  }
  

  // collab.on("mustSend", send)


});

Template.prosemeteor.helpers({
  msg() {
    return Template.instance().msg.get();
  },
});




Template.prosemeteor.onCreated(function helloOnCreated() {
  
  this.msg = new ReactiveVar("");
  if(Prosemirror) {
    this.msg.set("Prosemirror has loaded successfully");
  } else {
    this.msg.set("Prosemirror has NOT loaded successfully");
  };
  console.log(this.msg.get());
});