"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.canLift = canLift;
exports.canWrap = canWrap;
exports.canSplit = canSplit;
exports.joinable = joinable;
exports.joinPoint = joinPoint;

var _model = require("../model");

var _transform = require("./transform");

var _replace_step = require("./replace_step");

// :: (Node, number, ?number) → bool
// Tells you whether the range in the given positions' shared
// ancestor, or any of _its_ ancestor nodes, can be lifted out of a
// parent.
function canLift(doc, from, to) {
  return !!findLiftable(doc.resolve(from), doc.resolve(to == null ? from : to));
}

function rangeDepth($from, $to) {
  var shared = $from.sameDepth($to);
  if ($from.node(shared).isTextblock || $from.pos == $to.pos) --shared;
  if (shared < 0 || $from.pos > $to.pos) return null;
  return shared;
}

function canCut(node, start, end) {
  return (start == 0 || node.canReplace(start, node.childCount)) && (end == node.childCount || node.canReplace(0, start));
}

function findLiftable($from, $to) {
  var shared = rangeDepth($from, $to);
  if (!shared) return null;
  var parent = $from.node(shared),
      content = parent.content.cutByIndex($from.index(shared), $to.indexAfter(shared));
  for (var depth = shared;; --depth) {
    var node = $from.node(depth),
        index = $from.index(depth);
    if (depth < shared && node.canReplace(index, index + 1, content)) return { depth: depth, shared: shared, unwrap: false };
    if (depth == 0 || !canCut(node, index, index + 1)) break;
  }

  if (parent.isBlock) {
    var _ret = function () {
      var joined = _model.Fragment.empty;
      content.forEach(function (node) {
        return joined = joined.append(node.content);
      });
      for (var _depth = shared;; --_depth) {
        var _node = $from.node(_depth),
            _index = $from.index(_depth);
        if (_depth < shared && _node.canReplace(_index, _index + 1, joined)) return {
            v: { depth: _depth, shared: shared, unwrap: true }
          };
        if (_depth == 0 || !canCut(_node, _index, _index + 1)) break;
      }
    }();

    if ((typeof _ret === "undefined" ? "undefined" : _typeof(_ret)) === "object") return _ret.v;
  }
}

// :: (number, ?number, ?bool) → Transform
// Lift the nearest liftable ancestor of the [sibling
// range](#Node.siblingRange) of the given positions out of its parent
// (or do nothing if no such node exists). When `silent` is true, this
// won't raise an error when the lift is impossible.
_transform.Transform.prototype.lift = function (from) {
  var to = arguments.length <= 1 || arguments[1] === undefined ? from : arguments[1];
  var silent = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

  var $from = this.doc.resolve(from),
      $to = this.doc.resolve(to);
  var liftable = findLiftable($from, $to);
  if (!liftable) {
    if (!silent) throw new RangeError("No valid lift target");
    return this;
  }

  var depth = liftable.depth;
  var shared = liftable.shared;
  var unwrap = liftable.unwrap;


  var gapStart = $from.before(shared + 1),
      gapEnd = $to.after(shared + 1);
  var start = gapStart,
      end = gapEnd;

  var before = _model.Fragment.empty,
      beforeDepth = 0;
  for (var d = shared, splitting = false; d > depth; d--) {
    if (splitting || $from.index(d) > 0) {
      splitting = true;
      before = _model.Fragment.from($from.node(d).copy(before));
      beforeDepth++;
    } else {
      start--;
    }
  }var after = _model.Fragment.empty,
      afterDepth = 0;
  for (var _d = shared, _splitting = false; _d > depth; _d--) {
    if (_splitting || $to.after(_d + 1) < $to.end(_d)) {
      _splitting = true;
      after = _model.Fragment.from($to.node(_d).copy(after));
      afterDepth++;
    } else {
      end++;
    }
  }if (unwrap) {
    var joinPos = gapStart,
        parent = $from.node(shared);
    for (var i = $from.index(shared), e = $to.index(shared) + 1, first = true; i < e; i++, first = false) {
      if (!first) {
        this.join(joinPos);
        end -= 2;
        gapEnd -= 2;
      }
      joinPos += parent.child(i).nodeSize - (first ? 0 : 2);
    }
    ++gapStart;
    --gapEnd;
  }

  return this.step(new _replace_step.ReplaceWrapStep(start, end, gapStart, gapEnd, new _model.Slice(before.append(after), beforeDepth, afterDepth), before.size - beforeDepth, true));
};

// :: (Node, number, ?number, NodeType, ?Object) → bool
// Determines whether the [sibling range](#Node.siblingRange) of the
// given positions can be wrapped in the given node type.
function canWrap(doc, from, to, type, attrs) {
  return !!checkWrap(doc.resolve(from), doc.resolve(to == null ? from : to), type, attrs);
}

function checkWrap($from, $to, type, attrs) {
  var shared = rangeDepth($from, $to);
  if (shared == null) return null;
  var parent = $from.node(shared);
  var around = parent.contentMatchAt($from.index(shared)).findWrapping(type, attrs);
  if (!around) return null;
  if (!parent.canReplaceWith($from.index(shared), $to.indexAfter(shared), around.length ? around[0].type : type, around.length ? around[0].attrs : attrs)) return null;
  var inner = parent.child($from.index(shared));
  var inside = type.contentExpr.start(attrs || type.defaultAttrs).findWrapping(inner.type, inner.attrs);
  if (around && inside) return { shared: shared, around: around, inside: inside };
}

// :: (number, ?number, NodeType, ?Object) → Transform
// Wrap the [sibling range](#Node.siblingRange) of the given positions
// in a node of the given type, with the given attributes (if
// possible).
_transform.Transform.prototype.wrap = function (from) {
  var to = arguments.length <= 1 || arguments[1] === undefined ? from : arguments[1];
  var type = arguments[2];
  var wrapAttrs = arguments[3];

  var $from = this.doc.resolve(from),
      $to = this.doc.resolve(to);
  var check = checkWrap($from, $to, type, wrapAttrs);
  if (!check) throw new RangeError("Wrap not possible");
  var shared = check.shared;
  var around = check.around;
  var inside = check.inside;


  var content = _model.Fragment.empty,
      open = inside.length + 1 + around.length;
  for (var i = inside.length - 1; i >= 0; i--) {
    content = _model.Fragment.from(inside[i].type.create(inside[i].attrs, content));
  }content = _model.Fragment.from(type.create(wrapAttrs, content));
  for (var _i = around.length - 1; _i >= 0; _i--) {
    content = _model.Fragment.from(around[_i].type.create(around[_i].attrs, content));
  }var start = $from.before(shared + 1),
      end = $to.after(shared + 1);
  this.step(new _replace_step.ReplaceWrapStep(start, end, start, end, new _model.Slice(content, 0, 0), open, true));

  if (inside.length) {
    var splitPos = start + open,
        parent = $from.node(shared);
    for (var _i2 = $from.index(shared), e = $to.index(shared) + 1, first = true; _i2 < e; _i2++, first = false) {
      if (!first) this.split(splitPos, inside.length);
      splitPos += parent.child(_i2).nodeSize + (first ? 0 : 2 * inside.length);
    }
  }
  return this;
};

// :: (number, ?number, NodeType, ?Object) → Transform
// Set the type of all textblocks (partly) between `from` and `to` to
// the given node type with the given attributes.
_transform.Transform.prototype.setBlockType = function (from) {
  var to = arguments.length <= 1 || arguments[1] === undefined ? from : arguments[1];

  var _this = this;

  var type = arguments[2];
  var attrs = arguments[3];

  if (!type.isTextblock) throw new RangeError("Type given to setBlockType should be a textblock");
  var mapFrom = this.steps.length;
  this.doc.nodesBetween(from, to, function (node, pos) {
    if (node.isTextblock && !node.hasMarkup(type, attrs)) {
      // Ensure all markup that isn't allowed in the new node type is cleared
      _this.clearMarkupFor(_this.map(pos, 1, mapFrom), type, attrs);
      var startM = _this.map(pos, 1, mapFrom),
          endM = _this.map(pos + node.nodeSize, 1, mapFrom);
      _this.step(new _replace_step.ReplaceWrapStep(startM, endM, startM + 1, endM - 1, new _model.Slice(_model.Fragment.from(type.create(attrs)), 0, 0), 1, true));
      return false;
    }
  });
  return this;
};

// :: (number, ?NodeType, ?Object) → Transform
// Change the type and attributes of the node after `pos`.
_transform.Transform.prototype.setNodeType = function (pos, type, attrs) {
  var node = this.doc.nodeAt(pos);
  if (!node) throw new RangeError("No node at given position");
  if (!type) type = node.type;
  if (node.type.isLeaf) return this.replaceWith(pos, pos + node.nodeSize, type.create(attrs, null, node.marks));

  if (!type.validContent(node.content, attrs)) throw new RangeError("Invalid content for node type " + type.name);

  return this.step(new _replace_step.ReplaceWrapStep(pos, pos + node.nodeSize, pos + 1, pos + node.nodeSize - 1, new _model.Slice(_model.Fragment.from(type.create(attrs)), 0, 0), 1, true));
};

// :: (Node, number, ?NodeType, ?Object) → bool
// Check whether splitting at the given position is allowed.
function canSplit(doc, pos) {
  var depth = arguments.length <= 2 || arguments[2] === undefined ? 1 : arguments[2];
  var typeAfter = arguments[3];
  var attrsAfter = arguments[4];

  var $pos = doc.resolve(pos),
      base = $pos.depth - depth;
  if (base < 0 || !$pos.parent.canReplace($pos.index(), $pos.parent.childCount) || !$pos.parent.canReplace(0, $pos.indexAfter())) return false;
  for (var d = $pos.depth - 1; d > base; d--) {
    var node = $pos.node(d),
        _index2 = $pos.index(d);
    if (!node.canReplace(0, _index2) || !node.canReplaceWith(_index2, node.childCount, typeAfter || $pos.node(d + 1).type, typeAfter ? attrsAfter : $pos.node(d + 1).attrs)) return false;
    typeAfter = null;
  }
  var index = $pos.indexAfter(base);
  return $pos.node(base).canReplaceWith(index, index, typeAfter || $pos.node(base + 1).type, typeAfter ? attrsAfter : $pos.node(base + 1).attrs);
}

// :: (number, ?number, ?NodeType, ?Object) → Transform
// Split the node at the given position, and optionally, if `depth` is
// greater than one, any number of nodes above that. By default, the part
// split off will inherit the node type of the original node. This can
// be changed by passing `typeAfter` and `attrsAfter`.
_transform.Transform.prototype.split = function (pos) {
  var depth = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];
  var typeAfter = arguments[2];
  var attrsAfter = arguments[3];

  var $pos = this.doc.resolve(pos),
      before = _model.Fragment.empty,
      after = _model.Fragment.empty;
  for (var d = $pos.depth, e = $pos.depth - depth; d > e; d--) {
    before = _model.Fragment.from($pos.node(d).copy(before));
    after = _model.Fragment.from(typeAfter ? typeAfter.create(attrsAfter, after) : $pos.node(d).copy(after));
    typeAfter = null;
  }
  return this.step(new _replace_step.ReplaceStep(pos, pos, new _model.Slice(before.append(after), depth, depth, true)));
};

// :: (Node, number) → bool
// Test whether the blocks before and after a given position can be
// joined.
function joinable(doc, pos) {
  var $pos = doc.resolve(pos),
      index = $pos.index();
  return canJoin($pos.nodeBefore, $pos.nodeAfter) && $pos.parent.canReplace(index, index + 1);
}

function canJoin(a, b) {
  return a && b && !a.isText && a.canAppend(b);
}

// :: (Node, number, ?number) → ?number
// Find an ancestor of the given position that can be joined to the
// block before (or after if `dir` is positive). Returns the joinable
// point, if any.
function joinPoint(doc, pos) {
  var dir = arguments.length <= 2 || arguments[2] === undefined ? -1 : arguments[2];

  var $pos = doc.resolve(pos);
  for (var d = $pos.depth;; d--) {
    var before = void 0,
        after = void 0;
    if (d == $pos.depth) {
      before = $pos.nodeBefore;
      after = $pos.nodeAfter;
    } else if (dir > 0) {
      before = $pos.node(d + 1);
      after = $pos.node(d).maybeChild($pos.index(d) + 1);
    } else {
      before = $pos.node(d).maybeChild($pos.index(d) - 1);
      after = $pos.node(d + 1);
    }
    if (before && !before.isTextblock && canJoin(before, after)) return pos;
    if (d == 0) break;
    pos = dir < 0 ? $pos.before(d) : $pos.after(d);
  }
}

// :: (number, ?number, ?bool) → Transform
// Join the blocks around the given position. When `silent` is true,
// the method will return without raising an error if the position
// isn't a valid place to join.
_transform.Transform.prototype.join = function (pos) {
  var depth = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];
  var silent = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

  if (silent && (pos < depth || pos + depth > this.doc.content.size)) return this;
  var step = new _replace_step.ReplaceStep(pos - depth, pos + depth, _model.Slice.empty, true);
  if (silent) this.maybeStep(step);else this.step(step);
  return this;
};