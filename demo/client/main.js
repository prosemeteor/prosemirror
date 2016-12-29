import { ProseMeteorEditor } from 'meteor/prosemeteor:prosemirror';
import { Meteor } from 'meteor/meteor';

const docActivityTimeoutCallback = ({ docId, elementId }) => {
  document.getElementById(elementId).innerHTML =
   `<div style="background-color: #fff9a4;text-align:center;vertical-align:center;"> 
       Document ${docId} activity timeout reached, server session was shut down.
    </div>`;
};
const authenticationErrorCallback = ({ userId, docId, type, elementId }) => {
  document.getElementById(elementId).innerHTML =
  `<div style="background-color: #ffa4a4;text-align:center;vertical-align:center;"> 
        Authentication Error: user id "${userId}" isn\'t allowed to "${type}" document "${docId}".
    </div>`;
};

Meteor.startup(function() {
  const editor1 = new ProseMeteorEditor({
    docId: 'proofOfConceptDocId1',
    onDocActivityTimeout: ({ docId }) => {
      docActivityTimeoutCallback({ docId, elementId: 'prosemeteor-poc-1' })
    },
    onAuthenticationError: ({ userId, type, docId }) => {
      authenticationErrorCallback({ userId, type, docId, elementId: 'prosemeteor-poc-1' });
    },
    proseMirrorOptions: {
      place: document.getElementById('prosemeteor-poc-1'),
      menuBar: true,
      autoInput: true,
      tooltipMenu: {selectedBlockMenu: true}
    }
  });

  const editor2 = new ProseMeteorEditor({
    docId: 'proofOfConceptDocId2',
    onDocActivityTimeout: ({ docId }) => {
      docActivityTimeoutCallback({ docId, elementId: 'prosemeteor-poc-2' })
    },
    onAuthenticationError: ({ userId, type, docId }) => {
      authenticationErrorCallback({ userId, type, docId, elementId: 'prosemeteor-poc-2' });
    },
    proseMirrorOptions: {
      place: document.getElementById('prosemeteor-poc-2'),
      menuBar: true,
      autoInput: true,
      tooltipMenu: {selectedBlockMenu: true}
    }
  });

  const editor3 = new ProseMeteorEditor({
    docId: 'proofOfConceptDocId3',
    onDocActivityTimeout: ({ docId }) => {
      docActivityTimeoutCallback({ docId, elementId: 'prosemeteor-poc-3' })
    },
    onAuthenticationError: ({ userId, type, docId }) => {
      authenticationErrorCallback({ userId, type, docId, elementId: 'prosemeteor-poc-3' });
    },
    proseMirrorOptions: {
      place: document.getElementById('prosemeteor-poc-3'),
      menuBar: true,
      autoInput: true,
      tooltipMenu: {selectedBlockMenu: true}
    }
  });
});
