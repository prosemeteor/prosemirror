import { Authority } from './authority';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { DDP } from 'meteor/ddp-client';
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

    // bind class methods
    this.setupClientMethods = this.setupClientMethods.bind(this);
    this.openDoc = this.openDoc.bind(this);
    this.createAuthority = this.createAuthority.bind(this);
    this.latestDocState = this.latestDocState.bind(this);
    this.stepsSince = this.stepsSince.bind(this);
    this.receiveSteps = this.receiveSteps.bind(this);

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

      // open a doc, setting up its authority
      'ProseMeteor.openDoc' ({ docId, groupId = undefined }) {
        check(docId, String);
        check(groupId, Match.Maybe(String));
        return self.openDoc({ docId, groupId });
      },

      // creates an authority in memory
      'ProseMeteor.createAuthority' ({ docId, groupId = undefined }) {
        check(docId, String);
        check(groupId, Match.Maybe(String));
        self.createAuthority({ docId, groupId });
      }
    });
  }

  /**
  * Open a ProseMirror document. Instructs appropriate server to create a server in memory and returns the server's URL.
  * @param {Object} params
  * @param {String} params.docId         the unique id of the doc
  * @param {String} [params.groupId]     an id to associate this doc with other docs
  */
  openDoc ({ docId, groupId = undefined }) {
    console.log(`ProseMeteor AuthorityManager: AuthorityManager opening doc ${docId}`);
    // if we're already tracking this doc with an authority locally on this server, we're all set
    if (this.authorities[docId]) {
      console.log(`ProseMeteor AuthorityManager: doc ${docId} authority exists locally, returning local ip ${this.registry.fullUrlWithProtocol} `);
      return this.registry.fullUrlWithProtocol;
    }
    const chooseProperAuthority = () => {
      const authorityUrl = this.registry.getUrlOfAuthorityHostingDoc({ docId, groupId });
      if (authorityUrl === this.registry.fullUrlWithProtocol) {
        console.log(`ProseMeteor AuthorityManager: this was server chosen to host doc ${docId}`);
        // if this server is the server hosting that doc, we can create a local authority
        this.createAuthority({ docId, groupId });
        return authorityUrl;
      } else {
        console.log(`ProseMeteor AuthorityManager: server chosen to host doc ${docId}: ${authorityUrl}`);
        // authority will live on another server. run health check
        const healthCheckPassed = this.registry.runSingleHealthCheck({ authorityUrl });
        if (!healthCheckPassed) {
          // bad server. try again
          console.log(`ProseMeteor AuthorityManager: server ${authorityUrl} FAILED health check, selecting another`);
          return chooseProperAuthority();
        }
        console.log(`ProseMeteor AuthorityManager: server ${authorityUrl} PASSED health check, instructing it to create a local authority`);
        // instruct the correct server to create a local authority
        let authorityServerConn;
        try {
          authorityServerConn = DDP.connect(authorityUrl);
        } catch (e) {
          console.log(`ProseMeteor AuthorityManager: ddp connection to chosen authority server failed: ${e}`);
        }
        authorityServerConn.call('ProseMeteor.createAuthority', { docId, groupId });
        return authorityUrl;
      }
    };
    const correctAuthorityUrl = chooseProperAuthority();
    console.log(`ProseMeteor AuthorityManager: got correct authority url ${correctAuthorityUrl}`);
    return correctAuthorityUrl;
  }

  /**
  *  Creates a new Authority in memory to track the doc.
  * @param {Object} params
  * @param {String} params.docId         the unique id of the doc
  * @param {String} [params.groupId]     an id to associate this doc with other docs
  */
  createAuthority ({ docId, groupId }) {
    console.log(`ProseMeteor AuthorityManager: (ip ${this.registry.fullUrlWithProtocol}) creating authority for doc ${docId}`);
    // create a new authority
    this.authorities[docId] = new Authority({
      docId,
      groupId,
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
