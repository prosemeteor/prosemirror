"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.draw = draw;
exports.redraw = redraw;

var _format = require("../format");

var _dom = require("../dom");

var _main = require("./main");

var _dompos = require("./dompos");

function options(ranges) {
  return {
    pos: 0,
    preRenderContent: function preRenderContent() {
      this.pos++;
    },
    postRenderContent: function postRenderContent() {
      this.pos++;
    },
    onRender: function onRender(node, dom, offset) {
      if (node.isBlock) {
        if (offset != null) dom.setAttribute("pm-offset", offset);
        dom.setAttribute("pm-size", node.nodeSize);
        if (node.isTextblock) adjustTrailingHacks(dom, node);
        if (dom.contentEditable == "false") dom = (0, _dom.elt)("div", null, dom);
        if (node.type.isLeaf) this.pos++;
      }

      return dom;
    },
    onContainer: function onContainer(node) {
      node.setAttribute("pm-container", true);
    },

    // : (Node, DOMNode, number) → DOMNode
    renderInlineFlat: function renderInlineFlat(node, dom, offset) {
      ranges.advanceTo(this.pos);
      var pos = this.pos,
          end = pos + node.nodeSize;
      var nextCut = ranges.nextChangeBefore(end);

      var inner = dom,
          wrapped = void 0;
      for (var i = 0; i < node.marks.length; i++) {
        inner = inner.firstChild;
      }if (dom.nodeType != 1) {
        dom = (0, _dom.elt)("span", null, dom);
        if (nextCut == -1) wrapped = dom;
      }
      if (!wrapped && (nextCut > -1 || ranges.current.length)) {
        wrapped = inner == dom ? dom = (0, _dom.elt)("span", null, inner) : inner.parentNode.appendChild((0, _dom.elt)("span", null, inner));
      }

      dom.setAttribute("pm-offset", offset);
      dom.setAttribute("pm-size", node.nodeSize);

      var inlineOffset = 0;
      while (nextCut > -1) {
        var size = nextCut - pos;
        var split = splitSpan(wrapped, size);
        if (ranges.current.length) split.className = ranges.current.join(" ");
        split.setAttribute("pm-inner-offset", inlineOffset);
        inlineOffset += size;
        ranges.advanceTo(nextCut);
        nextCut = ranges.nextChangeBefore(end);
        if (nextCut == -1) wrapped.setAttribute("pm-inner-offset", inlineOffset);
        pos += size;
      }

      if (ranges.current.length) wrapped.className = ranges.current.join(" ");
      this.pos += node.nodeSize;
      return dom;
    },

    document: document
  };
}

function splitSpan(span, at) {
  var textNode = span.firstChild,
      text = textNode.nodeValue;
  var newNode = span.parentNode.insertBefore((0, _dom.elt)("span", null, text.slice(0, at)), span);
  textNode.nodeValue = text.slice(at);
  return newNode;
}

function draw(pm, doc) {
  pm.content.textContent = "";
  pm.content.appendChild((0, _format.toDOM)(doc, options(pm.ranges.activeRangeTracker())));
}

function adjustTrailingHacks(dom, node) {
  var needs = node.content.size == 0 || node.lastChild.type.isBR || node.type.isCode && node.lastChild.isText && /\n$/.test(node.lastChild.text) ? "br" : !node.lastChild.isText && node.lastChild.type.isLeaf ? "text" : null;
  var last = dom.lastChild;
  var has = !last || last.nodeType != 1 || !last.hasAttribute("pm-ignore") ? null : last.nodeName == "BR" ? "br" : "text";
  if (needs != has) {
    if (has) dom.removeChild(last);
    if (needs) dom.appendChild(needs == "br" ? (0, _dom.elt)("br", { "pm-ignore": "trailing-break" }) : (0, _dom.elt)("span", { "pm-ignore": "cursor-text" }, ""));
  }
}

function findNodeIn(parent, i, node) {
  for (; i < parent.childCount; i++) {
    var child = parent.child(i);
    if (child == node) return i;
  }
  return -1;
}

function movePast(dom) {
  var next = dom.nextSibling;
  dom.parentNode.removeChild(dom);
  return next;
}

function redraw(pm, dirty, doc, prev) {
  if (dirty.get(prev) == _main.DIRTY_REDRAW) return draw(pm, doc);

  var opts = options(pm.ranges.activeRangeTracker());

  function scan(dom, node, prev, pos) {
    var iPrev = 0,
        pChild = prev.firstChild;
    var domPos = dom.firstChild;

    for (var iNode = 0, offset = 0; iNode < node.childCount; iNode++) {
      var child = node.child(iNode),
          matching = void 0,
          reuseDOM = void 0;
      var found = pChild == child ? iPrev : findNodeIn(prev, iPrev + 1, child);
      if (found > -1) {
        matching = child;
        while (iPrev != found) {
          iPrev++;
          domPos = movePast(domPos);
        }
      }

      if (matching && !dirty.get(matching)) {
        reuseDOM = true;
      } else if (pChild && !child.isText && child.sameMarkup(pChild) && dirty.get(pChild) != _main.DIRTY_REDRAW) {
        reuseDOM = true;
        if (!pChild.type.isLeaf) scan((0, _dompos.childContainer)(domPos), child, pChild, pos + offset + 1);
      } else {
        opts.pos = pos + offset;
        var rendered = (0, _format.nodeToDOM)(child, opts, offset);
        dom.insertBefore(rendered, domPos);
        reuseDOM = false;
      }

      if (reuseDOM) {
        domPos.setAttribute("pm-offset", offset);
        domPos.setAttribute("pm-size", child.nodeSize);
        domPos = domPos.nextSibling;
        pChild = prev.maybeChild(++iPrev);
      }
      offset += child.nodeSize;
    }

    while (pChild) {
      domPos = movePast(domPos);
      pChild = prev.maybeChild(++iPrev);
    }
    if (node.isTextblock) adjustTrailingHacks(dom, node);

    if (_dom.browser.ios) iosHacks(dom);
  }
  scan(pm.content, doc, prev, 0);
}

function iosHacks(dom) {
  if (dom.nodeName == "UL" || dom.nodeName == "OL") {
    var oldCSS = dom.style.cssText;
    dom.style.cssText = oldCSS + "; list-style: square !important";
    window.getComputedStyle(dom).listStyle;
    dom.style.cssText = oldCSS;
  }
}