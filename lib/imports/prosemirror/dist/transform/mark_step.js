"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RemoveMarkStep = exports.AddMarkStep = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _model = require("../model");

var _step = require("./step");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function mapFragment(fragment, f, parent) {
  var mapped = [];
  for (var i = 0; i < fragment.childCount; i++) {
    var child = fragment.child(i);
    if (child.content.size) child = child.copy(mapFragment(child.content, f, child));
    if (child.isInline) child = f(child, parent, i);
    mapped.push(child);
  }
  return _model.Fragment.fromArray(mapped);
}

// ;; Add a mark to all inline content between two positions.

var AddMarkStep = exports.AddMarkStep = function (_Step) {
  _inherits(AddMarkStep, _Step);

  // :: (number, number, Mark)

  function AddMarkStep(from, to, mark) {
    _classCallCheck(this, AddMarkStep);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(AddMarkStep).call(this));

    _this.from = from;
    _this.to = to;
    _this.mark = mark;
    return _this;
  }

  _createClass(AddMarkStep, [{
    key: "apply",
    value: function apply(doc) {
      var _this2 = this;

      var oldSlice = doc.slice(this.from, this.to);
      var slice = new _model.Slice(mapFragment(oldSlice.content, function (node, parent, index) {
        if (!parent.contentMatchAt(index + 1).allowsMark(_this2.mark.type)) return node;
        return node.mark(_this2.mark.addToSet(node.marks));
      }, oldSlice.possibleParent), oldSlice.openLeft, oldSlice.openRight);
      return _step.StepResult.fromReplace(doc, this.from, this.to, slice);
    }
  }, {
    key: "invert",
    value: function invert() {
      return new RemoveMarkStep(this.from, this.to, this.mark);
    }
  }, {
    key: "map",
    value: function map(mapping) {
      var from = mapping.mapResult(this.from, 1),
          to = mapping.mapResult(this.to, -1);
      if (from.deleted && to.deleted || from.pos >= to.pos) return null;
      return new AddMarkStep(from.pos, to.pos, this.mark);
    }
  }], [{
    key: "fromJSON",
    value: function fromJSON(schema, json) {
      return new AddMarkStep(json.from, json.to, schema.markFromJSON(json.mark));
    }
  }]);

  return AddMarkStep;
}(_step.Step);

_step.Step.register("addMark", AddMarkStep);

// ;; Remove a mark from all inline content between two positions.

var RemoveMarkStep = exports.RemoveMarkStep = function (_Step2) {
  _inherits(RemoveMarkStep, _Step2);

  // :: (number, number, Mark)

  function RemoveMarkStep(from, to, mark) {
    _classCallCheck(this, RemoveMarkStep);

    var _this3 = _possibleConstructorReturn(this, Object.getPrototypeOf(RemoveMarkStep).call(this));

    _this3.from = from;
    _this3.to = to;
    _this3.mark = mark;
    return _this3;
  }

  _createClass(RemoveMarkStep, [{
    key: "apply",
    value: function apply(doc) {
      var _this4 = this;

      var oldSlice = doc.slice(this.from, this.to);
      var slice = new _model.Slice(mapFragment(oldSlice.content, function (node) {
        return node.mark(_this4.mark.removeFromSet(node.marks));
      }), oldSlice.openLeft, oldSlice.openRight);
      return _step.StepResult.fromReplace(doc, this.from, this.to, slice);
    }
  }, {
    key: "invert",
    value: function invert() {
      return new AddMarkStep(this.from, this.to, this.mark);
    }
  }, {
    key: "map",
    value: function map(mapping) {
      var from = mapping.mapResult(this.from, 1),
          to = mapping.mapResult(this.to, -1);
      if (from.deleted && to.deleted || from.pos >= to.pos) return null;
      return new RemoveMarkStep(from.pos, to.pos, this.mark);
    }
  }], [{
    key: "fromJSON",
    value: function fromJSON(schema, json) {
      return new RemoveMarkStep(json.from, json.to, schema.markFromJSON(json.mark));
    }
  }]);

  return RemoveMarkStep;
}(_step.Step);

_step.Step.register("removeMark", RemoveMarkStep);