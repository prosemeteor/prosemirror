
import { Meteor } from 'meteor/meteor';

export const Prosepipe = new Meteor.Streamer('prosemirror-pipe');

Prosepipe.allowRead('all');
Prosepipe.allowWrite('all');
