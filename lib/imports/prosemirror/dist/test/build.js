"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.a2 = exports.a = exports.code = exports.strong = exports.em = exports.hr = exports.img2 = exports.img = exports.br = exports.ol = exports.ul = exports.li = exports.h2 = exports.h1 = exports.pre = exports.blockquote = exports.p = exports.doc = exports.dataImage = undefined;

var _model = require("../model");

// This file defines a set of helpers for building up documents to be
// used in the test suite. You can say, for example, `doc(p("foo"))`
// to create a document with a paragraph with the text 'foo' in it.
//
// These also support angle-brace notation for marking 'tags'
// (positions) inside of such nodes. If you include `<x>` inside of a
// string, as part of a bigger text node or on its own, the resulting
// node and its parent nodes will have a `tag` property added to them
// that maps this tag name (`x`) to its position inside of that node.

var noTag = _model.Node.prototype.tag = Object.create(null);

function flatten(children, f) {
  var result = [],
      pos = 0,
      tag = noTag;

  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    if (child.tag && child.tag != _model.Node.prototype.tag) {
      if (tag == noTag) tag = Object.create(null);
      for (var _id in child.tag) {
        tag[_id] = child.tag[_id] + (child.flat || child.isText ? 0 : 1) + pos;
      }
    }

    if (typeof child == "string") {
      var re = /<(\w+)>/g,
          m = void 0,
          at = 0,
          out = "";
      while (m = re.exec(child)) {
        out += child.slice(at, m.index);
        pos += m.index - at;
        at = m.index + m[0].length;
        if (tag == noTag) tag = Object.create(null);
        tag[m[1]] = pos;
      }
      out += child.slice(at);
      pos += child.length - at;
      if (out) result.push(f(_model.defaultSchema.text(out)));
    } else if (child.flat) {
      for (var j = 0; j < child.flat.length; j++) {
        var node = f(child.flat[j]);
        pos += node.nodeSize;
        result.push(node);
      }
    } else {
      var _node = f(child);
      pos += _node.nodeSize;
      result.push(_node);
    }
  }
  return { nodes: result, tag: tag };
}

function id(x) {
  return x;
}

// : (string, ?Object) → (...content: [union<string, Node>]) → Node
// Create a builder function for nodes with content.
function block(type, attrs) {
  return function () {
    var _flatten = flatten(arguments, id);

    var nodes = _flatten.nodes;
    var tag = _flatten.tag;

    var node = _model.defaultSchema.node(type, attrs, nodes);
    if (tag != noTag) node.tag = tag;
    return node;
  };
}

// Create a builder function for marks.
function mark(type, attrs) {
  var mark = _model.defaultSchema.mark(type, attrs);
  return function () {
    var _flatten2 = flatten(arguments, function (n) {
      return mark.type.isInSet(n.marks) ? n : n.mark(mark.addToSet(n.marks));
    });

    var nodes = _flatten2.nodes;
    var tag = _flatten2.tag;

    return { flat: nodes, tag: tag };
  };
}

var dataImage = exports.dataImage = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

var doc = exports.doc = block("doc");
var p = exports.p = block("paragraph");
var blockquote = exports.blockquote = block("blockquote");
var pre = exports.pre = block("code_block");
var h1 = exports.h1 = block("heading", { level: 1 });
var h2 = exports.h2 = block("heading", { level: 2 });
var li = exports.li = block("list_item");
var ul = exports.ul = block("bullet_list");
var ol = exports.ol = block("ordered_list");

var br = exports.br = _model.defaultSchema.node("hard_break");
var img = exports.img = _model.defaultSchema.node("image", { src: dataImage, alt: "x" });
var img2 = exports.img2 = _model.defaultSchema.node("image", { src: dataImage, alt: "y" });
var hr = exports.hr = _model.defaultSchema.node("horizontal_rule");

var em = exports.em = mark("em");
var strong = exports.strong = mark("strong");
var code = exports.code = mark("code");
var a = exports.a = mark("link", { href: "http://foo" });
var a2 = exports.a2 = mark("link", { href: "http://bar" });