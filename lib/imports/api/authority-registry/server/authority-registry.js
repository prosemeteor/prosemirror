import { insertAuthority, removeAuthority } from './methods';
import { authorityRegistryColl } from './collection';

export class AuthorityRegistry {
  register ({ ip, port }, cb) {
    const insert = () => {
      insertAuthority.call({ ip, port }, (err, res) => {
        if (err) {
          return cb(new Error(`Failed to insert Authority server into registry: ${err}`));
        }
        return cb(null, res);
      });
    };

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
