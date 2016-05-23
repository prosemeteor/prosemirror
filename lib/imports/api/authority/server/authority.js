import { Step } from './../../../prosemirror/dist/transform';
import { defaultSchema } from './../../../prosemirror/dist/model/defaultschema';
import { getLatestDocSnapshot } from './../../documents/both/methods';


export class Authority {
  /**
   * Central authority to track a ProseMirror document, apply steps from clients, and notify clients when changes occur.
   * @param {Object} params
   * @param {String} params.docId                     the id of the doc this Authority tracks
   * @param {Collection} params.documentsCollection   a Meteor Collection that is used to store ProseMirror docs
   * @param {Streamer}  params.streamer               a Streamer object that contains .emit() and .on() methods for streaming events with clients
   * @constructor
   */
  constructor({ docId, documentsCollection, streamer }) {
    console.log('Authority created for doc id: ' + docId);
    this.docId = docId;

    getLatestDocSnapshot.call({
      docId: this.docId
    }, (err, res) => {
      let { version, timestamp, docJSON } = res;
      if (err) {
        console.error('Authority error getting latest snapshot for doc ' + this.docId + ':', err);
      }
      console.log('Authority got latest snapshot for doc ' + this.docId + ':', JSON.stringify(res, null, 2));

      this.doc = defaultSchema.nodeFromJSON(docJSON);
      this.documentsCollection = documentsCollection;
      this.steps = [];
      this.stepClientIds = [];
      this.streamerServer = streamer;
    });

  }

  /**
   * Return the latest state of the document in memory
   * @return {{ version: Number, docJSON: Object}}
   */
  latestDocState() {
    return {
      version: this.steps.length,
      docJSON: this.doc.toJSON()
    };
  }

  /*
  * Receives steps from a client, applying them to the local doc.
  * @param {Object} params
  * @param {Number} params.version        doc version the client is submitting for
  * @param {Number} params.clientId       client id used by ProseMirror
  * @param {Array} params.stepsJSON       steps to be received, in JS object/array form (not yet Step instances)
  */
  receiveSteps({ clientId, stepsJSON, version }) {
    // parse the steps from json and convert them into Step instances
    const stepObjects = stepsJSON.map((step) => {
      return Step.fromJSON(defaultSchema, step);
    });
    console.log('Authority received ' + stepsJSON.length + ' steps from client ' + clientId + ' for doc version ' + version);

    // if the client submitted steps but that client didn't have the latest version
    // of the doc, stop since they must be applied to newest doc version
    if (version !== this.steps.length) {
      console.log('client ' + clientId + 'didn\'t have the latest version, Authority not accepting changes');
      return;
    }
    // apply and accumulate new steps
    stepObjects.forEach((step) => {
      this.doc = step.apply(this.doc).doc;
      this.steps.push(step);
      this.stepClientIds.push(clientId);
    });
    console.log('Authority notifying clients of new steps');
    // notify listening clients that new steps have arrived
    this.streamerServer.emit('authorityNewSteps');
  }

  /**
   * Return all steps since the provided version.
   * @param {Object} params
   * @param {Number} params.version    version of the document
   * @return {Object} stepsSince  object with "steps" array and "clientIds" array
   */
  stepsSince({ version }) {
    return {
      steps: this.steps.slice(version),
      clientIds: this.stepClientIds.slice(version)
    };
  }
  // /**
  //  * Store a snapshot of the current document in the documentsCollection
  //  */
  // storeSnapshot() {
  //   const doc = this.pm.doc;
  //   const newSnapshotJSON = doc.toJSON();
  //   const newSnapshotNumber = ProseMeteorManager.numberOfSnapshots() + 1;
  //   this.documentsCollection.insert({
  //     docId: this.docId,
  //     docJSON: newSnapshotJSON,
  //     timestamp: Date.now(),
  //     number: newSnapshotNumber
  //   });
  // }
  // /**
  // * Loads the latest snapshot from db and sets it to this authority's PM instance's doc state.
  // */
  // loadLatestSnapshot() {
  //   const snapshotJSON = ProseMeteorManager.getLatestDocSnapshotJSON(this.docId);
  //   this.pm.setDoc(this.pm.schema.nodeFromJSON(lastSnapshot));
  // }
}
