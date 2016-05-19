// import { ProseMirror } from './../../../prosemirror/dist/edit'
import { Step } from './../../../prosemirror/dist/transform'
import { defaultSchema } from './../../../prosemirror/dist/model/defaultschema'

export class ProseMeteorAuthority {
  /**
   * Central authority to track a ProseMirror document, apply steps from clients, and notify clients when changes occur.
   * @param  {String} docId              a unique id for the doc
   * @constructor
   */
  constructor( docId, snapshotCollection, serverStreamer ) {
    console.log('created authority for doc: ' + docId);
    // create a new PM instance to track the doc's' state
    //  = new ProseMirror();
    this.doc = null;
    this.docId = docId;
    this.snapshotCollection = snapshotCollection;
    this.steps = [];
    this.stepClientIds = [];
    this.streamer = serverStreamer;
    // when a client submits new steps, we receieve them
    this.streamer.on('clientSubmitSteps', this.receieveSteps.bind(this));
  }
  /**
   * Receive new steps from a client, applying them to the local doc and
   * storing them.
   * @param  {Number} version    version of the document these steps apply to
   * @param  {[Step]} steps      steps to be applied to the doc
   * @param  {String} clientId   id of the client submitting the steps
   * @return {[type]}          [description]
   */
  receieveSteps({ clientId, steps, version }) {
    // parse the steps from json and convert them into Step instances
    const stepObjects = steps.map((step) => {
      return Step.fromJSON(defaultSchema, step);
    });
    //console.log('Server got step: ' + resp);
    console.log('Authority received steps from client ' + clientId + ' for version ' + version);
    //
    // if the client submitted steps but that client didn't have the latest version
    // of the doc, stop since they must be applied to newest doc version
    if (version !== this.steps.length) {
      return;
    }
    // apply and accumulate new steps
    stepObjects.forEach((step) => {
      this.doc = step.apply(this.doc).doc;
      this.steps.push(step);
      this.stepClientIds.push(clientId);
    });
    console.log('Authority updated doc:', this.doc);
    console.log('Authority steps:', this.steps);
    console.log('Authority step client Ids:', this.stepClientIds);
    // notify listening clients that new steps have arrived
    // this.streamer.emit('authorityNewSteps');
  }
  /**
   * Return all steps since the provided version.
   * @param  {Number} version    version of the document
   * @return {Object} stepsSince  object with "steps" array and "clientIds" array
   */
  stepsSince(version) {
    return {
      steps: this.steps.slice(version),
      clientIds: this.stepClientIds.slice(version)
    };
  }
  // /**
  //  * Store a snapshot of the current document in the snapshotCollection
  //  */
  // storeSnapshot() {
  //   const doc = this.pm.doc;
  //   const newSnapshotJSON = doc.toJSON();
  //   const newSnapshotNumber = ProseMeteorManager.numberOfSnapshots() + 1;
  //   this.snapshotCollection.insert({
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
  //   const snapshotJSON = ProseMeteorManager.getLatestSnapshotJSON(this.docId);
  //   this.pm.setDoc(this.pm.schema.nodeFromJSON(lastSnapshot));
  // }
}
