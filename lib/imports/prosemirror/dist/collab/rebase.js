"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.rebaseSteps = rebaseSteps;

var _transform = require("../transform");

function rebaseSteps(doc, forward, steps, maps) {
  var remap = new _transform.Remapping([], forward.slice());
  var transform = new _transform.Transform(doc);
  var positions = [];

  for (var i = 0; i < steps.length; i++) {
    var step = steps[i].map(remap);
    var result = step && transform.maybeStep(step);
    var id = remap.addToFront(maps[i].invert());
    if (result && result.doc) {
      remap.addToBack(step.posMap(), id);
      positions.push(transform.steps.length - 1);
    } else {
      positions.push(-1);
    }
  }
  return { doc: transform.doc, transform: transform, mapping: remap, positions: positions };
}