import { Meteor } from 'meteor/meteor';
import { documentsColl } from './../../api/documents/both/collection'
import { AuthorityManager } from './../../api/authority/server/authority-manager';


// data fixtures
import './fixtures/document-fixture';

console.log('prosemeteor server startup');

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
authorityManager.openDoc({ docId: 'proofOfConceptDocId' });
