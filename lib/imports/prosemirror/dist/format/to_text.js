"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toText = toText;

var _model = require("../model");

var _register = require("./register");

function serializeFragment(fragment) {
  var accum = "";
  fragment.forEach(function (child) {
    return accum += child.type.serializeText(child);
  });
  return accum;
}

_model.Block.prototype.serializeText = function (node) {
  return serializeFragment(node.content);
};

_model.Textblock.prototype.serializeText = function (node) {
  var text = _model.Block.prototype.serializeText(node);
  return text && text + "\n\n";
};

_model.Inline.prototype.serializeText = function () {
  return "";
};

_model.HardBreak.prototype.serializeText = function () {
  return "\n";
};

_model.Text.prototype.serializeText = function (node) {
  return node.text;
};

// :: (union<Node, Fragment>) → string
// Serialize content as a plain text string.
function toText(content) {
  return serializeFragment(content).trim();
}

(0, _register.defineTarget)("text", toText);