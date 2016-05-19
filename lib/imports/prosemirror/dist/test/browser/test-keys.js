"use strict";

var _def = require("./def");

var _build = require("../build");

var _cmp = require("../cmp");

var _tests = require("../tests");

var _edit = require("../../edit");

function trace(prop) {
  return function (pm) {
    return pm.mod[prop] = (pm.mod[prop] || 0) + 1;
  };
}

var extraMap = new _edit.Keymap({
  "'B'": trace("b"),
  "Ctrl-X C": trace("c"),
  "Ctrl-A": trace("a")
});

var test = (0, _def.namespace)("keys", {
  doc: (0, _build.doc)((0, _build.p)("foo"))
});

test("basic", function (pm) {
  pm.addKeymap(extraMap);
  (0, _def.dispatch)(pm, "'B'");
  (0, _def.dispatch)(pm, "'B'");
  (0, _cmp.cmp)(pm.mod.b, 2);
});

test("multi", function (pm) {
  pm.addKeymap(extraMap);
  (0, _def.dispatch)(pm, "Ctrl-X");
  (0, _def.dispatch)(pm, "C");
  (0, _def.dispatch)(pm, "Ctrl-X");
  (0, _def.dispatch)(pm, "C");
  (0, _cmp.cmp)(pm.mod.c, 2);
});

test("addKeymap", function (pm) {
  pm.addKeymap(extraMap);
  var map = new _edit.Keymap({ "Ctrl-A": trace("a2") });
  pm.addKeymap(map, 10);
  (0, _def.dispatch)(pm, "Ctrl-A");
  (0, _cmp.cmp)(pm.mod.a, undefined);
  (0, _cmp.cmp)(pm.mod.a2, 1);
  pm.removeKeymap(map);
  (0, _def.dispatch)(pm, "Ctrl-A");
  (0, _cmp.cmp)(pm.mod.a, 1);
  (0, _cmp.cmp)(pm.mod.a2, 1);
});

test("addKeymap_bottom", function (pm) {
  pm.addKeymap(extraMap);
  var mapTop = new _edit.Keymap({ "Ctrl-A": trace("a2") });
  var mapBot = new _edit.Keymap({ "Ctrl-A": trace("a3"), "Ctrl-D": trace("d") });
  pm.addKeymap(mapTop, 10);
  pm.addKeymap(mapBot, 60);
  (0, _def.dispatch)(pm, "Ctrl-A");
  (0, _cmp.cmp)(pm.mod.a2, 1);
  (0, _cmp.cmp)(pm.mod.a3, undefined);
  (0, _def.dispatch)(pm, "Ctrl-D");
  (0, _cmp.cmp)(pm.mod.d, 1);
  pm.removeKeymap(mapBot);
  (0, _def.dispatch)(pm, "Ctrl-D");
  (0, _cmp.cmp)(pm.mod.d, 1);
});

test("multiBindings", function (pm) {
  (0, _def.dispatch)(pm, "Enter");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.pre)("\nabc"), (0, _build.ul)((0, _build.li)((0, _build.p)("def"))), (0, _build.p)("foo")));
  pm.setTextSelection(12);
  (0, _def.dispatch)(pm, "Enter");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.pre)("\nabc"), (0, _build.ul)((0, _build.li)((0, _build.p)("def")), (0, _build.li)((0, _build.p)())), (0, _build.p)("foo")));
  (0, _def.dispatch)(pm, "Enter");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.pre)("\nabc"), (0, _build.ul)((0, _build.li)((0, _build.p)("def"))), (0, _build.p)(), (0, _build.p)("foo")));
  pm.setTextSelection(19);
  (0, _def.dispatch)(pm, "Enter");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.pre)("\nabc"), (0, _build.ul)((0, _build.li)((0, _build.p)("def"))), (0, _build.p)(), (0, _build.p)("f"), (0, _build.p)("oo")));
}, {
  doc: (0, _build.doc)((0, _build.pre)("abc"), (0, _build.ul)((0, _build.li)((0, _build.p)("def"))), (0, _build.p)("foo"))
});

(0, _tests.defTest)("keys_add_inconsistent", function () {
  var map = new _edit.Keymap({ "Ctrl-A": "foo", "Ctrl-B Ctrl-C": "quux" });
  try {
    map.addBinding("Ctrl-A", "bar");
    (0, _cmp.is)(false);
  } catch (e) {
    if (!/Inconsistent/.test(e.toString())) throw e;
  }
  try {
    map.addBinding("Ctrl-A Ctrl-X", "baz");
    (0, _cmp.is)(false);
  } catch (e) {
    if (!/Inconsistent/.test(e.toString())) throw e;
  }
  try {
    map.addBinding("Ctrl-B", "bak");
    (0, _cmp.is)(false);
  } catch (e) {
    if (!/Inconsistent/.test(e.toString())) throw e;
  }
});

(0, _tests.defTest)("keys_add_consistent", function () {
  var map = new _edit.Keymap({ "Ctrl-A Ctrl-B": "foo", "Ctrl-A Ctrl-C": "bar" });
  map.removeBinding("Ctrl-A Ctrl-B");
  map.removeBinding("Ctrl-A Ctrl-C");
  map.addBinding("Ctrl-A", "quux");
});