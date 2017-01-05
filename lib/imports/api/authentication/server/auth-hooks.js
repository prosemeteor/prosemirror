import { check } from 'meteor/check';

/**
 * Stores authentication hooks provided by the package implementer that are called to
 * determine if users are permitted to interact with documents (view, edit, delete, etc.)
 */

class AuthHooks {
  constructor () {
    this._canUserViewDoc = () => true;
    this._canUserEditDoc = () => true;
    this._canUserDeleteDoc = () => true;
  }

  get canUserViewDoc () {
    return this._canUserViewDoc;
  }
  set canUserViewDoc (hookFn) {
    check(hookFn, Function);
    this._canUserViewDoc = hookFn;
  }

  get canUserEditDoc () {
    return this._canUserEditDoc;
  }
  set canUserEditDoc (hookFn) {
    check(hookFn, Function);
    this._canUserEditDoc = hookFn;
  }

  get canUserDeleteDoc () {
    return this._canUserDeleteDoc;
  }
  set canUserDeleteDoc (hookFn) {
    check(hookFn, Function);
    this._canUserDeleteDoc = hookFn;
  }
}

export const authHooks = new AuthHooks();
