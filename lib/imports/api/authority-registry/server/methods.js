import { check, Match } from 'meteor/check';
import { authorityRegistryColl } from './collection';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

const HTTPS_PORT = 443;

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
export const insertAuthority = new ValidatedMethod({
  name: 'authorityRegistry.insertAuthority',
  validate (args) {
    check(args, {
      ip: String,
      port: Number
    });
  },
  run ({ ip, port }) {
    const fullUrl = `${ip}:${port}`;
    const fullUrlWithProtocol = (this.port === HTTPS_PORT) ? `https://${fullUrl}` : `http://${fullUrl}`;
    const authorityDoc = {
      ip,
      port,
      fullUrl: fullUrlWithProtocol,
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

export const removeAuthority = new ValidatedMethod({
  name: 'authorityRegistry.removeAuthority',
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

export const addDocToAuthority = new ValidatedMethod({
  name: 'authorityRegistry.addDocToAuthority',
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

export const removeDocFromAuthority = new ValidatedMethod({
  name: 'authorityRegistry.removeDocFromAuthority',
  validate (args) {
    check(args, {
      ip: String,
      docId: String,
      fullUrl: String,
      groupId: Match.Maybe(String)
    });
  },
  run ({ ip, docId, fullUrl, groupId = null }) {
    // first remove this docId
    authorityRegistryColl.update({ ip }, { $pull: { docIds: docId } });

    if (groupId) {
      // check each remaining docId. if any have the same groupId, keep this docs groupId. otherwise remove it from groupIds[]
    }
  }
});

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
