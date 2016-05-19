"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _edit = require("../edit");

var _dom = require("../dom");

var _tooltip = require("../ui/tooltip");

var _update = require("../ui/update");

var _menu = require("./menu");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var classPrefix = "ProseMirror-tooltipmenu";

// :: union<bool, Object> #path=tooltipMenu #kind=option
//
// When given a truthy value, enables the tooltip menu module for this
// editor. This menu shows up when there is a selection, and
// optionally in certain other circumstances, providing
// context-relevant commands.
//
// By default, the tooltip will show inline menu commands (registered
// with the [`menuGroup`](#CommandSpec.menuGroup) command property)
// when there is an inline selection, and block related commands when
// there is a node selection on a block.
//
// The module can be configured by passing an object. These properties
// are recognized:
//
// **`showLinks`**`: bool = true`
//   : Causes a tooltip with the link target to show up when the
//     cursor is inside of a link (without a selection).
//
// **`selectedBlockMenu`**`: bool = false`
//   : When enabled, and a whole block is selected or the cursor is
//     inside an empty block, the block menu gets shown.
//
// **`inlineContent`**`: [`[`MenuGroup`](#MenuGroup)`]`
//   : The menu elements to show when displaying the menu for inline
//     content.
//
// **`blockContent`**`: [`[`MenuGroup`](#MenuGroup)`]`
//   : The menu elements to show when displaying the menu for block
//     content.
//
// **`selectedBlockContent`**`: [MenuGroup]`
//   : The elements to show when a full block has been selected and
//     `selectedBlockMenu` is enabled. Defaults to concatenating
//     `inlineContent` and `blockContent`.
//
// **`position`**`: string`
//  : Where, relative to the selection, the tooltip should appear.
//    Defaults to `"above"`. Can also be set to `"below"`.

(0, _edit.defineOption)("tooltipMenu", false, function (pm, value) {
  if (pm.mod.tooltipMenu) pm.mod.tooltipMenu.detach();
  pm.mod.tooltipMenu = value ? new TooltipMenu(pm, value) : null;
});

var defaultInline = [_menu.inlineGroup, _menu.insertMenu];
var defaultBlock = [[_menu.textblockMenu, _menu.blockGroup]];

var TooltipMenu = function () {
  function TooltipMenu(pm, config) {
    var _this = this;

    _classCallCheck(this, TooltipMenu);

    this.pm = pm;
    this.config = config || {};

    this.showLinks = this.config.showLinks !== false;
    this.selectedBlockMenu = this.config.selectedBlockMenu;
    this.updater = new _update.UpdateScheduler(pm, "change selectionChange blur focus commandsChanged", function () {
      return _this.update();
    });
    this.onContextMenu = this.onContextMenu.bind(this);
    pm.content.addEventListener("contextmenu", this.onContextMenu);

    this.position = this.config.position || "above";
    this.tooltip = new _tooltip.Tooltip(pm.wrapper, this.position);
    this.inlineContent = this.config.inlineContent || defaultInline;
    this.blockContent = this.config.blockContent || defaultBlock;
    this.selectedBlockContent = this.config.selectedBlockContent || this.inlineContent.concat(this.blockContent);
  }

  _createClass(TooltipMenu, [{
    key: "detach",
    value: function detach() {
      this.updater.detach();
      this.tooltip.detach();
      this.pm.content.removeEventListener("contextmenu", this.onContextMenu);
    }
  }, {
    key: "show",
    value: function show(content, coords) {
      this.tooltip.open((0, _dom.elt)("div", null, (0, _menu.renderGrouped)(this.pm, content)), coords);
    }
  }, {
    key: "update",
    value: function update() {
      var _this2 = this;

      var _pm$selection = this.pm.selection;
      var empty = _pm$selection.empty;
      var node = _pm$selection.node;
      var from = _pm$selection.from;
      var to = _pm$selection.to;var link = void 0;
      if (!this.pm.hasFocus()) {
        this.tooltip.close();
      } else if (node && node.isBlock) {
        return function () {
          var coords = _this2.nodeSelectionCoords();
          return function () {
            return _this2.show(_this2.blockContent, coords);
          };
        };
      } else if (!empty) {
        return function () {
          var coords = node ? _this2.nodeSelectionCoords() : _this2.selectionCoords(),
              $from = void 0;
          var showBlock = _this2.selectedBlockMenu && ($from = _this2.pm.doc.resolve(from)).parentOffset == 0 && $from.end() == to;
          return function () {
            return _this2.show(showBlock ? _this2.selectedBlockContent : _this2.inlineContent, coords);
          };
        };
      } else if (this.selectedBlockMenu && this.pm.doc.resolve(from).parent.content.size == 0) {
        return function () {
          var coords = _this2.selectionCoords();
          return function () {
            return _this2.show(_this2.blockContent, coords);
          };
        };
      } else if (this.showLinks && (link = this.linkUnderCursor())) {
        return function () {
          var coords = _this2.selectionCoords();
          return function () {
            return _this2.showLink(link, coords);
          };
        };
      } else {
        this.tooltip.close();
      }
    }
  }, {
    key: "selectionCoords",
    value: function selectionCoords() {
      var pos = this.position == "above" ? topCenterOfSelection() : bottomCenterOfSelection();
      if (pos.top != 0) return pos;
      var realPos = this.pm.coordsAtPos(this.pm.selection.from);
      return { left: realPos.left, top: this.position == "above" ? realPos.top : realPos.bottom };
    }
  }, {
    key: "nodeSelectionCoords",
    value: function nodeSelectionCoords() {
      var selected = this.pm.content.querySelector(".ProseMirror-selectednode");
      if (!selected) return { left: 0, top: 0 };
      var box = selected.getBoundingClientRect();
      return { left: Math.min((box.left + box.right) / 2, box.left + 20),
        top: this.position == "above" ? box.top : box.bottom };
    }
  }, {
    key: "linkUnderCursor",
    value: function linkUnderCursor() {
      var head = this.pm.selection.head;
      if (!head) return null;
      var marks = this.pm.doc.marksAt(head);
      return marks.reduce(function (found, m) {
        return found || m.type.name == "link" && m;
      }, null);
    }
  }, {
    key: "showLink",
    value: function showLink(link, pos) {
      var node = (0, _dom.elt)("div", { class: classPrefix + "-linktext" }, (0, _dom.elt)("a", { href: link.attrs.href, title: link.attrs.title }, link.attrs.href));
      this.tooltip.open(node, pos);
    }
  }, {
    key: "onContextMenu",
    value: function onContextMenu(e) {
      if (!this.pm.selection.empty) return;
      var pos = this.pm.posAtCoords({ left: e.clientX, top: e.clientY });
      if (!pos || !pos.isValid(this.pm.doc, true)) return;

      this.pm.setTextSelection(pos, pos);
      this.pm.flush();
      this.show(this.inlineContent, this.selectionCoords());
    }
  }]);

  return TooltipMenu;
}();

// Get the x and y coordinates at the top center of the current DOM selection.


function topCenterOfSelection() {
  var range = window.getSelection().getRangeAt(0),
      rects = range.getClientRects();
  if (!rects.length) return range.getBoundingClientRect();
  var left = void 0,
      right = void 0,
      top = void 0,
      bottom = void 0;
  for (var i = 0; i < rects.length; i++) {
    var rect = rects[i];
    if (left == right) {
      ;left = rect.left;
      right = rect.right;
      top = rect.top;
      bottom = rect.bottom;
    } else if (rect.top < bottom - 1 && (
    // Chrome bug where bogus rectangles are inserted at span boundaries
    i == rects.length - 1 || Math.abs(rects[i + 1].left - rect.left) > 1)) {
      left = Math.min(left, rect.left);
      right = Math.max(right, rect.right);
      top = Math.min(top, rect.top);
    }
  }
  return { top: top, left: (left + right) / 2 };
}

function bottomCenterOfSelection() {
  var range = window.getSelection().getRangeAt(0),
      rects = range.getClientRects();
  if (!rects.length) {
    var rect = range.getBoundingClientRect();
    return { left: rect.left, top: rect.bottom };
  }

  var left = void 0,
      right = void 0,
      bottom = void 0,
      top = void 0;
  for (var i = rects.length - 1; i >= 0; i--) {
    var _rect = rects[i];
    if (left == right) {
      ;left = _rect.left;
      right = _rect.right;
      bottom = _rect.bottom;
      top = _rect.top;
    } else if (_rect.bottom > top + 1 && (i == 0 || Math.abs(rects[i - 1].left - _rect.left) > 1)) {
      left = Math.min(left, _rect.left);
      right = Math.max(right, _rect.right);
      bottom = Math.min(bottom, _rect.bottom);
    }
  }
  return { top: bottom, left: (left + right) / 2 };
}

(0, _dom.insertCSS)("\n\n." + classPrefix + "-linktext a {\n  color: #444;\n  text-decoration: none;\n  padding: 0 5px;\n}\n\n." + classPrefix + "-linktext a:hover {\n  text-decoration: underline;\n}\n\n");