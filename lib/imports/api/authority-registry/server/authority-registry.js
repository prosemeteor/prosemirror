import {
  insertAuthority,
  removeAuthority,
  storeFailedHealthChecks,
  removeAuthorities,
  resetFailedHealthChecksCount
} from './methods';
import { authorityRegistryColl } from './collection';
import { WebApp } from 'meteor/webapp';
import { HTTP } from 'meteor/http';
import { check, Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import ip from 'ip';

const HTTPS_PORT = 443;
const HEALTH_CHECK_RESPONSE = 'ProseMeteor Health OK';
const FAILED_HEALTH_CHECKS_THRESHOLD = 5;
const HEALTH_CHECK_INTERVAL_MS = 1000 * 10;   // interval on which to run health checks

export class AuthorityRegistry {
  constructor () {
    this.ip = ip.address();
    this.port = parseInt(process.env.PORT);
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
    let self = this;
    Meteor.methods({
      // allow clients to request latest doc state
      'ProseMeteor.getUrlOfAuthorityHostingDoc' ({ docId, groupId }) {
        check(docId, String);
        check(groupId, Match.Maybe(String));
        return self.getUrlOfAuthorityHostingDoc({ docId, groupId });
      }
    });
  }
  /**
  *  Starts a continuous interval to run health checks against all other servers so
  *  we can know when an authority server is no longer available.
  */
  startHealthCheckInterval () {
    Meteor.setInterval(() => {
      this.runHealthChecks();
    }, HEALTH_CHECK_INTERVAL_MS);
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
      insertAuthority.call({ ip: this.ip, port: this.port }, (err, res) => {
        if (err) {
          return cb(new Error(`Failed to insert Authority server into registry: ${err}`));
        }
        console.log(`ProseMeteor AuthorityRegistry: Registered server in authority registry: ${this.ip}:${this.port}`);
        return cb(null, res);
      });
      // at the same time, start the health checks on all other servers
      this.runHealthChecks();
    };
    // check if this sever's already registered first
    if (this.isRegistered({ ip: this.ip, port: this.port })) {
      console.log('ProseMeteor AuthorityRegistry: Authority server was already registered, clearing it out');
      removeAuthority.call({ ip: this.ip }, (err, res) => {
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
    removeAuthority.call({ ip, port }, (err, res) => {
      if (err) {
        return cb(new Error(`Failed to remove Authority server from registry: ${err}`));
      }
      console.log(`ProseMeteor AuthorityRegistry: Unregistered authority server with ip ${ip}`);
      return cb(null, res);
    });
  }
  /**
  *  Run health checks against every server in the registry, keeping track of which have failed
  * and removing those that have failed more than the threshold.
  */
  runHealthChecks () {
    const fullRegistry = this.fullRegistry();
    const numServers = fullRegistry.length;
    let failedConnections = [];                       // _ids of all servers that failed checks, that didn't pass the threshold
    let failedConnectionsAboveThreshold = [];         // _ids of all servers that failed checks, that did pass the threshold
    let successfullChecksThatFailedPreviously = [];   // _ids of all servers that had a previous failure but passed this time, without passing the threshold
    console.log(`ProseMeteor AuthorityRegistry: Starting health checks for ${numServers} servers at time: ${new Date()}`);
    console.log(`Full registry: ${JSON.stringify(fullRegistry, null, 2)}`);
    // do a check on each server
    fullRegistry.forEach(({ _id, ip, port, failedHealthChecks }) => {
      if (ip === this.ip && port === this.port) {
        console.log('ProseMeteor AuthorityRegistry: Skipping this server\'s health check');
        return;
      }
      // if this server has failed too many times, remove it from the registry since we can assume it's down
      if (failedHealthChecks >= FAILED_HEALTH_CHECKS_THRESHOLD) {
        console.log(`ProseMeteor AuthorityRegistry: ${ip}:${port} has failed ${failedHealthChecks} consecutive health checks, marking it to be removed from the registry`);
        failedConnectionsAboveThreshold.push(_id);
        return;
      }
      const healthCheckUrl = `${ip}:${port}/prosemeteor-health-check`;
      // use http or https depending on port
      const healthCheckUrlWithProtocol = (port === HTTPS_PORT) ? `https://${healthCheckUrl}` : `http://${healthCheckUrl}`;
      let healthCheckRes;
      let healthCheckFailed = false;
      try {
        healthCheckRes = HTTP.get(healthCheckUrlWithProtocol);
        if (healthCheckRes !== HEALTH_CHECK_RESPONSE) {
          healthCheckFailed = true;
        }
      } catch (e) {
        healthCheckFailed = true;
      }
      if (healthCheckFailed) {
        failedConnections.push(_id);
      } else {
        console.log(`ProseMeteor AuthorityRegistry: Server passed health check: ${ip}:${port}`);
        // if this server failed a previous health check but passed this time, mark it to reset its failedHealthChecks count
        if (failedHealthChecks > 0) {
          successfullChecksThatFailedPreviously.push(_id);
        }
      }
    });
    console.log(`ProseMeteor AuthorityRegistry: Finished health checks. failed connections (${failedConnections.length} of ${numServers}): ${failedConnections}`);
    // store any failures
    if (failedConnections.length > 0) {
      storeFailedHealthChecks.call({ _ids: failedConnections }, (err, res) => {
        if (err) {
          console.log(`ProseMeteor AuthorityRegistry: Failed to store failed health checks: ${err}`);
        }
        console.log('ProseMeteor AuthorityRegistry: Successfully stored failed health checks');
      });
    }
    // remove servers that have failed too many health checks
    if (failedConnectionsAboveThreshold.length > 0) {
      removeAuthorities.call({ _ids: failedConnectionsAboveThreshold }, (err) => {
        if (err) {
          console.log(`ProseMeteor AuthorityRegistry: Failed to remove authorities ${failedConnectionsAboveThreshold}: ${err}`);
        }
        console.log(`ProseMeteor AuthorityRegistry: Removed ${failedConnectionsAboveThreshold.length} authorities from the registry because of failed health checks`);
      });
    }
    // reset failed health check count on servers that failed < threshold previously, and now passed
    if (successfullChecksThatFailedPreviously.length > 0) {
      resetFailedHealthChecksCount.call({ _ids: successfullChecksThatFailedPreviously }, (err) => {
        if (err) {
          console.log(`ProseMeteor AuthorityRegistry: Failed to reset the failed health checks count for ${successfullChecksThatFailedPreviously.length} servers: ${err}`);
        }
        console.log(`ProseMeteor AuthorityRegistry: Reset the failed health checks count for ${successfullChecksThatFailedPreviously.length} servers: ${successfullChecksThatFailedPreviously}`);
      });
    }
  }
  /**
  *  Returns the full authority registry from the database.
  * @returns {Array} full registry
  */
  fullRegistry () {
    return authorityRegistryColl.find({}).fetch();
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
  addDocToAuthority ({ ip, docId }) {
    // delegate the doc to the specified authority
  }
  removeDocFromAuthority ({ docId }) {
    // remove a doc from its authority
  }
  /**
  *  Returns the full url of the authority that does/will host this doc.
  * @param {Object} params
  * @param {String} params.docId      unique id for this doc
  * @param {String} [params.groupId]  optional, a groupId of this doc to associate it with other docs
  * @returns {String} url of authority that does/will host this doc
  */
  getUrlOfAuthorityHostingDoc ({ docId, groupId }) {
    check(docId, String);
    check(groupId, Match.Maybe(String));
    console.log(`ProseMeteor AuthorityRegistry: searching for url of authority hosting docId "${docId}", groupId "${groupId || 'none'}"`);
    // return ip of authority, or undefined
    const authority = authorityRegistryColl.findOne({ docIds: docId });
    let port, ip;
    if (authority) {
      console.log(`ProseMeteor AuthorityRegistry: Found an authority hosting docId "${docId}", selecting it "${docId}"`);
      ip = authority.ip;
      port = authority.port;
    } else {
      let chosenAuthority = this.chooseAuthorityToHostDoc({ docId, groupId });
      ip = chosenAuthority.ip;
      port = chosenAuthority.port;
    }
    const fullUrl = `${ip}:${port}`;
    const fullUrlWithProtocol = (port === HTTPS_PORT) ? `https://${fullUrl}` : `http://${fullUrl}`;
    return fullUrlWithProtocol;
  }
  /**
  *  Chooses an authority to host a document.
  * @param {Object} params
  * @param {String} params.docId      unique id for this doc
  * @param {String} [params.groupId]  optional, a groupId of this doc to associate it with other docs
  * @returns {Object} { ip: {String}, port: {Number} }
  */
  chooseAuthorityToHostDoc ({ docId, groupId }) {
    check(docId, String);
    check(groupId, Match.Maybe(String));
    // if there is already a server hosting this groupId, use it so they all are hosted together
    if (groupId) {
      const authorityHostingGroup = authorityRegistryColl.findOne({ groupIds: groupId });
      if (authorityHostingGroup) {
        console.log(`ProseMeteor AuthorityRegistry: Found an authority hosting groupId "${groupId}", selecting it to host docId "${docId}"`);
        return {
          ip: authorityHostingGroup.ip,
          port: authorityHostingGroup.port
        };
      }
    }
    // otherwise choose the server currently hosting the lowest number of docs
    const fullRegistry = this.fullRegistry();
    let indexOfLowestDocIds;
    let lowestDocIdsCount;
    fullRegistry.forEach(({ _id, ip, port, docIds }, index) => {
      if (typeof lowestDocIdsCount === 'undefined') {
        lowestDocIdsCount = docIds.length;
        indexOfLowestDocIds = index;
      } else if (docIds.length < lowestDocIdsCount) {
        lowestDocIdsCount = docIds.length;
        indexOfLowestDocIds = index;
      }
    });
    const authorityWithLeastDocs = fullRegistry[indexOfLowestDocIds];
    console.log(`ProseMeteor AuthorityRegistry: Selecting authority server with least documents: "${authorityWithLeastDocs.ip}:${authorityWithLeastDocs.port}" (${lowestDocIdsCount} docs)`);

    return {
      ip: authorityWithLeastDocs.ip,
      port: authorityWithLeastDocs.port
    };
  }
}
