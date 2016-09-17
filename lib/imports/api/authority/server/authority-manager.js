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
  * @constructor
  */
  constructor ({ documentsColl, streamer }) {
    check(documentsColl, Mongo.Collection);
    check(streamer, Meteor.Streamer);
    this.documentsColl = documentsColl;
    this.authorities = {};
    this.streamerServer = streamer;
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
      'ProseMeteor.openDoc' ({ docId }) {
        check(docId, String);
        return self.openDoc({ docId });
      },

      // creates an authority in memory
      'ProseMeteor.createAuthority' ({ docId, groupId = null }) {
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
  * @returns {String}  authorityUrl      url of the chosen authority
  */
  openDoc ({ docId }) {
    console.log(`ProseMeteor AuthorityManager: AuthorityManager opening doc ${docId}`);
    // get this doc's groupId if it has one
    const thisDoc = this.documentsColl.findOne({ docId });
    const groupId = thisDoc.groupId || undefined;
    // if we're already tracking this doc with an authority locally on this server, we're all set
    if (this.authorities[docId]) {
      console.log(`ProseMeteor AuthorityManager: doc ${docId} authority exists locally, returning local ip ${this.registry.fullUrl} `);
      return this.registry.fullUrl;
    }

    // if another authority already has this doc, use it
    const existingAuthorityOfDocId = this.registry.getAuthorityInfoByDocId({ docId });
    if (existingAuthorityOfDocId) {
      console.log(`ProseMeteor AuthorityManager: Found an authority hosting docId "${docId}", selecting it "${existingAuthorityOfDocId.fullUrl}"`);
      return existingAuthorityOfDocId.fullUrl;
    }

    // if another authority already has this doc's groupId, use it
    const existingAuthorityOfGroupId = this.registry.getAuthorityInfoByGroupId({ groupId });
    if (existingAuthorityOfGroupId) {
      if (existingAuthorityOfGroupId.fullUrl === this.registry.fullUrl) {
        console.log(`ProseMeteor AuthorityManager: this app server is already hosting groupId ${groupId} of doc ${docId}, creating local Authority`);
        // if this server is the server hosting that doc, we can create a local authority
        this.createAuthority({ docId, groupId });
        return existingAuthorityOfGroupId.fullUrl;
      }
      // if the remote server is healthy, tell it to create an authority
      const healthCheckPassed = this.registry.runSingleHealthCheck({ authorityUrl: existingAuthorityOfGroupId.fullUrl });
      if (healthCheckPassed) {
        console.log(`ProseMeteor AuthorityManager: a server is already hosting groupId ${groupId} for doc ${docId}`);
        this.instructServerToCreateAuthority({ fullUrl: existingAuthorityOfGroupId.fullUrl, docId, groupId });
        return existingAuthorityOfGroupId.fullUrl;
      }
    }
    // get array of eligible authorities. if an authority is already hosting the doc, it will be returned as the only element in the array
    const eligibleAuthorities = this.registry.getEligibleAuthoritiesToHostDoc({ docId, groupId });
    let finalAuthority;

    // find the first eligible authority that is healthy and instruct it to create a doc
    for (let i = 0; i < eligibleAuthorities.length; i++) {
      const authority = eligibleAuthorities[i];
      if (authority.fullUrl === this.registry.fullUrl) {
        console.log(`ProseMeteor AuthorityManager: this app server was chosen to host doc ${docId}`);
        // if this server is the server hosting that doc, we can create a local authority
        this.createAuthority({ docId, groupId });
        finalAuthority = authority;
        break;
      } else {
        console.log(`ProseMeteor AuthorityManager: server chosen to host doc ${docId}: ${authority.fullUrl} (${authority._id})`);
        // authority will live on another server. run health check
        const healthCheckPassed = this.registry.runSingleHealthCheck({ authorityUrl: authority.fullUrl });
        if (!healthCheckPassed) {
          // bad server. try again
          console.log(`ProseMeteor AuthorityManager: server ${authority.fullUrl} FAILED health check, selecting another`);
          continue;
        }
        console.log(`ProseMeteor AuthorityManager: server ${authority.fullUrl} PASSED health check, instructing it to create a local authority`);
        // instruct the correct server to create a local authority
        let authorityServerConn;
        try {
          authorityServerConn = DDP.connect(authority.fullUrl);
        } catch (e) {
          console.log(`ProseMeteor AuthorityManager: ddp connection to chosen authority server failed, selecting another: ${e}`);
          continue;
        }
        authorityServerConn.call('ProseMeteor.createAuthority', { docId, groupId });
        finalAuthority = authority;
        break;
      }
    }
    if (!finalAuthority) {
      throw new Meteor.Error('failed-select-authority', `Failed to select an appropriate authority server for doc ${docId}`);
    }
    console.log(`ProseMeteor AuthorityManager: got correct authority url ${finalAuthority.fullUrl}`);
    return finalAuthority.fullUrl;
  }

  /**
  *  Creates a new Authority in memory to track the doc.
  * @param {Object} params
  * @param {String} params.docId         the unique id of the doc
  * @param {String} [params.groupId]     an id to associate this doc with other docs
  */
  createAuthority ({ docId, groupId = null }) {
    console.log(`ProseMeteor AuthorityManager: (ip ${this.registry.fullUrl}) creating authority for doc ${docId}`);
    // create a new authority
    this.authorities[docId] = new Authority({
      docId,
      groupId,
      documentsColl: this.documentsColl,
      streamer: this.streamerServer
    });
    this.registry.addDocToAuthorityServer({ docId, groupId });
    return;
  }

  /**
  *  Creates a new Authority in memory to track the doc.
  * @param {Object} params
  * @param {String} params.fullUrl       full url of app the server to instruct
  * @param {String} params.docId         the unique id of the doc
  * @param {String} [params.groupId]     an id to associate this doc with other docs
  */
  instructServerToCreateAuthority ({ fullUrl, docId, groupId = null }) {
    // instruct the correct server to create a local authority
    let authorityServerConn;
    try {
      authorityServerConn = DDP.connect(fullUrl);
      authorityServerConn.call('ProseMeteor.createAuthority', { docId, groupId });
    } catch (e) {
      console.log(`ProseMeteor AuthorityManager: ddp connection to chosen authority server failed: ${e}`);
    }
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
