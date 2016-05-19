import { Mongo } from 'meteor/mongo';
import { ProseMirror } from './../../../prosemirror/dist/edit';
import { Streamer } from 'meteor/rocketchat:streamer';
import { Random } from 'meteor/random';

//--------------  example use --------------
// create a new manager that tracks N number of documents
const proseMeteorManager = new ProseMeteorManager(new Mongo.Collection('prosemeteor_snapshots'));
// when a user connects to a brand new doc, we call openDoc()
const newDocId = proseMeteorManager.openDoc();
// lets assume the newDocId is simply the string 'newDocId'. when another user connects we call openDoc() again. since it already exists
// and another user is already vieweing it we've already got it in memory, so nothing will happen
proseMeteorManager.openDoc('newDocId');
// some point later, the last user viewing a doc leaves, so nobody is viewing the doc anymore. we remove it from memory
proseMeteorManager.disconnectDoc('someDocId');

class ProseMeteorManager {
  /**
  *  Central manager to track any number of ProseMirror documents. Manages a ProseMeteorAuthority for each individual document,
  *  @constructor
  */
  constructor(snapshotCollection) {
    // store the collection that holds doc snapshots
    this.snapshotCollection = snapshotCollection;
    // maintain an object containing all authorities, one authority per doc in the format { <docId1>: ProseMeteorAuthority, <docId2>: ProseMeteorAuthority }
    this.authorities = {};
  }
  /**
  * Open a ProseMirror document. If no docId provided, creates a new doc. Otherwise loads the latest snapshot of the doc with docId if it's not loaded yet. Creates
  * a new ProseMeteorAuthority to track the doc and returns the unique docId.
  * @param {String}  [docId]       optional, the unique id of the doc. if none provided, a new doc will be created
  * @returns {String} docId
  */
  openDoc(docId) {
    // if no docId provided, create a new document
    if (!docId) {
      return this.createDoc();
    }
    // if we're already tracking this doc with an authority, we're all set
    if (this.authorities[docId]) {
      return docId;
    }
    // if docId provided, load the existing doc
    this.authorities[docId] = new ProseMeteorAuthority(docId, this.snapshotCollection);
    // if this existing doc has a snapshot in db, load the latest one
    if (this.numberOfSnapshots(docId) > 0) {
       this.authorities[docId].loadLatestSnapshot();
    }
    return docId;
  }
  /**
  * Create a new ProseMirror document with its own ProseMeteorAuthority, and return a unique docId for the new doc.
  * @returns {String}
  */
  createDoc() {
    const docId = Random.id();
    this.authorities[docId] = new ProseMeteorAuthority(docId, this.snapshotCollection);
    return docId;
  }
  /**
  *  If no more users are editing a doc, it doesn't need to be kept in memory. This will save the doc's latest
  * state and remove it from memory.
  */
  disconnectDoc(docId) {
    // store the docs state in a snapshot
    this.authorities[docId].storeSnapshot();
    // now remove from memory
    delete this.authorities[docId];
  }
  /**
   * Return the number of snapshots that are currently stored for this doc.
   * @return {Number}
   */
  static numberOfSnapshots(docId) {
    return snapshotCollection.find({ docId }).count;
  }
  /**
   * Return the latest stored document snapshot in a JSON string.
   * @return {JSON}
   */
  static getLatestSnapshotJSON(docId) {
    const snapshot = snapshotCollection.findOne({ docId, { sort: { timestamp: 1 }}});
    return JSON.stringify(snapshot)
  }
}
