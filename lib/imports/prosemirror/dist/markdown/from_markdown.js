"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.fromMarkdown = fromMarkdown;

var _markdownIt = require("markdown-it");

var _markdownIt2 = _interopRequireDefault(_markdownIt);

var _model = require("../model");

var _format = require("../format");

var _sortedinsert = require("../util/sortedinsert");

var _sortedinsert2 = _interopRequireDefault(_sortedinsert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// :: (Schema, string, ?Object) → Node
// Parse a string as [CommonMark](http://commonmark.org/) markup, and
// create a ProseMirror document corresponding to its meaning. Note
// that, by default, some CommonMark features, namely inline HTML and
// tight lists, are not supported.
function fromMarkdown(schema, text, options) {
  var tokens = configureMarkdown(schema).parse(text, {});
  var state = new MarkdownParseState(schema, tokens, options),
      doc = void 0;
  state.parseTokens(tokens);
  do {
    doc = state.closeNode();
  } while (state.stack.length);
  return doc;
}

// ;; #kind=interface #path=MarkdownParseSpec
// Schema-specific parsing logic can be defined
// [registering](#SchemaItem.register) values with parsing information
// on [mark](#MarkType) and [node](#NodeType) types, using the
// `"parseMarkdown"` namespace.
//
// The name of the registered item should be the
// [markdown-it](https://github.com/markdown-it/markdown-it) token
// name that the parser should respond to,
//
// To influence the way the markdown-it parser is initialized and
// configured, you can register values under the `"configureMarkdown"`
// namespace. An item with the name `"init"` will be called to
// initialize the parser. Items with other names will be called with a
// parser and should return a parser. You could for example configure
// a subscript mark to enable the [subscript
// plugin](https://github.com/markdown-it/markdown-it-sub):
//
//     SubMark.register("configureMarkdown", "sub", parser => {
//       return parser.use(require("markdown-it-sub"))
//     })

// :: union<string, (state: MarkdownParseState, token: MarkdownToken) → Node> #path=MarkdownParseSpec.parse
// The parsing function for this token. It is, when a matching token
// is encountered, passed the parsing state and the token, and must
// return a `Node` if the parsing spec was for a node type, and a
// `Mark` if it was for a mark type.
//
// The function will be called so that `this` is bound to the node or
// mark type instance that the spec was associated with.
//
// As a shorthand, `parse` can be set to a string. You can use
// `"block"` to create a node of the type that this spec was
// associated with, and wrap the content between the open and close
// tokens in this node.
//
// Alternatively, it can be set to `"mark"`, if the spec is associated
// with a [mark type](#MarkType), which will cause the content between
// the opening and closing token to be marked with an instance of that
// mark type.

// :: ?union<Object, (MarkdownParseState, MarkdownToken) → Object> #path=MarkdownParseSpec.attrs
// When `parse` is set to a string, this property can be used to
// specify attributes for the node or mark. It may hold an object or a
// function that, when called with the [parser
// state](#MarkdownParseState) and the token object, returns an
// attribute object.

(0, _format.defineSource)("markdown", fromMarkdown);

var noMarks = [];

function maybeMerge(a, b) {
  if (a.isText && b.isText && _model.Mark.sameSet(a.marks, b.marks)) return a.copy(a.text + b.text);
}

// ;; Object used to track the context of a running parse,
// and to expose parsing-related methods to node-specific parsing
// functions.

var MarkdownParseState = function () {
  function MarkdownParseState(schema, tokens, options) {
    _classCallCheck(this, MarkdownParseState);

    // :: Schema
    // The schema into which we are parsing.
    this.schema = schema;
    this.stack = [{ type: schema.nodes.doc, content: [] }];
    this.tokens = tokens;
    this.marks = noMarks;
    this.tokenTypes = tokenTypeInfo(schema);
    // :: Object
    // The options passed to the parser.
    this.options = options;
  }

  _createClass(MarkdownParseState, [{
    key: "top",
    value: function top() {
      return this.stack[this.stack.length - 1];
    }
  }, {
    key: "push",
    value: function push(elt) {
      if (this.stack.length) this.top().content.push(elt);
    }

    // :: (string)
    // Adds the given text to the current position in the document,
    // using the current marks as styling.

  }, {
    key: "addText",
    value: function addText(text) {
      var nodes = this.top().content,
          last = nodes[nodes.length - 1];
      var node = this.schema.text(text, this.marks),
          merged = void 0;
      if (last && (merged = maybeMerge(last, node))) nodes[nodes.length - 1] = merged;else nodes.push(node);
    }

    // :: (Mark)
    // Adds the given mark to the set of active marks.

  }, {
    key: "openMark",
    value: function openMark(mark) {
      this.marks = mark.addToSet(this.marks);
    }

    // :: (Mark)
    // Removes the given mark from the set of active marks.

  }, {
    key: "closeMark",
    value: function closeMark(mark) {
      this.marks = mark.removeFromSet(this.marks);
    }
  }, {
    key: "parseTokens",
    value: function parseTokens(toks) {
      for (var i = 0; i < toks.length; i++) {
        var tok = toks[i];
        var tokenType = this.tokenTypes[tok.type];
        if (!tokenType) throw new Error("Token type `" + tok.type + "` not supported by Markdown parser");

        tokenType(this, tok);
      }
    }

    // :: (NodeType, ?Object, ?[Node]) → ?Node
    // Add a node at the current position.

  }, {
    key: "addNode",
    value: function addNode(type, attrs, content) {
      content = type.fixContent(_model.Fragment.from(content), attrs);
      if (!content) return null;
      var node = type.create(attrs, content, this.marks);
      this.push(node);
      return node;
    }

    // :: (NodeType, ?Object)
    // Wrap subsequent content in a node of the given type.

  }, {
    key: "openNode",
    value: function openNode(type, attrs) {
      this.stack.push({ type: type, attrs: attrs, content: [] });
    }

    // :: () → ?Node
    // Close and return the node that is currently on top of the stack.

  }, {
    key: "closeNode",
    value: function closeNode() {
      if (this.marks.length) this.marks = noMarks;
      var info = this.stack.pop();
      return this.addNode(info.type, info.attrs, info.content);
    }

    // :: (MarkdownToken, string) → any
    // Retrieve the named attribute from the given token.

  }, {
    key: "getAttr",
    value: function getAttr(tok, name) {
      if (tok.attrs) for (var i = 0; i < tok.attrs.length; i++) {
        if (tok.attrs[i][0] == name) return tok.attrs[i][1];
      }
    }
  }]);

  return MarkdownParseState;
}();

function tokenTypeInfo(schema) {
  return schema.cached.markdownTokens || (schema.cached.markdownTokens = summarizeTokens(schema));
}

function registerTokens(tokens, name, type, info) {
  if (info.parse == "block") {
    tokens[name + "_open"] = function (state, tok) {
      var attrs = typeof info.attrs == "function" ? info.attrs.call(type, state, tok) : info.attrs;
      state.openNode(type, attrs);
    };
    tokens[name + "_close"] = function (state) {
      return state.closeNode();
    };
  } else if (info.parse == "mark") {
    tokens[name + "_open"] = function (state, tok) {
      var attrs = info.attrs instanceof Function ? info.attrs.call(type, state, tok) : info.attrs;
      state.openMark(type.create(attrs));
    };
    tokens[name + "_close"] = function (state) {
      return state.closeMark(type);
    };
  } else if (info.parse) {
    tokens[name] = info.parse.bind(type);
  } else {
    throw new RangeError("Unrecognized markdown parsing spec: " + info);
  }
}

function summarizeTokens(schema) {
  var tokens = Object.create(null);
  tokens.text = function (state, tok) {
    return state.addText(tok.content);
  };
  tokens.inline = function (state, tok) {
    return state.parseTokens(tok.children);
  };
  tokens.softbreak = function (state) {
    return state.addText("\n");
  };

  schema.registry("parseMarkdown", function (name, info, type) {
    registerTokens(tokens, name, type, info);
  });
  return tokens;
}

function configFromSchema(schema) {
  var found = schema.cached.markdownConfig;
  if (!found) {
    (function () {
      var init = null;
      var modifiers = [];
      schema.registry("configureMarkdown", function (name, f) {
        if (name == "init") {
          if (init) throw new RangeError("Two markdown parser initializers defined in schema");
          init = f;
        } else {
          var rank = (/_(\d+)$/.exec(name) || [0, 50])[1];
          (0, _sortedinsert2.default)(modifiers, { f: f, rank: rank }, function (a, b) {
            return a.rank - b.rank;
          });
        }
      });
      found = { init: init || function () {
          return (0, _markdownIt2.default)("commonmark", { html: false });
        }, modifiers: modifiers.map(function (spec) {
          return spec.f;
        }) };
    })();
  }
  return found;
}

function configureMarkdown(schema) {
  var config = configFromSchema(schema);
  var module = config.init();
  config.modifiers.forEach(function (f) {
    return module = f(module);
  });
  return module;
}

_model.BlockQuote.register("parseMarkdown", "blockquote", { parse: "block" });

_model.Paragraph.register("parseMarkdown", "paragraph", { parse: "block" });

_model.ListItem.register("parseMarkdown", "list_item", { parse: "block" });

_model.BulletList.register("parseMarkdown", "bullet_list", { parse: "block" });

_model.OrderedList.register("parseMarkdown", "ordered_list", { parse: "block", attrs: function attrs(state, tok) {
    var order = state.getAttr(tok, "order");
    return { order: order ? +order : 1 };
  } });

_model.Heading.register("parseMarkdown", "heading", { parse: "block", attrs: function attrs(_, tok) {
    return { level: Math.min(this.maxLevel, +tok.tag.slice(1)) };
  } });

function trimTrailingNewline(str) {
  if (str.charAt(str.length - 1) == "\n") return str.slice(0, str.length - 1);
  return str;
}

function parseCodeBlock(state, tok) {
  state.openNode(this);
  state.addText(trimTrailingNewline(tok.content));
  state.closeNode();
}

_model.CodeBlock.register("parseMarkdown", "code_block", { parse: parseCodeBlock });
_model.CodeBlock.register("parseMarkdown", "fence", { parse: parseCodeBlock });

_model.HorizontalRule.register("parseMarkdown", "hr", { parse: function parse(state, tok) {
    state.addNode(this, { markup: tok.markup });
  } });

_model.Image.register("parseMarkdown", "image", { parse: function parse(state, tok) {
    state.addNode(this, { src: state.getAttr(tok, "src"),
      title: state.getAttr(tok, "title") || null,
      alt: tok.children[0] && tok.children[0].content || null });
  } });

_model.HardBreak.register("parseMarkdown", "hardbreak", { parse: function parse(state) {
    state.addNode(this);
  } });

// Inline marks

_model.EmMark.register("parseMarkdown", "em", { parse: "mark" });

_model.StrongMark.register("parseMarkdown", "strong", { parse: "mark" });

_model.LinkMark.register("parseMarkdown", "link", {
  parse: "mark",
  attrs: function attrs(state, tok) {
    return {
      href: state.getAttr(tok, "href"),
      title: state.getAttr(tok, "title") || null
    };
  }
});

_model.CodeMark.register("parseMarkdown", "code_inline", { parse: function parse(state, tok) {
    state.openMark(this.create());
    state.addText(tok.content);
    state.closeMark(this);
  } });