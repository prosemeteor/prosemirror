"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.tempEditors = tempEditors;
exports.tempEditor = tempEditor;
exports.namespace = namespace;
exports.dispatch = dispatch;

var _tests = require("../tests");

var _main = require("../../edit/main");

var tempPMs = null;

function tempEditors(options) {
  var space = document.querySelector("#workspace");
  if (tempPMs) {
    tempPMs.forEach(function (pm) {
      return space.removeChild(pm.wrapper);
    });
    tempPMs = null;
  }
  return tempPMs = options.map(function (options) {
    if (!options) options = {};
    options.place = space;
    var pm = new _main.ProseMirror(options);
    var a = options.doc && options.doc.tag && options.doc.tag.a;
    if (a != null) {
      if (options.doc.resolve(a).parent.isTextblock) pm.setTextSelection(a, options.doc.tag.b);else pm.setNodeSelection(a);
    }
    return pm;
  });
}

function tempEditor(options) {
  return tempEditors([options])[0];
}

function namespace(space, defaults) {
  return function (name, f, options) {
    if (!options) options = {};
    if (defaults) for (var opt in defaults) {
      if (!options.hasOwnProperty(opt)) options[opt] = defaults[opt];
    }(0, _tests.defTest)(space + "_" + name, function () {
      return f(tempEditor(options));
    });
  };
}

function dispatch(pm, key) {
  pm.input.dispatchKey(key);
}