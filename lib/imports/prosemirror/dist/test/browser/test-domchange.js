"use strict";

var _domchange = require("../../edit/domchange");

var _def = require("./def");

var _build = require("../build");

var _cmp = require("../cmp");

var _testSelection = require("./test-selection");

var test = (0, _def.namespace)("domchange", { doc: (0, _build.doc)((0, _build.p)("hello")) });

test("add_text", function (pm) {
  (0, _testSelection.findTextNode)(pm.content, "hello").nodeValue = "heLllo";
  (0, _domchange.readInputChange)(pm);
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("heLllo")));
});

test("remove_text", function (pm) {
  (0, _testSelection.findTextNode)(pm.content, "hello").nodeValue = "heo";
  (0, _domchange.readInputChange)(pm);
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("heo")));
});

test("remove_ambiguous_text", function (pm) {
  (0, _testSelection.findTextNode)(pm.content, "hello").nodeValue = "helo";
  (0, _domchange.readInputChange)(pm);
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("helo")));
});

test("active_marks", function (pm) {
  pm.execCommand("em:toggle");
  (0, _testSelection.findTextNode)(pm.content, "hello").nodeValue = "helloo";
  (0, _domchange.readInputChange)(pm);
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("hello", (0, _build.em)("o"))));
});

test("add_node", function (pm) {
  var txt = (0, _testSelection.findTextNode)(pm.content, "hello");
  txt.parentNode.appendChild(document.createTextNode("!"));
  (0, _domchange.readInputChange)(pm);
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("hello!")));
});

test("kill_node", function (pm) {
  var txt = (0, _testSelection.findTextNode)(pm.content, "hello");
  txt.parentNode.removeChild(txt);
  (0, _domchange.readInputChange)(pm);
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)()));
});

test("add_paragraph", function (pm) {
  pm.content.insertBefore(document.createElement("p"), pm.content.firstChild).appendChild(document.createTextNode("hey"));
  (0, _domchange.readInputChange)(pm);
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("hey"), (0, _build.p)("hello")));
});

test("add_duplicate_paragraph", function (pm) {
  pm.content.insertBefore(document.createElement("p"), pm.content.firstChild).appendChild(document.createTextNode("hello"));
  (0, _domchange.readInputChange)(pm);
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("hello"), (0, _build.p)("hello")));
});

test("add_repeated_text", function (pm) {
  (0, _testSelection.findTextNode)(pm.content, "hello").nodeValue = "helhello";
  (0, _domchange.readInputChange)(pm);
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("helhello")));
});

test("detect_enter", function (pm) {
  pm.flush();
  var bq = pm.content.querySelector("blockquote");
  bq.appendChild(document.createElement("p"));
  (0, _domchange.readInputChange)(pm);
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo")), (0, _build.p)()));
}, { doc: (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo"), (0, _build.p)("<a>"))) });

test("composition_simple", function (pm) {
  (0, _testSelection.findTextNode)(pm.content, "hello").nodeValue = "hellox";
  pm.startOperation();
  (0, _domchange.readCompositionChange)(pm, 0);
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("hellox")));
});

test("composition_del_inside_markup", function (pm) {
  pm.flush();
  (0, _testSelection.findTextNode)(pm.content, "cd").nodeValue = "c";
  pm.startOperation();
  (0, _domchange.readCompositionChange)(pm, 0);
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("a", (0, _build.em)("b", _build.img, (0, _build.strong)("c")), "e")));
}, { doc: (0, _build.doc)((0, _build.p)("a", (0, _build.em)("b", _build.img, (0, _build.strong)("cd<a>")), "e")) });

test("composition_type_inside_markup", function (pm) {
  pm.flush();
  (0, _testSelection.findTextNode)(pm.content, "cd").nodeValue = "cdxy";
  pm.startOperation();
  (0, _domchange.readCompositionChange)(pm, 0);
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("a", (0, _build.em)("b", _build.img, (0, _build.strong)("cdxy")), "e")));
}, { doc: (0, _build.doc)((0, _build.p)("a", (0, _build.em)("b", _build.img, (0, _build.strong)("cd<a>")), "e")) });

test("composition_type_ambiguous", function (pm) {
  pm.flush();
  pm.execCommand("strong:toggle");
  (0, _testSelection.findTextNode)(pm.content, "foo").nodeValue = "fooo";
  pm.startOperation();
  (0, _domchange.readCompositionChange)(pm, 0);
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("fo", (0, _build.strong)("o"), "o")));
}, { doc: (0, _build.doc)((0, _build.p)("fo<a>o")) });