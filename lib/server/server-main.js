import { Meteor } from 'meteor/meteor';
import { Documents } from './../imports/api/documents/server/collection'
import { ProseMeteorAuthority } from './../imports/api/authority/server/authority';

// start up server
import './../imports/startup/server/index';

const streamerServer = new Meteor.Streamer('prosemirror-steps', { retransmit : false });

streamerServer.on('docRequest', (idofdoc) => {
	console.log('server received docRequest with "' + idofdoc + '", emitting response')
	doc = Documents.findOne();
	streamerServer.emit('docResponse', doc);
});

streamerServer.allowRead('all');
streamerServer.allowWrite('all');


// // receieve steps from client
// streamerServer.on('clientSubmitSteps', ({ clientId, steps, version }) => {
// 	// parse the steps from json and convert them into Step instances
// 	const stepObjects = steps.map((step) => {
// 		return Step.fromJSON(defaultSchema, step);
// 	});
// 	//console.log('Server got step: ' + resp);
//   console.log('Client ' + clientId + ' has submitted steps for version ' + version, stepObjects);
// });

// create an authority
let authority = new ProseMeteorAuthority('docId', Documents, streamerServer);
