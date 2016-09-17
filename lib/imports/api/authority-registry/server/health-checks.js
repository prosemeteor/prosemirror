/**
* Module for methods that assist health check logic.
*/
import { proseMeteorConfig } from './../../config/server/prosemeteor-config';
import { HTTP } from 'meteor/http';
import {
  storeFailedHealthChecks,
  resetFailedHealthChecksCount,
  removeAuthorities
} from './methods';

// response body that health check endpoint returns
export const HEALTH_CHECK_RESPONSE = 'ProseMeteor Health OK';

/**
* Sends requests to each server's health check endpoint and returns the results.
*
* @param {Array} serversArray         arry of server entries from the registry in db to run health checks against
*/
export const checkHealthOfServers = (serversArray) => {
  let failedConnections = [];                       // _ids of all servers that failed checks, that didn't pass the threshold
  let failedConnectionsAboveThreshold = [];         // _ids of all servers that failed checks, that did pass the threshold
  let successfulChecksThatFailedPreviously = [];    // _ids of all servers that had a previous failure but passed this time, without passing the threshold
  // do a check on each server
  serversArray.forEach(({ _id, ip, port, fullUrl, failedHealthChecks }) => {
    console.log(`ProseMeteor AuthorityRegistry: running health check against ${fullUrl}`);
    if (ip === proseMeteorConfig.ip && port === proseMeteorConfig.port) {
      console.log('ProseMeteor AuthorityRegistry: Skipping this server\'s health check');
      return;
    }
    // if this server has failed too many times, remove it from the registry since we can assume it's down
    if (failedHealthChecks >= proseMeteorConfig.failedHealthChecksThreshold) {
      console.log(`ProseMeteor AuthorityRegistry: ${ip}:${port} has failed ${failedHealthChecks} consecutive health checks, marking it to be removed from the registry`);
      failedConnectionsAboveThreshold.push(_id);
      return;
    }
    const healthCheckUrl = `${ip}:${port}/prosemeteor-health-check`;
    // use http or https depending on port
    const healthCheckUrlWithProtocol = `${proseMeteorConfig.protocol}://${healthCheckUrl}`;
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
        successfulChecksThatFailedPreviously.push(_id);
      }
    }
  });
  return {
    failedConnections,
    failedConnectionsAboveThreshold,
    successfulChecksThatFailedPreviously
  };
};

/**
* Stores the results of health checks for each server.
*
* @param {Object} params
* @param {Array} params.failedConnections                     array of _id's of servers who have failed the health check
* @param {Array} params.successfulChecksThatFailedPreviously  array of _id's of servers who have passed the health check but failed previously
*/
export const storeHealthCheckResults = ({
  failedConnections,
  successfulChecksThatFailedPreviously
}) => {
  if (failedConnections.length > 0) {
    try {
      storeFailedHealthChecks.call({ _ids: failedConnections });
      console.log('ProseMeteor AuthorityRegistry: Successfully stored failed health checks');
    } catch (e) {
      console.log(`ProseMeteor AuthorityRegistry: Failed to store failed health checks: ${e}`);
    }
  }
  // reset failed health check count on servers that failed < threshold previously, and now passed
  if (successfulChecksThatFailedPreviously.length > 0) {
    try {
      resetFailedHealthChecksCount.call({ _ids: successfulChecksThatFailedPreviously });
      console.log(`ProseMeteor AuthorityRegistry: Reset the failed health checks count for ${successfulChecksThatFailedPreviously.length} servers: ${successfulChecksThatFailedPreviously}`);
    } catch (e) {
      console.log(`ProseMeteor AuthorityRegistry: Failed to reset the failed health checks count for ${successfulChecksThatFailedPreviously.length} servers: ${e}`);
    }
  }
};

/**
* Removes servers that have failed too many consecutive health checks from the registry.
*
* @param {Object} params
* @param {Array} params.failedConnectionsAboveThreshold  array of _id's of servers who have failed too many health checks and need to be removed
*/
export const removeDeadServersFromRegistry = ({ failedConnectionsAboveThreshold }) => {
  // remove servers that have failed too many health checks
  if (failedConnectionsAboveThreshold.length > 0) {
    try {
      removeAuthorities.call({ _ids: failedConnectionsAboveThreshold });
      console.log(`ProseMeteor AuthorityRegistry: Removed ${failedConnectionsAboveThreshold.length} authorities from the registry because of failed health checks`);
    } catch (e) {
      console.log(`ProseMeteor AuthorityRegistry: Failed to remove authorities ${failedConnectionsAboveThreshold}: ${e}`);
    }
  }
};
