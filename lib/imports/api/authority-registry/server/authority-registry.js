import { insertAuthority, removeAuthority } from './methods';

export class AuthorityRegistry {
  register ({ ip, port }, cb) {
    insertAuthority.call({ authorityIp: ip, port }, (err, res) => {
      if (err) {
        return cb(new Error(`Failed to insert Authority into registry: ${err}`));
      }
      return cb(null, res);
    });
  }
  unregister ({ ip }, cb) {
    // remove from collection
    removeAuthority.call({ authorityIp: ip }, (err, res) => {
      if (err) {
        return cb(new Error(`Failed to remove Authority from registry: ${err}`));
      }
      console.log(`Unregistered authority with ip ${ip}`);
      return cb(null, res);
    });
  }
  addDocToAuthority ({ authorityIp, docId }) {
    // delegate the doc to the specified authority
  }
  removeDocFromAuthority ({ docId }) {
    // remove a doc from its authority
  }
  getAuthorityIpHostingDoc ({ docId }) {
    // return ip of authority, or undefined
  }
  chooseAuthorityToHostDoc ({ docId }) {
    // -queries collection for all authorities
    // -gets ip of last selected authority from db
    // -iterate over authorities in sorted order. choose the one AFTER the last one selected
  }
}
