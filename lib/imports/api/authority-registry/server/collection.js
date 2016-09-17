import { Mongo } from 'meteor/mongo';

// todo: the collection name and field names should probably be configurable
export const authorityRegistryColl = new Mongo.Collection('prosemeteor-authority-registry');

// Deny all client-side updates since we will be using methods to manage this collection
authorityRegistryColl.deny({
  insert () { return true; },
  update () { return true; },
  remove () { return true; }
});
