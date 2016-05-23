"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _register = require("./register");

Object.defineProperty(exports, "serializeTo", {
  enumerable: true,
  get: function get() {
    return _register.serializeTo;
  }
});
Object.defineProperty(exports, "knownTarget", {
  enumerable: true,
  get: function get() {
    return _register.knownTarget;
  }
});
Object.defineProperty(exports, "defineTarget", {
  enumerable: true,
  get: function get() {
    return _register.defineTarget;
  }
});
Object.defineProperty(exports, "parseFrom", {
  enumerable: true,
  get: function get() {
    return _register.parseFrom;
  }
});
Object.defineProperty(exports, "knownSource", {
  enumerable: true,
  get: function get() {
    return _register.knownSource;
  }
});
Object.defineProperty(exports, "defineSource", {
  enumerable: true,
  get: function get() {
    return _register.defineSource;
  }
});

var _from_dom = require("./from_dom");

Object.defineProperty(exports, "fromDOM", {
  enumerable: true,
  get: function get() {
    return _from_dom.fromDOM;
  }
});
Object.defineProperty(exports, "fromHTML", {
  enumerable: true,
  get: function get() {
    return _from_dom.fromHTML;
  }
});

var _to_dom = require("./to_dom");

Object.defineProperty(exports, "toDOM", {
  enumerable: true,
  get: function get() {
    return _to_dom.toDOM;
  }
});
Object.defineProperty(exports, "toHTML", {
  enumerable: true,
  get: function get() {
    return _to_dom.toHTML;
  }
});
Object.defineProperty(exports, "nodeToDOM", {
  enumerable: true,
  get: function get() {
    return _to_dom.nodeToDOM;
  }
});

var _from_text = require("./from_text");

Object.defineProperty(exports, "fromText", {
  enumerable: true,
  get: function get() {
    return _from_text.fromText;
  }
});

var _to_text = require("./to_text");

Object.defineProperty(exports, "toText", {
  enumerable: true,
  get: function get() {
    return _to_text.toText;
  }
});