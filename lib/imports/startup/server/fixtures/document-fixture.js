import { Meteor } from 'meteor/meteor';
import { createEmptyDoc } from './../../../api/documents/both/methods';
import { documentsColl } from './../../../api/documents/both/collection';

// if the database is empty on server start, create some sample data.
Meteor.startup(() => {
  // create a single empty doc for the proof of concept. hard coding _id for now
  documentsColl.remove({});
  if (documentsColl.find().count() === 0) {
    createEmptyDoc.call({
      docId: 'proofOfConceptDocId'
    }, (err, res) => {
      if (err) {
        console.error('Error while inserting empty doc:', err);
      }
    });
  }
});
