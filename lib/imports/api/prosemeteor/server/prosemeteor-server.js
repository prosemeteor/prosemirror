import { Meteor } from 'meteor/meteor';
import { AuthorityManager } from './../../authority/server/authority-manager';
import { documentsColl } from './../../documents/both/collection';
import { proseMeteorConfig } from './../../config/server/prosemeteor-config';
/**
* Main ProseMeteor server class that instantiates all of ProseMeteor on the server.
*/
export class ProseMeteorServer {
  /*
  * Main ProseMeteor class on the server.
  * @param {Object} params
  * @param {String} params.protocol              protocol this server uses ('http' or 'https')
  * @param {Number} [params.snapshotIntervalMs]  interval in milliseconds that documents are backed up to a snapshot in db
  * @constructor
  */
  constructor ({
    // set default config values if not provided.
    protocol = 'http',                  // protocol this application's servers are communicating on
    snapshotIntervalMs = 5000,          // how often documents are backed up in a snapshot when open
    healthCheckIntervalMs = 1000 * 30,  // how often health checks are run against all other available application servers
    failedHealthChecksThreshold = 5     // number of failed consecutive health checks that leads to a server being
                                        // removed from the registry of servers available to host Authorities
   }) {
    // store documents collection
    this.documentsColl = documentsColl;
    // create streamer for event communication with client
    this.streamerServer = new Meteor.Streamer('prosemirror-pipe', { retransmit: false });
    this.streamerServer.allowRead('all');
    this.streamerServer.allowWrite('all');

    // set all config values
    proseMeteorConfig.protocol = protocol;
    proseMeteorConfig.snapshotIntervalMs = snapshotIntervalMs;
    proseMeteorConfig.healthCheckIntervalMs = healthCheckIntervalMs;
    proseMeteorConfig.failedHealthChecksThreshold = failedHealthChecksThreshold;

    // create authority manager  to create, delete authorities and communicate with clients
    this.authorityManager = new AuthorityManager({
      documentsColl,
      streamer: this.streamerServer
    });
  }
}
