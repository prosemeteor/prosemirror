"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.toMarkdown = toMarkdown;

var _model = require("../model");

var _format = require("../format");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// :: (Node, ?Object) → string
// Serialize the content of the given node to [CommonMark](http://commonmark.org/).
//
// To define serialization behavior for your own [node
// types](#NodeType), give them a `serializeMarkDown` method. It will
// be called with a `MarkdownSerializer` and a `Node`, and should
// update the serializer's state to add the content of the node.
//
// [Mark types](#MarkType) can define `openMarkdown` and
// `closeMarkdown` properties, which provide the markup text that
// marked content should be wrapped in. They may hold either a string
// or a function from a `MarkdownSerializer` and a `Mark` to a string.
function toMarkdown(doc, options) {
  var state = new MarkdownSerializer(options);
  state.renderContent(doc);
  return state.out;
}

(0, _format.defineTarget)("markdown", toMarkdown);

// ;; This is an object used to track state and expose
// methods related to markdown serialization. Instances are passed to
// node and mark serialization methods (see `toMarkdown`).

var MarkdownSerializer = function () {
  function MarkdownSerializer(options) {
    _classCallCheck(this, MarkdownSerializer);

    this.delim = this.out = "";
    this.closed = false;
    this.inTightList = false;
    // :: Object
    // The options passed to the serializer. The following are supported:
    //
    // **`hardBreak`**: ?string
    //   : Markdown to use for hard line breaks. Defaults to a backslash
    //     followed by a newline.
    this.options = options || {};
  }

  _createClass(MarkdownSerializer, [{
    key: "flushClose",
    value: function flushClose(size) {
      if (this.closed) {
        if (!this.atBlank()) this.out += "\n";
        if (size == null) size = 2;
        if (size > 1) {
          var delimMin = this.delim;
          var trim = /\s+$/.exec(delimMin);
          if (trim) delimMin = delimMin.slice(0, delimMin.length - trim[0].length);
          for (var i = 1; i < size; i++) {
            this.out += delimMin + "\n";
          }
        }
        this.closed = false;
      }
    }

    // :: (string, ?string, Node, ())
    // Render a block, prefixing each line with `delim`, and the first
    // line in `firstDelim`. `node` should be the node that is closed at
    // the end of the block, and `f` is a function that renders the
    // content of the block.

  }, {
    key: "wrapBlock",
    value: function wrapBlock(delim, firstDelim, node, f) {
      var old = this.delim;
      this.write(firstDelim || delim);
      this.delim += delim;
      f();
      this.delim = old;
      this.closeBlock(node);
    }
  }, {
    key: "atBlank",
    value: function atBlank() {
      return (/(^|\n)$/.test(this.out)
      );
    }

    // :: ()
    // Ensure the current content ends with a newline.

  }, {
    key: "ensureNewLine",
    value: function ensureNewLine() {
      if (!this.atBlank()) this.out += "\n";
    }

    // :: (?string)
    // Prepare the state for writing output (closing closed paragraphs,
    // adding delimiters, and so on), and then optionally add content
    // (unescaped) to the output.

  }, {
    key: "write",
    value: function write(content) {
      this.flushClose();
      if (this.delim && this.atBlank()) this.out += this.delim;
      if (content) this.out += content;
    }

    // :: (Node)
    // Close the block for the given node.

  }, {
    key: "closeBlock",
    value: function closeBlock(node) {
      this.closed = node;
    }

    // :: (string, ?bool)
    // Add the given text to the document. When escape is not `false`,
    // it will be escaped.

  }, {
    key: "text",
    value: function text(_text, escape) {
      var lines = _text.split("\n");
      for (var i = 0; i < lines.length; i++) {
        var startOfLine = this.atBlank() || this.closed;
        this.write();
        this.out += escape !== false ? this.esc(lines[i], startOfLine) : lines[i];
        if (i != lines.length - 1) this.out += "\n";
      }
    }

    // :: (Node)
    // Render the given node as a block.

  }, {
    key: "render",
    value: function render(node) {
      node.type.serializeMarkdown(this, node);
    }

    // :: (Node)
    // Render the contents of `parent` as block nodes.

  }, {
    key: "renderContent",
    value: function renderContent(parent) {
      var _this = this;

      parent.forEach(function (child) {
        return _this.render(child);
      });
    }

    // :: (Node)
    // Render the contents of `parent` as inline content.

  }, {
    key: "renderInline",
    value: function renderInline(parent) {
      var _this2 = this;

      var active = [];
      var progress = function progress(node) {
        var marks = node ? node.marks : [];
        var code = marks.length && marks[marks.length - 1].type.isCode && marks[marks.length - 1];
        var len = marks.length - (code ? 1 : 0);

        // Try to reorder 'mixable' marks, such as em and strong, which
        // in Markdown may be opened and closed in different order, so
        // that order of the marks for the token matches the order in
        // active.
        outer: for (var i = 0; i < len; i++) {
          var mark = marks[i];
          if (!mark.type.markdownMixable) break;
          for (var j = 0; j < active.length; j++) {
            var other = active[j];
            if (!other.type.markdownMixable) break;
            if (mark.eq(other)) {
              if (i > j) marks = marks.slice(0, j).concat(mark).concat(marks.slice(j, i)).concat(marks.slice(i + 1, len));else if (j > i) marks = marks.slice(0, i).concat(marks.slice(i + 1, j)).concat(mark).concat(marks.slice(j, len));
              continue outer;
            }
          }
        }

        // Find the prefix of the mark set that didn't change
        var keep = 0;
        while (keep < Math.min(active.length, len) && marks[keep].eq(active[keep])) {
          ++keep;
        } // Close the marks that need to be closed
        while (keep < active.length) {
          _this2.text(_this2.markString(active.pop(), false), false);
        } // Open the marks that need to be opened
        while (active.length < len) {
          var add = marks[active.length];
          active.push(add);
          _this2.text(_this2.markString(add, true), false);
        }

        // Render the node. Special case code marks, since their content
        // may not be escaped.
        if (node) {
          if (code && node.isText) _this2.text(_this2.markString(code, false) + node.text + _this2.markString(code, true), false);else _this2.render(node);
        }
      };
      parent.forEach(progress);
      progress(null);
    }
  }, {
    key: "renderList",
    value: function renderList(node, delim, firstDelim) {
      var _this3 = this;

      if (this.closed && this.closed.type == node.type) this.flushClose(3);else if (this.inTightList) this.flushClose(1);

      var prevTight = this.inTightList;
      this.inTightList = node.attrs.tight;

      var _loop = function _loop(i) {
        if (i && node.attrs.tight) _this3.flushClose(1);
        _this3.wrapBlock(delim, firstDelim(i), node, function () {
          return _this3.render(node.child(i));
        });
      };

      for (var i = 0; i < node.childCount; i++) {
        _loop(i);
      }
      this.inTightList = prevTight;
    }

    // :: (string, ?bool) → string
    // Escape the given string so that it can safely appear in Markdown
    // content. If `startOfLine` is true, also escape characters that
    // has special meaning only at the start of the line.

  }, {
    key: "esc",
    value: function esc(str, startOfLine) {
      str = str.replace(/[`*\\~+\[\]]/g, "\\$&");
      if (startOfLine) str = str.replace(/^[:#-*]/, "\\$&").replace(/^(\d+)\./, "$1\\.");
      return str;
    }
  }, {
    key: "quote",
    value: function quote(str) {
      var wrap = str.indexOf('"') == -1 ? '""' : str.indexOf("'") == -1 ? "''" : "()";
      return wrap[0] + str + wrap[1];
    }

    // :: (string, number) → string
    // Repeat the given string `n` times.

  }, {
    key: "repeat",
    value: function repeat(str, n) {
      var out = "";
      for (var i = 0; i < n; i++) {
        out += str;
      }return out;
    }

    // : (Mark, bool) → string
    // Get the markdown string for a given opening or closing mark.

  }, {
    key: "markString",
    value: function markString(mark, open) {
      var value = open ? mark.type.openMarkdown : mark.type.closeMarkdown;
      return typeof value == "string" ? value : value(this, mark);
    }
  }]);

  return MarkdownSerializer;
}();

function def(cls, method) {
  cls.prototype.serializeMarkdown = method;
}

def(_model.BlockQuote, function (state, node) {
  state.wrapBlock("> ", null, node, function () {
    return state.renderContent(node);
  });
});

def(_model.CodeBlock, function (state, node) {
  if (node.attrs.params == null) {
    state.wrapBlock("    ", null, node, function () {
      return state.text(node.textContent, false);
    });
  } else {
    state.write("```" + node.attrs.params + "\n");
    state.text(node.textContent, false);
    state.ensureNewLine();
    state.write("```");
    state.closeBlock(node);
  }
});

def(_model.Heading, function (state, node) {
  state.write(state.repeat("#", node.attrs.level) + " ");
  state.renderInline(node);
  state.closeBlock(node);
});

def(_model.HorizontalRule, function (state, node) {
  state.write(node.attrs.markup || "---");
  state.closeBlock(node);
});

def(_model.BulletList, function (state, node) {
  state.renderList(node, "  ", function () {
    return (node.attrs.bullet || "*") + " ";
  });
});

def(_model.OrderedList, function (state, node) {
  var start = node.attrs.order || 1;
  var maxW = String(start + node.childCount - 1).length;
  var space = state.repeat(" ", maxW + 2);
  state.renderList(node, space, function (i) {
    var nStr = String(start + i);
    return state.repeat(" ", maxW - nStr.length) + nStr + ". ";
  });
});

def(_model.ListItem, function (state, node) {
  return state.renderContent(node);
});

def(_model.Paragraph, function (state, node) {
  state.renderInline(node);
  state.closeBlock(node);
});

// Inline nodes

def(_model.Image, function (state, node) {
  state.write("![" + state.esc(node.attrs.alt || "") + "](" + state.esc(node.attrs.src) + (node.attrs.title ? " " + state.quote(node.attrs.title) : "") + ")");
});

var defaultHardBreak = "\\\n";

def(_model.HardBreak, function (state) {
  return state.write(state.options.hardBreak || defaultHardBreak);
});

def(_model.Text, function (state, node) {
  return state.text(node.text);
});

// Marks

_model.EmMark.prototype.openMarkdown = _model.EmMark.prototype.closeMarkdown = "*";
_model.EmMark.prototype.markdownMixable = true;

_model.StrongMark.prototype.openMarkdown = _model.StrongMark.prototype.closeMarkdown = "**";
_model.StrongMark.prototype.markdownMixable = true;

_model.LinkMark.prototype.openMarkdown = "[";
_model.LinkMark.prototype.closeMarkdown = function (state, mark) {
  return "](" + state.esc(mark.attrs.href) + (mark.attrs.title ? " " + state.quote(mark.attrs.title) : "") + ")";
};

_model.CodeMark.prototype.openMarkdown = _model.CodeMark.prototype.closeMarkdown = "`";