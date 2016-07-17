// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from 'meteor/tinytest';

// Import and rename a variable exported by prosemirror.js.
import { name as packageName } from 'meteor/prosemirror';

// Write your tests here!
// Here is an example.
Tinytest.add('prosemirror - example', function (test) {
  test.equal(packageName, 'prosemirror');
});

// test for Prosepipe setup
// test for Prosemirror setup
