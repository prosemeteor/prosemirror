"use strict";

var _model = require("../model");

var _transform = require("./transform");

var _mark_step = require("./mark_step");

var _replace_step = require("./replace_step");

// :: (number, number, Mark) → Transform
// Add the given mark to the inline content between `from` and `to`.
_transform.Transform.prototype.addMark = function (from, to, mark) {
  var _this = this;

  var removed = [],
      added = [],
      removing = null,
      adding = null;
  this.doc.nodesBetween(from, to, function (node, pos, parent, index) {
    if (!node.isInline) return;
    var marks = node.marks;
    if (mark.isInSet(marks) || !parent.contentMatchAt(index + 1).allowsMark(mark.type)) {
      adding = removing = null;
    } else {
      var start = Math.max(pos, from),
          end = Math.min(pos + node.nodeSize, to);
      var rm = mark.type.isInSet(marks);

      if (!rm) removing = null;else if (removing && removing.mark.eq(rm)) removing.to = end;else removed.push(removing = new _mark_step.RemoveMarkStep(start, end, rm));

      if (adding) adding.to = end;else added.push(adding = new _mark_step.AddMarkStep(start, end, mark));
    }
  });

  removed.forEach(function (s) {
    return _this.step(s);
  });
  added.forEach(function (s) {
    return _this.step(s);
  });
  return this;
};

// :: (number, number, ?union<Mark, MarkType>) → Transform
// Remove the given mark, or all marks of the given type, from inline
// nodes between `from` and `to`.
_transform.Transform.prototype.removeMark = function (from, to) {
  var _this2 = this;

  var mark = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

  var matched = [],
      step = 0;
  this.doc.nodesBetween(from, to, function (node, pos) {
    if (!node.isInline) return;
    step++;
    var toRemove = null;
    if (mark instanceof _model.MarkType) {
      var found = mark.isInSet(node.marks);
      if (found) toRemove = [found];
    } else if (mark) {
      if (mark.isInSet(node.marks)) toRemove = [mark];
    } else {
      toRemove = node.marks;
    }
    if (toRemove && toRemove.length) {
      var end = Math.min(pos + node.nodeSize, to);
      for (var i = 0; i < toRemove.length; i++) {
        var style = toRemove[i],
            _found = void 0;
        for (var j = 0; j < matched.length; j++) {
          var m = matched[j];
          if (m.step == step - 1 && style.eq(matched[j].style)) _found = m;
        }
        if (_found) {
          _found.to = end;
          _found.step = step;
        } else {
          matched.push({ style: style, from: Math.max(pos, from), to: end, step: step });
        }
      }
    }
  });
  matched.forEach(function (m) {
    return _this2.step(new _mark_step.RemoveMarkStep(m.from, m.to, m.style));
  });
  return this;
};

// :: (number, number) → Transform
// Remove all marks and non-text inline nodes from the given range.
_transform.Transform.prototype.clearMarkup = function (from, to) {
  var _this3 = this;

  var delSteps = []; // Must be accumulated and applied in inverse order
  this.doc.nodesBetween(from, to, function (node, pos) {
    if (!node.isInline) return;
    if (!node.type.isText) {
      delSteps.push(new _replace_step.ReplaceStep(pos, pos + node.nodeSize, _model.Slice.empty));
      return;
    }
    for (var i = 0; i < node.marks.length; i++) {
      _this3.step(new _mark_step.RemoveMarkStep(Math.max(pos, from), Math.min(pos + node.nodeSize, to), node.marks[i]));
    }
  });
  for (var i = delSteps.length - 1; i >= 0; i--) {
    this.step(delSteps[i]);
  }return this;
};

_transform.Transform.prototype.clearMarkupFor = function (pos, newType, newAttrs) {
  var node = this.doc.nodeAt(pos),
      match = newType.contentExpr.start(newAttrs);
  var delSteps = [];
  for (var i = 0, cur = pos + 1; i < node.childCount; i++) {
    var child = node.child(i),
        end = cur + child.nodeSize;
    var allowed = match.matchType(child.type, child.attrs, []);
    if (!allowed) {
      delSteps.push(new _replace_step.ReplaceStep(cur, end, _model.Slice.empty));
    } else {
      match = allowed;
      for (var j = 0; j < child.marks.length; j++) {
        if (!match.allowsMark(child.marks[j])) this.step(new _mark_step.RemoveMarkStep(cur, end, child.marks[j]));
      }
    }
    cur = end;
  }
  for (var _i = delSteps.length - 1; _i >= 0; _i--) {
    this.step(delSteps[_i]);
  }return this;
};