"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findTextNode = findTextNode;

var _def = require("./def");

var _build = require("../build");

var _cmp = require("../cmp");

function allPositions(doc) {
  var found = [];
  function scan(node, start) {
    if (node.isTextblock) {
      for (var i = 0; i <= node.content.size; i++) {
        found.push(start + i);
      }
    } else {
      node.forEach(function (child, offset) {
        return scan(child, start + offset + 1);
      });
    }
  }
  scan(doc, 0);
  return found;
}

var test = (0, _def.namespace)("selection");

function findTextNode(node, text) {
  if (node.nodeType == 3) {
    if (node.nodeValue == text) return node;
  } else if (node.nodeType == 1) {
    for (var ch = node.firstChild; ch; ch = ch.nextSibling) {
      var found = findTextNode(ch, text);
      if (found) return found;
    }
  }
}

function setSel(node, offset) {
  var range = document.createRange();
  range.setEnd(node, offset);
  range.setStart(node, offset);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

test("read", function (pm) {
  function test(node, offset, expected, comment) {
    setSel(node, offset);
    pm.sel.readFromDOM();
    var sel = pm.selection;
    (0, _cmp.cmp)(sel.head == null ? sel.from : sel.head, expected, comment);
    pm.flush();
  }
  var one = findTextNode(pm.content, "one");
  var two = findTextNode(pm.content, "two");
  test(one, 0, 1, "force 0:0");
  test(one, 1, 2, "force 0:1");
  test(one, 3, 4, "force 0:3");
  test(one.parentNode, 0, 1, "force :0 from one");
  test(one.parentNode, 1, 4, "force :1 from one");
  test(two, 0, 8, "force 1:0");
  test(two, 3, 11, "force 1:3");
  test(two.parentNode, 1, 11, "force :1 from two");
  test(pm.content, 1, 4, "force :1");
  test(pm.content, 1, 5, "force :1");
  test(pm.content, 2, 8, "force :2");
  test(pm.content, 3, 11, "force :3");
}, {
  doc: (0, _build.doc)((0, _build.p)("one"), _build.hr, (0, _build.blockquote)((0, _build.p)("two")))
});

function getSel() {
  var sel = window.getSelection();
  var node = sel.focusNode,
      offset = sel.focusOffset;
  while (node && node.nodeType != 3) {
    var after = offset < node.childNodes.length && node.childNodes[offset];
    var before = offset > 0 && node.childNodes[offset - 1];
    if (after) {
      node = after;offset = 0;
    } else if (before) {
      node = before;offset = node.nodeType == 3 ? node.nodeValue.length : node.childNodes.length;
    } else break;
  }
  return { node: node, offset: offset };
}

test("set", function (pm) {
  function test(pos, node, offset) {
    pm.setTextSelection(pos);
    pm.flush();
    var sel = getSel();
    (0, _cmp.cmp)(sel.node, node, pos);
    (0, _cmp.cmp)(sel.offset, offset, pos);
  }
  var one = findTextNode(pm.content, "one");
  var two = findTextNode(pm.content, "two");
  pm.focus();
  test(1, one, 0);
  test(2, one, 1);
  test(4, one, 3);
  test(8, two, 0);
  test(10, two, 2);
}, {
  doc: (0, _build.doc)((0, _build.p)("one"), _build.hr, (0, _build.blockquote)((0, _build.p)("two")))
});

test("change_event", function (pm) {
  var received = 0;
  pm.on("selectionChange", function () {
    return ++received;
  });
  pm.setTextSelection(2);
  pm.setTextSelection(2);
  (0, _cmp.cmp)(received, 1, "changed");
  pm.setTextSelection(1);
  (0, _cmp.cmp)(received, 2, "changed back");
  pm.setOption("doc", (0, _build.doc)((0, _build.p)("hi")));
  (0, _cmp.cmp)(received, 2, "new doc");
  pm.tr.insertText(3, "you").apply();
  (0, _cmp.cmp)(received, 3, "doc changed");
}, { doc: (0, _build.doc)((0, _build.p)("one")) });

test("coords_order", function (pm) {
  var p00 = pm.coordsAtPos(1);
  var p01 = pm.coordsAtPos(2);
  var p03 = pm.coordsAtPos(4);
  var p10 = pm.coordsAtPos(6);
  var p13 = pm.coordsAtPos(9);

  (0, _cmp.gt)(p00.bottom, p00.top);
  (0, _cmp.gt)(p13.bottom, p13.top);

  (0, _cmp.cmp)(p00.top, p01.top);
  (0, _cmp.cmp)(p01.top, p03.top);
  (0, _cmp.cmp)(p00.bottom, p03.bottom);
  (0, _cmp.cmp)(p10.top, p13.top);

  (0, _cmp.gt)(p01.left, p00.left);
  (0, _cmp.gt)(p03.left, p01.left);
  (0, _cmp.gt)(p10.top, p00.top);
  (0, _cmp.gt)(p13.left, p10.left);
}, {
  doc: (0, _build.doc)((0, _build.p)("one"), (0, _build.p)("two"))
});

test("coords_cornercases", function (pm) {
  pm.markRange(2, 5, { className: "foo" });
  pm.markRange(7, 13, { className: "foo" });
  allPositions(pm.doc).forEach(function (pos) {
    var coords = pm.coordsAtPos(pos);
    var found = pm.posAtCoords(coords);
    (0, _cmp.cmp)(found, pos);
    pm.setTextSelection(pos);
    pm.flush();
  });
}, {
  doc: (0, _build.doc)((0, _build.p)("one", (0, _build.em)("two", (0, _build.strong)("three"), _build.img), _build.br, (0, _build.code)("foo")), (0, _build.p)())
});

test("coords_round_trip", function (pm) {
  ;[1, 2, 4, 7, 14, 15].forEach(function (pos) {
    var coords = pm.coordsAtPos(pos);
    var found = pm.posAtCoords(coords);
    (0, _cmp.cmp)(found, pos);
  });
}, {
  doc: (0, _build.doc)((0, _build.p)("one"), (0, _build.blockquote)((0, _build.p)("two"), (0, _build.p)("three")))
});

test("follow_change", function (pm) {
  pm.tr.insertText(1, "xy").apply();
  (0, _cmp.cmp)(pm.selection.head, 3);
  (0, _cmp.cmp)(pm.selection.anchor, 3);
  pm.tr.insertText(1, "zq").apply();
  (0, _cmp.cmp)(pm.selection.head, 5);
  (0, _cmp.cmp)(pm.selection.anchor, 5);
  pm.tr.insertText(7, "uv").apply();
  (0, _cmp.cmp)(pm.selection.head, 5);
  (0, _cmp.cmp)(pm.selection.anchor, 5);
}, {
  doc: (0, _build.doc)((0, _build.p)("hi"))
});

test("replace_with_block", function (pm) {
  pm.setTextSelection(4);
  pm.tr.replaceSelection(pm.schema.node("horizontal_rule")).apply();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("foo"), _build.hr, (0, _build.p)("bar")), "split paragraph");
  (0, _cmp.cmp)(pm.selection.head, 7, "moved after rule");
  pm.setTextSelection(10);
  pm.tr.replaceSelection(pm.schema.node("horizontal_rule")).apply();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("foo"), _build.hr, (0, _build.p)("bar"), _build.hr), "inserted after");
  (0, _cmp.cmp)(pm.selection.head, 10, "stayed in paragraph");
}, {
  doc: (0, _build.doc)((0, _build.p)("foobar"))
});

test("type_over_hr", function (pm) {
  pm.input.insertText(pm.selection.from, pm.selection.to, "x");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("a"), (0, _build.p)("x"), (0, _build.p)("b")));
  (0, _cmp.cmp)(pm.selection.head, 5);
  (0, _cmp.cmp)(pm.selection.anchor, 5);
}, { doc: (0, _build.doc)((0, _build.p)("a"), "<a>", _build.hr, (0, _build.p)("b")) });