"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Tooltip = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _dom = require("../dom");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var prefix = "ProseMirror-tooltip";

// ;; Used to show tooltips. An instance of this class is a persistent
// DOM node (to allow position and opacity animation) that can be
// shown and hidden. It is positioned relative to a position (passed
// when showing the tooltip), and points at that position with a
// little arrow-like triangle attached to the node.

var Tooltip = exports.Tooltip = function () {
  // :: (DOMNode, union<string, Object>)
  // Create a new tooltip that lives in the wrapper node, which should
  // be its offset anchor, i.e. it should have a `relative` or
  // `absolute` CSS position. You'll often want to pass an editor's
  // [`wrapper` node](#ProseMirror.wrapper). `options` may be an object
  // containg a `direction` string and a `getBoundingRect` function which
  // should return a rectangle determining the space in which the tooltip
  // may appear. Alternatively, `options` may be a string specifying the
  // direction. The direction can be `"above"`, `"below"`, `"right"`,
  // `"left"`, or `"center"`. In the latter case, the tooltip has no arrow
  // and is positioned centered in its wrapper node.

  function Tooltip(wrapper, options) {
    var _this = this;

    _classCallCheck(this, Tooltip);

    this.wrapper = wrapper;
    this.options = typeof options == "string" ? { direction: options } : options;
    this.dir = this.options.direction || "above";
    this.pointer = wrapper.appendChild((0, _dom.elt)("div", { class: prefix + "-pointer-" + this.dir + " " + prefix + "-pointer" }));
    this.pointerWidth = this.pointerHeight = null;
    this.dom = wrapper.appendChild((0, _dom.elt)("div", { class: prefix }));
    this.dom.addEventListener("transitionend", function () {
      if (_this.dom.style.opacity == "0") _this.dom.style.display = _this.pointer.style.display = "";
    });

    this.isOpen = false;
    this.lastLeft = this.lastTop = null;
  }

  // :: ()
  // Remove the tooltip from the DOM.


  _createClass(Tooltip, [{
    key: "detach",
    value: function detach() {
      this.dom.parentNode.removeChild(this.dom);
      this.pointer.parentNode.removeChild(this.pointer);
    }
  }, {
    key: "getSize",
    value: function getSize(node) {
      var wrap = this.wrapper.appendChild((0, _dom.elt)("div", {
        class: prefix,
        style: "display: block; position: absolute"
      }, node));
      var size = { width: wrap.offsetWidth + 1, height: wrap.offsetHeight };
      wrap.parentNode.removeChild(wrap);
      return size;
    }

    // :: (DOMNode, ?{left: number, top: number})
    // Make the tooltip visible, show the given node in it, and position
    // it relative to the given position. If `pos` is not given, the
    // tooltip stays in its previous place. Unless the tooltip's
    // direction is `"center"`, `pos` should definitely be given the
    // first time it is shown.

  }, {
    key: "open",
    value: function open(node, pos) {
      var left = this.lastLeft = pos ? pos.left : this.lastLeft;
      var top = this.lastTop = pos ? pos.top : this.lastTop;

      var size = this.getSize(node);

      var around = this.wrapper.getBoundingClientRect();

      // Use the window as the bounding rectangle if no getBoundingRect
      // function is defined
      var boundingRect = (this.options.getBoundingRect || windowRect)();

      for (var child = this.dom.firstChild, next; child; child = next) {
        next = child.nextSibling;
        if (child != this.pointer) this.dom.removeChild(child);
      }
      this.dom.appendChild(node);

      this.dom.style.display = this.pointer.style.display = "block";

      if (this.pointerWidth == null) {
        this.pointerWidth = this.pointer.offsetWidth - 1;
        this.pointerHeight = this.pointer.offsetHeight - 1;
      }

      this.dom.style.width = size.width + "px";
      this.dom.style.height = size.height + "px";

      var margin = 5;
      if (this.dir == "above" || this.dir == "below") {
        var tipLeft = Math.max(boundingRect.left, Math.min(left - size.width / 2, boundingRect.right - size.width));
        this.dom.style.left = tipLeft - around.left + "px";
        this.pointer.style.left = left - around.left - this.pointerWidth / 2 + "px";
        if (this.dir == "above") {
          var tipTop = top - around.top - margin - this.pointerHeight - size.height;
          this.dom.style.top = tipTop + "px";
          this.pointer.style.top = tipTop + size.height + "px";
        } else {
          // below
          var _tipTop = top - around.top + margin;
          this.pointer.style.top = _tipTop + "px";
          this.dom.style.top = _tipTop + this.pointerHeight + "px";
        }
      } else if (this.dir == "left" || this.dir == "right") {
        this.dom.style.top = top - around.top - size.height / 2 + "px";
        this.pointer.style.top = top - this.pointerHeight / 2 - around.top + "px";
        if (this.dir == "left") {
          var pointerLeft = left - around.left - margin - this.pointerWidth;
          this.dom.style.left = pointerLeft - size.width + "px";
          this.pointer.style.left = pointerLeft + "px";
        } else {
          // right
          var _pointerLeft = left - around.left + margin;
          this.dom.style.left = _pointerLeft + this.pointerWidth + "px";
          this.pointer.style.left = _pointerLeft + "px";
        }
      } else if (this.dir == "center") {
        var _top = Math.max(around.top, boundingRect.top),
            bottom = Math.min(around.bottom, boundingRect.bottom);
        var fromTop = (bottom - _top - size.height) / 2;
        this.dom.style.left = (around.width - size.width) / 2 + "px";
        this.dom.style.top = _top - around.top + fromTop + "px";
      }

      getComputedStyle(this.dom).opacity;
      getComputedStyle(this.pointer).opacity;
      this.dom.style.opacity = this.pointer.style.opacity = 1;
      this.isOpen = true;
    }

    // :: ()
    // Close (hide) the tooltip.

  }, {
    key: "close",
    value: function close() {
      if (this.isOpen) {
        this.isOpen = false;
        this.dom.style.opacity = this.pointer.style.opacity = 0;
      }
    }
  }]);

  return Tooltip;
}();

function windowRect() {
  return {
    left: 0, right: window.innerWidth,
    top: 0, bottom: window.innerHeight
  };
}

(0, _dom.insertCSS)("\n\n." + prefix + " {\n  position: absolute;\n  display: none;\n  box-sizing: border-box;\n  -moz-box-sizing: border- box;\n  overflow: hidden;\n\n  -webkit-transition: width 0.4s ease-out, height 0.4s ease-out, left 0.4s ease-out, top 0.4s ease-out, opacity 0.2s;\n  -moz-transition: width 0.4s ease-out, height 0.4s ease-out, left 0.4s ease-out, top 0.4s ease-out, opacity 0.2s;\n  transition: width 0.4s ease-out, height 0.4s ease-out, left 0.4s ease-out, top 0.4s ease-out, opacity 0.2s;\n  opacity: 0;\n\n  border-radius: 5px;\n  padding: 3px 7px;\n  margin: 0;\n  background: white;\n  border: 1px solid #777;\n  color: #555;\n\n  z-index: 11;\n}\n\n." + prefix + "-pointer {\n  position: absolute;\n  display: none;\n  width: 0; height: 0;\n\n  -webkit-transition: left 0.4s ease-out, top 0.4s ease-out, opacity 0.2s;\n  -moz-transition: left 0.4s ease-out, top 0.4s ease-out, opacity 0.2s;\n  transition: left 0.4s ease-out, top 0.4s ease-out, opacity 0.2s;\n  opacity: 0;\n\n  z-index: 12;\n}\n\n." + prefix + "-pointer:after {\n  content: \"\";\n  position: absolute;\n  display: block;\n}\n\n." + prefix + "-pointer-above {\n  border-left: 6px solid transparent;\n  border-right: 6px solid transparent;\n  border-top: 6px solid #777;\n}\n\n." + prefix + "-pointer-above:after {\n  border-left: 6px solid transparent;\n  border-right: 6px solid transparent;\n  border-top: 6px solid white;\n  left: -6px; top: -7px;\n}\n\n." + prefix + "-pointer-below {\n  border-left: 6px solid transparent;\n  border-right: 6px solid transparent;\n  border-bottom: 6px solid #777;\n}\n\n." + prefix + "-pointer-below:after {\n  border-left: 6px solid transparent;\n  border-right: 6px solid transparent;\n  border-bottom: 6px solid white;\n  left: -6px; top: 1px;\n}\n\n." + prefix + "-pointer-right {\n  border-top: 6px solid transparent;\n  border-bottom: 6px solid transparent;\n  border-right: 6px solid #777;\n}\n\n." + prefix + "-pointer-right:after {\n  border-top: 6px solid transparent;\n  border-bottom: 6px solid transparent;\n  border-right: 6px solid white;\n  left: 1px; top: -6px;\n}\n\n." + prefix + "-pointer-left {\n  border-top: 6px solid transparent;\n  border-bottom: 6px solid transparent;\n  border-left: 6px solid #777;\n}\n\n." + prefix + "-pointer-left:after {\n  border-top: 6px solid transparent;\n  border-bottom: 6px solid transparent;\n  border-left: 6px solid white;\n  left: -7px; top: -6px;\n}\n\n." + prefix + " input[type=\"text\"],\n." + prefix + " textarea {\n  background: #eee;\n  border: none;\n  outline: none;\n}\n\n." + prefix + " input[type=\"text\"] {\n  padding: 0 4px;\n}\n\n");