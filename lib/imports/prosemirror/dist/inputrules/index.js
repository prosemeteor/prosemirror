"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.removeInputRule = exports.addInputRule = exports.InputRule = undefined;

var _inputrules = require("./inputrules");

Object.defineProperty(exports, "InputRule", {
  enumerable: true,
  get: function get() {
    return _inputrules.InputRule;
  }
});
Object.defineProperty(exports, "addInputRule", {
  enumerable: true,
  get: function get() {
    return _inputrules.addInputRule;
  }
});
Object.defineProperty(exports, "removeInputRule", {
  enumerable: true,
  get: function get() {
    return _inputrules.removeInputRule;
  }
});

require("./autoinput");