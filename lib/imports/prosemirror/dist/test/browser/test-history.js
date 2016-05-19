"use strict";

var _def = require("./def");

var _build = require("../build");

var _cmp = require("../cmp");

var test = (0, _def.namespace)("history");

function type(pm, text) {
  pm.tr.replaceSelection(pm.schema.text(text)).apply();
}

function cutHistory(pm) {
  pm.history.lastAddedAt = 0;
}

test("undo", function (pm) {
  type(pm, "a");
  type(pm, "b");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("ab")));
  pm.execCommand("undo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)()));
});

test("redo", function (pm) {
  type(pm, "a");
  type(pm, "b");
  pm.execCommand("undo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)()));
  pm.execCommand("redo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("ab")));
});

test("multiple", function (pm) {
  type(pm, "a");
  cutHistory(pm);
  type(pm, "b");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("ab")));
  pm.execCommand("undo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("a")));
  pm.execCommand("undo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)()));
  pm.execCommand("redo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("a")));
  pm.execCommand("redo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("ab")));
  pm.execCommand("undo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("a")));
});

test("unsynced", function (pm) {
  type(pm, "hello");
  pm.tr.insertText(1, "oops").apply({ addToHistory: false });
  pm.tr.insertText(10, "!").apply({ addToHistory: false });
  pm.execCommand("undo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("oops!")));
});

function unsyncedComplex(pm, compress) {
  type(pm, "hello");
  cutHistory(pm);
  type(pm, "!");
  pm.tr.insertText(1, "....").apply({ addToHistory: false });
  pm.tr.split(3).apply();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)(".."), (0, _build.p)("..hello!")));
  pm.tr.split(2).apply({ addToHistory: false });
  if (compress) pm.history.done.compress(Infinity);
  pm.execCommand("undo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("."), (0, _build.p)("...hello")));
  pm.execCommand("undo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("."), (0, _build.p)("...")));
}

test("unsynced_complex", function (pm) {
  return unsyncedComplex(pm, false);
});

test("unsynced_complex_compress", function (pm) {
  return unsyncedComplex(pm, true);
});

test("overlapping", function (pm) {
  type(pm, "hello");
  cutHistory(pm);
  pm.tr.delete(1, 6).apply();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)()));
  pm.execCommand("undo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("hello")));
  pm.execCommand("undo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)()));
});

test("overlapping_no_collapse", function (pm) {
  pm.history.allowCollapsing = false;
  type(pm, "hello");
  cutHistory(pm);
  pm.tr.delete(1, 6).apply();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)()));
  pm.execCommand("undo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("hello")));
  pm.execCommand("undo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)()));
});

test("overlapping_unsynced_delete", function (pm) {
  type(pm, "hi");
  cutHistory(pm);
  type(pm, "hello");
  pm.tr.delete(1, 8).apply({ addToHistory: false });
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)()));
  pm.execCommand("undo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)()));
});

test("ping_pong", function (pm) {
  type(pm, "one");
  type(pm, " two");
  cutHistory(pm);
  type(pm, " three");
  pm.tr.insertText(1, "zero ").apply();
  cutHistory(pm);
  pm.tr.split(1).apply();
  pm.setTextSelection(1);
  type(pm, "top");
  for (var i = 0; i < 6; i++) {
    var re = i % 2;
    for (var j = 0; j < 4; j++) {
      (0, _cmp.cmp)(pm.history[re ? "redo" : "undo"](), j < 3);
    }(0, _cmp.cmpNode)(pm.doc, re ? (0, _build.doc)((0, _build.p)("top"), (0, _build.p)("zero one two three")) : (0, _build.doc)((0, _build.p)()));
  }
});

test("eat_neighboring", function (pm) {
  type(pm, "o");
  pm.tr.split(1).apply();
  pm.tr.insertText(3, "zzz").apply({ addToHistory: false });
  pm.execCommand("undo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("zzz")));
});

test("ping_pong_unsynced", function (pm) {
  type(pm, "one");
  type(pm, " two");
  cutHistory(pm);
  pm.tr.insertText(pm.selection.head, "xxx").apply({ addToHistory: false });
  type(pm, " three");
  pm.tr.insertText(1, "zero ").apply();
  cutHistory(pm);
  pm.tr.split(1).apply();
  pm.setTextSelection(1);
  type(pm, "top");
  pm.tr.insertText(1, "yyy").apply({ addToHistory: false });
  pm.tr.insertText(7, "zzz").apply({ addToHistory: false });
  for (var i = 0; i < 3; i++) {
    if (i == 2) pm.history.done.compress(Infinity);
    for (var j = 0; j < 4; j++) {
      (0, _cmp.cmp)(pm.history.undo(), j < 3);
    }(0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("yyyzzzxxx")), i + " undo");
    if (i == 2) pm.history.undone.compress(Infinity);
    for (var _j = 0; _j < 4; _j++) {
      (0, _cmp.cmp)(pm.history.redo(), _j < 3);
    }(0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("yyytopzzz"), (0, _build.p)("zero one twoxxx three")), i + " redo");
  }
});

test("setDocResets", function (pm) {
  type(pm, "hello");
  pm.setDoc((0, _build.doc)((0, _build.p)("aah")));
  (0, _cmp.cmp)(pm.history.undo(), false);
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("aah")));
}, { doc: (0, _build.doc)((0, _build.p)("okay")) });

test("isAtVersion", function (pm) {
  type(pm, "hello");
  cutHistory(pm);
  var version = pm.history.getVersion();
  type(pm, "ok");
  (0, _cmp.is)(!pm.history.isAtVersion(version), "ahead");
  pm.history.undo();
  (0, _cmp.is)(pm.history.isAtVersion(version), "went back");
  pm.history.undo();
  (0, _cmp.is)(!pm.history.isAtVersion(version), "behind");
  pm.history.redo();
  (0, _cmp.is)(pm.history.isAtVersion(version), "went forward");
});

test("rollback", function (pm) {
  type(pm, "hello");
  var version = pm.history.getVersion();
  type(pm, "ok");
  cutHistory(pm);
  type(pm, "more");
  (0, _cmp.is)(pm.history.backToVersion(version), "rollback");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("hello")), "back to start");
  (0, _cmp.is)(pm.history.backToVersion(version), "no-op rollback");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("hello")), "no-op had no effect");
  pm.history.undo();
  (0, _cmp.is)(!pm.history.backToVersion(version), "failed rollback");
});

test("rollback_to_start", function (pm) {
  var version = pm.history.getVersion();
  type(pm, "def");
  pm.history.backToVersion(version);
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("abc")));
}, { doc: (0, _build.doc)((0, _build.p)("abc")) });

test("setSelectionOnUndo", function (pm) {
  type(pm, "hi");
  cutHistory(pm);
  pm.setTextSelection(1, 3);
  var selection = pm.selection;
  pm.tr.replaceWith(selection.from, selection.to, pm.schema.text("hello")).apply();
  var selection2 = pm.selection;
  pm.execCommand("undo");
  (0, _cmp.is)(pm.selection.eq(selection), "failed restoring selection after undo");
  pm.execCommand("redo");
  (0, _cmp.is)(pm.selection.eq(selection2), "failed restoring selection after redo");
});

test("rebaseSelectionOnUndo", function (pm) {
  type(pm, "hi");
  cutHistory(pm);
  pm.setTextSelection(1, 3);
  pm.tr.insert(1, pm.schema.text("hello")).apply();
  pm.tr.insert(1, pm.schema.text("---")).apply({ addToHistory: false });
  pm.execCommand("undo");
  (0, _cmp.cmpStr)(pm.selection.head, 6);
});

test("unsynced_overwrite", function (pm) {
  pm.history.preserveItems++;
  type(pm, "a");
  type(pm, "b");
  cutHistory(pm);
  pm.setTextSelection(1, 3);
  type(pm, "c");
  pm.history.undo();
  pm.history.undo();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)()));
});

test("unsynced_list_manip", function (pm) {
  pm.history.preserveItems++;
  (0, _def.dispatch)(pm, "Enter");
  pm.execCommand("list_item:sink");
  type(pm, "abc");
  cutHistory(pm);
  (0, _def.dispatch)(pm, "Enter");
  (0, _def.dispatch)(pm, "Enter");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hello"), (0, _build.ul)((0, _build.li)((0, _build.p)("abc"))), (0, _build.p)()))));
  pm.history.undo();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hello"), (0, _build.ul)((0, _build.li)((0, _build.p)("abc")))))));
  pm.history.undo();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hello")))));
}, { doc: (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hello<a>")))) });

test("unsynced_list_indent", function (pm) {
  pm.history.preserveItems++;
  (0, _def.dispatch)(pm, "Enter");
  pm.execCommand("list_item:sink");
  type(pm, "abc");
  cutHistory(pm);
  (0, _def.dispatch)(pm, "Enter");
  pm.execCommand("list_item:sink");
  type(pm, "def");
  cutHistory(pm);
  pm.setTextSelection(12);
  pm.execCommand("list_item:lift");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hello")), (0, _build.li)((0, _build.p)("abc"), (0, _build.ul)((0, _build.li)((0, _build.p)("def")))))));
  pm.history.undo();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hello"), (0, _build.ul)((0, _build.li)((0, _build.p)("abc"), (0, _build.ul)((0, _build.li)((0, _build.p)("def")))))))));
  pm.history.undo();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hello"), (0, _build.ul)((0, _build.li)((0, _build.p)("abc")))))));
  pm.history.undo();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hello")))));
  pm.history.redo();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hello"), (0, _build.ul)((0, _build.li)((0, _build.p)("abc")))))));
  pm.history.redo();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hello"), (0, _build.ul)((0, _build.li)((0, _build.p)("abc"), (0, _build.ul)((0, _build.li)((0, _build.p)("def")))))))));
  pm.history.redo();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hello")), (0, _build.li)((0, _build.p)("abc"), (0, _build.ul)((0, _build.li)((0, _build.p)("def")))))));
}, { doc: (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hello<a>")))) });