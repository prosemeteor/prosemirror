"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.tr = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.testTransform = testTransform;

var _transform = require("../transform");

var _model = require("../model");

var _cmp = require("./cmp");

var _failure = require("./failure");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function tag(tr, name) {
  var calc = /^(.*)([+-]\d+)$/.exec(name),
      extra = 0;
  if (calc) {
    name = calc[1];extra = +calc[2];
  }
  var pos = tr.before.tag[name];
  if (pos == null) return undefined;
  return tr.map(pos) + extra;
}

function mrk(tr, mark) {
  return mark && (typeof mark == "string" ? tr.doc.type.schema.mark(mark) : mark);
}

var DelayedTransform = function () {
  function DelayedTransform(steps) {
    _classCallCheck(this, DelayedTransform);

    this.steps = steps;
  }

  _createClass(DelayedTransform, [{
    key: "plus",
    value: function plus(f) {
      return new DelayedTransform(this.steps.concat(f));
    }
  }, {
    key: "addMark",
    value: function addMark(mark, from, to) {
      return this.plus(function (tr) {
        return tr.addMark(tag(tr, from || "a"), tag(tr, to || "b"), mrk(tr, mark));
      });
    }
  }, {
    key: "rmMark",
    value: function rmMark(mark, from, to) {
      return this.plus(function (tr) {
        return tr.removeMark(tag(tr, from || "a"), tag(tr, to || "b"), mrk(tr, mark));
      });
    }
  }, {
    key: "ins",
    value: function ins(nodes, at) {
      return this.plus(function (tr) {
        return tr.insert(tag(tr, at || "a"), typeof nodes == "string" ? tr.doc.type.schema.node(nodes) : nodes);
      });
    }
  }, {
    key: "del",
    value: function del(from, to) {
      return this.plus(function (tr) {
        return tr.delete(tag(tr, from || "a"), tag(tr, to || "b"));
      });
    }
  }, {
    key: "txt",
    value: function txt(text, at) {
      return this.plus(function (tr) {
        return tr.insertText(tag(tr, at || "a"), text);
      });
    }
  }, {
    key: "join",
    value: function join(at) {
      return this.plus(function (tr) {
        return tr.join(tag(tr, at || "a"));
      });
    }
  }, {
    key: "split",
    value: function split(at, depth, type, attrs) {
      return this.plus(function (tr) {
        return tr.split(tag(tr, at || "a"), depth, type && tr.doc.type.schema.nodeType(type), attrs);
      });
    }
  }, {
    key: "lift",
    value: function lift(from, to) {
      return this.plus(function (tr) {
        return tr.lift(tag(tr, from || "a"), tag(tr, to || "b"));
      });
    }
  }, {
    key: "wrap",
    value: function wrap(type, attrs, from, to) {
      return this.plus(function (tr) {
        return tr.wrap(tag(tr, from || "a"), tag(tr, to || "b"), tr.doc.type.schema.nodeType(type), attrs);
      });
    }
  }, {
    key: "blockType",
    value: function blockType(type, attrs, from, to) {
      return this.plus(function (tr) {
        return tr.setBlockType(tag(tr, from || "a"), tag(tr, to || "b"), tr.doc.type.schema.nodeType(type), attrs);
      });
    }
  }, {
    key: "nodeType",
    value: function nodeType(type, attrs, at) {
      return this.plus(function (tr) {
        return tr.setNodeType(tag(tr, at || "a"), tr.doc.type.schema.nodeType(type), attrs);
      });
    }
  }, {
    key: "repl",
    value: function repl(slice, from, to) {
      return this.plus(function (tr) {
        var s = slice instanceof _model.Node ? slice.slice(slice.tag.a, slice.tag.b) : slice;
        tr.replace(tag(tr, from || "a"), tag(tr, to || "b"), s);
      });
    }
  }, {
    key: "get",
    value: function get(doc) {
      var tr = new _transform.Transform(doc);
      for (var i = 0; i < this.steps.length; i++) {
        this.steps[i](tr);
      }return tr;
    }
  }]);

  return DelayedTransform;
}();

var tr = exports.tr = new DelayedTransform([]);

function invert(transform) {
  var out = new _transform.Transform(transform.doc);
  for (var i = transform.steps.length - 1; i >= 0; i--) {
    out.step(transform.steps[i].invert(transform.docs[i]));
  }return out;
}

function testMapping(maps, pos, newPos, label) {
  var mapped = pos;
  maps.forEach(function (m) {
    return mapped = m.map(mapped, 1);
  });
  (0, _cmp.cmpStr)(mapped, newPos, label);

  var remap = new _transform.Remapping();
  for (var i = maps.length - 1; i >= 0; i--) {
    var id = remap.addToFront(maps[i]);
    remap.addToBack(maps[i].invert(), id);
  }
  (0, _cmp.cmpStr)(remap.map(pos, 1), pos, label + " round trip");
}

function testStepJSON(tr) {
  var newTR = new _transform.Transform(tr.before);
  tr.steps.forEach(function (step) {
    return newTR.step(_transform.Step.fromJSON(tr.doc.type.schema, step.toJSON()));
  });
  (0, _cmp.cmpNode)(tr.doc, newTR.doc);
}

function testTransform(delayedTr, doc, expect) {
  var tr = void 0;
  try {
    tr = delayedTr.get(doc);
  } catch (e) {
    if (!(e instanceof _transform.TransformError)) throw e;
    if (expect != "fail") throw new _failure.Failure("Transform failed unexpectedly: " + e);
    return;
  }
  if (expect == "fail") throw new _failure.Failure("Transform succeeded unexpectedly");

  (0, _cmp.cmpNode)(tr.doc, expect);
  (0, _cmp.cmpNode)(invert(tr).doc, tr.before, "inverted");

  testStepJSON(tr);

  var maps = tr.maps;
  for (var tag in expect.tag) {
    // FIXME Babel 6.5.1 screws this up when I use let
    testMapping(maps, tr.before.tag[tag], expect.tag[tag], tag);
  }
}