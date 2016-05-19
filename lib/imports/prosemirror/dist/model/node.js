"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TextNode = exports.Node = undefined;

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fragment = require("./fragment");

var _mark = require("./mark");

var _replace2 = require("./replace");

var _resolvedpos = require("./resolvedpos");

var _comparedeep = require("../util/comparedeep");

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var emptyArray = [],
    emptyAttrs = Object.create(null);

// ;; This class represents a node in the tree that makes up a
// ProseMirror document. So a document is an instance of `Node`, with
// children that are also instances of `Node`.
//
// Nodes are persistent data structures. Instead of changing them, you
// create new ones with the content you want. Old ones keep pointing
// at the old document shape. This is made cheaper by sharing
// structure between the old and new data as much as possible, which a
// tree shape like this (without back pointers) makes easy.
//
// **Never** directly mutate the properties of a `Node` object. See
// [this guide](guide/doc.html) for more information.

var Node = exports.Node = function () {
  function Node(type, attrs, content, marks) {
    _classCallCheck(this, Node);

    // :: NodeType
    // The type of node that this is.
    this.type = type;

    // :: Object
    // An object mapping attribute names to string values. The kind of
    // attributes allowed and required are determined by the node
    // type.
    this.attrs = attrs;

    // :: Fragment
    // The node's content.
    this.content = content || _fragment.Fragment.empty;

    // :: [Mark]
    // The marks (things like whether it is emphasized or part of a
    // link) associated with this node.
    this.marks = marks || emptyArray;
  }

  // :: number
  // The size of this node. For text node, this is the amount of
  // characters. For leaf nodes, it is one. And for non-leaf nodes, it
  // is the size of the content plus two (the start and end token).


  _createClass(Node, [{
    key: "child",


    // :: (number) → Node
    // Get the child node at the given index. Raise an error when the
    // index is out of range.
    value: function child(index) {
      return this.content.child(index);
    }

    // :: (number) → ?Node
    // Get the child node at the given index, if it exists.

  }, {
    key: "maybeChild",
    value: function maybeChild(index) {
      return this.content.maybeChild(index);
    }

    // :: ((node: Node, offset: number))
    // Call `f` for every child node, passing the node and its offset
    // into this parent node.

  }, {
    key: "forEach",
    value: function forEach(f) {
      this.content.forEach(f);
    }

    // :: string
    // Concatenate all the text nodes found in this fragment and its
    // children.

  }, {
    key: "eq",


    // :: (Node) → bool
    // Test whether two nodes represent the same content.
    value: function eq(other) {
      return this == other || this.sameMarkup(other) && this.content.eq(other.content);
    }

    // :: (Node) → bool
    // Compare the markup (type, attributes, and marks) of this node to
    // those of another. Returns `true` if both have the same markup.

  }, {
    key: "sameMarkup",
    value: function sameMarkup(other) {
      return this.hasMarkup(other.type, other.attrs, other.marks);
    }

    // :: (NodeType, ?Object, ?[Mark]) → bool
    // Check whether this node's markup correspond to the given type,
    // attributes, and marks.

  }, {
    key: "hasMarkup",
    value: function hasMarkup(type, attrs, marks) {
      return this.type == type && (0, _comparedeep.compareDeep)(this.attrs, attrs || type.defaultAttrs || emptyAttrs) && _mark.Mark.sameSet(this.marks, marks || emptyArray);
    }

    // :: (?Fragment) → Node
    // Create a new node with the same markup as this node, containing
    // the given content (or empty, if no content is given).

  }, {
    key: "copy",
    value: function copy() {
      var content = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

      if (content == this.content) return this;
      return new this.constructor(this.type, this.attrs, content, this.marks);
    }

    // :: ([Mark]) → Node
    // Create a copy of this node, with the given set of marks instead
    // of the node's own marks.

  }, {
    key: "mark",
    value: function mark(marks) {
      return marks == this.marks ? this : new this.constructor(this.type, this.attrs, this.content, marks);
    }

    // :: (number, ?number) → Node
    // Create a copy of this node with only the content between the
    // given offsets. If `to` is not given, it defaults to the end of
    // the node.

  }, {
    key: "cut",
    value: function cut(from, to) {
      if (from == 0 && to == this.content.size) return this;
      return this.copy(this.content.cut(from, to));
    }

    // :: (number, ?number) → Slice
    // Cut out the part of the document between the given positions, and
    // return it as a `Slice` object.

  }, {
    key: "slice",
    value: function slice(from) {
      var to = arguments.length <= 1 || arguments[1] === undefined ? this.content.size : arguments[1];

      if (from == to) return _replace2.Slice.empty;

      var $from = this.resolve(from),
          $to = this.resolve(to);
      var depth = $from.sameDepth($to),
          start = $from.start(depth),
          node = $from.node(depth);
      var content = node.content.cut($from.pos - start, $to.pos - start);
      return new _replace2.Slice(content, $from.depth - depth, $to.depth - depth, node);
    }

    // :: (number, number, Slice) → Node
    // Replace the part of the document between the given positions with
    // the given slice. The slice must 'fit', meaning its open sides
    // must be able to connect to the surrounding content, and its
    // content nodes must be valid children for the node they are placed
    // into. If any of this is violated, an error of type `ReplaceError`
    // is thrown.

  }, {
    key: "replace",
    value: function replace(from, to, slice) {
      return (0, _replace2.replace)(this.resolve(from), this.resolve(to), slice);
    }

    // :: (number) → ?Node
    // Find the node after the given position.

  }, {
    key: "nodeAt",
    value: function nodeAt(pos) {
      for (var node = this;;) {
        var _node$content$findInd = node.content.findIndex(pos);

        var index = _node$content$findInd.index;
        var offset = _node$content$findInd.offset;

        node = node.maybeChild(index);
        if (!node) return null;
        if (offset == pos || node.isText) return node;
        pos -= offset + 1;
      }
    }

    // :: (number) → {node: ?Node, index: number, offset: number}
    // Find the (direct) child node after the given offset, if any,
    // and return it along with its index and offset relative to this
    // node.

  }, {
    key: "childAfter",
    value: function childAfter(pos) {
      var _content$findIndex = this.content.findIndex(pos);

      var index = _content$findIndex.index;
      var offset = _content$findIndex.offset;

      return { node: this.content.maybeChild(index), index: index, offset: offset };
    }

    // :: (number) → {node: ?Node, index: number, offset: number}
    // Find the (direct) child node before the given offset, if any,
    // and return it along with its index and offset relative to this
    // node.

  }, {
    key: "childBefore",
    value: function childBefore(pos) {
      if (pos == 0) return { node: null, index: 0, offset: 0 };

      var _content$findIndex2 = this.content.findIndex(pos);

      var index = _content$findIndex2.index;
      var offset = _content$findIndex2.offset;

      if (offset < pos) return { node: this.content.child(index), index: index, offset: offset };
      var node = this.content.child(index - 1);
      return { node: node, index: index - 1, offset: offset - node.nodeSize };
    }

    // :: (?number, ?number, (node: Node, pos: number, parent: Node, index: number))
    // Iterate over all nodes between the given two positions, calling
    // the callback with the node, its position, its parent
    // node, and its index in that node.

  }, {
    key: "nodesBetween",
    value: function nodesBetween(from, to, f) {
      var pos = arguments.length <= 3 || arguments[3] === undefined ? 0 : arguments[3];

      this.content.nodesBetween(from, to, f, pos, this);
    }

    // :: ((node: Node, pos: number, parent: Node))
    // Call the given callback for every descendant node.

  }, {
    key: "descendants",
    value: function descendants(f) {
      this.nodesBetween(0, this.content.size, f);
    }

    // :: (number) → ResolvedPos
    // Resolve the given position in the document, returning an object
    // describing its path through the document.

  }, {
    key: "resolve",
    value: function resolve(pos) {
      return _resolvedpos.ResolvedPos.resolveCached(this, pos);
    }
  }, {
    key: "resolveNoCache",
    value: function resolveNoCache(pos) {
      return _resolvedpos.ResolvedPos.resolve(this, pos);
    }

    // :: (number) → [Mark]
    // Get the marks at the given position factoring in the surrounding marks'
    // inclusiveLeft and inclusiveRight properties. If the position is at the
    // start of a non-empty node, the marks of the node after it are returned.

  }, {
    key: "marksAt",
    value: function marksAt(pos) {
      var $pos = this.resolve(pos),
          parent = $pos.parent,
          index = $pos.index();

      // In an empty parent, return the empty array
      if (parent.content.size == 0) return emptyArray;
      // When inside a text node or at the start of the parent node, return the node's marks
      if (index == 0 || !$pos.atNodeBoundary) return parent.child(index).marks;

      var marks = parent.child(index - 1).marks;
      for (var i = 0; i < marks.length; i++) {
        if (!marks[i].type.inclusiveRight) marks = marks[i--].removeFromSet(marks);
      }return marks;
    }

    // :: (?number, ?number, MarkType) → bool
    // Test whether a mark of the given type occurs in this document
    // between the two given positions.

  }, {
    key: "rangeHasMark",
    value: function rangeHasMark(from, to, type) {
      var found = false;
      this.nodesBetween(from, to, function (node) {
        if (type.isInSet(node.marks)) found = true;
        return !found;
      });
      return found;
    }

    // :: bool
    // True when this is a block (non-inline node)

  }, {
    key: "toString",


    // :: () → string
    // Return a string representation of this node for debugging
    // purposes.
    value: function toString() {
      var name = this.type.name;
      if (this.content.size) name += "(" + this.content.toStringInner() + ")";
      return wrapMarks(this.marks, name);
    }

    // :: (number) → ContentMatch
    // Get the content match in this node at the given index.

  }, {
    key: "contentMatchAt",
    value: function contentMatchAt(index) {
      return this.type.contentExpr.getMatchAt(this.attrs, this.content, index);
    }

    // :: (number, number, ?Fragment, ?number, ?number) → bool
    // Test whether replacing the range `from` to `to` (by index) with
    // the given replacement fragment (which defaults to the empty
    // fragment) would leave the node's content valid. You can
    // optionally pass `start` and `end` indices into the replacement
    // fragment.

  }, {
    key: "canReplace",
    value: function canReplace(from, to, replacement, start, end) {
      return this.type.contentExpr.checkReplace(this.attrs, this.content, from, to, replacement, start, end);
    }

    // :: (number, number, NodeType, ?[Mark]) → bool
    // Test whether replacing the range `from` to `to` (by index) with a
    // node of the given type and marks would be valid.

  }, {
    key: "canReplaceWith",
    value: function canReplaceWith(from, to, type, attrs, marks) {
      return this.type.contentExpr.checkReplaceWith(this.attrs, this.content, from, to, type, attrs, marks || emptyArray);
    }

    // :: (Node) → bool
    // Test whether the given node's content could be appended to this
    // node. If that node is empty, this will only return true if there
    // is at least one node type that can appear in both nodes (to avoid
    // merging completely incompatible nodes).

  }, {
    key: "canAppend",
    value: function canAppend(other) {
      if (other.content.size) return this.canReplace(this.childCount, this.childCount, other.content);else return this.type.compatibleContent(other.type);
    }
  }, {
    key: "defaultContentType",
    value: function defaultContentType(at) {
      return this.contentMatchAt(at).element.defaultType();
    }

    // :: () → Object
    // Return a JSON-serializeable representation of this node.

  }, {
    key: "toJSON",
    value: function toJSON() {
      var obj = { type: this.type.name };
      for (var _ in this.attrs) {
        obj.attrs = this.attrs;
        break;
      }
      if (this.content.size) obj.content = this.content.toJSON();
      if (this.marks.length) obj.marks = this.marks.map(function (n) {
        return n.toJSON();
      });
      return obj;
    }

    // :: (Schema, Object) → Node
    // Deserialize a node from its JSON representation.

  }, {
    key: "nodeSize",
    get: function get() {
      return this.type.isLeaf ? 1 : 2 + this.content.size;
    }

    // :: number
    // The number of children that the node has.

  }, {
    key: "childCount",
    get: function get() {
      return this.content.childCount;
    }
  }, {
    key: "textContent",
    get: function get() {
      return this.content.textContent;
    }

    // :: ?Node
    // Returns this node's first child, or `null` if there are no
    // children.

  }, {
    key: "firstChild",
    get: function get() {
      return this.content.firstChild;
    }

    // :: ?Node
    // Returns this node's last child, or `null` if there are no
    // children.

  }, {
    key: "lastChild",
    get: function get() {
      return this.content.lastChild;
    }
  }, {
    key: "isBlock",
    get: function get() {
      return this.type.isBlock;
    }

    // :: bool
    // True when this is a textblock node, a block node with inline
    // content.

  }, {
    key: "isTextblock",
    get: function get() {
      return this.type.isTextblock;
    }

    // :: bool
    // True when this is an inline node (a text node or a node that can
    // appear among text).

  }, {
    key: "isInline",
    get: function get() {
      return this.type.isInline;
    }

    // :: bool
    // True when this is a text node.

  }, {
    key: "isText",
    get: function get() {
      return this.type.isText;
    }
  }], [{
    key: "fromJSON",
    value: function fromJSON(schema, json) {
      var type = schema.nodeType(json.type);
      var content = json.text != null ? json.text : _fragment.Fragment.fromJSON(schema, json.content);
      return type.create(json.attrs, content, json.marks && json.marks.map(schema.markFromJSON));
    }
  }]);

  return Node;
}();

// ;; #forward=Node


var TextNode = exports.TextNode = function (_Node) {
  _inherits(TextNode, _Node);

  function TextNode(type, attrs, content, marks) {
    _classCallCheck(this, TextNode);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(TextNode).call(this, type, attrs, null, marks));

    if (!content) throw new RangeError("Empty text nodes are not allowed");

    // :: ?string
    // For text nodes, this contains the node's text content.
    _this.text = content;
    return _this;
  }

  _createClass(TextNode, [{
    key: "toString",
    value: function toString() {
      return wrapMarks(this.marks, JSON.stringify(this.text));
    }
  }, {
    key: "mark",
    value: function mark(marks) {
      return new TextNode(this.type, this.attrs, this.text, marks);
    }
  }, {
    key: "cut",
    value: function cut() {
      var from = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
      var to = arguments.length <= 1 || arguments[1] === undefined ? this.text.length : arguments[1];

      if (from == 0 && to == this.text.length) return this;
      return this.copy(this.text.slice(from, to));
    }
  }, {
    key: "eq",
    value: function eq(other) {
      return this.sameMarkup(other) && this.text == other.text;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      var base = _get(Object.getPrototypeOf(TextNode.prototype), "toJSON", this).call(this);
      base.text = this.text;
      return base;
    }
  }, {
    key: "textContent",
    get: function get() {
      return this.text;
    }
  }, {
    key: "nodeSize",
    get: function get() {
      return this.text.length;
    }
  }]);

  return TextNode;
}(Node);

function wrapMarks(marks, str) {
  for (var i = marks.length - 1; i >= 0; i--) {
    str = marks[i].type.name + "(" + str + ")";
  }return str;
}