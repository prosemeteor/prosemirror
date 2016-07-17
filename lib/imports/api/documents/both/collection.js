import { Mongo } from 'meteor/mongo';

// todo: the collection name and field names should probably be configurable
export const documentsColl = new Mongo.Collection('prosemeteor-documents');

// Deny all client-side updates since we will be using methods to manage this collection
documentsColl.deny({
  insert () { return true; },
  update () { return true; },
  remove () { return true; }
});

// class Documents extends Mongo.Collection {
//   insert(document, callback) {
//     return super.insert(document, callback);
//   }
//   remove(selector, callback) {
//     return super.remove(selector, callback);
//   }
// }
