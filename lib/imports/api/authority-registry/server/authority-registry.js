import ip from 'ip';
import { insertAuthority, removeAuthority } from './methods';

export class AuthorityRegistry {
  registerAuthority(cb) {
    const authorityIp = ip.address();
    insertAuthority.call({ authorityIp }, (err, res) => {
      if (err) {
        return cb(new Error('Failed to insert Authority into registry :' + err));
      }
      return cb(null, res);
    });
  }
  unregisterAuthority(cb) {
    // remove from collection
    const authorityIp = ip.address();
    removeAuthority.call({ authorityIp }, (err, res) => {
      if (err) {
        return cb(new Error('Failed to remove Authority from registry :' + err));
      }
      return cb(null, res);
    });
  }
  addDocToAuthority({ authorityIp, docId }) {
    // delegate the doc to the specified authority
  }
  removeDocFromAuthority({ docId }) {
    // remove a doc from its authority
  }
  getAuthorityIpHostingDoc({ docId }) {
    // return ip of authority, or undefined
  }
  chooseAuthorityToHostDoc({ docId }) {
    // -queries collection for all authorities
    // -gets ip of last selected authority from db
    // -iterate over authorities in sorted order. choose the one AFTER the last one selected
  }
}
