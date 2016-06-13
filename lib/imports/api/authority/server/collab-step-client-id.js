import { check } from 'meteor/check';

/** Class representing a step's client id associated with a collaborative document, with version data. */
export class CollabStepClientId {
  /**
  * @param {Object} params
  * @param {Number} params.versionAppliedTo   the version this step was applied to
  * @param {Number} params.clientId           the ProseMirror Step instance
  */
  constructor ({ versionAppliedTo, clientId }) {
    check(versionAppliedTo, Number);
    check(clientId, Number);
    this.versionAppliedTo = versionAppliedTo;
    this.clientId = clientId;
  }
}
