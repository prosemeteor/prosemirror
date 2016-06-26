import { insertAuthority, removeAuthority, storeFailedHealthChecks, removeAuthorities } from './methods';
import { authorityRegistryColl } from './collection';
import { WebApp } from 'meteor/webapp';
import { HTTP } from 'meteor/http';

export class AuthorityRegistry {
  constructor () {
    this.failedHealthChecksThreshold = 3;
    // create a health check endpoint, so other servers can verify this server is alive or not
    WebApp.rawConnectHandlers.use(`/prosemeteor-health-check`, (req, res, next) => {
      res.writeHead(200, {
        'Content-Type': `text/plain`
      });
      res.end(`ProseMeteor Health OK`);
      next();
    });
  }
  register ({ ip, port }, cb) {
    const insert = () => {
      // insert the server
      insertAuthority.call({ ip, port }, (err, res) => {
        if (err) {
          return cb(new Error(`Failed to insert Authority server into registry: ${err}`));
        }
        console.log(`ProseMeteor AuthorityRegistry: Registered server in authority registry: ${ip}:${port}`);
        return cb(null, res);
      });
      // at the same time, start the health checks on all other servers
      this.runHealthChecks({ thisServerIp: ip, thisServerPort: port });
    };
    // check if this sever's already registered first
    if (this.isRegistered({ ip, port })) {
      console.log(`ProseMeteor AuthorityRegistry: Authority server was already registered, clearing it out`);
      removeAuthority.call({ ip }, (err, res) => {
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
    // remove from collection
    removeAuthority.call({ ip, port }, (err, res) => {
      if (err) {
        return cb(new Error(`Failed to remove Authority server from registry: ${err}`));
      }
      console.log(`ProseMeteor AuthorityRegistry: Unregistered authority server with ip ${ip}`);
      return cb(null, res);
    });
  }
  runHealthChecks ({ thisServerIp, thisServerPort }) {
    const fullRegistry = this.fullRegistry();
    const numServers = fullRegistry.length;
    let failedConnections = [];
    let failedConnectionsAboveThreshold = [];
    console.log(`ProseMeteor AuthorityRegistry: Starting health checks for ${numServers} servers`);
    // do a check on each server
    fullRegistry.forEach(({ _id, ip, port, failedHealthChecks }) => {
      if (ip === thisServerIp && port === thisServerPort) {
        console.log(`ProseMeteor AuthorityRegistry: Skipping this server's health check`);
        return;
      }
      // if this server has failed too many times, remove it from the registry since we can assume it's down
      if (failedHealthChecks >= this.failedHealthChecksThreshold) {
        console.log(`ProseMeteor AuthorityRegistry: ${ip}:${port} has failed ${failedHealthChecks} consecutive health checks, marking it to be removed from the registry`);
        failedConnectionsAboveThreshold.push(_id);
        return;
      }
      const healthCheckUrl = `${ip}:${port}/prosemeteor-health-check`;
      const httpUrl = `http://${healthCheckUrl}`;
      const httpsUrl = `https://${healthCheckUrl}`;
      let httpRes;
      let httpsRes;
      let httpFailed = false;
      let httpsFailed = false;
      try {
        httpRes = HTTP.get(httpUrl);
      } catch (e) {
        // console.log(`ProseMeteor AuthorityRegistry: httpRes failed ${e}`);
        httpFailed = true;
      }
      try {
        httpsRes = HTTP.get(httpsUrl);
      } catch (e) {
        // console.log(`ProseMeteor AuthorityRegistry: httpsRes failed ${e}`);
        httpsFailed = true;
      }
      if (httpRes) {
        // console.log(`ProseMeteor AuthorityRegistry: ---http res: ${httpRes}`);
      }
      if (httpsRes) {
        // console.log(`ProseMeteor AuthorityRegistry: ---https res: ${httpsRes}`);
      }
      if (httpFailed && httpsFailed) {
        failedConnections.push(_id);
      }
    });
    console.log(`ProseMeteor AuthorityRegistry: Finished health checks. failed connections (${failedConnections.length} of ${numServers}): ${failedConnections}`);

    // store any failures
    if (failedConnections.length > 0) {
      storeFailedHealthChecks.call({ _ids: failedConnections }, (err, res) => {
        if (err) {
          console.log(`ProseMeteor AuthorityRegistry: Failed to store failed health checks: ${err}`);
        }
        console.log(`ProseMeteor AuthorityRegistry: Successfully stored failed health checks`);
      });
    }
    if (failedConnectionsAboveThreshold.length > 0) {
    // remove servers that have failed too many health checks
      removeAuthorities.call({ _ids: failedConnectionsAboveThreshold }, (err) => {
        if (err) {
          console.log(`ProseMeteor AuthorityRegistry: Failed to remove authorities ${failedConnectionsAboveThreshold}: ${err}`);
        }
        console.log(`ProseMeteor AuthorityRegistry: Removed ${failedConnectionsAboveThreshold.length} authorities from the registry because of failed health checks`);
      });
    }
  }
  fullRegistry () {
    return authorityRegistryColl.find({}).fetch();
  }
  isRegistered ({ ip, port }) {
    return authorityRegistryColl.find({ ip, port }).count() !== 0;
  }
  addDocToAuthority ({ ip, docId }) {
    // delegate the doc to the specified authority
  }
  removeDocFromAuthority ({ docId }) {
    // remove a doc from its authority
  }
  getipHostingDoc ({ docId }) {
    // return ip of authority, or undefined
  }
  chooseAuthorityToHostDoc ({ docId }) {
    // -queries collection for all authorities
    // -gets ip of last selected authority from db
    // -iterate over authorities in sorted order. choose the one AFTER the last one selected
  }
}
