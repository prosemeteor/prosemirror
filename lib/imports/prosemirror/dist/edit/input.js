"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Input = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _model = require("../model");

var _browserkeymap = require("browserkeymap");

var _browserkeymap2 = _interopRequireDefault(_browserkeymap);

var _format = require("../format");

var _capturekeys = require("./capturekeys");

var _dom = require("../dom");

var _domchange = require("./domchange");

var _selection = require("./selection");

var _dompos = require("./dompos");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var stopSeq = null;

// A collection of DOM events that occur within the editor, and callback functions
// to invoke when the event fires.
var handlers = {};

var Input = exports.Input = function () {
  function Input(pm) {
    var _this = this;

    _classCallCheck(this, Input);

    this.pm = pm;
    this.baseKeymap = null;

    this.keySeq = null;

    this.mouseDown = null;
    this.dragging = null;
    this.dropTarget = null;
    this.shiftKey = false;
    this.finishComposing = null;

    this.keymaps = [];
    this.defaultKeymap = null;

    this.storedMarks = null;

    var _loop = function _loop(event) {
      var handler = handlers[event];
      pm.content.addEventListener(event, function (e) {
        return handler(pm, e);
      });
    };

    for (var event in handlers) {
      _loop(event);
    }

    pm.on("selectionChange", function () {
      return _this.storedMarks = null;
    });
  }

  // Dispatch a key press to the internal keymaps, which will override the default
  // DOM behavior.


  _createClass(Input, [{
    key: "dispatchKey",
    value: function dispatchKey(name, e) {
      var pm = this.pm,
          seq = pm.input.keySeq;
      // If the previous key should be used in sequence with this one, modify the name accordingly.
      if (seq) {
        if (_browserkeymap2.default.isModifierKey(name)) return true;
        clearTimeout(stopSeq);
        stopSeq = setTimeout(function () {
          if (pm.input.keySeq == seq) pm.input.keySeq = null;
        }, 50);
        name = seq + " " + name;
      }

      var handle = function handle(bound) {
        if (bound === false) return "nothing";
        if (bound == "...") return "multi";
        if (bound == null) return false;

        var result = false;
        if (Array.isArray(bound)) {
          for (var i = 0; result === false && i < bound.length; i++) {
            result = handle(bound[i]);
          }
        } else if (typeof bound == "string") {
          result = pm.execCommand(bound);
        } else {
          result = bound(pm);
        }
        return result == false ? false : "handled";
      };

      var result = void 0;
      for (var i = 0; !result && i < pm.input.keymaps.length; i++) {
        result = handle(pm.input.keymaps[i].map.lookup(name, pm));
      }if (!result) result = handle(pm.input.baseKeymap.lookup(name, pm)) || handle(_capturekeys.captureKeys.lookup(name));

      // If the key should be used in sequence with the next key, store the keyname internally.
      if (result == "multi") pm.input.keySeq = name;

      if ((result == "handled" || result == "multi") && e) e.preventDefault();

      if (seq && !result && /\'$/.test(name)) {
        if (e) e.preventDefault();
        return true;
      }
      return !!result;
    }

    // : (ProseMirror, TextSelection, string, ?(Node) → Selection)
    // Insert text into a document.

  }, {
    key: "insertText",
    value: function insertText(from, to, text, findSelection) {
      if (from == to && !text) return;
      var pm = this.pm,
          marks = pm.input.storedMarks || pm.doc.marksAt(from);
      var tr = pm.tr.replaceWith(from, to, text ? pm.schema.text(text, marks) : null);
      tr.apply({
        scrollIntoView: true,
        selection: findSelection && findSelection(tr.doc) || (0, _selection.findSelectionNear)(tr.doc, tr.map(to), -1, true)
      });
      // :: () #path=ProseMirror#events#textInput
      // Fired when the user types text into the editor.
      if (text) pm.signal("textInput", text);
    }
  }, {
    key: "startComposition",
    value: function startComposition(dataLen, realStart) {
      this.pm.ensureOperation({ noFlush: true, readSelection: realStart }).composing = {
        ended: false,
        applied: false,
        margin: dataLen
      };
      this.pm.unscheduleFlush();
    }
  }, {
    key: "applyComposition",
    value: function applyComposition(andFlush) {
      var composing = this.composing;
      if (composing.applied) return;
      (0, _domchange.readCompositionChange)(this.pm, composing.margin);
      composing.applied = true;
      // Operations that read DOM changes must be flushed, to make sure
      // subsequent DOM changes find a clean DOM.
      if (andFlush) this.pm.flush();
    }
  }, {
    key: "composing",
    get: function get() {
      return this.pm.operation && this.pm.operation.composing;
    }
  }]);

  return Input;
}();

handlers.keydown = function (pm, e) {
  // :: () #path=ProseMirror#events#interaction
  // Fired when the user interacts with the editor, for example by
  // clicking on it or pressing a key while it is focused. Mostly
  // useful for closing or resetting transient UI state such as open
  // menus.
  if (!(0, _selection.hasFocus)(pm)) return;
  pm.signal("interaction");
  if (e.keyCode == 16) pm.input.shiftKey = true;
  if (pm.input.composing) return;
  var name = _browserkeymap2.default.keyName(e);
  if (name && pm.input.dispatchKey(name, e)) return;
  pm.sel.fastPoll();
};

handlers.keyup = function (pm, e) {
  if (e.keyCode == 16) pm.input.shiftKey = false;
};

handlers.keypress = function (pm, e) {
  if (!(0, _selection.hasFocus)(pm) || pm.input.composing || !e.charCode || e.ctrlKey && !e.altKey || _dom.browser.mac && e.metaKey) return;
  if (pm.input.dispatchKey(_browserkeymap2.default.keyName(e), e)) return;
  var sel = pm.selection;
  // On iOS, let input through, because if we handle it the virtual
  // keyboard's default case doesn't update (it only does so when the
  // user types or taps, not on selection updates from JavaScript).
  if (!_dom.browser.ios) {
    pm.input.insertText(sel.from, sel.to, String.fromCharCode(e.charCode));
    e.preventDefault();
  }
};

function realTarget(pm, mouseEvent) {
  if (pm.operation && pm.flush()) return document.elementFromPoint(mouseEvent.clientX, mouseEvent.clientY);else return mouseEvent.target;
}

function selectClickedNode(pm, e, target) {
  var pos = (0, _dompos.selectableNodeAbove)(pm, target, { left: e.clientX, top: e.clientY }, true);
  if (pos == null) return pm.sel.fastPoll();

  var _pm$selection = pm.selection;
  var node = _pm$selection.node;
  var from = _pm$selection.from;

  if (node) {
    var $pos = pm.doc.resolve(pos),
        $from = pm.doc.resolve(from);
    if ($pos.depth >= $from.depth && $pos.before() == from) {
      if ($from.depth == 0) return pm.sel.fastPoll();
      pos = $pos.before();
    }
  }

  pm.setNodeSelection(pos);
  pm.focus();
  e.preventDefault();
}

var lastClick = 0,
    oneButLastClick = 0;

function handleTripleClick(pm, e, target) {
  e.preventDefault();
  var pos = (0, _dompos.selectableNodeAbove)(pm, target, { left: e.clientX, top: e.clientY }, true);
  if (pos != null) {
    var $pos = pm.doc.resolve(pos),
        node = $pos.nodeAfter;
    if (node.isBlock && !node.isTextblock) // Non-textblock block, select it
      pm.setNodeSelection(pos);else if (node.isInline) // Inline node, select whole parent
      pm.setTextSelection($pos.start(), $pos.end());else // Textblock, select content
      pm.setTextSelection(pos + 1, pos + 1 + node.content.size);
    pm.focus();
  }
}

handlers.mousedown = function (pm, e) {
  pm.signal("interaction");
  var now = Date.now(),
      doubleClick = now - lastClick < 500,
      tripleClick = now - oneButLastClick < 600;
  oneButLastClick = lastClick;
  lastClick = now;

  var target = realTarget(pm, e);
  if (tripleClick) handleTripleClick(pm, e, target);else if (doubleClick && (0, _dompos.handleNodeClick)(pm, "handleDoubleClick", e, target, true)) {} else pm.input.mouseDown = new MouseDown(pm, e, target, doubleClick);
};

var MouseDown = function () {
  function MouseDown(pm, event, target, doubleClick) {
    _classCallCheck(this, MouseDown);

    this.pm = pm;
    this.event = event;
    this.target = target;
    this.leaveToBrowser = pm.input.shiftKey || doubleClick;

    var pos = (0, _dompos.posBeforeFromDOM)(pm, this.target),
        node = pm.doc.nodeAt(pos);
    this.mightDrag = node.type.draggable || node == pm.sel.range.node ? pos : null;
    if (this.mightDrag != null) {
      this.target.draggable = true;
      if (_dom.browser.gecko && (this.setContentEditable = !this.target.hasAttribute("contentEditable"))) this.target.setAttribute("contentEditable", "false");
    }

    this.x = event.clientX;this.y = event.clientY;

    window.addEventListener("mouseup", this.up = this.up.bind(this));
    window.addEventListener("mousemove", this.move = this.move.bind(this));
    pm.sel.fastPoll();
  }

  _createClass(MouseDown, [{
    key: "done",
    value: function done() {
      window.removeEventListener("mouseup", this.up);
      window.removeEventListener("mousemove", this.move);
      if (this.mightDrag != null) {
        this.target.draggable = false;
        if (_dom.browser.gecko && this.setContentEditable) this.target.removeAttribute("contentEditable");
      }
    }
  }, {
    key: "up",
    value: function up(event) {
      this.done();

      var target = realTarget(this.pm, event);
      if (this.leaveToBrowser || !(0, _dom.contains)(this.pm.content, target)) {
        this.pm.sel.fastPoll();
      } else if (this.event.ctrlKey) {
        selectClickedNode(this.pm, event, target);
      } else if (!(0, _dompos.handleNodeClick)(this.pm, "handleClick", event, target, true)) {
        var pos = (0, _dompos.selectableNodeAbove)(this.pm, target, { left: this.x, top: this.y });
        if (pos) {
          this.pm.setNodeSelection(pos);
          this.pm.focus();
        } else {
          this.pm.sel.fastPoll();
        }
      }
    }
  }, {
    key: "move",
    value: function move(event) {
      if (!this.leaveToBrowser && (Math.abs(this.x - event.clientX) > 4 || Math.abs(this.y - event.clientY) > 4)) this.leaveToBrowser = true;
      this.pm.sel.fastPoll();
    }
  }]);

  return MouseDown;
}();

handlers.touchdown = function (pm) {
  pm.sel.fastPoll();
};

handlers.contextmenu = function (pm, e) {
  (0, _dompos.handleNodeClick)(pm, "handleContextMenu", e, realTarget(pm, e), false);
};

// Input compositions are hard. Mostly because the events fired by
// browsers are A) very unpredictable and inconsistent, and B) not
// cancelable.
//
// ProseMirror has the problem that it must not update the DOM during
// a composition, or the browser will cancel it. What it does is keep
// long-running operations (delayed DOM updates) when a composition is
// active.
//
// We _do not_ trust the information in the composition events which,
// apart from being very uninformative to begin with, is often just
// plain wrong. Instead, when a composition ends, we parse the dom
// around the original selection, and derive an update from that.

handlers.compositionstart = function (pm, e) {
  if (!pm.input.composing && (0, _selection.hasFocus)(pm)) pm.input.startComposition(e.data ? e.data.length : 0, true);
};

handlers.compositionupdate = function (pm) {
  if (!pm.input.composing && (0, _selection.hasFocus)(pm)) pm.input.startComposition(0, false);
};

handlers.compositionend = function (pm, e) {
  if (!(0, _selection.hasFocus)(pm)) return;
  var composing = pm.input.composing;
  if (!composing) {
    // We received a compositionend without having seen any previous
    // events for the composition. If there's data in the event
    // object, we assume that it's a real change, and start a
    // composition. Otherwise, we just ignore it.
    if (e.data) pm.input.startComposition(e.data.length, false);else return;
  } else if (composing.applied) {
    // This happens when a flush during composition causes a
    // syncronous compositionend.
    return;
  }

  clearTimeout(pm.input.finishComposing);
  pm.operation.composing.ended = true;
  // Applying the composition right away from this event confuses
  // Chrome (and probably other browsers), causing them to re-update
  // the DOM afterwards. So we apply the composition either in the
  // next input event, or after a short interval.
  pm.input.finishComposing = window.setTimeout(function () {
    var composing = pm.input.composing;
    if (composing && composing.ended) pm.input.applyComposition(true);
  }, 20);
};

function readInput(pm) {
  var composing = pm.input.composing;
  if (composing) {
    // Ignore input events during composition, except when the
    // composition has ended, in which case we can apply it.
    if (composing.ended) pm.input.applyComposition(true);
    return true;
  }

  // Read the changed DOM and derive an update from that.
  var result = (0, _domchange.readInputChange)(pm);
  pm.flush();
  return result;
}

function readInputSoon(pm) {
  window.setTimeout(function () {
    if (!readInput(pm)) window.setTimeout(function () {
      return readInput(pm);
    }, 80);
  }, 20);
}

handlers.input = function (pm) {
  if ((0, _selection.hasFocus)(pm)) readInput(pm);
};

function toClipboard(doc, from, to, dataTransfer) {
  var slice = doc.slice(from, to),
      $from = doc.resolve(from);
  var parent = $from.node($from.depth - slice.openLeft);
  var attr = parent.type.name + " " + slice.openLeft + " " + slice.openRight;
  var html = "<div pm-context=\"" + attr + "\">" + (0, _format.toHTML)(slice.content) + "</div>";
  dataTransfer.clearData();
  dataTransfer.setData("text/html", html);
  dataTransfer.setData("text/plain", (0, _format.toText)(slice.content));
  return slice;
}

var cachedCanUpdateClipboard = null;

function canUpdateClipboard(dataTransfer) {
  if (cachedCanUpdateClipboard != null) return cachedCanUpdateClipboard;
  dataTransfer.setData("text/html", "<hr>");
  return cachedCanUpdateClipboard = dataTransfer.getData("text/html") == "<hr>";
}

// :: (text: string) → string #path=ProseMirror#events#transformPastedText
// Fired when plain text is pasted. Handlers must return the given
// string or a [transformed](#EventMixin.signalPipelined) version of
// it.

// :: (html: string) → string #path=ProseMirror#events#transformPastedHTML
// Fired when html content is pasted or dragged into the editor.
// Handlers must return the given string or a
// [transformed](#EventMixin.signalPipelined) version of it.

// :: (slice: Slice) → Slice #path=ProseMirror#events#transformPasted
// Fired when something is pasted or dragged into the editor. The
// given slice represents the pasted content, and your handler can
// return a modified version to manipulate it before it is inserted
// into the document.

// : (ProseMirror, DataTransfer, ?bool) → ?Slice
function fromClipboard(pm, dataTransfer, plainText) {
  var txt = dataTransfer.getData("text/plain");
  var html = dataTransfer.getData("text/html");
  if (!html && !txt) return null;
  var fragment = void 0,
      slice = void 0;
  if ((plainText || !html) && txt) {
    // FIXME provide way not to wrap this in a whole doc / redo text parsing
    fragment = (0, _format.parseFrom)(pm.schema, pm.signalPipelined("transformPastedText", txt), "text").content;
  } else {
    var dom = document.createElement("div");
    dom.innerHTML = pm.signalPipelined("transformPastedHTML", html);
    var wrap = dom.querySelector("[pm-context]"),
        context = void 0,
        contextNodeType = void 0,
        found = void 0;
    if (wrap && (context = /^(\w+) (\d+) (\d+)$/.exec(wrap.getAttribute("pm-context"))) && (contextNodeType = pm.schema.nodes[context[1]]) && contextNodeType.defaultAttrs && (found = parseFromContext(wrap, contextNodeType, +context[2], +context[3]))) slice = found;else fragment = (0, _format.fromDOM)(pm.schema, dom, { topNode: false });
  }
  if (!slice) {
    var openLeft = 0,
        openRight = 0;
    if (fragment.size) {
      if (fragment.firstChild.isTextblock) openLeft = 1;
      if (fragment.lastChild.isTextblock) openRight = 1;
    }
    slice = new _model.Slice(fragment, openLeft, openRight);
  }
  return pm.signalPipelined("transformPasted", slice);
}

function parseFromContext(dom, contextNodeType, openLeft, openRight) {
  var schema = contextNodeType.schema,
      contextNode = contextNodeType.create();
  var parsed = (0, _format.fromDOM)(schema, dom, { topNode: contextNode, preserveWhitespace: true });
  return new _model.Slice(parsed.content, clipOpen(parsed.content, openLeft, true), clipOpen(parsed.content, openRight, false), contextNode);
}

function clipOpen(fragment, max, start) {
  for (var i = 0; i < max; i++) {
    var node = start ? fragment.firstChild : fragment.lastChild;
    if (!node || node.type.isLeaf) return i;
    fragment = node.content;
  }
  return max;
}

handlers.copy = handlers.cut = function (pm, e) {
  var _pm$selection2 = pm.selection;
  var from = _pm$selection2.from;
  var to = _pm$selection2.to;
  var empty = _pm$selection2.empty;var cut = e.type == "cut";
  if (empty) return;
  if (!e.clipboardData || !canUpdateClipboard(e.clipboardData)) {
    if (cut && _dom.browser.ie && _dom.browser.ie_version <= 11) readInputSoon(pm);
    return;
  }
  toClipboard(pm.doc, from, to, e.clipboardData);
  e.preventDefault();
  if (cut) pm.tr.delete(from, to).apply();
};

handlers.paste = function (pm, e) {
  if (!(0, _selection.hasFocus)(pm)) return;
  if (!e.clipboardData) {
    if (_dom.browser.ie && _dom.browser.ie_version <= 11) readInputSoon(pm);
    return;
  }
  var sel = pm.selection;
  var slice = fromClipboard(pm, e.clipboardData, pm.input.shiftKey);
  if (slice) {
    e.preventDefault();
    var tr = pm.tr.replace(sel.from, sel.to, slice);
    tr.apply({ scrollIntoView: true, selection: (0, _selection.findSelectionNear)(tr.doc, tr.map(sel.to)) });
  }
};

var Dragging = function Dragging(slice, from, to) {
  _classCallCheck(this, Dragging);

  this.slice = slice;
  this.from = from;
  this.to = to;
};

function dropPos(pm, e, slice) {
  var pos = pm.posAtCoords({ left: e.clientX, top: e.clientY });
  if (pos == null || !slice || !slice.content.size) return pos;
  var $pos = pm.doc.resolve(pos);
  for (var d = $pos.depth; d >= 0; d--) {
    var bias = d == $pos.depth ? 0 : pos <= ($pos.start(d + 1) + $pos.end(d + 1)) / 2 ? -1 : 1;
    var insertPos = $pos.index(d) + (bias > 0 ? 1 : 0);
    if ($pos.node(d).canReplace(insertPos, insertPos, slice.content)) return bias == 0 ? pos : bias < 0 ? $pos.before(d + 1) : $pos.after(d + 1);
  }
  return pos;
}

function removeDropTarget(pm) {
  if (pm.input.dropTarget) {
    pm.wrapper.removeChild(pm.input.dropTarget);
    pm.input.dropTarget = null;
  }
}

handlers.dragstart = function (pm, e) {
  var mouseDown = pm.input.mouseDown;
  if (mouseDown) mouseDown.done();

  if (!e.dataTransfer) return;

  var _pm$selection3 = pm.selection;
  var from = _pm$selection3.from;
  var to = _pm$selection3.to;
  var empty = _pm$selection3.empty;var dragging = void 0;
  var pos = !empty && pm.posAtCoords({ left: e.clientX, top: e.clientY });
  if (pos != null && pos >= from && pos <= to) {
    dragging = { from: from, to: to };
  } else if (mouseDown && mouseDown.mightDrag != null) {
    var _pos = mouseDown.mightDrag;
    dragging = { from: _pos, to: _pos + pm.doc.nodeAt(_pos).nodeSize };
  }

  if (dragging) {
    var slice = toClipboard(pm.doc, dragging.from, dragging.to, e.dataTransfer);
    // FIXME the document could change during a drag, invalidating this range
    // use a marked range?
    pm.input.dragging = new Dragging(slice, dragging.from, dragging.to);
  }
};

handlers.dragend = function (pm) {
  removeDropTarget(pm);
  window.setTimeout(function () {
    return pm.input.dragging = null;
  }, 50);
};

handlers.dragover = handlers.dragenter = function (pm, e) {
  e.preventDefault();

  var target = pm.input.dropTarget;
  if (!target) target = pm.input.dropTarget = pm.wrapper.appendChild((0, _dom.elt)("div", { class: "ProseMirror-drop-target" }));

  var pos = dropPos(pm, e, pm.input.dragging && pm.input.dragging.slice);
  if (pos == null) return;
  var coords = pm.coordsAtPos(pos);
  var rect = pm.wrapper.getBoundingClientRect();
  coords.top -= rect.top;
  coords.right -= rect.left;
  coords.bottom -= rect.top;
  coords.left -= rect.left;
  target.style.left = coords.left - 1 + "px";
  target.style.top = coords.top + "px";
  target.style.height = coords.bottom - coords.top + "px";
};

handlers.dragleave = function (pm, e) {
  if (e.target == pm.content) removeDropTarget(pm);
};

handlers.drop = function (pm, e) {
  var dragging = pm.input.dragging;
  pm.input.dragging = null;
  removeDropTarget(pm);

  // :: (event: DOMEvent) #path=ProseMirror#events#drop
  // Fired when a drop event occurs on the editor content. A handler
  // may declare the event handled by calling `preventDefault` on it
  // or returning a truthy value.
  if (!e.dataTransfer || pm.signalDOM(e)) return;

  var slice = dragging && dragging.slice || fromClipboard(pm, e.dataTransfer);
  if (slice) {
    e.preventDefault();
    var insertPos = dropPos(pm, e, slice),
        start = insertPos;
    if (insertPos == null) return;
    var tr = pm.tr;
    if (dragging && !e.ctrlKey && dragging.from != null) {
      tr.delete(dragging.from, dragging.to);
      insertPos = tr.map(insertPos);
    }
    tr.replace(insertPos, insertPos, slice).apply();
    var found = void 0;
    if (slice.content.childCount == 1 && slice.openLeft == 0 && slice.openRight == 0 && slice.content.child(0).type.selectable && (found = pm.doc.nodeAt(insertPos)) && found.sameMarkup(slice.content.child(0))) {
      pm.setNodeSelection(insertPos);
    } else {
      var left = (0, _selection.findSelectionNear)(pm.doc, insertPos, 1, true).from;
      var right = (0, _selection.findSelectionNear)(pm.doc, tr.map(start), -1, true).to;
      pm.setTextSelection(left, right);
    }
    pm.focus();
  }
};

handlers.focus = function (pm) {
  pm.wrapper.classList.add("ProseMirror-focused");
  // :: () #path=ProseMirror#events#focus
  // Fired when the editor gains focus.
  pm.signal("focus");
};

handlers.blur = function (pm) {
  pm.wrapper.classList.remove("ProseMirror-focused");
  // :: () #path=ProseMirror#events#blur
  // Fired when the editor loses focus.
  pm.signal("blur");
};