"use strict";

var _def = require("./def");

var _build = require("../build");

var _cmp = require("../cmp");

var test = (0, _def.namespace)("draw");

test("update", function (pm) {
  pm.tr.typeText("bar").apply();
  pm.flush();
  (0, _cmp.cmpStr)(pm.content.textContent, "barfoo");
}, { doc: (0, _build.doc)((0, _build.p)("foo")) });

test("minimal_at_end", function (pm) {
  var oldP = pm.content.querySelector("p");
  pm.tr.typeText("!").apply();
  pm.flush();
  (0, _cmp.cmp)(pm.content.querySelector("p"), oldP);
}, { doc: (0, _build.doc)((0, _build.h1)("foo"), (0, _build.p)("bar")) });

test("minimal_at_start", function (pm) {
  var oldP = pm.content.querySelector("p");
  pm.tr.insertText(2, "!").apply();
  pm.flush();
  (0, _cmp.cmp)(pm.content.querySelector("p"), oldP);
}, { doc: (0, _build.doc)((0, _build.p)("foo"), (0, _build.h1)("bar")) });

test("minimal_around", function (pm) {
  var oldP = pm.content.querySelector("p");
  var oldPre = pm.content.querySelector("pre");
  pm.tr.insertText(2, "!").apply();
  pm.flush();
  (0, _cmp.cmp)(pm.content.querySelector("p"), oldP);
  (0, _cmp.cmp)(pm.content.querySelector("pre"), oldPre);
}, { doc: (0, _build.doc)((0, _build.p)("foo"), (0, _build.h1)("bar"), (0, _build.pre)("baz")) });

test("minimal_on_split", function (pm) {
  var oldP = pm.content.querySelector("p");
  var oldPre = pm.content.querySelector("pre");
  pm.tr.split(8).apply();
  pm.flush();
  (0, _cmp.cmp)(pm.content.querySelector("p"), oldP);
  (0, _cmp.cmp)(pm.content.querySelector("pre"), oldPre);
}, { doc: (0, _build.doc)((0, _build.p)("foo"), (0, _build.h1)("bar"), (0, _build.pre)("baz")) });

test("minimal_on_join", function (pm) {
  var oldP = pm.content.querySelector("p");
  var oldPre = pm.content.querySelector("pre");
  pm.tr.join(10).apply();
  pm.flush();
  (0, _cmp.cmp)(pm.content.querySelector("p"), oldP);
  (0, _cmp.cmp)(pm.content.querySelector("pre"), oldPre);
}, { doc: (0, _build.doc)((0, _build.p)("foo"), (0, _build.h1)("bar"), (0, _build.h1)("x"), (0, _build.pre)("baz")) });