
// import { Meteor } from 'meteor/meteor';
import './fixtures.js'
import {Step} from "prosemirror/dist/transform"
import {Documents} from '../../api/documents.js'


export const Prosepipe = new Meteor.Streamer('prosemirror-pipe', {retransmit : false});

Prosepipe.on('docRequest', (idofdoc) => {
	console.log(idofdoc);
	doc = Documents.findOne();
	Prosepipe.emit('docResponse', doc);
});

Prosepipe.allowRead('all');
Prosepipe.allowWrite('all');
