"use strict";

var _model = require("../model");

var _build = require("./build");

var _tests = require("./tests");

var _cmp = require("./cmp");

var _failure = require("./failure");

function test(name, doc, insert, expected) {
     (0, _tests.defTest)("node_replace_" + name, function () {
          var slice = insert ? insert.slice(insert.tag.a, insert.tag.b) : _model.Slice.empty;
          (0, _cmp.cmpNode)(doc.replace(doc.tag.a, doc.tag.b, slice), expected);
     });
}

test("delete_join", (0, _build.doc)((0, _build.p)("on<a>e"), (0, _build.p)("t<b>wo")), null, (0, _build.doc)((0, _build.p)("onwo")));

test("merge_simple", (0, _build.doc)((0, _build.p)("on<a>e"), (0, _build.p)("t<b>wo")), (0, _build.doc)((0, _build.p)("xx<a>xx"), (0, _build.p)("yy<b>yy")), (0, _build.doc)((0, _build.p)("onxx"), (0, _build.p)("yywo")));

test("replace_with_text", (0, _build.doc)((0, _build.p)("on<a>e"), (0, _build.p)("t<b>wo")), (0, _build.doc)((0, _build.p)("<a>H<b>")), (0, _build.doc)((0, _build.p)("onHwo")));

test("insert_text", (0, _build.doc)((0, _build.p)("before"), (0, _build.p)("on<a><b>e"), (0, _build.p)("after")), (0, _build.doc)((0, _build.p)("<a>H<b>")), (0, _build.doc)((0, _build.p)("before"), (0, _build.p)("onHe"), (0, _build.p)("after")));

test("non_matching", (0, _build.doc)((0, _build.p)("on<a>e"), (0, _build.p)("t<b>wo")), (0, _build.doc)((0, _build.h1)("<a>H<b>")), (0, _build.doc)((0, _build.p)("onHwo")));

test("deep", (0, _build.doc)((0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("on<a>e"), (0, _build.p)("t<b>wo")))), (0, _build.doc)((0, _build.p)("<a>H<b>")), (0, _build.doc)((0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("onHwo")))));

test("same_block", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("a<a>bc<b>d"))), (0, _build.doc)((0, _build.p)("x<a>y<b>z")), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("ayd"))));

test("deep_lopsided", (0, _build.doc)((0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("on<a>e"), (0, _build.p)("two"), "<b>", (0, _build.p)("three")))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("aa<a>aa"), (0, _build.p)("bb"), (0, _build.p)("cc"), "<b>", (0, _build.p)("dd"))), (0, _build.doc)((0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("onaa"), (0, _build.p)("bb"), (0, _build.p)("cc"), (0, _build.p)("three")))));

test("deeper_lopsided", (0, _build.doc)((0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("on<a>e"), (0, _build.p)("two"), (0, _build.p)("three")), "<b>", (0, _build.p)("x"))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("aa<a>aa"), (0, _build.p)("bb"), (0, _build.p)("cc")), "<b>", (0, _build.p)("dd")), (0, _build.doc)((0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("onaa"), (0, _build.p)("bb"), (0, _build.p)("cc")), (0, _build.p)("x"))));

test("wide_split_delete", (0, _build.doc)((0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("hell<a>o"))), (0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("<b>a")))), null, (0, _build.doc)((0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("hella")))));

test("wide_split_insert", (0, _build.doc)((0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("hell<a>o"))), (0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("<b>a")))), (0, _build.doc)((0, _build.p)("<a>i<b>")), (0, _build.doc)((0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("hellia")))));

test("insert_split", (0, _build.doc)((0, _build.p)("foo<a><b>bar")), (0, _build.doc)((0, _build.p)("<a>x"), (0, _build.p)("y<b>")), (0, _build.doc)((0, _build.p)("foox"), (0, _build.p)("ybar")));

test("insert_deep_split", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo<a>x<b>bar"))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("<a>x")), (0, _build.blockquote)((0, _build.p)("y<b>"))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foox")), (0, _build.blockquote)((0, _build.p)("ybar"))));

test("branched", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo<a>u"), (0, _build.p)("v<b>bar"))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("<a>x")), (0, _build.blockquote)((0, _build.p)("y<b>"))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foox")), (0, _build.blockquote)((0, _build.p)("ybar"))));

test("keep_first", (0, _build.doc)((0, _build.h1)("foo<a>bar"), "<b>"), (0, _build.doc)((0, _build.p)("foo<a>baz"), "<b>"), (0, _build.doc)((0, _build.h1)("foobaz")));

test("keep_if_empty", (0, _build.doc)((0, _build.h1)("<a>bar"), "<b>"), (0, _build.doc)((0, _build.p)("foo<a>baz"), "<b>"), (0, _build.doc)((0, _build.h1)("baz")));

function err(name, doc, insert, pattern) {
     (0, _tests.defTest)("node_replace_error_" + name, function () {
          var slice = insert ? insert.slice(insert.tag.a, insert.tag.b) : _model.Slice.empty;
          try {
               doc.replace(doc.tag.a, doc.tag.b, slice);
               throw new _failure.Failure("No error raised");
          } catch (e) {
               if (!(e instanceof _model.ReplaceError)) throw e;
               if (e.message.toLowerCase().indexOf(pattern) == -1) throw new _failure.Failure("Wrong error raised: " + e.message);
          }
     });
}

err("negative", (0, _build.doc)((0, _build.p)("<a><b>")), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("<a>")), "<b>"), "deeper");

err("inconsistent", (0, _build.doc)((0, _build.p)("<a><b>")), (0, _build.doc)("<a>", (0, _build.p)("<b>")), "inconsistent");

err("bad_fit", (0, _build.doc)("<a><b>"), (0, _build.doc)((0, _build.p)("<a>foo<b>")), "invalid content");

err("bad_join", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("a")), "<a>"), "<b>"), (0, _build.doc)((0, _build.p)("foo", "<a>"), "<b>"), "cannot join");

err("bad_join_delete", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("a"), "<a>"), (0, _build.ul)("<b>", (0, _build.li)((0, _build.p)("b")))), null, "cannot join");

err("empty_blockquote", (0, _build.doc)((0, _build.blockquote)("<a>", (0, _build.p)("hi")), "<b>"), (0, _build.doc)((0, _build.blockquote)("hi", "<a>"), "<b>"), "invalid content");