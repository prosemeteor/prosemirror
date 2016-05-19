"use strict";

var _def = require("./def");

var _build = require("../build");

var _cmp = require("../cmp");

var test = (0, _def.namespace)("ranges", { doc: (0, _build.doc)((0, _build.p)("hello")) });

test("preserve", function (pm) {
  var range = pm.markRange(2, 5);
  (0, _cmp.cmpStr)(range.from, 2);
  (0, _cmp.cmpStr)(range.to, 5);
  pm.tr.insertText(1, "A").insertText(2, "B").apply();
  (0, _cmp.cmpStr)(range.from, 4);
  (0, _cmp.cmpStr)(range.to, 7);
  pm.tr.delete(5, 6).apply();
  (0, _cmp.cmpStr)(range.from, 4);
  (0, _cmp.cmpStr)(range.to, 6);
});

test("leftInclusive", function (pm) {
  var range1 = pm.markRange(2, 3, { inclusiveLeft: true });
  var range2 = pm.markRange(2, 3, { inclusiveLeft: false });
  pm.tr.insertText(2, "X").apply();
  (0, _cmp.cmpStr)(range1.from, 2);
  (0, _cmp.cmpStr)(range2.from, 3);
});

test("rightInclusive", function (pm) {
  var range1 = pm.markRange(2, 3, { inclusiveRight: true });
  var range2 = pm.markRange(2, 3, { inclusiveRight: false });
  pm.tr.insertText(3, "X").apply();
  (0, _cmp.cmpStr)(range1.to, 4);
  (0, _cmp.cmpStr)(range2.to, 3);
});

test("deleted", function (pm) {
  var range = pm.markRange(2, 3),
      cleared = false;
  range.on("removed", function () {
    return cleared = true;
  });
  pm.tr.insertText(2, "A").apply();
  (0, _cmp.cmp)(cleared, false);
  pm.tr.delete(3, 5).apply();
  (0, _cmp.cmp)(cleared, true);
  (0, _cmp.cmp)(range.from, null);
});

test("cleared", function (pm) {
  var range = pm.markRange(2, 3),
      cleared = false;
  range.on("removed", function () {
    return cleared = true;
  });
  pm.removeRange(range);
  (0, _cmp.cmp)(cleared, true);
  (0, _cmp.cmp)(range.from, null);
});

test("stay_when_empty", function (pm) {
  var range = pm.markRange(2, 3, { removeWhenEmpty: false }),
      cleared = false;
  range.on("removed", function () {
    return cleared = true;
  });
  pm.tr.delete(1, 5).apply();
  (0, _cmp.cmp)(cleared, false);
  (0, _cmp.cmpStr)(range.from, 1);
  (0, _cmp.cmpStr)(range.to, 1);
});

test("add_class_simple", function (pm) {
  var range = pm.markRange(2, 5, { className: "foo" });
  pm.flush();
  (0, _cmp.cmp)(pm.content.querySelector(".foo").textContent, "ell");
  pm.removeRange(range);
  pm.flush();
  (0, _cmp.cmp)(pm.content.querySelector(".foo"), null);
});

test("add_class_messy", function (pm) {
  var big = (0, _build.doc)(_build.hr, (0, _build.blockquote)((0, _build.p)(), _build.hr, (0, _build.ul)((0, _build.li)((0, _build.p)("a"))), (0, _build.p)("h<a>ello")), (0, _build.p)("y<b>ou"));
  pm.setContent(big);
  pm.markRange(big.tag.a, big.tag.b, { className: "foo" });
  pm.flush();
  var foos = pm.content.querySelectorAll(".foo");
  (0, _cmp.cmp)(foos.length, 2);
  (0, _cmp.cmpStr)(foos[0].textContent, "ello");
  (0, _cmp.cmpStr)(foos[1].textContent, "y");
});

test("add_class_multi_block", function (pm) {
  var range = pm.markRange(2, 19, { className: "foo" });
  pm.flush();
  var found = pm.content.querySelectorAll(".foo");
  (0, _cmp.cmp)(found.length, 3);
  (0, _cmp.cmp)(found[0].textContent, "ne");
  (0, _cmp.cmp)(found[1].textContent, "two");
  (0, _cmp.cmp)(found[2].textContent, "thre");
  pm.removeRange(range);
  pm.flush();
  (0, _cmp.cmp)(pm.content.querySelector(".foo"), null);
}, { doc: (0, _build.doc)((0, _build.p)("one"), (0, _build.ul)((0, _build.li)((0, _build.p)("two")), (0, _build.li)((0, _build.p)("three")))) });