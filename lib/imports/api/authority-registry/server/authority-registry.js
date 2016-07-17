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
import { check } from 'meteor/check';
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
  }
  setUpHealthCheckEndpoint () {
    // create a health check endpoint, so other servers can verify this server is alive or not
    WebApp.rawConnectHandlers.use('/prosemeteor-health-check', (req, res, next) => {
      res.writeHead(200, {
        'Content-Type': 'text/plain'
      });
      res.end(HEALTH_CHECK_RESPONSE);
      next();
    });
  }
  startHealthCheckInterval () {
    Meteor.setInterval(() => {
      this.runHealthChecks();
    }, HEALTH_CHECK_INTERVAL_MS);
  }
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
  fullRegistry () {
    return authorityRegistryColl.find({}).fetch();
  }
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
  getUrlOfAuthorityHostingDoc ({ docId, groupId }) {
    check(docId, String);
    // return ip of authority, or undefined
    const authority = authorityRegistryColl.findOne({ docIds: docId });
    let port, ip;
    if (authority) {
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
  chooseAuthorityToHostDoc ({ docId, groupId }) {
    check(docId, String);
    // if there is already a server hosting this groupId, use it so they all are hosted together
    if (groupId) {
      check(groupId, String);
      const authorityHostingGroup = authorityRegistryColl.findOne({ groupIds: groupId });
      if (authorityHostingGroup) {
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
    return {
      ip: authorityWithLeastDocs.ip,
      port: authorityWithLeastDocs.port
    };
  }
}
