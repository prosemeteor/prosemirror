"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// ;; Fragment is the type used to represent a node's collection of
// child nodes.
//
// Fragments are persistent data structures. That means you should
// _not_ mutate them or their content, but create new instances
// whenever needed. The API tries to make this easy.

var Fragment = exports.Fragment = function () {
  function Fragment(content, size) {
    _classCallCheck(this, Fragment);

    this.content = content;
    this.size = size || 0;
    if (size == null) for (var i = 0; i < content.length; i++) {
      this.size += content[i].nodeSize;
    }
  }

  // :: string
  // Concatenate all the text nodes found in this fragment and its
  // children.


  _createClass(Fragment, [{
    key: "toString",


    // :: () → string
    // Return a debugging string that describes this fragment.
    value: function toString() {
      return "<" + this.toStringInner() + ">";
    }
  }, {
    key: "toStringInner",
    value: function toStringInner() {
      return this.content.join(", ");
    }
  }, {
    key: "nodesBetween",
    value: function nodesBetween(from, to, f, nodeStart, parent) {
      for (var i = 0, pos = 0; pos < to; i++) {
        var child = this.content[i],
            end = pos + child.nodeSize;
        if (end > from && f(child, nodeStart + pos, parent, i) !== false && child.content.size) {
          var start = pos + 1;
          child.nodesBetween(Math.max(0, from - start), Math.min(child.content.size, to - start), f, nodeStart + start);
        }
        pos = end;
      }
    }

    // :: (number, ?number) → Fragment
    // Cut out the sub-fragment between the two given positions.

  }, {
    key: "cut",
    value: function cut(from, to) {
      if (to == null) to = this.size;
      if (from == 0 && to == this.size) return this;
      var result = [],
          size = 0;
      if (to > from) for (var i = 0, pos = 0; pos < to; i++) {
        var child = this.content[i],
            end = pos + child.nodeSize;
        if (end > from) {
          if (pos < from || end > to) {
            if (child.isText) child = child.cut(Math.max(0, from - pos), Math.min(child.text.length, to - pos));else child = child.cut(Math.max(0, from - pos - 1), Math.min(child.content.size, to - pos - 1));
          }
          result.push(child);
          size += child.nodeSize;
        }
        pos = end;
      }
      return new Fragment(result, size);
    }
  }, {
    key: "cutByIndex",
    value: function cutByIndex(from, to) {
      if (from == to) return Fragment.empty;
      if (from == 0 && to == this.content.length) return this;
      return new Fragment(this.content.slice(from, to));
    }

    // :: (Fragment) → Fragment
    // Create a new fragment containing the content of this fragment and
    // `other`.

  }, {
    key: "append",
    value: function append(other) {
      if (!other.size) return this;
      if (!this.size) return other;
      var last = this.lastChild,
          first = other.firstChild,
          content = this.content.slice(),
          i = 0;
      if (last.isText && last.sameMarkup(first)) {
        content[content.length - 1] = last.copy(last.text + first.text);
        i = 1;
      }
      for (; i < other.content.length; i++) {
        content.push(other.content[i]);
      }return new Fragment(content, this.size + other.size);
    }

    // :: (number, Node) → Fragment
    // Create a new fragment in which the node at the given index is
    // replaced by the given node.

  }, {
    key: "replaceChild",
    value: function replaceChild(index, node) {
      var current = this.content[index];
      if (current == node) return this;
      var copy = this.content.slice();
      var size = this.size + node.nodeSize - current.nodeSize;
      copy[index] = node;
      return new Fragment(copy, size);
    }

    // (Node) → Fragment
    // Create a new fragment by prepending the given node to this
    // fragment.

  }, {
    key: "addToStart",
    value: function addToStart(node) {
      return new Fragment([node].concat(this.content), this.size + node.nodeSize);
    }

    // (Node) → Fragment
    // Create a new fragment by appending the given node to this
    // fragment.

  }, {
    key: "addToEnd",
    value: function addToEnd(node) {
      return new Fragment(this.content.concat(node), this.size + node.nodeSize);
    }

    // :: () → ?Object
    // Create a JSON-serializeable representation of this fragment.

  }, {
    key: "toJSON",
    value: function toJSON() {
      return this.content.length ? this.content.map(function (n) {
        return n.toJSON();
      }) : null;
    }

    // :: (Schema, ?Object) → Fragment
    // Deserialize a fragment from its JSON representation.

  }, {
    key: "eq",


    // :: (Fragment) → bool
    // Compare this fragment to another one.
    value: function eq(other) {
      if (this.content.length != other.content.length) return false;
      for (var i = 0; i < this.content.length; i++) {
        if (!this.content[i].eq(other.content[i])) return false;
      }return true;
    }

    // :: (?union<Fragment, Node, [Node]>) → Fragment
    // Create a fragment from something that can be interpreted as a set
    // of nodes. For `null`, it returns the empty fragment. For a
    // fragment, the fragment itself. For a node or array of nodes, a
    // fragment containing those nodes.

  }, {
    key: "child",


    // :: (number) → Node
    // Get the child node at the given index. Raise an error when the
    // index is out of range.
    value: function child(index) {
      var found = this.content[index];
      if (!found) throw new RangeError("Index " + index + " out of range for " + this);
      return found;
    }

    // :: (number) → ?Node
    // Get the child node at the given index, if it exists.

  }, {
    key: "maybeChild",
    value: function maybeChild(index) {
      return this.content[index];
    }

    // :: ((node: Node, offset: number))
    // Call `f` for every child node, passing the node and its offset
    // into this parent node.

  }, {
    key: "forEach",
    value: function forEach(f) {
      for (var i = 0, p = 0; i < this.content.length; i++) {
        var child = this.content[i];
        f(child, p);
        p += child.nodeSize;
      }
    }

    // : (number, ?number) → {index: number, offset: number}
    // Find the index and inner offset corresponding to a given relative
    // position in this fragment. The result object will be reused
    // (overwritten) the next time the function is called. (Not public.)

  }, {
    key: "findIndex",
    value: function findIndex(pos) {
      var round = arguments.length <= 1 || arguments[1] === undefined ? -1 : arguments[1];

      if (pos == 0) return retIndex(0, pos);
      if (pos == this.size) return retIndex(this.content.length, pos);
      if (pos > this.size || pos < 0) throw new RangeError("Position " + pos + " outside of fragment (" + this + ")");
      for (var i = 0, curPos = 0;; i++) {
        var cur = this.child(i),
            end = curPos + cur.nodeSize;
        if (end >= pos) {
          if (end == pos || round > 0) return retIndex(i + 1, end);
          return retIndex(i, curPos);
        }
        curPos = end;
      }
    }
  }, {
    key: "textContent",
    get: function get() {
      var text = "";
      this.content.forEach(function (n) {
        return text += n.textContent;
      });
      return text;
    }
  }, {
    key: "firstChild",


    // :: ?Node
    // The first child of the fragment, or `null` if it is empty.
    get: function get() {
      return this.content.length ? this.content[0] : null;
    }

    // :: ?Node
    // The last child of the fragment, or `null` if it is empty.

  }, {
    key: "lastChild",
    get: function get() {
      return this.content.length ? this.content[this.content.length - 1] : null;
    }

    // :: number
    // The number of child nodes in this fragment.

  }, {
    key: "childCount",
    get: function get() {
      return this.content.length;
    }
  }], [{
    key: "fromJSON",
    value: function fromJSON(schema, value) {
      return value ? new Fragment(value.map(schema.nodeFromJSON)) : Fragment.empty;
    }

    // :: ([Node]) → Fragment
    // Build a fragment from an array of nodes. Ensures that adjacent
    // text nodes with the same style are joined together.

  }, {
    key: "fromArray",
    value: function fromArray(array) {
      if (!array.length) return Fragment.empty;
      var joined = void 0,
          size = 0;
      for (var i = 0; i < array.length; i++) {
        var node = array[i];
        size += node.nodeSize;
        if (i && node.isText && array[i - 1].sameMarkup(node)) {
          if (!joined) joined = array.slice(0, i);
          joined[joined.length - 1] = node.copy(joined[joined.length - 1].text + node.text);
        } else if (joined) {
          joined.push(node);
        }
      }
      return new Fragment(joined || array, size);
    }
  }, {
    key: "from",
    value: function from(nodes) {
      if (!nodes) return Fragment.empty;
      if (nodes instanceof Fragment) return nodes;
      if (Array.isArray(nodes)) return this.fromArray(nodes);
      return new Fragment([nodes], nodes.nodeSize);
    }
  }]);

  return Fragment;
}();

var found = { index: 0, offset: 0 };
function retIndex(index, offset) {
  found.index = index;
  found.offset = offset;
  return found;
}

// :: Fragment
// An empty fragment. Intended to be reused whenever a node doesn't
// contain anything (rather than allocating a new empty fragment for
// each leaf node).
Fragment.empty = new Fragment([], 0);