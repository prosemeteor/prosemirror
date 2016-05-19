"use strict";

var _build = require("./build");

var _failure = require("./failure");

var _cmp = require("./cmp");

var _tests = require("./tests");

var _model = require("../model");

var _format = require("../format");

var document = typeof window == "undefined" ? require("jsdom").jsdom() : window.document;

function t(name, doc, dom) {
  (0, _tests.defTest)("dom_" + name, function () {
    var derivedDOM = document.createElement("div");
    derivedDOM.appendChild((0, _format.toDOM)(doc, { document: document }));
    var declaredDOM = document.createElement("div");
    declaredDOM.innerHTML = dom;

    var derivedText = derivedDOM.innerHTML;
    var declaredText = declaredDOM.innerHTML;
    if (derivedText != declaredText) throw new _failure.Failure("DOM text mismatch: " + derivedText + " vs " + declaredText);

    (0, _cmp.cmpNode)(doc, (0, _format.fromDOM)(_model.defaultSchema, derivedDOM));
  });
}

t("simple", (0, _build.doc)((0, _build.p)("hello")), "<p>hello</p>");

t("br", (0, _build.doc)((0, _build.p)("hi", _build.br, "there")), "<p>hi<br/>there</p>");

t("img", (0, _build.doc)((0, _build.p)("hi", _build.img, "there")), '<p>hi<img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" alt="x"/>there</p>');

t("join_styles", (0, _build.doc)((0, _build.p)("one", (0, _build.strong)("two", (0, _build.em)("three")), (0, _build.em)("four"), "five")), "<p>one<strong>two</strong><em><strong>three</strong>four</em>five</p>");

t("links", (0, _build.doc)((0, _build.p)("a ", (0, _build.a)("big ", (0, _build.a2)("nested"), " link"))), "<p>a <a href=\"http://foo\">big </a><a href=\"http://bar\">nested</a><a href=\"http://foo\"> link</a></p>");

t("unordered_list", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("one")), (0, _build.li)((0, _build.p)("two")), (0, _build.li)((0, _build.p)("three", (0, _build.strong)("!")))), (0, _build.p)("after")), "<ul><li><p>one</p></li><li><p>two</p></li><li><p>three<strong>!</strong></p></li></ul><p>after</p>");

t("ordered_list", (0, _build.doc)((0, _build.ol)((0, _build.li)((0, _build.p)("one")), (0, _build.li)((0, _build.p)("two")), (0, _build.li)((0, _build.p)("three", (0, _build.strong)("!")))), (0, _build.p)("after")), "<ol><li><p>one</p></li><li><p>two</p></li><li><p>three<strong>!</strong></p></li></ol><p>after</p>");

t("blockquote", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("hello"), (0, _build.p)("bye"))), "<blockquote><p>hello</p><p>bye</p></blockquote>");

t("nested_blockquote", (0, _build.doc)((0, _build.blockquote)((0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("he said"))), (0, _build.p)("i said"))), "<blockquote><blockquote><blockquote><p>he said</p></blockquote></blockquote><p>i said</p></blockquote>");

t("headings", (0, _build.doc)((0, _build.h1)("one"), (0, _build.h2)("two"), (0, _build.p)("text")), "<h1>one</h1><h2>two</h2><p>text</p>");

t("inline_code", (0, _build.doc)((0, _build.p)("text and ", (0, _build.code)("code that is ", (0, _build.em)("emphasized"), "..."))), "<p>text and <code>code that is </code><em><code>emphasized</code></em><code>...</code></p>");

t("code_block", (0, _build.doc)((0, _build.blockquote)((0, _build.pre)("some code")), (0, _build.p)("and")), "<blockquote><pre><code>some code</code></pre></blockquote><p>and</p>");

function recover(name, html, doc) {
  (0, _tests.defTest)("dom_recover_" + name, function () {
    var dom = document.createElement("div");
    dom.innerHTML = html;
    (0, _cmp.cmpNode)((0, _format.fromDOM)(_model.defaultSchema, dom), doc);
  });
}

recover("list", "<ol class=\"tight\"><p>Oh no</p></ol>", (0, _build.doc)((0, _build.ol)((0, _build.li)((0, _build.p)("Oh no")))));

recover("divs_as_paragraphs", "<div>hi</div><div>bye</div>", (0, _build.doc)((0, _build.p)("hi"), (0, _build.p)("bye")));

recover("i_and_b", "<p><i>hello <b>there</b></i></p>", (0, _build.doc)((0, _build.p)((0, _build.em)("hello ", (0, _build.strong)("there")))));

recover("wrap_paragraph", "hi", (0, _build.doc)((0, _build.p)("hi")));

recover("extra_div", "<div><p>one</p><p>two</p></div>", (0, _build.doc)((0, _build.p)("one"), (0, _build.p)("two")));

recover("ignore_whitespace", " <blockquote> <p>woo  \n  <em> hooo</em></p> </blockquote> ", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("woo ", (0, _build.em)("hooo")))));

recover("find_place", "<ul class=\"tight\"><li>hi</li><p>whoah</p><li>again</li></ul>", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hi")), (0, _build.li)((0, _build.p)("whoah")), (0, _build.li)((0, _build.p)("again")))));

recover("move_up", "<div>hello<hr/>bye</div>", (0, _build.doc)((0, _build.p)("hello"), _build.hr, (0, _build.p)("bye")));

recover("dont_ignore_whitespace", "<p><em>one</em> <strong>two</strong></p>", (0, _build.doc)((0, _build.p)((0, _build.em)("one"), " ", (0, _build.strong)("two"))));

recover("stray_tab", "<p> <b>&#09;</b></p>", (0, _build.doc)((0, _build.p)()));

recover("random_spaces", "<p><b>1 </b>  </p>", (0, _build.doc)((0, _build.p)((0, _build.strong)("1"))));

recover("empty_code_block", "<pre></pre>", (0, _build.doc)((0, _build.pre)()));

recover("trailing_code", "<pre>foo\n</pre>", (0, _build.doc)((0, _build.pre)("foo\n")));

recover("script", "<p>hello<script>alert('x')</script>!</p>", (0, _build.doc)((0, _build.p)("hello!")));

recover("head_body", "<head><title>T</title><meta charset='utf8'/></head><body>hi</body>", (0, _build.doc)((0, _build.p)("hi")));

recover("double_strong", "<p>A <strong>big <strong>strong</strong> monster</strong>.</p>", (0, _build.doc)((0, _build.p)("A ", (0, _build.strong)("big strong monster"), ".")));

recover("font_weight", "<p style='font-weight: bold'>Hello</p>", (0, _build.doc)((0, _build.p)((0, _build.strong)("Hello"))));