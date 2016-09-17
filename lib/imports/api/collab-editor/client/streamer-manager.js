import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp-client';

/**
* Manages multiple Meteor streamer instances using the same name across any number of urls.
*/
export class StreamerManager {
  /**
  * Create a StreamerManager.
  * @param {String} name      name of the streamer
  */
  constructor (name) {
    this.streamers = {};
    this.name = name;

    this.get = this.get.bind(this);
  }

  /**
  * Get the streamer instance for the provided url. Creates a new instance if one doesn't exist.
  * @param {String} url
  */
  get (url) {
    // if a streamer exists for this url, return it
    if (this.streamers[url] instanceof StreamerInstance) {
      return this.streamers[url];
    }
    // no streamer exists for this url, create one and return it
    this.streamers[url] = new StreamerInstance({
      name: this.name,
      url
    });
    return this.streamers[url];
  }
};

/**
*   Represents a single streamer object.
*/
class StreamerInstance {
  constructor ({ name, url }) {
    this.name = name;
    this.url = url;

    this.ddpConnection = DDP.connect(url);
    this.streamerClient = new Meteor.Streamer(this.name, {
      ddpConnection: this.ddpConnection
    });
  }
}
