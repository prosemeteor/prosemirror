import { insertAuthority, removeAuthority } from './methods';
import { authorityRegistryColl } from './collection';
import { WebApp } from 'meteor/webapp';
import { HTTP } from 'meteor/http';

export class AuthorityRegistry {
  constructor () {
    // create a health check endpoint, so other servers can verify this server is alive or not
    WebApp.rawConnectHandlers.use(`/prosemeteor-health-check`, (req, res, next) => {
      console.log(`--req:`, req);
      console.log(`--res:`, res);
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
        return cb(null, res);
      });
      // at the same time, start the health checks on all other servers
      this.runHealthChecks();
    };
    // check if this sever's already registered first
    if (this.isRegistered({ ip, port })) {
      console.log(`Authority server is already registered, clearing it out`);
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

  runHealthChecks () {
    const fullRegistry = this.fullRegistry();
    const numServers = fullRegistry.length;
    console.log(`---starting health checks for ${numServers} servers`);
    // let numServerChecked = 0;
    fullRegistry.forEach(({ ip, port }) => {
      const healthCheckUrl = `${ip}:${port}/prosemeteor-health-check`;
      const httpUrl = `http://${healthCheckUrl}`;
      const httpsUrl = `https://${healthCheckUrl}`;
      let httpRes;
      let httpsRes;
      try {
        httpRes = HTTP.get(httpUrl);
      } catch (e) {
        console.log(`httpRes failed ${e}`);
      }
      try {
        httpsRes = HTTP.get(httpsUrl);
      } catch (e) {
        console.log(`httpsRes failed ${e}`);
      }
      if (httpRes) {
        console.log(`---http res: ${httpRes}`);
      }
      if (httpsRes) {
        console.log(`---https res: ${httpsRes}`);
      }
      // const res = HTTP.get(healthCheckUrl, (err, res) => {
      //   console.log(`--------${healthCheckUrl}`);
      //   console.log(`--err: ${err}`);
      //   console.log(`--res ${res}`);
      // });
    });
    console.log(`---finished health checks`);
  }
  unregister ({ ip, port }, cb) {
    // remove from collection
    removeAuthority.call({ ip, port }, (err, res) => {
      if (err) {
        return cb(new Error(`Failed to remove Authority server from registry: ${err}`));
      }
      console.log(`Unregistered authority server with ip ${ip}`);
      return cb(null, res);
    });
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
