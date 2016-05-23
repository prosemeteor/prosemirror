"use strict";

var _rebase = require("../collab/rebase");

var _build = require("./build");

var _failure = require("./failure");

var _tests = require("./tests");

var _cmp = require("./cmp");

var _trans = require("./trans");

function runRebase(transforms, expected) {
  var start = transforms[0].before,
      doc = start,
      maps = [];
  transforms.forEach(function (transform) {
    var result = (0, _rebase.rebaseSteps)(doc, maps, transform.steps, transform.maps);
    maps = maps.concat(result.transform.maps);
    doc = result.doc;
  });
  (0, _cmp.cmpNode)(doc, expected);

  for (var tag in start.tag) {
    var mapped = start.tag[tag],
        deleted = false;
    for (var i = 0; i < maps.length; i++) {
      var result = maps[i].mapResult(mapped, 1);
      if (result.deleted) deleted = true;
      mapped = result.pos;
    }

    var exp = expected.tag[tag];
    if (deleted) {
      if (exp) throw new _failure.Failure("Tag " + tag + " was unexpectedly deleted");
    } else {
      if (!exp) throw new _failure.Failure("Tag " + tag + " is not actually deleted");
      (0, _cmp.cmpStr)(mapped, exp, tag);
    }
  }
}

function rebase(name, doc) {
  for (var _len = arguments.length, clients = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    clients[_key - 2] = arguments[_key];
  }

  var expected = clients.pop();
  (0, _tests.defTest)("rebase_" + name, function () {
    return runRebase(clients.map(function (tr) {
      return tr.get(doc);
    }), expected);
  });
}

function permute(array) {
  if (array.length < 2) return [array];
  var result = [];
  for (var i = 0; i < array.length; i++) {
    var others = permute(array.slice(0, i).concat(array.slice(i + 1)));
    for (var j = 0; j < others.length; j++) {
      result.push([array[i]].concat(others[j]));
    }
  }
  return result;
}

function rebase$(name, doc) {
  for (var _len2 = arguments.length, clients = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
    clients[_key2 - 2] = arguments[_key2];
  }

  var expected = clients.pop();
  (0, _tests.defTest)("rebase_" + name, function () {
    permute(clients.map(function (tr) {
      return tr.get(doc);
    })).forEach(function (transforms) {
      return runRebase(transforms, expected);
    });
  });
}

rebase$("type_simple", (0, _build.doc)((0, _build.p)("h<1>ell<2>o")), _trans.tr.txt("X", 1), _trans.tr.txt("Y", 2), (0, _build.doc)((0, _build.p)("hX<1>ellY<2>o")));

rebase$("type_simple_multiple", (0, _build.doc)((0, _build.p)("h<1>ell<2>o")), _trans.tr.txt("X", 1).txt("Y", 1).txt("Z", 1), _trans.tr.txt("U", 2).txt("V", 2), (0, _build.doc)((0, _build.p)("hXYZ<1>ellUV<2>o")));

rebase$("type_three", (0, _build.doc)((0, _build.p)("h<1>ell<2>o th<3>ere")), _trans.tr.txt("X", 1), _trans.tr.txt("Y", 2), _trans.tr.txt("Z", 3), (0, _build.doc)((0, _build.p)("hX<1>ellY<2>o thZ<3>ere")));

rebase$("wrap", (0, _build.doc)((0, _build.p)("<1>hell<2>o<3>")), _trans.tr.txt("X", 2), _trans.tr.wrap("blockquote", null, 1, 3), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("<1>hellX<2>o<3>"))));

rebase$("delete", (0, _build.doc)((0, _build.p)("hello<1> wo<2>rld<3>!")), _trans.tr.del(1, 3), _trans.tr.txt("X", 2), (0, _build.doc)((0, _build.p)("hello<1><3>!")));

rebase("delete_twice", (0, _build.doc)((0, _build.p)("hello<1> wo<2>rld<3>!")), _trans.tr.del(1, 3), _trans.tr.del(1, 3), (0, _build.doc)((0, _build.p)("hello<1><3>!")));

rebase$("join", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("one")), "<1>", (0, _build.li)((0, _build.p)("tw<2>o")))), _trans.tr.txt("A", 2), _trans.tr.join(1), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("one"), (0, _build.p)("twA<2>o")))));

rebase("mark", (0, _build.doc)((0, _build.p)("hello <1>wo<2>rld<3>")), _trans.tr.addMark("em", 1, 3), _trans.tr.txt("_", 2), (0, _build.doc)((0, _build.p)("hello <1>", (0, _build.em)("wo"), "_<2>", (0, _build.em)("rld<3>"))));

rebase("mark_unmark", (0, _build.doc)((0, _build.p)((0, _build.em)("<1>hello"), " world<2>")), _trans.tr.addMark("em", 1, 2), _trans.tr.rmMark("em", 1, 2), (0, _build.doc)((0, _build.p)("<1>hello", (0, _build.em)(" world<2>"))));

rebase("unmark_mark", (0, _build.doc)((0, _build.p)("<1>hello ", (0, _build.em)("world<2>"))), _trans.tr.rmMark("em", 1, 2), _trans.tr.addMark("em", 1, 2), (0, _build.doc)((0, _build.p)((0, _build.em)("<1>hello "), "world<2>")));

rebase("replace_nested", (0, _build.doc)((0, _build.p)("b<before>efore"), (0, _build.blockquote)((0, _build.ul)((0, _build.li)((0, _build.p)("o<1>ne")), (0, _build.li)((0, _build.p)("t<2>wo")), (0, _build.li)((0, _build.p)("thr<3>ee")))), (0, _build.p)("a<after>fter")), _trans.tr.repl((0, _build.doc)((0, _build.p)("a<a>"), (0, _build.blockquote)((0, _build.p)("b")), (0, _build.p)("<b>c")), 1, 3), _trans.tr.txt("ayay", 2), (0, _build.doc)((0, _build.p)("b<before>efore"), (0, _build.blockquote)((0, _build.ul)((0, _build.li)((0, _build.p)("o<1>"), (0, _build.blockquote)((0, _build.p)("b")), (0, _build.p)("<3>ee")))), (0, _build.p)("a<after>fter")));

rebase$("map_through_insert", (0, _build.doc)((0, _build.p)("X<1>X<2>X")), _trans.tr.txt("hello", 1), _trans.tr.txt("goodbye", 2).del("2-6", "2-3"), (0, _build.doc)((0, _build.p)("Xhello<1>Xgbye<2>X")));

rebase("double_remove", (0, _build.doc)((0, _build.p)("a"), "<1>", (0, _build.p)("b"), "<2>", (0, _build.p)("c")), _trans.tr.del(1, 2), _trans.tr.del(1, 2), (0, _build.doc)((0, _build.p)("a"), "<1><2>", (0, _build.p)("c")));

rebase$("edit_in_removed", (0, _build.doc)((0, _build.p)("a"), "<1>", (0, _build.p)("b<2>"), "<3>", (0, _build.p)("c")), _trans.tr.del(1, 3), _trans.tr.txt("ay", 2), (0, _build.doc)((0, _build.p)("a"), "<1><3>", (0, _build.p)("c")));

rebase("double_insert", (0, _build.doc)((0, _build.p)("a"), "<1>", (0, _build.p)("b")), _trans.tr.ins("paragraph", 1), _trans.tr.ins("paragraph", 1), (0, _build.doc)((0, _build.p)("a"), (0, _build.p)(), (0, _build.p)(), "<1>", (0, _build.p)("b")));