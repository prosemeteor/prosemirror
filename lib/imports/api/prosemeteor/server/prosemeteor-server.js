import { Meteor } from 'meteor/meteor';
import { AuthorityManager } from './../../authority/server/authority-manager';
import { check } from 'meteor/check';
import { documentsColl } from './../../documents/both/collection';


/**
* Main ProseMeteor server class that instantiates all of ProseMeteor on the server.
*/
export class ProseMeteorServer {
  /*
  * Main ProseMeteor class on the server.
  * @param {Object} params
  * @param {Collection} params.documentsColl     Collection PM docs are stored in
  * @param {Number} [params.snapshotIntervalMs]  interval in milliseconds that documents are backed up to a snapshot in db
  * @constructor
  */
  constructor({ snapshotIntervalMs = 5000 }) {
    // store documents collection
    this.documentsColl = documentsColl;
    // create streamer for event communication with client
    this.streamerServer = new Meteor.Streamer('prosemirror-pipe', { retransmit : false });
    this.streamerServer.allowRead('all');
    this.streamerServer.allowWrite('all');

    // create authority manager  to create, delete authorities and communicate with clients
    this.authorityManager = new AuthorityManager({
      documentsColl,
      streamer: this.streamerServer,
      snapshotIntervalMs
    });
  }
}
