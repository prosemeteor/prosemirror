"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.readInputChange = readInputChange;
exports.readCompositionChange = readCompositionChange;

var _model = require("../model");

var _format = require("../format");

var _map = require("../transform/map");

var _selection = require("./selection");

var _dompos = require("./dompos");

function readInputChange(pm) {
  pm.ensureOperation({ readSelection: false });
  return readDOMChange(pm, rangeAroundSelection(pm));
}

function readCompositionChange(pm, margin) {
  return readDOMChange(pm, rangeAroundComposition(pm, margin));
}

// Note that all referencing and parsing is done with the
// start-of-operation selection and document, since that's the one
// that the DOM represents. If any changes came in in the meantime,
// the modification is mapped over those before it is applied, in
// readDOMChange.

function parseBetween(pm, from, to) {
  var _DOMFromPos = (0, _dompos.DOMFromPos)(pm, from, true);

  var parent = _DOMFromPos.node;
  var startOff = _DOMFromPos.offset;

  var endOff = (0, _dompos.DOMFromPos)(pm, to, true).offset;
  while (startOff) {
    var prev = parent.childNodes[startOff - 1];
    if (prev.nodeType != 1 || !prev.hasAttribute("pm-offset")) --startOff;else break;
  }
  while (endOff < parent.childNodes.length) {
    var next = parent.childNodes[endOff];
    if (next.nodeType != 1 || !next.hasAttribute("pm-offset")) ++endOff;else break;
  }
  return (0, _format.fromDOM)(pm.schema, parent, {
    topNode: pm.doc.resolve(from).parent.copy(),
    from: startOff,
    to: endOff,
    preserveWhitespace: true,
    editableContent: true
  });
}

function isAtEnd($pos, depth) {
  for (var i = depth || 0; i < $pos.depth; i++) {
    if ($pos.index(i) + 1 < $pos.node(i).childCount) return false;
  }return $pos.parentOffset == $pos.parent.content.size;
}
function isAtStart($pos, depth) {
  for (var i = depth || 0; i < $pos.depth; i++) {
    if ($pos.index(0) > 0) return false;
  }return $pos.parentOffset == 0;
}

function rangeAroundSelection(pm) {
  var _pm$operation = pm.operation;
  var sel = _pm$operation.sel;
  var doc = _pm$operation.doc;var $from = doc.resolve(sel.from);var $to = doc.resolve(sel.to);
  // When the selection is entirely inside a text block, use
  // rangeAroundComposition to get a narrow range.
  if ($from.sameParent($to) && $from.parent.isTextblock && $from.parentOffset && $to.parentOffset < $to.parent.content.size) return rangeAroundComposition(pm, 0);

  for (var depth = 0;; depth++) {
    var fromStart = isAtStart($from, depth + 1),
        toEnd = isAtEnd($to, depth + 1);
    if (fromStart || toEnd || $from.index(depth) != $to.index(depth) || $to.node(depth).isTextblock) {
      var from = $from.before(depth + 1),
          to = $to.after(depth + 1);
      if (fromStart && $from.index(depth) > 0) from -= $from.node(depth).child($from.index(depth) - 1).nodeSize;
      if (toEnd && $to.index(depth) + 1 < $to.node(depth).childCount) to += $to.node(depth).child($to.index(depth) + 1).nodeSize;
      return { from: from, to: to };
    }
  }
}

function rangeAroundComposition(pm, margin) {
  var _pm$operation2 = pm.operation;
  var sel = _pm$operation2.sel;
  var doc = _pm$operation2.doc;

  var $from = doc.resolve(sel.from),
      $to = doc.resolve(sel.to);
  if (!$from.sameParent($to)) return rangeAroundSelection(pm);
  var startOff = Math.max(0, $from.parentOffset - margin);
  var size = $from.parent.content.size;
  var endOff = Math.min(size, $to.parentOffset + margin);

  if (startOff > 0) startOff = $from.parent.childBefore(startOff).offset;
  if (endOff < size) {
    var after = $from.parent.childAfter(endOff);
    endOff = after.offset + after.node.nodeSize;
  }
  var nodeStart = $from.start();
  return { from: nodeStart + startOff, to: nodeStart + endOff };
}

function readDOMChange(pm, range) {
  var op = pm.operation;
  // If the document was reset since the start of the current
  // operation, we can't do anything useful with the change to the
  // DOM, so we discard it.
  if (op.docSet) {
    pm.markAllDirty();
    return false;
  }

  var parsed = parseBetween(pm, range.from, range.to);
  var compare = op.doc.slice(range.from, range.to);
  var change = findDiff(compare.content, parsed.content, range.from, op.sel.from);
  if (!change) return false;
  var fromMapped = (0, _map.mapThroughResult)(op.mappings, change.start);
  var toMapped = (0, _map.mapThroughResult)(op.mappings, change.endA);
  if (fromMapped.deleted && toMapped.deleted) return false;

  // Mark nodes touched by this change as 'to be redrawn'
  markDirtyFor(pm, op.doc, change.start, change.endA);

  var $from = parsed.resolveNoCache(change.start - range.from);
  var $to = parsed.resolveNoCache(change.endB - range.from),
      nextSel = void 0,
      text = void 0;
  // If this looks like the effect of pressing Enter, just dispatch an
  // Enter key instead.
  if (!$from.sameParent($to) && $from.pos < parsed.content.size && (nextSel = (0, _selection.findSelectionFrom)(parsed, $from.pos + 1, 1, true)) && nextSel.head == $to.pos) {
    pm.input.dispatchKey("Enter");
  } else if ($from.sameParent($to) && $from.parent.isTextblock && (text = uniformTextBetween(parsed, $from.pos, $to.pos)) != null) {
    pm.input.insertText(fromMapped.pos, toMapped.pos, text, function (doc) {
      return domSel(pm, doc);
    });
  } else {
    var slice = parsed.slice(change.start - range.from, change.endB - range.from);
    var tr = pm.tr.replace(fromMapped.pos, toMapped.pos, slice);
    tr.apply({
      scrollIntoView: true,
      selection: domSel(pm, tr.doc)
    });
  }
  return true;
}

function domSel(pm, doc) {
  if (pm.hasFocus()) return (0, _selection.selectionFromDOM)(pm, doc, null, true).range;
}

function uniformTextBetween(node, from, to) {
  var result = "",
      valid = true,
      marks = null;
  node.nodesBetween(from, to, function (node, pos) {
    if (!node.isInline && pos < from) return;
    if (!node.isText) return valid = false;
    if (!marks) marks = node.marks;else if (!_model.Mark.sameSet(marks, node.marks)) valid = false;
    result += node.text.slice(Math.max(0, from - pos), to - pos);
  });
  return valid ? result : null;
}

function findDiff(a, b, pos, preferedStart) {
  var start = (0, _model.findDiffStart)(a, b, pos);
  if (!start) return null;

  var _findDiffEnd = (0, _model.findDiffEnd)(a, b, pos + a.size, pos + b.size);

  var endA = _findDiffEnd.a;
  var endB = _findDiffEnd.b;

  if (endA < start) {
    var move = preferedStart <= start && preferedStart >= endA ? start - preferedStart : 0;
    start -= move;
    endB = start + (endB - endA);
    endA = start;
  } else if (endB < start) {
    var _move = preferedStart <= start && preferedStart >= endB ? start - preferedStart : 0;
    start -= _move;
    endA = start + (endA - endB);
    endB = start;
  }
  return { start: start, endA: endA, endB: endB };
}

function markDirtyFor(pm, doc, start, end) {
  var $start = doc.resolve(start),
      $end = doc.resolve(end),
      same = $start.sameDepth($end);
  if (same == 0) pm.markAllDirty();else pm.markRangeDirty($start.before(same), $start.after(same), doc);
}