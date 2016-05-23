"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ReplaceWrapStep = exports.ReplaceStep = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _model = require("../model");

var _step = require("./step");

var _map = require("./map");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// ;; Replace a part of the document with a slice of new content.

var ReplaceStep = exports.ReplaceStep = function (_Step) {
  _inherits(ReplaceStep, _Step);

  // :: (number, number, Slice, bool)
  // The given `slice` should fit the 'gap' between `from` and
  // `to`—the depths must line up, and the surrounding nodes must be
  // able to be joined with the open sides of the slice. When
  // `structure` is true, the step will fail if the content between
  // from and to is not just a sequence of closing and then opening
  // tokens (this is to guard against rebased replace steps
  // overwriting something they weren't supposed to).

  function ReplaceStep(from, to, slice, structure) {
    _classCallCheck(this, ReplaceStep);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(ReplaceStep).call(this));

    _this.from = from;
    _this.to = to;
    _this.slice = slice;
    _this.structure = !!structure;
    return _this;
  }

  _createClass(ReplaceStep, [{
    key: "apply",
    value: function apply(doc) {
      if (this.structure && contentBetween(doc, this.from, this.to)) return _step.StepResult.fail("Structure replace would overwrite content");
      return _step.StepResult.fromReplace(doc, this.from, this.to, this.slice);
    }
  }, {
    key: "posMap",
    value: function posMap() {
      return new _map.PosMap([this.from, this.to - this.from, this.slice.size]);
    }
  }, {
    key: "invert",
    value: function invert(doc) {
      return new ReplaceStep(this.from, this.from + this.slice.size, doc.slice(this.from, this.to));
    }
  }, {
    key: "map",
    value: function map(mapping) {
      var from = mapping.mapResult(this.from, 1),
          to = mapping.mapResult(this.to, -1);
      if (from.deleted && to.deleted) return null;
      return new ReplaceStep(from.pos, Math.max(from.pos, to.pos), this.slice);
    }
  }], [{
    key: "fromJSON",
    value: function fromJSON(schema, json) {
      return new ReplaceStep(json.from, json.to, _model.Slice.fromJSON(schema, json.slice));
    }
  }]);

  return ReplaceStep;
}(_step.Step);

_step.Step.register("replace", ReplaceStep);

// ;; Replace a part of the document with a slice of content, but
// preserve a range of the replaced content by moving it into the
// slice.

var ReplaceWrapStep = exports.ReplaceWrapStep = function (_Step2) {
  _inherits(ReplaceWrapStep, _Step2);

  // :: (number, number, number, number, Slice, number, bool)
  // Create a replace-wrap step with the given range and gap. `inset`
  // should be the point in the slice into which the gap should be
  // moved. `structure` has the same meaning as it has in the
  // `Replace` step.

  function ReplaceWrapStep(from, to, gapFrom, gapTo, slice, insert, structure) {
    _classCallCheck(this, ReplaceWrapStep);

    var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(ReplaceWrapStep).call(this));

    _this2.from = from;
    _this2.to = to;
    _this2.gapFrom = gapFrom;
    _this2.gapTo = gapTo;
    _this2.slice = slice;
    _this2.insert = insert;
    _this2.structure = !!structure;
    return _this2;
  }

  _createClass(ReplaceWrapStep, [{
    key: "apply",
    value: function apply(doc) {
      if (this.structure && (contentBetween(doc, this.from, this.gapFrom) || contentBetween(doc, this.gapTo, this.to))) return _step.StepResult.fail("Structure gap-replace would overwrite content");

      var gap = doc.slice(this.gapFrom, this.gapTo);
      if (gap.openLeft || gap.openRight) return _step.StepResult.fail("Gap is not a flat range");
      var inserted = this.slice.insertAt(this.insert, gap.content);
      if (!inserted) return _step.StepResult.fail("Content does not fit in gap");
      return _step.StepResult.fromReplace(doc, this.from, this.to, inserted);
    }
  }, {
    key: "posMap",
    value: function posMap() {
      return new _map.PosMap([this.from, this.gapFrom - this.from, this.insert, this.gapTo, this.to - this.gapTo, this.slice.size - this.insert]);
    }
  }, {
    key: "invert",
    value: function invert(doc) {
      var gap = this.gapTo - this.gapFrom;
      return new ReplaceWrapStep(this.from, this.from + this.slice.size + gap, this.from + this.insert, this.from + this.insert + gap, doc.slice(this.from, this.to).removeBetween(this.gapFrom - this.from, this.gapTo - this.from), this.gapFrom - this.from, this.structure);
    }
  }, {
    key: "map",
    value: function map(mapping) {
      var from = mapping.mapResult(this.from, 1),
          to = mapping.mapResult(this.to, -1);
      var gapFrom = mapping.map(this.gapFrom, -1),
          gapTo = mapping.map(this.gapTo, 1);
      if (from.deleted && to.deleted || gapFrom < from.pos || gapTo > to.pos) return null;
      return new ReplaceWrapStep(from.pos, to.pos, gapFrom, gapTo, this.slice, this.insert, this.structure);
    }
  }], [{
    key: "fromJSON",
    value: function fromJSON(schema, json) {
      return new ReplaceWrapStep(json.from, json.to, json.gapFrom, json.gapTo, _model.Slice.fromJSON(schema, json.slice), json.insert, json.structure);
    }
  }]);

  return ReplaceWrapStep;
}(_step.Step);

_step.Step.register("replaceWrap", ReplaceWrapStep);

function contentBetween(doc, from, to) {
  var $from = doc.resolve(from),
      dist = to - from,
      depth = $from.depth;
  while (dist > 0 && depth > 0 && $from.indexAfter(depth) == $from.node(depth).childCount) {
    depth--;
    dist--;
  }
  if (dist > 0) {
    var next = $from.node(depth).maybeChild($from.indexAfter(depth));
    while (dist > 0) {
      if (!next || next.type.isLeaf) return true;
      next = next.firstChild;
      dist--;
    }
  }
  return false;
}