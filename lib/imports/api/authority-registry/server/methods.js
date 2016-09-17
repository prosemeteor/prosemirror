import { check, Match } from 'meteor/check';
import { authorityRegistryColl } from './collection';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { proseMeteorConfig } from './../../config/server/prosemeteor-config';

/*
Authority schema looks like this
{
 _id: 'abc123',
 ip: '192.168.2.1',
 port: 2976,
 docIds: ['xyz321','foo837','bar221'],
 recentFailedConnectionTimes: [13662212879613, 13662212879721, 1366221289532]
}

*/

/**
* Inserts a new authority server into the registry. An authority server represents a server
* that is capable of and ready to host ProseMeteorAuthority instances that track a single
* ProseMeteor document.
*
* @param {Object} params
* @param {String} params.ip     ip of the server
* @param {Number} params.port   port of the server
*/
export const insertAuthorityServerIntoRegistry = new ValidatedMethod({
  name: 'authorityRegistry.insertAuthorityServerIntoRegistry',
  validate (args) {
    check(args, {
      ip: String,
      port: Number
    });
  },
  run ({ ip, port }) {
    const ipAndPort = `${ip}:${port}`;
    const fullUrl = `${proseMeteorConfig.protocol}://${ipAndPort}`;
    const authorityDoc = {
      ip,
      port,
      fullUrl,
      docIds: [],
      groupIds: [],
      failedHealthChecks: 0
    };

    const _id = authorityRegistryColl.insert(authorityDoc);
    let authorityDocWithId = {
      _id,
      ...authorityDoc
    };
    return authorityDocWithId;
  }
});

/**
* Removes an authority server from the registry.
*
* @param {Object} params
* @param {String} params.ip     ip of the server
* @param {Number} params.port   port of the server
*/
export const removeAuthorityServerFromRegistry = new ValidatedMethod({
  name: 'authorityRegistry.removeAuthorityServerFromRegistry',
  validate (args) {
    check(args, {
      ip: String,
      port: Number
    });
  },
  run ({ ip, port }) {
    return authorityRegistryColl.remove({ ip, port });
  }
});

/**
* Adds a document to an authority server in the registry.
*
* @param {Object} params
* @param {String} params.docId     id of the document
* @param {Number} params.fullUrl   full url of the server
* @param {String} [params.groupId] group id for the document
*/
export const addDocToAuthorityServer = new ValidatedMethod({
  name: 'authorityRegistry.addDocToAuthorityServer',
  validate (args) {
    check(args, {
      docId: String,
      fullUrl: String,
      groupId: Match.OneOf(undefined, null, String)
    });
  },
  run ({ ip, docId, fullUrl, groupId }) {
    if (groupId) {
      // if groupId provided, add both docId and groupId to authority
      return authorityRegistryColl.update({
        fullUrl
      }, {
        $addToSet: {
          docIds: docId,
          groupIds: groupId
        }
      });
    }
    // if no groupId, only add docId to authority
    return authorityRegistryColl.update({
      fullUrl
    }, {
      $addToSet: {
        docIds: docId
      }
    });
  }
});

/**
* Removes a document from an authority server in the registry.
*
* @param {Object} params
* @param {String} params.docId     id of the document
* @param {Number} params.fullUrl   full url of the server
* @param {String} [params.groupId] group id for the document
*/
export const removeDocFromAuthorityServer = new ValidatedMethod({
  name: 'authorityRegistry.removeDocFromAuthorityServer',
  validate (args) {
    check(args, {
      docId: String,
      fullUrl: String,
      groupId: Match.OneOf(undefined, null, String)
    });
  },
  run ({ docId, fullUrl, groupId = null }) {
    // first remove this docId
    authorityRegistryColl.update({ fullUrl }, { $pull: { docIds: docId } });

    if (groupId) {
      // TODO: check each remaining docId. if any have the same groupId, keep this docs groupId. otherwise remove it from groupIds[]
    }
  }
});

/**
* Stores failed health checks on the specified authority servers in the registry.
*
* @param {Object} params
* @param {Array} params._ids     _ids of the servers that failed health checks
*/
export const storeFailedHealthChecks = new ValidatedMethod({
  name: 'authortiyRegistry.storeFailedHealthChecks',
  validate (args) {
    check(args, {
      _ids: Array
    });
  },
  run ({ _ids }) {
    return authorityRegistryColl.update({ _id: { $in: _ids } }, { $inc: { failedHealthChecks: 1 } }, { multi: true });
  }
});

/**
* Resets the failed health checks count to zero on the specified authority servers in the registry.
*
* @param {Object} params
* @param {Array} params._ids     _ids of the servers that need to have health check count reset
*/
export const resetFailedHealthChecksCount = new ValidatedMethod({
  name: 'authortiyRegistry.resetFailedHealthChecksCount',
  validate (args) {
    check(args, {
      _ids: Array
    });
  },
  run ({ _ids }) {
    return authorityRegistryColl.update({ _id: { $in: _ids } }, { $set: { failedHealthChecks: 0 } }, { multi: true });
  }
});

/**
* Entirely removes the spcified authority servers from the registry.
*
* @param {Object} params
* @param {Array} params._ids     _ids of the servers that failed health checks
*/
export const removeAuthorities = new ValidatedMethod({
  name: 'authortiyRegistry.removeAuthorities',
  validate (args) {
    check(args, {
      _ids: Array
    });
  },
  run ({ _ids }) {
    return authorityRegistryColl.remove({ _id: { $in: _ids } });
  }
});
