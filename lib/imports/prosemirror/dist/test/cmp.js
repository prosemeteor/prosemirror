"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cmpNode = cmpNode;
exports.cmpStr = cmpStr;
exports.cmp = cmp;
exports.gt = gt;
exports.lt = lt;
exports.is = is;

var _failure = require("./failure");

function cmpNode(a, b, comment) {
  if (!a.eq(b)) throw new _failure.Failure("Different nodes:\n  " + a + "\nvs\n  " + b + (comment ? "\n(" + comment + ")" : ""));
}

function cmpStr(a, b, comment) {
  var as = String(a),
      bs = String(b);
  if (as != bs) throw new _failure.Failure("expected " + bs + ", got " + as + (comment ? " (" + comment + ")" : ""));
}

function cmp(a, b, comment) {
  if (a !== b) throw new _failure.Failure("expected " + b + ", got " + a + (comment ? " (" + comment + ")" : ""));
}

function gt(a, b, comment) {
  if (a <= b) throw new _failure.Failure("expected " + a + " > " + b + (comment ? " (" + comment + ")" : ""));
}

function lt(a, b, comment) {
  if (a >= b) throw new _failure.Failure("expected " + a + " < " + b + (comment ? " (" + comment + ")" : ""));
}

function is(condition, comment) {
  if (!condition) throw new _failure.Failure("assertion failed" + (comment ? " (" + comment + ")" : ""));
}