import { Meteor } from 'meteor/meteor';
import { AuthorityManager } from './../../authority/server/authority-manager';
import { proseMeteorConfig } from './../../config/server/prosemeteor-config';
import { check, Match } from 'meteor/check';
import { authHooks } from './../../authentication/server/auth-hooks';

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
    failedHealthChecksThreshold = 5,    // number of failed consecutive health checks that leads to a server being
                                        //      removed from the registry of servers available to host Authorities
    docActivityTimeoutMs = (1000 * 60) * 3,  // how long a document will remain in memory without any user activity. defaults to 3 minutes,
    authentication = {}                 // object to contain authentication hooks

  }) {
    check(protocol, String);
    check(snapshotIntervalMs, Match.OneOf(undefined, null, Number));
    check(healthCheckIntervalMs, Match.OneOf(undefined, null, Number));
    check(healthCheckIntervalMs, Match.OneOf(undefined, null, Number));
    check(failedHealthChecksThreshold, Match.OneOf(undefined, null, Number));
    check(docActivityTimeoutMs, Match.OneOf(undefined, null, Number));
    check(authentication, Object);
    check(authentication.canUserViewDoc, Match.OneOf(undefined, null, Function));
    check(authentication.canUserEditDoc, Match.OneOf(undefined, null, Function));
    check(authentication.canUserDeleteDoc, Match.OneOf(undefined, null, Function));

    // store provided auth hooks on AuthHooks instance, and use defaults if not provided
    const defaultAuthHook = () => true;     // default auth as true (public, everyone can interact)
    authHooks.canUserViewDoc = typeof authentication.canUserViewDoc === 'function' ? authentication.canUserViewDoc : defaultAuthHook;
    authHooks.canUserEditDoc = typeof authentication.canUserEditDoc === 'function' ? authentication.canUserEditDoc : defaultAuthHook;
    authHooks.canUserDeleteDoc = typeof authentication.canUserDeleteDoc === 'function' ? authentication.canUserDeleteDoc : defaultAuthHook;

    // create streamer for event communication with client
    this.streamerServer = new Meteor.Streamer('prosemirror-pipe', { retransmit: false });
    // authentication is handled on a per-call basis, so we can allow all reads/writes
    this.streamerServer.allowRead('all');
    this.streamerServer.allowWrite('all');

    // set all config values
    proseMeteorConfig.protocol = protocol;
    proseMeteorConfig.snapshotIntervalMs = snapshotIntervalMs;
    proseMeteorConfig.healthCheckIntervalMs = healthCheckIntervalMs;
    proseMeteorConfig.failedHealthChecksThreshold = failedHealthChecksThreshold;
    proseMeteorConfig.docActivityTimeoutMs = docActivityTimeoutMs;

    // create authority manager  to create, delete authorities and communicate with clients
    this.authorityManager = new AuthorityManager({
      streamer: this.streamerServer
    });
  }
}
