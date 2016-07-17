import { check } from 'meteor/check';
import { authorityRegistryColl } from './collection';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

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
    const authorityDoc = {
      ip,
      port,
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
      ip: String,
      docId: String
    });
  },
  run ({ ip, docId }) {
    return authorityRegistryColl.update({ ip }, { $push: { docIds: docId } });
  }
});

export const removeDocFromAuthority = new ValidatedMethod({
  name: 'authorityRegistry.removeDocFromAuthority',
  validate (args) {
    check(args, {
      ip: String,
      docId: String
    });
  },
  run ({ ip, docId }) {
    return authorityRegistryColl.update({ ip }, { $pull: { docIds: docId } });
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
