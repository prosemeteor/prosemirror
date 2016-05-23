import { Authority } from './authority';
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

export class AuthorityManager {
  /**
  * Manages creating Authorities for ProseMirror documents and provides communication between clients
  * and their corresponding Authority.
  *
  * @param {Object} params
  * @param {Collection} params.collection     a Collection instance that is used to store ProseMirror docs
  * @param {Streamer}  params.streamer        a Streamer object that contains .emit() and .on() methods for streaming events with clients
  * @constructor
  */
  constructor({ documentCollection, streamer }) {
    this.documentsCollection = documentCollection;
    this.authorities = {};
    this.streamerServer = streamer;

    this.setupClientMethods();
  }

  /**
  * Createds Meteor Methods to allow clients to communicate with the AuthorityManager.
  */
  setupClientMethods() {
    let self = this;

    // NOTE: I wasn't sure how to make these ValidatedMethods, since a ValidatedMethod has to be imported
    // by the client. How can we make a ValidtedMethod that has access to AuthorityManager on server, but also can be imported by client?
    Meteor.methods({
      // allow clients to request latest doc state
      'ProseMeteor.latestDocState'({ docId }) {
        check(docId, String);
        return self.latestDocState({ docId });
      },

      // allow clients to get new steps of a doc when they receieve the "authortiyNewSteps" event
      'ProseMeteor.stepsSince'({ docId, version }) {
        check(docId, String);
        check(version, Number);
        // need to stringify so steps can be sent over the wire
        return JSON.stringify(self.stepsSince({ docId, version }));
      },

      // allow clients to submit steps
      'ProseMeteor.clientSubmitSteps'({ docId, clientId, version, stepsJSON }) {
        check(docId, String);
        check(clientId, Number);
        check(version, Number);
        check(stepsJSON, Array);
        self.receiveSteps({ docId, clientId, version, stepsJSON });
      }
    });
  }

  /**
  * Open a ProseMirror document. Creates a new Authority to track the doc.
  * @param {Object} params
  * @param {String} params.docId       the unique id of the doc
  */
  openDoc({ docId }) {
    if (!docId) {
      throw new Meteor.Error('AuthorityManager.openDoc.nonexistant', 'This AuthorityManager doesn\'t have an Authority tracking a document with docId "' + docId + '".');
    }
    // if we're already tracking this doc with an authority, we're all set
    if (this.authorities[docId]) {
      return docId;
    }
    console.log('AuthorityManager opening doc ' + docId + ', creating new authority');
    // create a new authority
    this.authorities[docId] = new Authority({
      docId,
      documentsCollection: this.documentsCollection,
      streamer: this.streamerServer
    });
    return;
  }

  /**
   * Return the latest state of the document in memory from its corresponding Authority.
   * @return {{ version: Number, docJSON: Object}}
   */
  latestDocState({ docId }) {
    if (!this.authorities[docId]) {
      throw new Meteor.Error('AuthorityManager.latestDocState.nonexistant', 'This AuthorityManager doesn\'t have an Authority tracking a document with docId "' + docId + '".');
    }
    return this.authorities[docId].latestDocState();
  }

  /**
  * Returns the steps since specified version of a doc in memory from its corresponding Authority.
  * @param {Object} params
  * @param {Number} params.version        doc version to request steps since
  * @param {String} params.docId          id of the doc
  */
  stepsSince({ version, docId }) {
    if (!this.authorities[docId]) {
      throw new Meteor.Error('AuthorityManager.stepsSince.nonexistant', 'This AuthorityManager doesn\'t have an Authority tracking a document with docId "' + docId + '".');
    }
    return this.authorities[docId].stepsSince({ version });
  }

  /*
  * Receives steps from a client and provides them to the corresponding Authority to handle them.
  * @param {Object} params
  * @param {Number} params.version        doc version the client is submitting for
  * @param {String} params.docId          id of the doc
  * @param {Number} params.clientId       client id used by ProseMirror
  * @param {Array} params.stepsJSON       steps to be received, in JS object/array form (not yet Step instances)
  */
  receiveSteps({ docId, version, stepsJSON, clientId }) {
    if (!this.authorities[docId]) {
      throw new Meteor.Error('AuthorityManager.receiveSteps.nonexistant', 'This AuthorityManager doesn\'t have an Authority tracking a document with docId "' + docId + '".');
    }
    this.authorities[docId].receiveSteps({ clientId, version, stepsJSON });
  }
}

// import { Mongo } from 'meteor/mongo';
// import { ProseMirror } from './../../../prosemirror/dist/edit';
// import { Streamer } from 'meteor/rocketchat:streamer';
// import { Random } from 'meteor/random';
//
// //--------------  example use --------------
// // create a new manager that tracks N number of documents
// const proseMeteorManager = new ProseMeteorManager(new Mongo.Collection('prosemeteor_snapshots'));
// // when a user connects to a brand new doc, we call openDoc()
// const newDocId = proseMeteorManager.openDoc();
// // lets assume the newDocId is simply the string 'newDocId'. when another user connects we call openDoc() again. since it already exists
// // and another user is already vieweing it we've already got it in memory, so nothing will happen
// proseMeteorManager.openDoc('newDocId');
// // some point later, the last user viewing a doc leaves, so nobody is viewing the doc anymore. we remove it from memory
// proseMeteorManager.disconnectDoc('someDocId');
//
// class ProseMeteorManager {
//   /**
//   *  Central manager to track any number of ProseMirror documents. Manages a Authority for each individual document,
//   *  @constructor
//   */
//   constructor(documentsCollection) {
//     // store the collection that holds doc snapshots
//     this.documentsCollection = documentsCollection;
//     // maintain an object containing all authorities, one authority per doc in the format { <docId1>: Authority, <docId2>: Authority }
//     this.authorities = {};
//   }
//   /**
//   * Open a ProseMirror document. If no docId provided, creates a new doc. Otherwise loads the latest snapshot of the doc with docId if it's not loaded yet. Creates
//   * a new Authority to track the doc and returns the unique docId.
//   * @param {String}  [docId]       optional, the unique id of the doc. if none provided, a new doc will be created
//   * @returns {String} docId
//   */
//   openDoc(docId) {
//     // if no docId provided, create a new document
//     if (!docId) {
//       return this.createDoc();
//     }
//     // if we're already tracking this doc with an authority, we're all set
//     if (this.authorities[docId]) {
//       return docId;
//     }
//     // if docId provided, load the existing doc
//     this.authorities[docId] = new Authority(docId, this.documentsCollection);
//     // if this existing doc has a snapshot in db, load the latest one
//     if (this.numberOfSnapshots(docId) > 0) {
//        this.authorities[docId].loadLatestSnapshot();
//     }
//     return docId;
//   }
//   /**
//   * Create a new ProseMirror document with its own Authority, and return a unique docId for the new doc.
//   * @returns {String}
//   */
//   createDoc() {
//     const docId = Random.id();
//     this.authorities[docId] = new Authority(docId, this.documentsCollection);
//     return docId;
//   }
//   /**
//   *  If no more users are editing a doc, it doesn't need to be kept in memory. This will save the doc's latest
//   * state and remove it from memory.
//   */
//   disconnectDoc(docId) {
//     // store the docs state in a snapshot
//     this.authorities[docId].storeSnapshot();
//     // now remove from memory
//     delete this.authorities[docId];
//   }
//   /**
//    * Return the number of snapshots that are currently stored for this doc.
//    * @return {Number}
//    */
//   static numberOfSnapshots(docId) {
//     return documentsCollection.find({ docId }).count;
//   }
//   /**
//    * Return the latest stored document snapshot in a JSON string.
//    * @return {JSON}
//    */
//   static getLatestDocSnapshotJSON(docId) {
//     const snapshot = documentsCollection.findOne({ docId, { sort: { timestamp: 1 }}});
//     return JSON.stringify(snapshot)
//   }
// }
