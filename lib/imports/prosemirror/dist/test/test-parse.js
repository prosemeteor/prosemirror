"use strict";

var _build = require("./build");

var _cmp = require("./cmp");

var _tests = require("./tests");

var _model = require("../model");

var _markdown = require("../markdown");

function t(name, text, doc) {
  (0, _tests.defTest)("parse_" + name, function () {
    (0, _cmp.cmpNode)((0, _markdown.fromMarkdown)(_model.defaultSchema, text), doc);
    (0, _cmp.cmpStr)((0, _markdown.toMarkdown)(doc), text);
  });
}

t("paragraph", "hello!", (0, _build.doc)((0, _build.p)("hello!")));

t("heading", "# one\n\n## two\n\nthree", (0, _build.doc)((0, _build.h1)("one"), (0, _build.h2)("two"), (0, _build.p)("three")));

t("quote", "> once\n\n> > twice", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("once")), (0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("twice")))));

// FIXME bring back testing for preserving bullets and tight attrs
// when supported again

t("bullet_list", "* foo\n\n  * bar\n\n  * baz\n\n* quux", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("foo"), (0, _build.ul)((0, _build.li)((0, _build.p)("bar")), (0, _build.li)((0, _build.p)("baz")))), (0, _build.li)((0, _build.p)("quux")))));

t("ordered_list", "1. Hello\n\n2. Goodbye\n\n3. Nest\n\n   1. Hey\n\n   2. Aye", (0, _build.doc)((0, _build.ol)((0, _build.li)((0, _build.p)("Hello")), (0, _build.li)((0, _build.p)("Goodbye")), (0, _build.li)((0, _build.p)("Nest"), (0, _build.ol)((0, _build.li)((0, _build.p)("Hey")), (0, _build.li)((0, _build.p)("Aye")))))));

/* FIXME disabled until we have markdown attributes
t("code_block",
  "```\nMy Code\n```\n\n    Other code\n\nPara",
  doc(pre2("My Code"), pre("Other code"), p("Para")))*/

t("inline", "Hello. Some *em* text, some **strong** text, and some `code`", (0, _build.doc)((0, _build.p)("Hello. Some ", (0, _build.em)("em"), " text, some ", (0, _build.strong)("strong"), " text, and some ", (0, _build.code)("code"))));

t("inline_overlap_mix", "This is **strong *emphasized text with `code` in* it**", (0, _build.doc)((0, _build.p)("This is ", (0, _build.strong)("strong ", (0, _build.em)("emphasized text with ", (0, _build.code)("code"), " in"), " it"))));

t("inline_overlap_link", "**[link](http://foo) is bold**", (0, _build.doc)((0, _build.p)((0, _build.strong)((0, _build.a)("link"), " is bold"))));

t("inline_overlap_code", "**`code` is bold**", (0, _build.doc)((0, _build.p)((0, _build.strong)((0, _build.code)("code"), " is bold"))));

t("link", "My [link](http://foo) goes to foo", (0, _build.doc)((0, _build.p)("My ", (0, _build.a)("link"), " goes to foo")));

t("image", "Here's an image: ![x](" + _build.dataImage + ")", (0, _build.doc)((0, _build.p)("Here's an image: ", _build.img)));

t("break", "line one\\\nline two", (0, _build.doc)((0, _build.p)("line one", _build.br, "line two")));

t("horizontal_rule", "one two\n\n---\n\nthree", (0, _build.doc)((0, _build.p)("one two"), _build.hr, (0, _build.p)("three")));

t("ignore_html", "Foo < img> bar", (0, _build.doc)((0, _build.p)("Foo < img> bar")));

t("not_a_list", "1\\. foo", (0, _build.doc)((0, _build.p)("1. foo")));