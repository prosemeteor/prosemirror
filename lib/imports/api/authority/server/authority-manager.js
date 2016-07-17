import { Authority } from './authority';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { AuthorityRegistry } from './../../authority-registry/server/authority-registry';

export class AuthorityManager {
  /**
  * Manages creating Authorities for ProseMirror documents and provides communication between clients
  * and their corresponding Authority.
  *
  * @param {Object} params
  * @param {Collection} params.collection       a Collection instance that is used to store ProseMirror docs
  * @param {Streamer}  params.streamer          a Streamer object that contains .emit() and .on() methods for streaming events with clients
  * @param {Number} params.snapshotIntervalMs   interval in millseconds that Authority will store a snapshot of an open doc to db
  * @constructor
  */
  constructor ({ documentsColl, streamer, snapshotIntervalMs }) {
    check(documentsColl, Mongo.Collection);
    check(streamer, Meteor.Streamer);
    check(snapshotIntervalMs, Number);
    this.documentsColl = documentsColl;
    this.authorities = {};
    this.streamerServer = streamer;
    this.snapshotIntervalMs = snapshotIntervalMs;
    this.registry = new AuthorityRegistry();
    this.registry.register((err, res) => {
      if (err) {
        console.error(`Failed to register Authority with AuthorityRegistry: ${err}`);
      }
      console.log(`ProseMeteor AuthorityManager: Full registry: ${JSON.stringify(this.registry.fullRegistry(), null, 2)}`);
      this.setupClientMethods();
    });
  }

  /**
  * Creates Meteor Methods to allow clients to communicate with the AuthorityManager.
  */
  setupClientMethods () {
    let self = this;

    // NOTE: I wasn't sure how to make these ValidatedMethods, since a ValidatedMethod has to be imported
    // by the client. How can we make a ValidtedMethod that has access to AuthorityManager on server, but also can be imported by client?
    Meteor.methods({
      // allow clients to request latest doc state
      'ProseMeteor.latestDocState' ({ docId }) {
        check(docId, String);
        return self.latestDocState({ docId });
      },

      // allow clients to get new steps of a doc when they receieve the "authortiyNewSteps" event
      'ProseMeteor.stepsSince' ({ docId, version }) {
        check(docId, String);
        check(version, Number);
        // need to stringify so steps can be sent over the wire
        return JSON.stringify(self.stepsSince({ docId, version }));
      },

      // allow clients to submit steps
      'ProseMeteor.clientSubmitSteps' ({ docId, clientId, version, stepsJSON }) {
        check(docId, String);
        check(clientId, Number);
        check(version, Number);
        check(stepsJSON, Array);
        self.receiveSteps({ docId, clientId, version, stepsJSON });
      },

      // open a doc, creating an authority for it
      'ProseMeteor.openDoc' ({ docId }) {
        check(docId, String);
        self.openDoc({ docId });
      }
    });
  }

  /**
  * Open a ProseMirror document. Creates a new Authority to track the doc.
  * @param {Object} params
  * @param {String} params.docId       the unique id of the doc
  */
  openDoc ({ docId }) {
    check(docId, String);
    if (!docId) {
      throw new Meteor.Error('no-authority-exists', `This AuthorityManager doesn't have an Authority tracking a document with docId ${docId}.`);
    }
    // if we're already tracking this doc with an authority, we're all set
    if (this.authorities[docId]) {
      return docId;
    }
    console.log(`ProseMeteor AuthorityManager: AuthorityManager opening doc ${docId}, creating new authority`);
    // create a new authority
    this.authorities[docId] = new Authority({
      docId,
      documentsColl: this.documentsColl,
      streamer: this.streamerServer,
      snapshotIntervalMs: this.snapshotIntervalMs
    });
    return;
  }

  /**
   * Return the latest state of the document in memory from its corresponding Authority.
   * @return {{ version: Number, docJSON: Object}}
   */
  latestDocState ({ docId }) {
    check(docId, String);
    if (!this.authorities[docId]) {
      throw new Meteor.Error('no-authority-exists', `This AuthorityManager doesn't have an Authority tracking a document with docId ${docId}.`);
    }
    return this.authorities[docId].latestDocState();
  }

  /**
  * Returns the steps since specified version of a doc in memory from its corresponding Authority.
  * @param {Object} params
  * @param {Number} params.version        doc version to request steps since
  * @param {String} params.docId          id of the doc
  */
  stepsSince ({ version, docId }) {
    check(version, Number);
    check(docId, String);
    if (!this.authorities[docId]) {
      throw new Meteor.Error('no-authority-exists', `This AuthorityManager doesn't have an Authority tracking a document with docId ${docId}.`);
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
  receiveSteps ({ docId, version, stepsJSON, clientId }) {
    check(docId, String);
    check(version, Number);
    check(stepsJSON, Array);
    check(clientId, Number);
    if (!this.authorities[docId]) {
      throw new Meteor.Error('no-authority-exists', `This AuthorityManager doesn't have an Authority tracking a document with docId ${docId}.`);
    }
    this.authorities[docId].receiveSteps({ clientId, version, stepsJSON });
    //     this.authorities[docId].receiveSteps.bind(this.authorities[docId], { clientId, version, stepsJSON });
  }
}
