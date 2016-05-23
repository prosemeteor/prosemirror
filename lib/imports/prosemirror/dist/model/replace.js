"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Slice = exports.ReplaceError = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.replace = replace;

var _error = require("../util/error");

var _fragment = require("./fragment");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// ;; Error type raised by `Node.replace` when given an invalid
// replacement.

var ReplaceError = exports.ReplaceError = function (_ProseMirrorError) {
  _inherits(ReplaceError, _ProseMirrorError);

  function ReplaceError() {
    _classCallCheck(this, ReplaceError);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(ReplaceError).apply(this, arguments));
  }

  return ReplaceError;
}(_error.ProseMirrorError);

// ;; A slice represents a piece cut out of a larger document. It
// stores not only a fragment, but also the depth up to which nodes on
// both side are 'open' / cut through.


var Slice = exports.Slice = function () {
  // :: (Fragment, number, number, ?Node)

  function Slice(content, openLeft, openRight, possibleParent) {
    _classCallCheck(this, Slice);

    // :: Fragment The slice's content nodes.
    this.content = content;
    // :: number The open depth at the start.
    this.openLeft = openLeft;
    // :: number The open depth at the end.
    this.openRight = openRight;
    this.possibleParent = possibleParent;
  }

  // :: number
  // The size this slice would add when inserted into a document.


  _createClass(Slice, [{
    key: "insertAt",
    value: function insertAt(pos, fragment) {
      function insertInto(content, dist, insert) {
        var _content$findIndex = content.findIndex(dist);

        var index = _content$findIndex.index;
        var offset = _content$findIndex.offset;var child = content.maybeChild(index);
        if (offset == dist || child.isText) return content.cut(0, dist).append(insert).append(content.cut(dist));
        var inner = insertInto(child.content, dist - offset - 1, insert);
        if (!inner || offset + child.nodeSize > dist && !child.type.contentExpr.matches(child.attrs, inner)) return null;
        return content.replaceChild(index, child.copy(inner));
      }
      var content = insertInto(this.content, pos + this.openLeft, fragment);
      return content && new Slice(content, this.openLeft, this.openRight);
    }
  }, {
    key: "removeBetween",
    value: function removeBetween(from, to) {
      function removeRange(content, from, to) {
        var _content$findIndex2 = content.findIndex(from);

        var index = _content$findIndex2.index;
        var offset = _content$findIndex2.offset;var child = content.maybeChild(index);

        var _content$findIndex3 = content.findIndex(to);

        var indexTo = _content$findIndex3.index;
        var offsetTo = _content$findIndex3.offset;

        if (offset == from || child.isText) {
          if (offsetTo != to && !content.child(indexTo).isText) throw new RangeError("Removing non-flat range");
          return content.cut(0, from).append(content.cut(to));
        }
        if (index != indexTo) throw new RangeError("Removing non-flat range");
        return content.replaceChild(index, child.copy(removeRange(child.content, from - offset - 1, to - offset - 1)));
      }
      return new Slice(removeRange(this.content, from + this.openLeft, to + this.openLeft), this.openLeft, this.openRight);
    }
  }, {
    key: "toString",
    value: function toString() {
      return this.content + "(" + this.openLeft + "," + this.openRight + ")";
    }

    // :: () → ?Object
    // Convert a slice to a JSON-serializable representation.

  }, {
    key: "toJSON",
    value: function toJSON() {
      if (!this.content.size) return null;
      return { content: this.content.toJSON(),
        openLeft: this.openLeft,
        openRight: this.openRight };
    }

    // :: (Schema, ?Object) → Slice
    // Deserialize a slice from its JSON representation.

  }, {
    key: "size",
    get: function get() {
      return this.content.size - this.openLeft - this.openRight;
    }
  }], [{
    key: "fromJSON",
    value: function fromJSON(schema, json) {
      if (!json) return Slice.empty;
      return new Slice(_fragment.Fragment.fromJSON(schema, json.content), json.openLeft, json.openRight);
    }
  }]);

  return Slice;
}();

// :: Slice
// The empty slice.


Slice.empty = new Slice(_fragment.Fragment.empty, 0, 0);

function replace($from, $to, slice) {
  if (slice.openLeft > $from.depth) throw new ReplaceError("Inserted content deeper than insertion position");
  if ($from.depth - slice.openLeft != $to.depth - slice.openRight) throw new ReplaceError("Inconsistent open depths");
  return replaceOuter($from, $to, slice, 0);
}

function replaceOuter($from, $to, slice, depth) {
  var index = $from.index(depth),
      node = $from.node(depth);
  if (index == $to.index(depth) && depth < $from.depth - slice.openLeft) {
    var inner = replaceOuter($from, $to, slice, depth + 1);
    return node.copy(node.content.replaceChild(index, inner));
  } else if (slice.content.size) {
    var _prepareSliceForRepla = prepareSliceForReplace(slice, $from);

    var start = _prepareSliceForRepla.start;
    var end = _prepareSliceForRepla.end;

    return close(node, replaceThreeWay($from, start, end, $to, depth));
  } else {
    return close(node, replaceTwoWay($from, $to, depth));
  }
}

function checkJoin(main, sub) {
  if (!sub.type.compatibleContent(main.type)) throw new ReplaceError("Cannot join " + sub.type.name + " onto " + main.type.name);
}

function joinable($before, $after, depth) {
  var node = $before.node(depth);
  checkJoin(node, $after.node(depth));
  return node;
}

function addNode(child, target) {
  var last = target.length - 1;
  if (last >= 0 && child.isText && child.sameMarkup(target[last])) target[last] = child.copy(target[last].text + child.text);else target.push(child);
}

function addRange($start, $end, depth, target) {
  var node = ($end || $start).node(depth);
  var startIndex = 0,
      endIndex = $end ? $end.index(depth) : node.childCount;
  if ($start) {
    startIndex = $start.index(depth);
    if ($start.depth > depth) {
      startIndex++;
    } else if (!$start.atNodeBoundary) {
      addNode($start.nodeAfter, target);
      startIndex++;
    }
  }
  for (var i = startIndex; i < endIndex; i++) {
    addNode(node.child(i), target);
  }if ($end && $end.depth == depth && !$end.atNodeBoundary) addNode($end.nodeBefore, target);
}

function close(node, content) {
  if (!node.type.validContent(content, node.attrs)) throw new ReplaceError("Invalid content for node " + node.type.name);
  return node.copy(content);
}

function replaceThreeWay($from, $start, $end, $to, depth) {
  var openLeft = $from.depth > depth && joinable($from, $start, depth + 1);
  var openRight = $to.depth > depth && joinable($end, $to, depth + 1);

  var content = [];
  addRange(null, $from, depth, content);
  if (openLeft && openRight && $start.index(depth) == $end.index(depth)) {
    checkJoin(openLeft, openRight);
    addNode(close(openLeft, replaceThreeWay($from, $start, $end, $to, depth + 1)), content);
  } else {
    if (openLeft) addNode(close(openLeft, replaceTwoWay($from, $start, depth + 1)), content);
    addRange($start, $end, depth, content);
    if (openRight) addNode(close(openRight, replaceTwoWay($end, $to, depth + 1)), content);
  }
  addRange($to, null, depth, content);
  return new _fragment.Fragment(content);
}

function replaceTwoWay($from, $to, depth) {
  var content = [];
  addRange(null, $from, depth, content);
  if ($from.depth > depth) {
    var type = joinable($from, $to, depth + 1);
    addNode(close(type, replaceTwoWay($from, $to, depth + 1)), content);
  }
  addRange($to, null, depth, content);
  return new _fragment.Fragment(content);
}

function prepareSliceForReplace(slice, $along) {
  var extra = $along.depth - slice.openLeft,
      parent = $along.node(extra);
  var node = parent.copy(slice.content);
  for (var i = extra - 1; i >= 0; i--) {
    node = $along.node(i).copy(_fragment.Fragment.from(node));
  }return { start: node.resolveNoCache(slice.openLeft + extra),
    end: node.resolveNoCache(node.content.size - slice.openRight - extra) };
}