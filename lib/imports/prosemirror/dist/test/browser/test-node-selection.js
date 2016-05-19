"use strict";

var _def = require("./def");

var _build = require("../build");

var _cmp = require("../cmp");

var test = (0, _def.namespace)("nodeselection");

test("parent_block", function (pm) {
  pm.setTextSelection(9);
  pm.execCommand("selectParentNode");
  (0, _cmp.cmpStr)(pm.selection.from, 7, "to paragraph");
  pm.execCommand("selectParentNode");
  (0, _cmp.cmpStr)(pm.selection.from, 1, "to list item");
  pm.execCommand("selectParentNode");
  (0, _cmp.cmpStr)(pm.selection.from, 0, "to list");
  pm.execCommand("selectParentNode");
  (0, _cmp.cmpStr)(pm.selection.from, 0, "stop at toplevel");
}, { doc: (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("foo"), (0, _build.p)("bar")), (0, _build.li)((0, _build.p)("baz")))) });

test("through_inline_node", function (pm) {
  pm.setTextSelection(4);
  (0, _def.dispatch)(pm, "Right");
  (0, _cmp.cmpStr)(pm.selection.from, 4, "moved right onto image");
  (0, _def.dispatch)(pm, "Right");
  (0, _cmp.cmpStr)(pm.selection.head, 5, "moved right past");
  (0, _cmp.cmpStr)(pm.selection.anchor, 5, "moved right past'");
  (0, _def.dispatch)(pm, "Left");
  (0, _cmp.cmpStr)(pm.selection.from, 4, "moved left onto image");
  (0, _def.dispatch)(pm, "Left");
  (0, _cmp.cmpStr)(pm.selection.head, 4, "moved left past");
  (0, _cmp.cmpStr)(pm.selection.anchor, 4, "moved left past'");
}, { doc: (0, _build.doc)((0, _build.p)("foo", _build.img, "bar")) });

test("onto_block", function (pm) {
  pm.setTextSelection(6);
  (0, _def.dispatch)(pm, "Down");
  (0, _cmp.cmpStr)(pm.selection.from, 7, "moved down onto hr");
  pm.setTextSelection(11);
  (0, _def.dispatch)(pm, "Up");
  (0, _cmp.cmpStr)(pm.selection.from, 7, "moved up onto hr");
}, { doc: (0, _build.doc)((0, _build.p)("hello"), _build.hr, (0, _build.ul)((0, _build.li)((0, _build.p)("there")))) });

test("through_double_block", function (pm) {
  pm.setTextSelection(7);
  (0, _def.dispatch)(pm, "Down");
  (0, _cmp.cmpStr)(pm.selection.from, 9, "moved down onto hr");
  (0, _def.dispatch)(pm, "Down");
  (0, _cmp.cmpStr)(pm.selection.from, 10, "moved down onto second hr");
  pm.setTextSelection(14);
  (0, _def.dispatch)(pm, "Up");
  (0, _cmp.cmpStr)(pm.selection.from, 10, "moved up onto second hr");
  (0, _def.dispatch)(pm, "Up");
  (0, _cmp.cmpStr)(pm.selection.from, 9, "moved up onto hr");
}, { doc: (0, _build.doc)((0, _build.blockquote)((0, _build.p)("hello")), _build.hr, _build.hr, (0, _build.p)("there")) });

test("horizontally_through_block", function (pm) {
  pm.setTextSelection(4);
  (0, _def.dispatch)(pm, "Right");
  (0, _cmp.cmpStr)(pm.selection.from, 5, "right into first hr");
  (0, _def.dispatch)(pm, "Right");
  (0, _cmp.cmpStr)(pm.selection.from, 6, "right into second hr");
  (0, _def.dispatch)(pm, "Right");
  (0, _cmp.cmpStr)(pm.selection.head, 8, "right out of hr");
  (0, _def.dispatch)(pm, "Left");
  (0, _cmp.cmpStr)(pm.selection.from, 6, "left into second hr");
  (0, _def.dispatch)(pm, "Left");
  (0, _cmp.cmpStr)(pm.selection.from, 5, "left into first hr");
  (0, _def.dispatch)(pm, "Left");
  (0, _cmp.cmpStr)(pm.selection.head, 4, "left out of hr");
}, { doc: (0, _build.doc)((0, _build.p)("foo"), _build.hr, _build.hr, (0, _build.p)("bar")) });

test("block_out_of_image", function (pm) {
  pm.setNodeSelection(4);
  (0, _def.dispatch)(pm, "Down");
  (0, _cmp.cmpStr)(pm.selection.from, 6, "down into hr");
  pm.setNodeSelection(8);
  (0, _def.dispatch)(pm, "Up");
  (0, _cmp.cmpStr)(pm.selection.from, 6, "up into hr");
}, { doc: (0, _build.doc)((0, _build.p)("foo", _build.img), _build.hr, (0, _build.p)(_build.img, "bar")) });

test("lift_preserves", function (pm) {
  pm.setNodeSelection(3);
  pm.execCommand("lift");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hi")))), "lifted");
  (0, _cmp.cmpStr)(pm.selection.from, 2, "preserved selection");
  pm.execCommand("lift");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("hi")), "lifted again");
  (0, _cmp.cmpStr)(pm.selection.from, 0, "preserved selection again");
}, { doc: (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.blockquote)((0, _build.p)("hi"))))) });

test("lift_at_selection_level", function (pm) {
  pm.setNodeSelection(1);
  pm.execCommand("lift");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("a")), (0, _build.li)((0, _build.p)("b")))), "lifted list");
  (0, _cmp.cmpStr)(pm.selection.from, 0, "preserved selection");
}, { doc: (0, _build.doc)((0, _build.blockquote)((0, _build.ul)((0, _build.li)((0, _build.p)("a")), (0, _build.li)((0, _build.p)("b"))))) });

test("join_precisely_down", function (pm) {
  pm.setNodeSelection(1);
  (0, _cmp.cmp)(pm.execCommand("joinDown"), false, "don't join parent");
  pm.setNodeSelection(0);
  pm.execCommand("joinDown");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo"), (0, _build.p)("bar"))), "joined");
  (0, _cmp.cmpStr)(pm.selection.from, 0, "selected joined node");
}, { doc: (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo")), (0, _build.blockquote)((0, _build.p)("bar"))) });

test("join_precisely_up", function (pm) {
  pm.setNodeSelection(8);
  (0, _cmp.cmp)(pm.execCommand("joinUp"), false, "don't join parent");
  pm.setNodeSelection(7);
  pm.execCommand("joinUp");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo"), (0, _build.p)("bar"))), "joined");
  (0, _cmp.cmpStr)(pm.selection.from, 0, "selected joined node");
}, { doc: (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo")), (0, _build.blockquote)((0, _build.p)("bar"))) });

test("delete_block", function (pm) {
  pm.setNodeSelection(0);
  pm.execCommand("deleteSelection");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("bar")), (0, _build.li)((0, _build.p)("baz")), (0, _build.li)((0, _build.p)("quux")))), "paragraph vanished");
  (0, _cmp.cmpStr)(pm.selection.head, 3, "moved to list");
  pm.setNodeSelection(2);
  pm.execCommand("deleteSelection");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("baz")), (0, _build.li)((0, _build.p)("quux")))), "delete whole item");
  (0, _cmp.cmpStr)(pm.selection.head, 3, "to next item");
  pm.setNodeSelection(9);
  pm.execCommand("deleteSelection");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("baz")))), "delete last item");
  (0, _cmp.cmpStr)(pm.selection.head, 6, "back to paragraph above");
  pm.setNodeSelection(0);
  pm.execCommand("deleteSelection");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)()), "delete list");
}, { doc: (0, _build.doc)((0, _build.p)("foo"), (0, _build.ul)((0, _build.li)((0, _build.p)("bar")), (0, _build.li)((0, _build.p)("baz")), (0, _build.li)((0, _build.p)("quux")))) });

test("delete_hr", function (pm) {
  pm.setNodeSelection(3);
  pm.execCommand("deleteSelection");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("a"), _build.hr, (0, _build.p)("b")), "deleted first hr");
  (0, _cmp.cmpStr)(pm.selection.from, 3, "moved to second hr");
  pm.execCommand("deleteSelection");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("a"), (0, _build.p)("b")), "deleted second hr");
  (0, _cmp.cmpStr)(pm.selection.head, 4, "moved to paragraph");
}, { doc: (0, _build.doc)((0, _build.p)("a"), _build.hr, _build.hr, (0, _build.p)("b")) });

test("delete_selection", function (pm) {
  pm.setNodeSelection(4);
  pm.tr.replaceSelection(null).apply();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("foobar"), (0, _build.blockquote)((0, _build.p)("hi")), (0, _build.p)("ay")), "deleted img");
  (0, _cmp.cmpStr)(pm.selection.head, 4, "cursor at img");
  pm.setNodeSelection(9);
  pm.tr.deleteSelection().apply();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("foobar"), (0, _build.p)("ay")), "deleted blockquote");
  (0, _cmp.cmpStr)(pm.selection.from, 9, "cursor moved past");
  pm.setNodeSelection(8);
  pm.tr.deleteSelection().apply();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("foobar")), "deleted paragraph");
  (0, _cmp.cmpStr)(pm.selection.from, 7, "cursor moved back");
}, { doc: (0, _build.doc)((0, _build.p)("foo", _build.img, "bar"), (0, _build.blockquote)((0, _build.p)("hi")), (0, _build.p)("ay")) });

test("replace_selection_inline", function (pm) {
  pm.setNodeSelection(4);
  pm.tr.replaceSelection(pm.schema.node("hard_break")).apply();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("foo", _build.br, "bar", _build.img, "baz")), "replaced with br");
  (0, _cmp.cmpStr)(pm.selection.head, 4, "before inserted node");
  (0, _cmp.is)(pm.selection.empty, "empty selection");
  pm.setNodeSelection(8);
  pm.tr.replaceSelection(pm.schema.text("abc")).apply();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("foo", _build.br, "barabcbaz")), "replaced with text");
  (0, _cmp.cmpStr)(pm.selection.head, 8, "before text");
  (0, _cmp.is)(pm.selection.empty, "again empty selection");
  pm.setNodeSelection(0);
  pm.tr.replaceSelection(pm.schema.text("xyz")).apply();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("xyz")), "replaced all of paragraph");
}, { doc: (0, _build.doc)((0, _build.p)("foo", _build.img, "bar", _build.img, "baz")) });

test("replace_selection_block", function (pm) {
  pm.setNodeSelection(5);
  pm.tr.replaceSelection(pm.schema.node("code_block")).apply();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("abc"), (0, _build.pre)(), _build.hr, (0, _build.blockquote)((0, _build.p)("ow"))), "replace with code block");
  (0, _cmp.cmpStr)(pm.selection.from, 5, "selected code");
  pm.setNodeSelection(8);
  pm.tr.replaceSelection(pm.schema.node("paragraph")).apply();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("abc"), (0, _build.pre)(), _build.hr, (0, _build.p)()), "replace with paragraph");
  (0, _cmp.cmpStr)(pm.selection.from, 8);
}, { doc: (0, _build.doc)((0, _build.p)("abc"), _build.hr, _build.hr, (0, _build.blockquote)((0, _build.p)("ow"))) });