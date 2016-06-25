/* eslint-disable */
Package.describe({
  name: 'prosemeteor:prosemirror',
  version: '0.1.1',
  // Brief, one-line summary of the package.
  summary: 'Prosemirror integration for Meteor',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Npm.depends({
  //  using local version in imports/prosemirror for now because the latest publish was a month ago and collab module API has changed since then,
  // we want the latest changes
  // prosemirror: '0.6.1'
  ip: '1.1.3'
});

Package.onUse(function(api) {
  api.versionsFrom('1.3');
  api.use('ecmascript');
  api.use('rocketchat:streamer@0.3.5');
  api.use('mdg:validated-method@1.1.0');
  api.use('http');
  api.mainModule('lib/client/client-main.js', 'client');
  api.mainModule('lib/server/server-main.js', 'server');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.mainModule('lib/tests/prosemirror-tests.js');
});
