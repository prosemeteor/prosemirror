import {
  insertAuthorityServerIntoRegistry,
  removeAuthorityServerFromRegistry,
  addDocToAuthorityServer,
  removeDocFromAuthorityServer
} from './methods';
import { authorityRegistryColl } from './collection';
import { WebApp } from 'meteor/webapp';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import ip from 'ip';
import { proseMeteorConfig } from './../../config/server/prosemeteor-config';
import {
  checkHealthOfServers,
  storeHealthCheckResults,
  removeDeadServersFromRegistry,
  HEALTH_CHECK_RESPONSE
} from './health-checks';

/**
*   Class that manages and communicates with the authority registry. Maintains a list of all
*   authority servers.
*/
export class AuthorityRegistry {
  constructor () {
    proseMeteorConfig.ip = ip.address();
    proseMeteorConfig.port = parseInt(process.env.PORT);

    const ipAndPort = `${proseMeteorConfig.ip}:${proseMeteorConfig.port}`;
    this.fullUrl = `${proseMeteorConfig.protocol}://${ipAndPort}`;
    console.log(`ProseMeteor AuthorityRegistry, this server url: ${this.fullUrl}`);

    // bind class methods
    this.setUpHealthCheckEndpoint = this.setUpHealthCheckEndpoint.bind(this);
    this.setupClientMethods = this.setupClientMethods.bind(this);
    this.startHealthCheckInterval = this.startHealthCheckInterval.bind(this);
    this.register = this.register.bind(this);
    this.unregister = this.unregister.bind(this);
    this.runHealthChecks = this.runHealthChecks.bind(this);
    this.fullRegistry = this.fullRegistry.bind(this);
    this.isRegistered = this.isRegistered.bind(this);
    this.getEligibleAuthoritiesToHostDoc = this.getEligibleAuthoritiesToHostDoc.bind(this);

    this.setUpHealthCheckEndpoint();
    this.startHealthCheckInterval();
    this.setupClientMethods();
  }
  /**
  * Creates a health check endpoint for this server
  */
  setUpHealthCheckEndpoint () {
    // create a health check endpoint, so other servers can verify this server is alive or not
    WebApp.rawConnectHandlers.use('/prosemeteor-health-check', (req, res, cb) => {
      res.writeHead(200, {
        'Content-Type': 'text/plain'
      });
      res.end(HEALTH_CHECK_RESPONSE);
      cb();
    });
  }

  /**
  * Creates Meteor Methods to allow clients to communicate with the AuthorityRegistry.
  */
  setupClientMethods () {
    // let self = this;
    // Meteor.methods({});
  }
  /**
  *  Starts a continuous interval to run health checks against all other servers so
  *  we can know when an authority server is no longer available.
  */
  startHealthCheckInterval () {
    Meteor.setInterval(() => {
      this.runHealthChecks(this.fullRegistry());
    }, proseMeteorConfig.healthCheckIntervalMs);
  }
  /**
  *  Register this app server as an authority server that is ready to host document authorities, storing
  *  it in the registry.
  * @param {Function} cb        callback
  */
  register (cb) {
    check(cb, Function);
    const insert = () => {
      // insert the server
      insertAuthorityServerIntoRegistry.call({ ip: proseMeteorConfig.ip, port: proseMeteorConfig.port }, (err, res) => {
        if (err) {
          return cb(new Error(`Failed to insert Authority server into registry: ${err}`));
        }
        console.log(`ProseMeteor AuthorityRegistry: Registered server in authority registry: ${proseMeteorConfig.ip}:${proseMeteorConfig.port}`);
        return cb(null, res);
      });
      // at the same time, start the health checks on all other servers
      this.runHealthChecks(this.fullRegistry());
    };
    // check if this sever's already registered first
    if (this.isRegistered({ ip: proseMeteorConfig.ip, port: proseMeteorConfig.port })) {
      console.log('ProseMeteor AuthorityRegistry: Authority server was already registered, clearing it out');
      removeAuthorityServerFromRegistry.call({ ip: proseMeteorConfig.ip, port: proseMeteorConfig.port }, (err, res) => {
        if (err) {
          return cb(new Error(`Failed to remove existing authority server ${err}`));
        }
        return insert();
      });
    } else {
      return insert();
    }
  }
  /**
  *  Remove an app server from the registry, because it's no longer available to host document authorities.
  * @param {Object} params
  * @param {String} params.ip     ip of the server to remove from the registry
  * @param {Number} params.port   port of the server to remove from the registry
  * @param {Function} cb          callback
  */
  unregister ({ ip, port }, cb) {
    check(ip, String);
    check(port, Number);
    check(cb, Function);
    // remove from collection
    removeAuthorityServerFromRegistry.call({ ip, port }, (err, res) => {
      if (err) {
        return cb(new Error(`Failed to remove Authority server from registry: ${err}`));
      }
      console.log(`ProseMeteor AuthorityRegistry: Unregistered authority server with ip ${ip}`);
      return cb(null, res);
    });
  }

  /**
  * Runs a health check against a single server.
  * @param {Object} params
  * @param {String} params.authorityUrl     url of the authority
  * @param {Function} cb                  callback, given Boolean of if health check passed
  */
  runSingleHealthCheck ({ authorityUrl }, cb) {
    const authority = this.getAuthorityInfoByUrl({ authorityUrl });
    // run health check. if number of failed === 0, it was healthy
    const numFailed = this.runHealthChecks([ authority ]);
    const passed = numFailed === 0;
    console.log(`ProseMeteor AuthorityRegistry: ran single health check for ${authorityUrl}, passed=${passed}, numFailed=${numFailed}`);
    return passed;
  }
  /**
  *  Run health checks against every server in the registry, keeping track of which have failed
  * and removing those that have failed more than the threshold.
  * @param {Array} serversArray   array of server objects with { _id, {String} ip, {Number} port, {Number} failedHealthChecks}
  * @param {Function} cb          callback, with number of failed connections passed to it
  * @returns {Number} number of failed connections
  */
  runHealthChecks (serversArray) {
    const numServers = serversArray.length;
    console.log(`ProseMeteor AuthorityRegistry: Starting health checks for ${numServers} servers at time: ${new Date()}`);
    console.log(`ProseMeteor AuthorityRegitsry: Health checks server array: ${JSON.stringify(serversArray, null, 2)}`);

    // check health of all servers and get results
    const {
      failedConnections,
      failedConnectionsAboveThreshold,
      successfulChecksThatFailedPreviously
    } = checkHealthOfServers(serversArray);
    console.log(`ProseMeteor AuthorityRegistry: Finished health checks. failed connections (${failedConnections.length} of ${numServers}): ${JSON.stringify(failedConnections, null, 2)}`);
    console.log(`ProseMeteor AuthorityRegistry: Finished health checks. failedConnectionsAboveThreshold: ${JSON.stringify(failedConnectionsAboveThreshold, null, 2)}`);

    // store the results of health checks
    storeHealthCheckResults({
      failedConnections,
      successfulChecksThatFailedPreviously
    });

    // remove any dead servers from the registry
    removeDeadServersFromRegistry({ failedConnectionsAboveThreshold });

    // return total number of bad connections, combining failedConnections with failedConnectionsAboveThreshold
    return failedConnections.concat(failedConnectionsAboveThreshold).length;
  }
  /**
  *  Returns the full authority registry from the database.
  * @returns {Array} full registry
  */
  fullRegistry () {
    return authorityRegistryColl.find({}).fetch();
  }

  /**
  *  Returns a single authority from the registry database, found via its url.
  * @param {Object} params
  * @param {String} params.authorityUrl     full url of the authority to find (protocol:ip:port)
  * @returns {{}} authority
  */
  getAuthorityInfoByUrl ({ authorityUrl }) {
    return authorityRegistryColl.findOne({ fullUrl: authorityUrl });
  }

  /**
  *  Returns a single authority from the registry database, found via a docId that lives in an authority.
  * @param {Object} params
  * @param {String} params.docId        id of the doc that the wanted authority is hosting
  * @returns {{}} authority
  */
  getAuthorityInfoByDocId ({ docId }) {
    return authorityRegistryColl.findOne({ docIds: docId });
  }

  /**
  *  Returns a single authority from the registry database, found via a groupId that lives in an authority.
  * @param {Object} params
  * @param {String} params.groupId        groupId that the wanted authority is hosting
  * @returns {{}} authority
  */
  getAuthorityInfoByGroupId ({ groupId }) {
    return authorityRegistryColl.findOne({ groupIds: groupId });
  }
  /**
  *  Returns if the specified server is registered or not.
  * @param {Object} params
  * @param {String} params.ip     ip of the server to remove from the registry
  * @param {Number} params.port   port of the server to remove from the registry
  * @returns {Boolean} if the server is registered
  */
  isRegistered ({ ip, port }) {
    check(ip, String);
    check(port, Number);
    return authorityRegistryColl.find({ ip, port }).count() !== 0;
  }

  /**
  *  Adds a doc to an authority in the registry.
  * @param {Object} params
  * @param {String} params.docId      unique id for this doc
  * @param {String} [params.groupId]  optional, a groupId of this doc to associate it with other docs
  */
  addDocToAuthorityServer ({ docId, groupId = null }) {
    addDocToAuthorityServer.call({ docId, groupId, fullUrl: this.fullUrl });
    console.log(`ProseMeteor AuthorityRegistry: Added doc ${docId} to authority ${this.fullUrl}. Updated registry: ${JSON.stringify(this.fullRegistry(), null, 2)}`);
  }
  /**
  *  Removes a doc from an authority in the registry. If this doc is in a groupId and no more of that group are hosted
  *  on this server, the groupId is also removed from this authority.
  * @param {Object} params
  * @param {String} params.docId      unique id for this doc
  * @param {String} [params.groupId]  optional, a groupId of this doc to associate it with other docs
  */
  removeDocFromAuthorityServer ({ docId, groupId = null }) {
    // first remove this docId
    removeDocFromAuthorityServer.call({ docId, groupId, fullUrl: this.fullUrl });
  }
  /**
  *  Chooses a list of eligible authority servers to host a document, preferring the server with the least documents.
  * @returns {Array}  chosenAuthorities     array of chosen authority servers
  */
  getEligibleAuthoritiesToHostDoc () {
    // otherwise get 1-5 servers hosting the lowest number of docs
    const fullRegistry = this.fullRegistry();
    const fullRegistrySortedByDocIdsCount = fullRegistry
      .sort((authorityA, authorityB) => {
        return authorityA.docIds.length > authorityB.docIds.lenth;
      })
      .slice(0, 5);
    console.log(`ProseMeteor AuthorityRegistry: Selecting eligible authority servers with least documents: "${JSON.stringify(fullRegistrySortedByDocIdsCount, null, 2)}"`);

    return fullRegistrySortedByDocIdsCount;
  }
}
