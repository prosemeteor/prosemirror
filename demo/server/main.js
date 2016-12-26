import { Meteor } from 'meteor/meteor';
import { ProseMeteorServer } from 'meteor/prosemeteor:prosemirror';

Meteor.startup(() => {
  // code to run on server at startup
});

// setup ProseMeteor on server
const proseMeteorServer = new ProseMeteorServer({
  snapshotIntervalMs: 5000,
  protocol: 'http',
  docActivityTimeoutMs: (1000 * 60) * 5,
  authentication: {
    canUserEditDoc({ userId, docId }) {
      if (docId === 'proofOfConceptDocId2') {
        return false;
      }
      return true;
    }
  }
});
