import { check, Match } from 'meteor/check';
import { documentsColl } from './collection';
import { defaultSchema as schema } from './../../../prosemirror/dist/model';
import { Random } from 'meteor/random';

// export const storeDocSnapshot = new ValidatedMethod({
//   name: 'documents.storeDocSnapshot',
//   validate(args) {
//     check(args, {
//       docId: String,
//       version: Number,
//       doc: Object
//     });
//   },
//   run({ docId, version, doc }) {
//     let documentSnapsot = {
//       version,
//       doc,
//       docId,
//     }
//     return documentsColl.insert();
//   }
// });

export const createEmptyDoc = new ValidatedMethod({
  name: 'documents.createEmptyDoc',
  validate(args) {
    check(args, {
      // can provide docId as string, or leave empty
      docId: Match.Optional(String),
      // can provide text content, or leave emtpy to use default
      textConcent: Match.Optional(String)
    });
  },
  run(args) {
    // create an empty doc with version 0
    let fixtureDoc = schema.node("doc", null, [schema.node("paragraph", null, [
      schema.text(args.textConcent || "You can edit this text!")
    ])]);
    let fixtureDocJSON = fixtureDoc.toJSON();

    // if a docId was provided, use it. othwerise generate a random docId
    let docId = args.docId || Random.id();

    let documentSnapshot = {
      docId,
      docJSON: fixtureDocJSON,
      version: 0,
      timestamp: Date.now()
    };

    const _id = documentsColl.insert(documentSnapshot);
    let snapshotWithId = {
      _id,
      ...documentSnapshot
    };
    console.log('Inserted the following doc into the Documents collection:');
    console.log(JSON.stringify(snapshotWithId, null, 2));
    return snapshotWithId;
  }
});

export const getLatestDocSnapshot = new ValidatedMethod({
  name: 'documents.getLatestDocSnapshot',
  validate(args) {
    check(args, {
      docId: String
    });
  },
  run({ docId }) {
    return documentsColl.findOne({ docId }, { sort: { timestamp: -1 }});
  }
});
