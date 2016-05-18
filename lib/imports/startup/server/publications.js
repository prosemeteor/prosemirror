import { Meteor } from 'meteor/meteor';

import {Documents} from '../../api/documents.js'

Meteor.publish('documents.documents', function oneDoc() {
  return Documents.find({});
});