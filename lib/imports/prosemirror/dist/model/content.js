"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ContentMatch = exports.ContentExpr = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fragment = require("./fragment");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ContentExpr = exports.ContentExpr = function () {
  function ContentExpr(nodeType, elements) {
    _classCallCheck(this, ContentExpr);

    this.nodeType = nodeType;
    this.elements = elements;
  }

  _createClass(ContentExpr, [{
    key: "start",
    value: function start(attrs) {
      return new ContentMatch(this, attrs, 0, 0);
    }
  }, {
    key: "matches",
    value: function matches(attrs, fragment, from, to) {
      return this.start(attrs).matchToEnd(fragment, from, to);
    }

    // Get a position in a known-valid fragment. If this is a simple
    // (single-element) expression, we don't have to do any matching,
    // and can simply skip to the position with count `index`.

  }, {
    key: "getMatchAt",
    value: function getMatchAt(attrs, fragment) {
      var index = arguments.length <= 2 || arguments[2] === undefined ? fragment.childCount : arguments[2];

      if (this.elements.length == 1) return new ContentMatch(this, attrs, 0, index);else return this.start(attrs).matchFragment(fragment, 0, index);
    }
  }, {
    key: "checkReplace",
    value: function checkReplace(attrs, content, from, to) {
      var replacement = arguments.length <= 4 || arguments[4] === undefined ? _fragment.Fragment.empty : arguments[4];
      var start = arguments.length <= 5 || arguments[5] === undefined ? 0 : arguments[5];
      var end = arguments.length <= 6 || arguments[6] === undefined ? replacement.childCount : arguments[6];

      // Check for simple case, where the expression only has a single element
      // (Optimization to avoid matching more than we need)
      if (this.elements.length == 1) {
        var elt = this.elements[0];
        if (!checkCount(elt, content.childCount - (to - from) + (end - start), attrs, this)) return false;
        for (var i = start; i < end; i++) {
          if (!elt.matches(replacement.child(i), attrs, this)) return false;
        }return true;
      }

      var match = this.getMatchAt(attrs, content, from).matchFragment(replacement, start, end);
      return match ? match.matchToEnd(content, to) : false;
    }
  }, {
    key: "checkReplaceWith",
    value: function checkReplaceWith(attrs, content, from, to, type, typeAttrs, marks) {
      if (this.elements.length == 1) {
        var elt = this.elements[0];
        if (!checkCount(elt, content.childCount - (to - from) + 1, attrs, this)) return false;
        return elt.matchesType(type, typeAttrs, marks, attrs, this);
      }

      var match = this.getMatchAt(attrs, content, from).matchType(type, typeAttrs, marks);
      return match ? match.matchToEnd(content, to) : false;
    }
  }, {
    key: "compatible",
    value: function compatible(other) {
      for (var i = 0; i < this.elements.length; i++) {
        var elt = this.elements[i];
        for (var j = 0; j < other.elements.length; j++) {
          if (other.elements[j].compatible(elt)) return true;
        }
      }
      return false;
    }
  }, {
    key: "generateContent",
    value: function generateContent(attrs) {
      return this.start(attrs).fillBefore(_fragment.Fragment.empty, true);
    }
  }, {
    key: "isLeaf",
    get: function get() {
      return this.elements.length == 0;
    }
  }], [{
    key: "parse",
    value: function parse(nodeType, expr, groups) {
      var elements = [],
          pos = 0,
          inline = null;
      for (;;) {
        pos += /^\s*/.exec(expr.slice(pos))[0].length;
        if (pos == expr.length) break;

        var types = /^(?:(\w+)|\(\s*(\w+(?:\s*\|\s*\w+)*)\s*\))/.exec(expr.slice(pos));
        if (!types) throw new SyntaxError("Invalid content expression '" + expr + "' at " + pos);
        pos += types[0].length;
        var attrs = /^\[([^\]]+)\]/.exec(expr.slice(pos));
        if (attrs) pos += attrs[0].length;
        var marks = /^<(?:(_)|\s*(\w+(?:\s+\w+)*)\s*)>/.exec(expr.slice(pos));
        if (marks) pos += marks[0].length;
        var repeat = /^(?:([+*?])|\{\s*(\d+|\.\w+)\s*(,\s*(\d+|\.\w+)?)?\s*\})/.exec(expr.slice(pos));
        if (repeat) pos += repeat[0].length;

        var nodeTypes = expandTypes(nodeType.schema, groups, types[1] ? [types[1]] : types[2].split(/\s*\|\s*/));
        for (var i = 0; i < nodeTypes.length; i++) {
          if (inline == null) inline = nodeTypes[i].isInline;else if (inline != nodeTypes[i].isInline) throw new SyntaxError("Mixing inline and block content in a single node");
        }
        var attrSet = !attrs ? null : parseAttrs(nodeType, attrs[1]);
        var markSet = !marks ? false : marks[1] ? true : checkMarks(nodeType.schema, marks[2].split(/\s+/));

        var _parseRepeat = parseRepeat(nodeType, repeat);

        var min = _parseRepeat.min;
        var max = _parseRepeat.max;

        if (min != 0 && nodeTypes[0].hasRequiredAttrs(attrSet)) throw new SyntaxError("Node type " + types[0] + " in type " + nodeType.name + " is required, but has non-optional attributes");
        var newElt = new ContentElement(nodeTypes, attrSet, markSet, min, max);
        for (var _i = elements.length - 1; _i >= 0; _i--) {
          if (elements[_i].overlaps(newElt)) throw new SyntaxError("Overlapping adjacent content expressions in '" + expr + "'");
          if (elements[_i].min != 0) break;
        }
        elements.push(newElt);
      }

      return new ContentExpr(nodeType, elements);
    }
  }]);

  return ContentExpr;
}();

var ContentElement = function () {
  function ContentElement(nodeTypes, attrs, marks, min, max) {
    _classCallCheck(this, ContentElement);

    this.nodeTypes = nodeTypes;
    this.attrs = attrs;
    this.marks = marks;
    this.min = min;
    this.max = max;
  }

  _createClass(ContentElement, [{
    key: "matchesType",
    value: function matchesType(type, attrs, marks, parentAttrs, parentExpr) {
      if (this.nodeTypes.indexOf(type) == -1) return false;
      if (this.attrs) {
        if (!attrs) return false;
        for (var prop in this.attrs) {
          if (attrs[prop] != _resolveValue(this.attrs[prop], parentAttrs, parentExpr)) return false;
        }
      }
      if (this.marks === true) return true;
      if (this.marks === false) return marks.length == 0;
      for (var i = 0; i < marks.length; i++) {
        if (this.marks.indexOf(marks[i].type) == -1) return false;
      }return true;
    }
  }, {
    key: "matches",
    value: function matches(node, parentAttrs, parentExpr) {
      return this.matchesType(node.type, node.attrs, node.marks, parentAttrs, parentExpr);
    }
  }, {
    key: "compatible",
    value: function compatible(other) {
      for (var i = 0; i < this.nodeTypes.length; i++) {
        if (other.nodeTypes.indexOf(this.nodeTypes[i]) != -1) return true;
      }return false;
    }
  }, {
    key: "constrainedAttrs",
    value: function constrainedAttrs(parentAttrs, expr) {
      if (!this.attrs) return null;
      var attrs = Object.create(null);
      for (var prop in this.attrs) {
        attrs[prop] = _resolveValue(this.attrs[prop], parentAttrs, expr);
      }return attrs;
    }
  }, {
    key: "createFiller",
    value: function createFiller(parentAttrs, expr) {
      var type = this.nodeTypes[0],
          attrs = type.computeAttrs(this.constrainedAttrs(parentAttrs, expr));
      return type.create(attrs, type.contentExpr.generateContent(attrs));
    }
  }, {
    key: "defaultType",
    value: function defaultType() {
      return this.nodeTypes[0].defaultAttrs && this.nodeTypes[0];
    }
  }, {
    key: "overlaps",
    value: function overlaps(other) {
      return this.nodeTypes.some(function (t) {
        return other.nodeTypes.indexOf(t) > -1;
      });
    }
  }, {
    key: "allowsMark",
    value: function allowsMark(markType) {
      return this.marks === true || this.marks && this.marks.indexOf(markType) > -1;
    }
  }]);

  return ContentElement;
}();

// ;; Represents a partial match of a node type's [content
// expression](#SchemaSpec.nodes).


var ContentMatch = exports.ContentMatch = function () {
  function ContentMatch(expr, attrs, index, count) {
    _classCallCheck(this, ContentMatch);

    this.expr = expr;
    this.attrs = attrs;
    this.index = index;
    this.count = count;
  }

  _createClass(ContentMatch, [{
    key: "move",
    value: function move(index, count) {
      return new ContentMatch(this.expr, this.attrs, index, count);
    }
  }, {
    key: "resolveValue",
    value: function resolveValue(value) {
      return value instanceof AttrValue ? _resolveValue(value, this.attrs, this.expr) : value;
    }

    // :: (Node) → ?ContentMatch
    // Match a node, returning an updated match if successful.

  }, {
    key: "matchNode",
    value: function matchNode(node) {
      return this.matchType(node.type, node.attrs, node.marks);
    }

    // :: (NodeType, ?Object, [Mark]) → ?ContentMatch
    // Match a node type and marks, returning an updated match if
    // successful.

  }, {
    key: "matchType",
    value: function matchType(type, attrs, marks) {
      // FIXME `var` to work around Babel bug T7293
      for (index = this.index, count = this.count, void 0; index < this.expr.elements.length; index++, count = 0) {
        var index, count;

        var elt = this.expr.elements[index],
            max = this.resolveValue(elt.max);
        if (count < max && elt.matchesType(type, attrs, marks, this.attrs, this.expr)) {
          count++;
          return this.move(index, count);
        }
        if (count < this.resolveValue(elt.min)) return null;
      }
    }

    // :: (Fragment, ?number, ?number) → ?union<ContentMatch, bool>
    // Try to match a fragment. Returns a new match when successful,
    // `null` when it ran into a required element it couldn't fit, and
    // `false` if it reached the end of the expression without
    // matching all nodes.

  }, {
    key: "matchFragment",
    value: function matchFragment(fragment) {
      var from = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
      var to = arguments.length <= 2 || arguments[2] === undefined ? fragment.childCount : arguments[2];

      if (from == to) return this;
      var fragPos = from,
          end = this.expr.elements.length;
      for (index = this.index, count = this.count, void 0; index < end; index++, count = 0) {
        var index, count;

        var elt = this.expr.elements[index],
            max = this.resolveValue(elt.max);

        while (count < max) {
          if (elt.matches(fragment.child(fragPos), this.attrs, this.expr)) {
            count++;
            if (++fragPos == to) return this.move(index, count);
          } else {
            break;
          }
        }
        if (count < this.resolveValue(elt.min)) return null;
      }
      return false;
    }

    // :: (Fragment, ?number, ?number) → bool
    // Returns true only if the fragment matches here, and reaches all
    // the way to the end of the content expression.

  }, {
    key: "matchToEnd",
    value: function matchToEnd(fragment, start, end) {
      var matched = this.matchFragment(fragment, start, end);
      return matched && matched.validEnd() || false;
    }

    // :: () → bool
    // Returns true if this position represents a valid end of the
    // expression (no required content follows after it).

  }, {
    key: "validEnd",
    value: function validEnd() {
      for (var i = this.index, count = this.count; i < this.expr.elements.length; i++, count = 0) {
        if (count < this.resolveValue(this.expr.elements[i].min)) return false;
      }return true;
    }

    // :: (Fragment, bool, ?number) → ?Fragment
    // Try to match the given fragment, and if that fails, see if it can
    // be made to match by inserting nodes in front of it. When
    // successful, return a fragment (which may be empty if nothing had
    // to be inserted). When `toEnd` is true, only return a fragment if
    // the resulting match goes to the end of the content expression.

  }, {
    key: "fillBefore",
    value: function fillBefore(after, toEnd, startIndex) {
      var added = [],
          match = this,
          index = startIndex || 0,
          end = this.expr.elements.length;
      for (;;) {
        var fits = match.matchFragment(after, index);
        if (fits && (!toEnd || fits.validEnd())) return _fragment.Fragment.from(added);
        if (fits === false) return null; // Matched to end with content remaining

        var elt = match.element;
        if (match.count < this.resolveValue(elt.min)) {
          added.push(elt.createFiller(this.attrs, this.expr));
          match = match.move(match.index, match.count + 1);
        } else if (match.index < end) {
          match = match.move(match.index + 1, 0);
        } else if (after.childCount > index) {
          return null;
        } else {
          return _fragment.Fragment.from(added);
        }
      }
    }
  }, {
    key: "possibleContent",
    value: function possibleContent() {
      var found = [];
      for (var i = this.index, count = this.count; i < this.expr.elements.length; i++, count = 0) {
        var elt = this.expr.elements[i],
            attrs = elt.constrainedAttrs(this.attrs, this.expr);
        if (count < this.resolveValue(elt.max)) for (var j = 0; j < elt.nodeTypes.length; j++) {
          var type = elt.nodeTypes[j];
          if (!type.hasRequiredAttrs(attrs)) found.push({ type: type, attrs: attrs });
        }
        if (this.resolveValue(elt.min) > count) break;
      }
      return found;
    }

    // :: (MarkType) → bool
    // Check whether a node with the given mark type is allowed after
    // this position.

  }, {
    key: "allowsMark",
    value: function allowsMark(markType) {
      return this.element.allowsMark(markType);
    }

    // :: (NodeType, ?Object) → ?[{type: NodeType, attrs: Object}]
    // Find a set of wrapping node types that would allow a node of type
    // `type` to appear at this position. The result may be empty (when
    // it fits directly) and will be null when no such wrapping exists.

  }, {
    key: "findWrapping",
    value: function findWrapping(target, targetAttrs) {
      // FIXME find out how expensive this is. Try to reintroduce caching?
      var seen = Object.create(null),
          first = { match: this, via: null },
          active = [first];
      while (active.length) {
        var current = active.shift(),
            match = current.match;
        var possible = match.possibleContent();
        for (var i = 0; i < possible.length; i++) {
          var _possible$i = possible[i];
          var type = _possible$i.type;
          var attrs = _possible$i.attrs;var fullAttrs = type.computeAttrs(attrs);
          if (type == target) {
            var fits = match.matchType(type, targetAttrs, []);
            if (fits && fits.validEnd()) {
              var result = [];
              for (var obj = current; obj.via; obj = obj.via) {
                result.push({ type: obj.match.expr.nodeType, attrs: obj.match.attrs });
              }return result.reverse();
            }
          }
          if (!type.isLeaf && !(type.name in seen) && (current == first || match.matchType(type, fullAttrs, []).validEnd())) {
            active.push({ match: type.contentExpr.start(fullAttrs), via: current });
            seen[type.name] = true;
          }
        }
      }
    }
  }, {
    key: "element",
    get: function get() {
      return this.expr.elements[this.index];
    }
  }]);

  return ContentMatch;
}();

var AttrValue = function AttrValue(attr) {
  _classCallCheck(this, AttrValue);

  this.attr = attr;
};

function parseValue(nodeType, value) {
  if (value.charAt(0) == ".") {
    var attr = value.slice(1);
    if (!nodeType.attrs[attr]) throw new SyntaxError("Node type " + nodeType.name + " has no attribute " + attr);
    return new AttrValue(attr);
  } else {
    return JSON.parse(value);
  }
}

function checkMarks(schema, marks) {
  var found = [];
  for (var i = 0; i < marks.length; i++) {
    var mark = schema.marks[marks[i]];
    if (mark) found.push(mark);else throw new SyntaxError("Unknown mark type: '" + marks[i] + "'");
  }
  return found;
}

function _resolveValue(value, attrs, expr) {
  if (!(value instanceof AttrValue)) return value;
  var attrVal = attrs && attrs[value.attr];
  return attrVal !== undefined ? attrVal : expr.nodeType.defaultAttrs[value.attr];
}

function checkCount(elt, count, attrs, expr) {
  return count >= _resolveValue(elt.min, attrs, expr) && count <= _resolveValue(elt.max, attrs, expr);
}

function expandTypes(schema, groups, types) {
  var result = [];
  function expand(type) {
    var found = void 0;
    if (found = schema.nodes[type]) result.indexOf(found) == -1 && result.push(found);else if ((found = groups[type]) && found.length) found.forEach(expand);else throw new SyntaxError("Node type or group '" + type + "' does not exist");
  }
  types.forEach(expand);
  return result;
}

var many = 2e9; // Big number representable as a 32-bit int

function parseRepeat(nodeType, match) {
  var min = 1,
      max = 1;
  if (match) {
    if (match[1] == "+") {
      max = many;
    } else if (match[1] == "*") {
      min = 0;
      max = many;
    } else if (match[1] == "?") {
      min = 0;
    } else if (match[2]) {
      min = parseValue(nodeType, match[2]);
      if (match[3]) max = match[4] ? parseValue(nodeType, match[4]) : many;else max = min;
    }
    if (max == 0 || min > max) throw new SyntaxError("Invalid repeat count in '" + match[0] + "'");
  }
  return { min: min, max: max };
}

function parseAttrs(nodeType, expr) {
  var parts = expr.split(/\s*,\s*/);
  var attrs = Object.create(null);
  for (var i = 0; i < parts.length; i++) {
    var match = /^(\w+)=(\w+|\"(?:\\.|[^\\])*\"|\.\w+)$/.exec(parts[i]);
    if (!match) throw new SyntaxError("Invalid attribute syntax: " + parts[i]);
    attrs[match[1]] = parseValue(nodeType, match[2]);
  }
  return attrs;
}