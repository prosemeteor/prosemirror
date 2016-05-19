"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.captureKeys = undefined;

var _browserkeymap = require("browserkeymap");

var _browserkeymap2 = _interopRequireDefault(_browserkeymap);

var _selection = require("./selection");

var _dom = require("../dom");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function nothing() {}

function moveSelectionBlock(pm, dir) {
  var _pm$selection = pm.selection;
  var from = _pm$selection.from;
  var to = _pm$selection.to;
  var node = _pm$selection.node;

  var side = pm.doc.resolve(dir > 0 ? to : from);
  return (0, _selection.findSelectionFrom)(pm.doc, node && node.isBlock ? side.pos : dir > 0 ? side.after(side.depth) : side.before(side.depth), dir);
}

function selectNodeHorizontally(pm, dir) {
  var _pm$selection2 = pm.selection;
  var empty = _pm$selection2.empty;
  var node = _pm$selection2.node;
  var from = _pm$selection2.from;
  var to = _pm$selection2.to;

  if (!empty && !node) return false;

  if (node && node.isInline) {
    pm.setTextSelection(dir > 0 ? to : from);
    return true;
  }

  if (!node) {
    var $from = pm.doc.resolve(from);

    var _ref = dir > 0 ? $from.parent.childAfter($from.parentOffset) : $from.parent.childBefore($from.parentOffset);

    var nextNode = _ref.node;
    var offset = _ref.offset;

    if (nextNode) {
      if (nextNode.type.selectable && offset == $from.parentOffset - (dir > 0 ? 0 : nextNode.nodeSize)) {
        pm.setNodeSelection(dir < 0 ? from - nextNode.nodeSize : from);
        return true;
      }
      return false;
    }
  }

  var next = moveSelectionBlock(pm, dir);
  if (next && (next instanceof _selection.NodeSelection || node)) {
    pm.setSelection(next);
    return true;
  }
  return false;
}

function horiz(dir) {
  return function (pm) {
    var done = selectNodeHorizontally(pm, dir);
    if (done) pm.scrollIntoView();
    return done;
  };
}

// : (ProseMirror, number)
// Check whether vertical selection motion would involve node
// selections. If so, apply it (if not, the result is left to the
// browser)
function selectNodeVertically(pm, dir) {
  var _pm$selection3 = pm.selection;
  var empty = _pm$selection3.empty;
  var node = _pm$selection3.node;
  var from = _pm$selection3.from;
  var to = _pm$selection3.to;

  if (!empty && !node) return false;

  var leavingTextblock = true;
  if (!node || node.isInline) {
    pm.flush(); // verticalMotionLeavesTextblock needs an up-to-date DOM
    leavingTextblock = (0, _selection.verticalMotionLeavesTextblock)(pm, dir > 0 ? to : from, dir);
  }

  if (leavingTextblock) {
    var next = moveSelectionBlock(pm, dir);
    if (next && next instanceof _selection.NodeSelection) {
      pm.setSelection(next);
      return true;
    }
  }

  if (!node || node.isInline) return false;

  var beyond = (0, _selection.findSelectionFrom)(pm.doc, dir < 0 ? from : to, dir);
  if (beyond) pm.setSelection(beyond);
  return true;
}

function vert(dir) {
  return function (pm) {
    var done = selectNodeVertically(pm, dir);
    if (done !== false) pm.scrollIntoView();
    return done;
  };
}

// A backdrop keymap used to make sure we always suppress keys that
// have a dangerous default effect, even if the commands they are
// bound to return false, and to make sure that cursor-motion keys
// find a cursor (as opposed to a node selection) when pressed. For
// cursor-motion keys, the code in the handlers also takes care of
// block selections.

var keys = {
  "Esc": nothing,
  "Enter": nothing,
  "Ctrl-Enter": nothing,
  "Mod-Enter": nothing,
  "Shift-Enter": nothing,
  "Backspace": _dom.browser.ios ? undefined : nothing,
  "Delete": nothing,
  "Mod-B": nothing,
  "Mod-I": nothing,
  "Mod-Backspace": nothing,
  "Mod-Delete": nothing,
  "Shift-Backspace": nothing,
  "Shift-Delete": nothing,
  "Shift-Mod-Backspace": nothing,
  "Shift-Mod-Delete": nothing,
  "Mod-Z": nothing,
  "Mod-Y": nothing,
  "Shift-Mod-Z": nothing,
  "Ctrl-D": nothing,
  "Ctrl-H": nothing,
  "Ctrl-Alt-Backspace": nothing,
  "Alt-D": nothing,
  "Alt-Delete": nothing,
  "Alt-Backspace": nothing,

  "Left": horiz(-1),
  "Mod-Left": horiz(-1),
  "Right": horiz(1),
  "Mod-Right": horiz(1),
  "Up": vert(-1),
  "Down": vert(1)
};

if (_dom.browser.mac) {
  keys["Alt-Left"] = horiz(-1);
  keys["Alt-Right"] = horiz(1);
  keys["Ctrl-Backspace"] = keys["Ctrl-Delete"] = nothing;
}

var captureKeys = exports.captureKeys = new _browserkeymap2.default(keys);