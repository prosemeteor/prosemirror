import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Step } from './../../../prosemirror/dist/transform';
import { CollabStep } from './collab-step';
import { CollabStepClientId } from './collab-step-client-id';
import { defaultSchema } from './../../../prosemirror/dist/model/defaultschema';
import { getLatestDocSnapshot } from './../../documents/both/methods';
import { check } from 'meteor/check';

export class Authority {
  /**
   * Central authority to track a ProseMirror document, apply steps from clients, and notify clients when changes occur.
   * @param {Object} params
   * @param {String} params.docId                     the id of the doc this Authority tracks
   * @param {Collection} params.documentsColl       a Meteor Collection that is used to store ProseMirror docs
   * @param {Streamer}  params.streamer               a Streamer object that contains .emit() and .on() methods for streaming events with clients
   * @param {Number} params.snapshotIntervalMs       interval in millseconds that Authority will store a snapshot of an open doc to db
   * @constructor
   */
  constructor ({ docId, documentsColl, streamer, snapshotIntervalMs }) {
    check(docId, String);
    check(documentsColl, Mongo.Collection);
    check(streamer, Meteor.Streamer);
    check(snapshotIntervalMs, Number);
    console.log(`Authority created for doc id: ${docId}`);
    this.docId = docId;
    this.documentsColl = documentsColl;
    this.streamerServer = streamer;
    this.snapshotIntervalMs = snapshotIntervalMs;
    this.numberOfSnapshots = this.documentsColl.find({ docId: this.docId }).count();

    getLatestDocSnapshot.call({
      docId: this.docId
    }, (err, res) => {
      if (err) {
        throw new Meteor.Error(500, `Authority error getting latest snapshot for doc ${this.docId}: ${err}`);
      }
      let { docJSON } = res;
      console.log(`Authority got latest snapshot for doc ${this.docId}: ${JSON.stringify(res, null, 2)}`);

      this.doc = defaultSchema.nodeFromJSON(docJSON);
      this.steps = [];
      this.stepClientIds = [];

      // store info about last snapshot so we only store on interval, and only when changes have occurred
      this.latestSnapshot = res;

      // start interval to store doc snapshots
      this.startSnapshotInterval();
    });
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
    console.log(`Authority notifying clients of new steps`);
    this.streamerServer.emit(`authorityNewSteps`);
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
    }, this.snapshotIntervalMs);
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

    this.documentsColl.insert(newSnapshot);
    this.latestSnapshot = newSnapshot;
    this.numberOfSnapshots ++;
  }
  // /**
  // * Loads the latest snapshot from db and sets it to this authority's PM instance's doc state.
  // */
  // loadLatestSnapshot() {
  //   // const snapshotJSON = ProseMeteorManager.getLatestDocSnapshotJSON(this.docId);
  //   // this.pm.setDoc(this.pm.schema.nodeFromJSON(lastSnapshot));
  // }
}
