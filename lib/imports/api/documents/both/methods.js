import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { documentsColl } from './collection';

// for the proof of concept, there only exists a single doc. this method will retrieve it
export const getSingleDoc = new ValidatedMethod({
  name: 'documents.getSingleDoc',
  validate(args) {},
  run() {
    return documentsColl.findOne();
  }
});
