"use strict";

var _build = require("./build");

var _tests = require("./tests");

var _cmp = require("./cmp");

function t(name, doc, expect, openLeft, openRight) {
  (0, _tests.defTest)("slice_" + name, function () {
    var slice = void 0;
    if (doc.tag.a != null && doc.tag.b != null) slice = doc.slice(doc.tag.a, doc.tag.b);else if (doc.tag.a != null) slice = doc.slice(0, doc.tag.a);else slice = doc.slice(doc.tag.b);
    (0, _cmp.cmpNode)(slice.content, expect.content);
    (0, _cmp.cmp)(slice.openLeft, openLeft, "openLeft");
    (0, _cmp.cmp)(slice.openRight, openRight, "openRight");
  });
}

t("before", (0, _build.doc)((0, _build.p)("hello<a> world")), (0, _build.doc)((0, _build.p)("hello")), 0, 1);
t("before_everything", (0, _build.doc)((0, _build.p)("hello<a>")), (0, _build.doc)((0, _build.p)("hello")), 0, 1);
t("before_rest", (0, _build.doc)((0, _build.p)("hello<a> world"), (0, _build.p)("rest")), (0, _build.doc)((0, _build.p)("hello")), 0, 1);
t("before_styled", (0, _build.doc)((0, _build.p)("hello ", (0, _build.em)("WOR<a>LD"))), (0, _build.doc)((0, _build.p)("hello ", (0, _build.em)("WOR"))), 0, 1);
t("before_2nd", (0, _build.doc)((0, _build.p)("a"), (0, _build.p)("b<a>")), (0, _build.doc)((0, _build.p)("a"), (0, _build.p)("b")), 0, 1);
t("before_top", (0, _build.doc)((0, _build.p)("a"), "<a>", (0, _build.p)("b")), (0, _build.doc)((0, _build.p)("a")), 0, 0);
t("before_deep", (0, _build.doc)((0, _build.blockquote)((0, _build.ul)((0, _build.li)((0, _build.p)("a")), (0, _build.li)((0, _build.p)("b<a>"))))), (0, _build.doc)((0, _build.blockquote)((0, _build.ul)((0, _build.li)((0, _build.p)("a")), (0, _build.li)((0, _build.p)("b"))))), 0, 4);

t("after", (0, _build.doc)((0, _build.p)("hello<b> world")), (0, _build.doc)((0, _build.p)(" world")), 1, 0);
t("after_everything", (0, _build.doc)((0, _build.p)("<b>hello")), (0, _build.doc)((0, _build.p)("hello")), 1, 0);
t("after_rest", (0, _build.doc)((0, _build.p)("foo"), (0, _build.p)("bar<b>baz")), (0, _build.doc)((0, _build.p)("baz")), 1, 0);
t("after_styled", (0, _build.doc)((0, _build.p)("a sentence with an ", (0, _build.em)("emphasized ", (0, _build.a)("li<b>nk")), " in it")), (0, _build.doc)((0, _build.p)((0, _build.em)((0, _build.a)("nk")), " in it")), 1, 0);
t("after_among_styled", (0, _build.doc)((0, _build.p)("a ", (0, _build.em)("sentence"), " wi<b>th ", (0, _build.em)("text"), " in it")), (0, _build.doc)((0, _build.p)("th ", (0, _build.em)("text"), " in it")), 1, 0);
t("after_top", (0, _build.doc)((0, _build.p)("a"), "<b>", (0, _build.p)("b")), (0, _build.doc)((0, _build.p)("b")), 0, 0);
t("after_deep", (0, _build.doc)((0, _build.blockquote)((0, _build.ul)((0, _build.li)((0, _build.p)("a")), (0, _build.li)((0, _build.p)("<b>b"))))), (0, _build.doc)((0, _build.blockquote)((0, _build.ul)((0, _build.li)((0, _build.p)("b"))))), 4, 0);

t("between_text", (0, _build.doc)((0, _build.p)("hell<a>o wo<b>rld")), (0, _build.p)("o wo"), 0, 0);
t("between_paragraphs", (0, _build.doc)((0, _build.p)("on<a>e"), (0, _build.p)("t<b>wo")), (0, _build.doc)((0, _build.p)("e"), (0, _build.p)("t")), 1, 1);
t("between_across_inline", (0, _build.doc)((0, _build.p)("here's noth<a>ing and ", (0, _build.em)("here's e<b>m"))), (0, _build.p)("ing and ", (0, _build.em)("here's e")), 0, 0);
t("between_different_depth", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hello")), (0, _build.li)((0, _build.p)("wo<a>rld")), (0, _build.li)((0, _build.p)("x"))), (0, _build.p)((0, _build.em)("bo<b>o"))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("rld")), (0, _build.li)((0, _build.p)("x"))), (0, _build.p)((0, _build.em)("bo"))), 3, 1);
t("between_deep", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo<a>bar"), (0, _build.ul)((0, _build.li)((0, _build.p)("a")), (0, _build.li)((0, _build.p)("b"), "<b>", (0, _build.p)("c"))), (0, _build.p)("d"))), (0, _build.blockquote)((0, _build.p)("bar"), (0, _build.ul)((0, _build.li)((0, _build.p)("a")), (0, _build.li)((0, _build.p)("b")))), 1, 2);