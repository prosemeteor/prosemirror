import { check, Match } from 'meteor/check';
import { documentsColl } from './collection';
import { defaultSchema as schema } from './../../../prosemirror/dist/model';
import { Random } from 'meteor/random';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

export const storeDocSnapshot = new ValidatedMethod({
  name: 'documents.storeDocSnapshot',
  validate (args) {
    check(args, {
      docId: String,
      version: Number,
      docJSON: Object
    });
  },
  run ({ docId, docJSON, version }) {
    const documentSnapsot = {
      docId,
      version,
      docJSON,
      timestamp: Date.now()
    };
    return documentsColl.insert(documentSnapsot);
  }
});

export const createEmptyDoc = new ValidatedMethod({
  name: 'documents.createEmptyDoc',
  validate (args) {
    check(args, {
      // can provide docId as string, or leave empty
      docId: Match.Maybe(String),
      // can provide text content, or leave emtpy to use default
      textContent: Match.Maybe(String),
      groupId: Match.Maybe(String)
    });
  },
  run ({
    docId = Random.id(),    // generate random docId of none provided
    groupId = null,
    textContent = 'You can edit this text!'
  }) {
    // create an empty doc with version 0
    let fixtureDoc = schema.node('doc', null, [schema.node('paragraph', null, [
      schema.text(textContent)
    ])]);
    let fixtureDocJSON = fixtureDoc.toJSON();

    let documentSnapshot = {
      docId,
      groupId,
      docJSON: fixtureDocJSON,
      version: 0,
      timestamp: Date.now()
    };

    const _id = documentsColl.insert(documentSnapshot);
    let snapshotWithId = {
      _id,
      ...documentSnapshot
    };
    console.log('Inserted an empty doc into the prosemeteor-documents collection');
    return snapshotWithId;
  }
});

export const getLatestDocSnapshot = new ValidatedMethod({
  name: 'documents.getLatestDocSnapshot',
  validate (args) {
    check(args, {
      docId: String
    });
  },
  run ({ docId }) {
    return documentsColl.findOne({ docId }, { sort: { timestamp: -1 } });
  }
});
