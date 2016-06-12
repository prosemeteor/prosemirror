import { check } from 'meteor/check';
import { Step } from './../../../prosemirror/dist/transform';

/** Class representing a Step applied to a collaborative document, with version data. */
export class CollabStep {
  /**
  * @param {Object} params
  * @param {Number} params.versionAppliedTo   the version this step was applied to
  * @param {Object} params.step           the ProseMirror Step instance
  */
  constructor ({ versionAppliedTo, step }) {
    check(versionAppliedTo, Number);
    check(step, Step);
    this.versionAppliedTo = versionAppliedTo;
    this.step = step;
  }
}
