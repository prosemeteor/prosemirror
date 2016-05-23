import { ProseMeteorEditor } from 'meteor/prosemeteor:prosemirror';
import { Meteor } from 'meteor/meteor';

Meteor.startup(function() {
  let editor1 = new ProseMeteorEditor({
    docId: 'proofOfConceptDocId1',
    proseMirrorOptions: {
      place: document.getElementById('prosemeteor-poc-1'),
      menuBar: true,
      autoInput: true,
      tooltipMenu: {selectedBlockMenu: true}
    }
  });

  let editor2 = new ProseMeteorEditor({
    docId: 'proofOfConceptDocId2',
    proseMirrorOptions: {
      place: document.getElementById('prosemeteor-poc-2'),
      menuBar: true,
      autoInput: true,
      tooltipMenu: {selectedBlockMenu: true}
    }
  });
});
