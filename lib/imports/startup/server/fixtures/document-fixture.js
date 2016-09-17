import { Meteor } from 'meteor/meteor';
import { createEmptyDoc } from './../../../api/documents/both/methods';
import { documentsColl } from './../../../api/documents/both/collection';

// if the database is empty on server start, create some sample data.
Meteor.startup(() => {
  // documentsColl.remove({});
  if (documentsColl.find().count() === 0) {
    // create two empty docs for the PoC, to show that AuthorityManager can handle multiple Authorities. hardcode ids for now
    createEmptyDoc.call({
      docId: 'proofOfConceptDocId1',
      textContent: 'Demo 1, you can edit this text!',
      groupId: 'demoGroupId'
    }, (err, res) => {
      if (err) {
        console.error('Error while inserting empty doc:', err);
      }
    });

    createEmptyDoc.call({
      docId: 'proofOfConceptDocId2',
      textContent: 'Demo 2, you can edit this text!',
      groupId: 'demoGroupId'
    }, (err, res) => {
      if (err) {
        console.error('Error while inserting empty doc:', err);
      }
    });
  }
});
