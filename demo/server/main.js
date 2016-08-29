import { Meteor } from 'meteor/meteor';
import { ProseMeteorServer } from 'meteor/prosemeteor:prosemirror';

Meteor.startup(() => {
  // code to run on server at startup
});

// setup ProseMeteor on server
let proseMeteorServer = new ProseMeteorServer({
  snapshotIntervalMs: 5000,
  protocol: 'http'
 });
