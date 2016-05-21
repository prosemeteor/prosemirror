import { Meteor } from 'meteor/meteor';
import { documentsColl } from './../../../api/documents/both/collection';
import { defaultSchema as schema } from './../../../prosemirror/dist/model';

// if the database is empty on server start, create some sample data.
Meteor.startup(() => {
  documentsColl.remove({});
  if (documentsColl.find().count() === 0) {
    const fixturedoc = schema.node("doc", null, [schema.node("paragraph", null, [
      schema.text("This is a collaborative test document. Start editing to make it more interesting!")
    ])])

    let id = documentsColl.insert(fixturedoc.toJSON())
    console.log('Inserted the following doc (id: ' + id + ') into the Documents collection:');
    console.log(fixturedoc.toJSON());
  }
});
