import { Meteor } from 'meteor/meteor';
import { documentsColl } from './../../api/documents/both/collection'
import { ProseMeteorAuthorityManager } from './../../api/authority/server/authority-manager';
import { getSingleDoc } from './../../api/documents/both/methods';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

// data fixtures
import './fixtures/document-fixture';

console.log('prosemeteor server startup');

// create streamer for event communication with client
const streamerServer = new Meteor.Streamer('prosemirror-steps', { retransmit : false });
streamerServer.allowRead('all');
streamerServer.allowWrite('all');

// create an authority
const authorityManager = new ProseMeteorAuthorityManager(documentsColl, streamerServer);

// for the proof of concept, there's only a single document. fetch it, and tell the
// authority manager to open it (creates a new authority for that doc)
getSingleDoc.call((err, doc) => {
	if (err) {
		console.error('Server index, getSingleDoc err');
	}
	// tell authority manager to open the single doc
	authorityManager.openDoc(doc._id);
});
