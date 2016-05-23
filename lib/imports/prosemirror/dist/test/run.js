"use strict";

var _failure = require("./failure");

require("./all");

var _tests = require("./tests");

require("source-map-support").install();

var fail = 0,
    ran = 0;

// declare global: process
var filters = process.argv.slice(2);

for (var name in _tests.tests) {
  if (!(0, _tests.filter)(name, filters)) continue;
  ++ran;
  try {
    _tests.tests[name]();
  } catch (e) {
    ++fail;
    if (e instanceof _failure.Failure) console["log"](name + ": " + e);else console["log"](name + ": " + (e.stack || e));
  }
}

console["log"]((fail ? "\n" : "") + ran + " test ran. " + (fail ? fail + " failures." : "All passed."));
process.exit(fail ? 1 : 0);