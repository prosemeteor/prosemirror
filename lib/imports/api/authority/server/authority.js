import { Meteor } from 'meteor/meteor';
import { Step } from 'prosemirror/dist/transform';
import { defaultSchema } from 'prosemirror/dist/model/defaultschema';
import { documentsColl } from './../../documents/both/collection';
import { CollabStep } from './collab-step';
import { CollabStepClientId } from './collab-step-client-id';
import { storeDocSnapshot, getLatestDocSnapshot } from './../../documents/both/methods';
import { check, Match } from 'meteor/check';
import { proseMeteorConfig } from './../../config/server/prosemeteor-config';
import { AuthorityManager } from './authority-manager';
import { generateEventName } from './../../streamer-util/both/streamer-util';
import { STREAMER_EVENTS } from './../../streamer-util/both/event-names';
import { authHooks } from './../../authentication/server/auth-hooks';

export class Authority {
  /**
   * Central authority to track a ProseMirror document, apply steps from clients, and notify clients when changes occur.
   * @param {Object} params
   * @param {AuthorityManager} params.authorityManager    AuthorityManager that owns this Authority
   * @param {String} params.docId                         the id of the doc this Authority tracks
   * @param {String} [params.groupId]                     an id to associate this doc with other docs
   * @param {Streamer}  params.streamer                   a Streamer object that contains .emit() and .on() methods for streaming events with clients
   * @constructor
   */
  constructor ({ authorityManager, docId, groupId = null, streamer }) {
    check(authorityManager, AuthorityManager);
    check(docId, String);
    check(groupId, Match.Maybe(String));
    check(streamer, Meteor.Streamer);
    this.storeConnection = this.storeConnection.bind(this);
    this.cleanUpAndRemove = this.cleanUpAndRemove.bind(this);
    this.startDocActivityTimeoutTimer = this.startDocActivityTimeoutTimer.bind(this);
    this.stopDocActivityTimeoutTimer = this.stopDocActivityTimeoutTimer.bind(this);
    this.retrieveAndStoreUserAuth = this.retrieveAndStoreUserAuth.bind(this);
    this.invalidateAuth = this.invalidateAuth.bind(this);
    this.reportAuthError = this.reportAuthError.bind(this);

    console.log(`Authority created for doc id: ${docId}`);

    this.manager = authorityManager;
    this.docId = docId;
    this.groupId = groupId;
    this.streamerServer = streamer;
    this.numberOfSnapshots = documentsColl.find({ docId: this.docId }).count();
    // store all active user DDP connections
    this.connections = {};
    // store auth permissions for each user
    this.authentication = {
      view: {},
      edit: {},
      delete: {}
    };
    this.userIds = [];

    // initiate doc activity timeout to remove doc if no users interact with it
    this.docActivityTimeoutTimerId = undefined;
    this.startDocActivityTimeoutTimer();

    try {
      const latestSnapshot = getLatestDocSnapshot.call({
        docId: this.docId
      });
      let { docJSON } = latestSnapshot;
      console.log(`Authority got latest snapshot for doc ${this.docId}`);

      this.doc = defaultSchema.nodeFromJSON(docJSON);
      this.steps = [];
      this.stepClientIds = [];

      // store info about last snapshot so we only store on interval, and only when changes have occurred
      this.latestSnapshot = latestSnapshot;

      // start interval to store doc snapshots
      this.startSnapshotInterval();
    } catch (e) {
      console.log(`Authority error getting latest snapshot for doc ${this.docId}: ${e}`);
    }
  }

  /**
  * Stores a client's connection. Allows to handle disconnect later.
  * @param {Object}     params
  * @param {Connection} params.connection   Meteor Connection object of the client
  * @param {String}     params.userId       userId of requesting user
  */
  storeConnection ({ connection, userId }) {
    const connectionId = connection.id;
    if (typeof this.connections[connectionId] !== 'undefined') {
      return;
    }
    // grab auth info for this new user
    this.retrieveAndStoreUserAuth({ userId });
    // store the connection and setup close handler for when user leaves
    this.connections[connectionId] = connection;
    connection.onClose(() => {
      delete this.connections[connectionId];
      // if there are no more active connections, remove it
      if (Object.keys(this.connections).length === 0) {
        this.cleanUpAndRemove();
      }
      // remove user id from list of active users
      console.log(`Authority: user ${userId} has disconnected from doc ${this.docId}`);
      const userIdIndex = this.userIds.indexOf(userId);
      if (userIdIndex === -1) {
        throw new Meteor.Error('authority-user-not-found', 'Authority: user disconnected but their userId was not found in Authority, something went wrong');
      }
      this.userIds.splice(userIdIndex, 1);
    });
  }

  /**
   * Retrieve a user's authentication permissions and store it.
   * @param {Object}   params
   * @param {String}   params.userId       userId of requesting user
   */
  retrieveAndStoreUserAuth ({ userId }) {
    this.authentication.view[userId] = authHooks.canUserViewDoc({ docId: this.docId, userId });
    this.authentication.edit[userId] = authHooks.canUserEditDoc({ docId: this.docId, userId });
    this.authentication.delete[userId] = authHooks.canUserDeleteDoc({ docId: this.docId, userId });
    // store user id so we can know who to pull again if invalidated
    this.userIds.push(userId);
  }

  /**
   * Force a refresh of all users' permissions
   */
  invalidateAuth () {
    this.userIds.forEach((userId) => {
      this.retrieveAndStoreUserAuth({ userId });
    });
  }

  /**
   * Report an authentication error to the client.
   */
  reportAuthError ({ userId, type }) {
    check(type, String);
    const authenticationErrorEventName = generateEventName({
      name: STREAMER_EVENTS.AUTHORITY_AUTHENTICATION_ERROR,
      params: {
        docId: this.docId
      }
    });
    this.streamerServer.emit(authenticationErrorEventName, { userId, type, docId: this.docId });
  }

  /**
  * Handles cleaning up and removing when no more clients are connected. Stores a snapshot,
  * removes doc from Authority in DB, and instructs AuthorityManager to remove it from memory.
  */
  cleanUpAndRemove () {
    this.storeSnapshot();
    this.stopSnapshotInterval();
    this.stopDocActivityTimeoutTimer();
    this.manager.removeDoc({ docId: this.docId, groupId: this.groupId });
  }

  /**
   * Return the latest state of the document in memory
   * @param {Object} params
   * @param {String} params.userId     user id of requesting user
   * @return {{ version: Number, docJSON: Object} || String }
   */
  latestDocState ({ userId }) {
    if (this.authentication.edit[userId] === false) {
      return this.reportAuthError({ userId, type: 'edit' });
    }
    return {
      version: this.version(),
      docJSON: this.doc.toJSON()
    };
  }

  /**
  * Receives steps from a client, applying them to the local doc.
  * @param {Object} params
  * @param {Number} params.clientId       client id used by ProseMirror
  * @param {Array} params.stepsJSON       steps to be received, in JS object/array form (not yet Step instances)
  * @param {String} params.userId     user id of requesting user
  * @param {Number} params.version        doc version the client is submitting for
  */
  receiveSteps ({ clientId, stepsJSON, version, userId }) {
    check(clientId, Number);
    check(stepsJSON, Array);
    check(version, Number);
    if (this.authentication.edit[userId] === false) {
      return this.reportAuthError({ userId, type: 'edit' });
    }
    this.startDocActivityTimeoutTimer();
    const currentDocVersion = this.version();
    // parse the steps from json and convert them into Step instances
    const stepObjects = stepsJSON.map((step) => {
      return Step.fromJSON(defaultSchema, step);
    });
    console.log(`Authority received ${stepsJSON.length} steps from client ${clientId} for doc version ${version}`);

    // if the client submitted steps but that client didn't have the latest version
    // of the doc, stop since they must be applied to newest doc version
    if (version !== currentDocVersion) {
      console.log(`client ${clientId} didn't have the latest version, Authority not accepting changes`);
      return;
    }
    // apply and accumulate new steps
    stepObjects.forEach((step) => {
      this.doc = step.apply(this.doc).doc;
      this.steps.push(new CollabStep({ versionAppliedTo: currentDocVersion, step }));
      this.stepClientIds.push(new CollabStepClientId({ versionAppliedTo: currentDocVersion, clientId }));
    });
    // notify listening clients that new steps have arrived
    console.log('Authority notifying clients of new steps');
    const newStepsEventName = generateEventName({
      name: STREAMER_EVENTS.AUTHORITY_NEW_STEPS,
      params: {
        docId: this.docId
      }
    });
    this.streamerServer.emit(newStepsEventName);
  }

  /**
   * Return all steps since the provided version.
   * @param {Object} params
   * @param {Number} params.version    version of the document
   * @param {String} params.userId     user id of requesting user
   * @return {Object} stepsSince  object with "steps" array and "clientIds" array
   */
  stepsSince ({ version, userId }) {
    check(version, Number);
    if (this.authentication.edit[userId] === false) {
      return this.reportAuthError({ userId, type: 'edit' });
    }
    let steps = [];
    let clientIds = [];
    // iterate over all steps and find the steps/stepClientIds applied since specified version
    for (let i = 0; i < this.steps.length; i++) {
      const thisCollabStep = this.steps[i];
      const thisCollabClientId = this.stepClientIds[i];
      if (thisCollabStep.versionAppliedTo >= version) {
        steps.push(thisCollabStep.step);
      }
      if (thisCollabClientId.versionAppliedTo >= version) {
        clientIds.push(thisCollabClientId.clientId);
      }
    }
    return {
      steps,
      clientIds
    };
  }

  /**
  * Starts the timer interval to store doc snapshots to db.
  */
  startSnapshotInterval () {
    this.snapshotIntervalTimer = Meteor.setInterval(() => {
      // only store snapshot if changes have occurred since last snapshot
      let latestSnapshotVersion = this.latestSnapshot.version;
      let version = this.version();
      if (version > latestSnapshotVersion) {
        console.log(`Authority storing snapshot for doc ${this.docId}, version ${version}`);
        this.storeSnapshot();
      }
    }, proseMeteorConfig.snapshotIntervalMs);
  }

  /**
  * Clears the snapshot interval.
  */
  stopSnapshotInterval () {
    Meteor.clearInterval(this.snapshotIntervalTimer);
  }

  /**
  * Returns the version number of this Authority's document.
  * @returns {Number}
  */
  version () {
    let version;
    if (this.numberOfSnapshots === 0) {
      version = this.steps.length;
    } else {
      // if there's a previous snapshot, current doc version is last snapshot's version + the number of steps since then
      let latestSnapshotVersion = this.latestSnapshot.version;
      version = latestSnapshotVersion + this.stepsSince({ version: latestSnapshotVersion }).steps.length;
    }
    return version;
  }

  /**
   * Store a snapshot of the current document in the documentsColl
   */
  storeSnapshot () {
    const newSnapshot = {
      docId: this.docId,
      docJSON: this.doc.toJSON(),
      version: this.version(),
      timestamp: Date.now()
    };
    storeDocSnapshot.call({
      docId: this.docId,
      version: this.version(),
      docJSON: this.doc.toJSON()
    }, (err, res) => {
      if (err) {
        console.error(`Failed to store doc snapshot: ${err}`);
      }
      documentsColl.insert(newSnapshot);
      this.latestSnapshot = newSnapshot;
      this.numberOfSnapshots ++;
    });
  }

  startDocActivityTimeoutTimer () {
    this.stopDocActivityTimeoutTimer();
    const docActivityTimeoutEventName = generateEventName({
      name: STREAMER_EVENTS.AUTHORITY_DOC_ACTIVITY_TIMEOUT,
      params: {
        docId: this.docId
      }
    });
    this.docActivityTimeoutTimerId = Meteor.setTimeout(() => {
      this.streamerServer.emit(docActivityTimeoutEventName);
      console.log(`Authority doc activity timeout for doc ${this.docId}`);
      this.cleanUpAndRemove();
    }, proseMeteorConfig.docActivityTimeoutMs);
  }

  stopDocActivityTimeoutTimer () {
    if (this.docActivityTimeoutTimerId) {
      Meteor.clearTimeout(this.docActivityTimeoutTimerId);
    } else {
    }
  }

  // /**
  // * Loads the latest snapshot from db and sets it to this authority's PM instance's doc state.
  // */
  // loadLatestSnapshot() {
  //   // const snapshotJSON = ProseMeteorManager.getLatestDocSnapshotJSON(this.docId);
  //   // this.pm.setDoc(this.pm.schema.nodeFromJSON(lastSnapshot));
  // }
}
