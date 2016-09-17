/**
* Configuration class for getting and setting config values for ProseMeteor.
*/
class ProseMeteorConfig {
  constructor () {
    // all possible config values
    this._ip = undefined;
    this._port = undefined;
    this._protocol = undefined;
    this._snapshotIntervalMs = undefined;
    this._failedHealthChecksThreshold = undefined;
  }
  checkExists (key, value) {
    if (typeof value === 'undefined' || value === null) {
      throw new Error(`ProseMeteor ProseMeteorconfig: Nonexistant value "${value}" provided for ${key}`);
    }
  }
  get ip () {
    return this._ip;
  }
  set ip (value) {
    this.checkExists('ip', value);
    this._ip = value;
  }
  get port () {
    return this._port;
  }
  set port (value) {
    this.checkExists('port', value);
    this._port = value;
  }
  get protocol () {
    return this._protocol;
  }
  set protocol (value) {
    this.checkExists('protocol', value);
    if (['http', 'https'].indexOf(value) === -1) {
      throw new Error(`ProseMeteor ProseMeteorConfig: protocol must be either "http" or "https", "${value}" provided`);
    }
    this._protocol = value;
  }
  get snapshotIntervalMs () {
    return this._snapshotIntervalMs;
  }
  set snapshotIntervalMs (value) {
    this.checkExists('snapshotIntervalMs', value);
    this._snapshotIntervalMs = value;
  }

  get failedHealthChecksThreshold () {
    return this._failedHealthChecksThreshold;
  }
  set failedHealthChecksThreshold (value) {
    if (value < 3) {
      console.warn('ProseMeteorConfig: Warning, setting failedHealthChecksThreshold to less than 3 might be dangerous since it can lead to servers being removed from the registry of available servers.');
    }
    this._failedHealthChecksThreshold = value;
  }

}

export const proseMeteorConfig = new ProseMeteorConfig();
