import { Meteor } from 'meteor/meteor';
import { Documents } from '../../api/documents.js';
import {defaultSchema as schema} from 'prosemirror/dist/model';

// if the database is empty on server start, create some sample data.
Meteor.startup(() => {
  Documents.remove({})
  if (Documents.find().count() === 0) {
    const fixturedoc = schema.node("doc", null, [schema.node("paragraph", null, [
      schema.text("This is a collaborative test document. Start editing to make it more interesting!")
    ])])
    console.log(fixturedoc);
    console.log("-----------");
    console.log(fixturedoc.toJSON());
    console.log("-----------");
    Documents.insert(fixturedoc.toJSON())
    console.log("-----------");
    console.log(Documents.findOne())
  }
});
