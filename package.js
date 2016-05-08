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
  prosemirror: '0.6.1'
});

Package.onUse(function(api) {
  api.versionsFrom('1.3');
  api.use('ecmascript');
  api.mainModule('lib/client/main.js','client');
  api.mainModule('lib/server/main.js','server');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.mainModule('lib/tests/prosemirror-tests.js');
});
