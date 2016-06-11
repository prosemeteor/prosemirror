export class AuthorityRegistry {
  registerAuthority({ authorityIp }) {
    // insert { authorityIp, docIds: [] } into collection
  }
  unregisterAuthority({ authorityIp }) {
    // remove from collection
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
