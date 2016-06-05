import { Meteor } from 'meteor/meteor';
import { AuthorityManager } from './../../authority/server/authority-manager';
import { check } from 'meteor/check';


export class ProseMeteorServer {
  constructor({ documentsColl }) {
    // store documents collection
    this.documentsColl = documentsColl;
    // create streamer for event communication with client
    this.streamerServer = new Meteor.Streamer('prosemirror-pipe', { retransmit : false });
    this.streamerServer.allowRead('all');
    this.streamerServer.allowWrite('all');

    // create authority manager  to create, delete authorities and communicate with clients
    this.authorityManager = new AuthorityManager({
      documentsCollection: this.documentsColl,
      streamer: this.streamerServer
    });

    // set up Meteor methods
    this.setupClientMethods();
  }

  setupClientMethods() {
    let self = this;
    Meteor.methods({
      'ProseMeteor.openDoc'({ docId }) {
        check(docId, String);
        self.authorityManager.openDoc({ docId });
      }
    });
  }
}
