import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Step } from './../../../prosemirror/dist/transform';
import { CollabStep } from './collab-step';
import { CollabStepClientId } from './collab-step-client-id';
import { defaultSchema } from './../../../prosemirror/dist/model/defaultschema';
import { storeDocSnapshot, getLatestDocSnapshot } from './../../documents/both/methods';
import { check, Match } from 'meteor/check';
import { proseMeteorConfig } from './../../config/server/prosemeteor-config';
import { AuthorityManager } from './authority-manager';

export class Authority {
  /**
   * Central authority to track a ProseMirror document, apply steps from clients, and notify clients when changes occur.
   * @param {Object} params
   * @param {AuthorityManager} params.authorityManager    AuthorityManager that owns this Authority
   * @param {String} params.docId                         the id of the doc this Authority tracks
   * @param {String} [params.groupId]                     an id to associate this doc with other docs
   * @param {Collection} params.documentsColl             a Meteor Collection that is used to store ProseMirror docs
   * @param {Streamer}  params.streamer                   a Streamer object that contains .emit() and .on() methods for streaming events with clients
   * @constructor
   */
  constructor ({ authorityManager, docId, groupId = null, documentsColl, streamer }) {
    check(authorityManager, AuthorityManager);
    check(docId, String);
    check(groupId, Match.Maybe(String));
    check(documentsColl, Mongo.Collection);
    check(streamer, Meteor.Streamer);
    this.storeConnection = this.storeConnection.bind(this);
    this.cleanUpAndRemove = this.cleanUpAndRemove.bind(this);

    console.log(`Authority created for doc id: ${docId}`);
    this.manager = authorityManager;
    this.docId = docId;
    this.groupId = groupId;
    this.documentsColl = documentsColl;
    this.streamerServer = streamer;
    this.numberOfSnapshots = this.documentsColl.find({ docId: this.docId }).count();
    this.connections = {};

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
  */
  storeConnection ({ connection }) {
    const connectionId = connection.id;
    if (typeof this.connections[connectionId] !== 'undefined') {
      return;
    }
    this.connections[connectionId] = connection;
    console.log(`---storeConnection() storing connection id ${connectionId} for authority ${this.docId}, authority.connections=`, this.connections);
    connection.onClose((a) => {
      delete this.connections[connectionId];
      console.log('--closed! id=', connectionId);

      // if there are no more active connections, remove it
      if (Object.keys(this.connections).length === 0) {
        this.cleanUpAndRemove();
      }
    });
  }

  /**
  * Handles cleaning up and removing when no more clients are connected. Stores a snapshot,
  * removes doc from Authority in DB, and instructs AuthorityManager to remove it from memory.
  */
  cleanUpAndRemove () {
    this.storeSnapshot();
    this.manager.removeDoc({ docId: this.docId, groupId: this.groupId });
  }

  /**
   * Return the latest state of the document in memory
   * @return {{ version: Number, docJSON: Object}}
   */
  latestDocState () {
    return {
      version: this.version(),
      docJSON: this.doc.toJSON()
    };
  }

  /*
  * Receives steps from a client, applying them to the local doc.
  * @param {Object} params
  * @param {Number} params.clientId       client id used by ProseMirror
  * @param {Array} params.stepsJSON       steps to be received, in JS object/array form (not yet Step instances)
  * @param {Number} params.version        doc version the client is submitting for
  */
  receiveSteps ({ clientId, stepsJSON, version }) {
    check(clientId, Number);
    check(stepsJSON, Array);
    check(version, Number);
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
    this.streamerServer.emit('authorityNewSteps');
  }

  /**
   * Return all steps since the provided version.
   * @param {Object} params
   * @param {Number} params.version    version of the document
   * @return {Object} stepsSince  object with "steps" array and "clientIds" array
   */
  stepsSince ({ version }) {
    check(version, Number);
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
      this.documentsColl.insert(newSnapshot);
      this.latestSnapshot = newSnapshot;
      this.numberOfSnapshots ++;
    });
  }
  // /**
  // * Loads the latest snapshot from db and sets it to this authority's PM instance's doc state.
  // */
  // loadLatestSnapshot() {
  //   // const snapshotJSON = ProseMeteorManager.getLatestDocSnapshotJSON(this.docId);
  //   // this.pm.setDoc(this.pm.schema.nodeFromJSON(lastSnapshot));
  // }
}
