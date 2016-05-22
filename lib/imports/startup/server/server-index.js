import { Meteor } from 'meteor/meteor';
import { documentsColl } from './../../api/documents/both/collection'
import { AuthorityManager } from './../../api/authority/server/authority-manager';
import { check } from 'meteor/check';

// data fixtures
import './fixtures/document-fixture';

// create streamer for event communication with client
const streamerServer = new Meteor.Streamer('prosemirror-steps', { retransmit : false });
streamerServer.allowRead('all');
streamerServer.allowWrite('all');

// create an authority
const authorityManager = new AuthorityManager({
  documentsCollection: documentsColl,
  streamer: streamerServer
});

// tell authority manager to open the single doc for the proof of concept, which
// will create an authority to handle the doc


// set up a method to let clients open a doc, which tells the AuthorityManager
// to create a new Authority to start tracking the doc
// NOTE: this should probably be moved somewhere else after PoC
Meteor.methods({
  'ProseMeteor.openDoc'({ docId }) {
    check(docId, String);
    authorityManager.openDoc({ docId });
  }
});
