import { check } from 'meteor/check';
import { authorityRegistryColl } from './collection';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

/*
Document schema looks like this
{
 _id: 'abc123',
 authorityIp: '192.168.2.1',
 port: 2976,
 docIds: ['xyz321','foo837','bar221']
}
*/
export const insertAuthority = new ValidatedMethod({
  name: `authorityRegistry.insertAuthority`,
  validate (args) {
    check(args, {
      authorityIp: String,
      port: Number
    });
  },
  run ({ authorityIp, port }) {
    const authorityDoc = {
      authorityIp,
      port,
      docIds: []
    };

    const _id = authorityRegistryColl.insert(authorityDoc);
    let authorityDocWithId = {
      _id,
      ...authorityDoc
    };
    console.log(`Registered Authority in registry: ${authorityIp}:${port}`);
    return authorityDocWithId;
  }
});

export const removeAuthority = new ValidatedMethod({
  name: `authorityRegistry.removeAuthority`,
  validate (args) {
    check(args, {
      authorityIp: String
    });
  },
  run ({ authorityIp, port }) {
    console.log(`Unregistered Authority in registry: ${authorityIp}`);

    return authorityRegistryColl.remove({ authorityIp });
  }
});

export const addDocToAuthority = new ValidatedMethod({
  name: `authorityRegistry.addDocToAuthority`,
  validate (args) {
    check(args, {
      authorityIp: String,
      docId: String
    });
  },
  run ({ authorityIp, docId }) {
    console.log(`Added doc ${docId} to Authority in registry: ${authorityIp}`);

    return authorityRegistryColl.update({ authorityIp }, { $push: { docIds: docId } });
  }
});

export const removeDocFromAuthority = new ValidatedMethod({
  name: `authorityRegistry.removeDocFromAuthority`,
  validate (args) {
    check(args, {
      authorityIp: String,
      docId: String
    });
  },
  run ({ authorityIp, docId }) {
    console.log(`Removed doc ${docId} from Authority in registry: ${authorityIp}`);

    return authorityRegistryColl.update({ authorityIp }, { $pull: { docIds: docId } });
  }
});
