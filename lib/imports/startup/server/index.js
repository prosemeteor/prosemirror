

// Load Fixtures
import './fixtures.js'

// Load Publications
import './publications.js'


import {Documents} from '../../api/documents.js'
//import {Step} from 'prosemirror/dist/transform'

export const Prosepipe = new Meteor.Streamer('prosemirror-pipe');
// export const Prosepipe = new Meteor.Streamer('prosemirror-pipe', {retransmit : false});

Prosepipe.on('docRequest', (idofdoc) => {
	console.log(idofdoc);
	doc = Documents.findOne();
	Prosepipe.emit('docResponse', doc);
});

Prosepipe.allowRead('all');
Prosepipe.allowWrite('all');
