"use strict";

var _model = require("../model");

var _build = require("./build");

var _failure = require("./failure");

var _tests = require("./tests");

var _cmp = require("./cmp");

function str(name, node, str) {
    (0, _tests.defTest)("node_string_" + name, function () {
        return (0, _cmp.cmpStr)(node, str);
    });
}

str("nesting", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hey"), (0, _build.p)()), (0, _build.li)((0, _build.p)("foo")))), 'doc(bullet_list(list_item(paragraph("hey"), paragraph), list_item(paragraph("foo"))))');

str("inline_element", (0, _build.doc)((0, _build.p)("foo", _build.img, _build.br, "bar")), 'doc(paragraph("foo", image, hard_break, "bar"))');

str("marks", (0, _build.doc)((0, _build.p)("foo", (0, _build.em)("bar", (0, _build.strong)("quux")), (0, _build.code)("baz"))), 'doc(paragraph("foo", em("bar"), em(strong("quux")), code("baz")))');

function cut(name, doc, cut) {
    (0, _tests.defTest)("node_cut_" + name, function () {
        return (0, _cmp.cmpNode)(doc.cut(doc.tag.a || 0, doc.tag.b), cut);
    });
}

cut("block", (0, _build.doc)((0, _build.p)("foo"), "<a>", (0, _build.p)("bar"), "<b>", (0, _build.p)("baz")), (0, _build.doc)((0, _build.p)("bar")));

cut("text", (0, _build.doc)((0, _build.p)("0"), (0, _build.p)("foo<a>bar<b>baz"), (0, _build.p)("2")), (0, _build.doc)((0, _build.p)("bar")));

cut("deep", (0, _build.doc)((0, _build.blockquote)((0, _build.ul)((0, _build.li)((0, _build.p)("a"), (0, _build.p)("b<a>c")), (0, _build.li)((0, _build.p)("d")), "<b>", (0, _build.li)((0, _build.p)("e"))), (0, _build.p)("3"))), (0, _build.doc)((0, _build.blockquote)((0, _build.ul)((0, _build.li)((0, _build.p)("c")), (0, _build.li)((0, _build.p)("d"))))));

cut("left", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo<b>bar"))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo"))));

cut("right", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo<a>bar"))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("bar"))));

cut("inline", (0, _build.doc)((0, _build.p)("foo", (0, _build.em)("ba<a>r", _build.img, (0, _build.strong)("baz"), _build.br), "qu<b>ux", (0, _build.code)("xyz"))), (0, _build.doc)((0, _build.p)((0, _build.em)("r", _build.img, (0, _build.strong)("baz"), _build.br), "qu")));

function between(name, doc) {
    for (var _len = arguments.length, nodes = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        nodes[_key - 2] = arguments[_key];
    }

    (0, _tests.defTest)("node_between_" + name, function () {
        var i = 0;
        doc.nodesBetween(doc.tag.a, doc.tag.b, function (node, pos) {
            if (i == nodes.length) throw new _failure.Failure("More nodes iterated than listed (" + node.type.name + ")");
            var compare = node.isText ? node.text : node.type.name;
            if (compare != nodes[i++]) throw new _failure.Failure("Expected " + JSON.stringify(nodes[i - 1]) + ", got " + JSON.stringify(compare));
            if (!node.isText && doc.nodeAt(pos) != node) throw new _failure.Failure("Pos " + pos + " does not point at node " + node + " " + doc.nodeAt(pos));
        });
    });
}

between("text", (0, _build.doc)((0, _build.p)("foo<a>bar<b>baz")), "paragraph", "foobarbaz");

between("deep", (0, _build.doc)((0, _build.blockquote)((0, _build.ul)((0, _build.li)((0, _build.p)("f<a>oo")), (0, _build.p)("b"), "<b>"), (0, _build.p)("c"))), "blockquote", "bullet_list", "list_item", "paragraph", "foo", "paragraph", "b");

between("inline", (0, _build.doc)((0, _build.p)((0, _build.em)("x"), "f<a>oo", (0, _build.em)("bar", _build.img, (0, _build.strong)("baz"), _build.br), "quux", (0, _build.code)("xy<b>z"))), "paragraph", "foo", "bar", "image", "baz", "hard_break", "quux", "xyz");

function from(name, arg, expect) {
    (0, _tests.defTest)("node_fragment_from_" + name, function () {
        (0, _cmp.cmpNode)(expect.copy(_model.Fragment.from(arg)), expect);
    });
}

from("single", _model.defaultSchema.node("paragraph"), (0, _build.doc)((0, _build.p)()));

from("array", [_model.defaultSchema.node("hard_break"), _model.defaultSchema.text("foo")], (0, _build.p)(_build.br, "foo"));

from("fragment", (0, _build.doc)((0, _build.p)("foo")).content, (0, _build.doc)((0, _build.p)("foo")));

from("null", null, (0, _build.p)());

from("append", [_model.defaultSchema.text("a"), _model.defaultSchema.text("b")], (0, _build.p)("ab"));