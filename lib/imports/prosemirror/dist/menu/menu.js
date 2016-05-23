"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.historyGroup = exports.blockGroup = exports.textblockMenu = exports.insertMenu = exports.inlineGroup = exports.DropdownSubmenu = exports.Dropdown = exports.MenuCommandGroup = exports.MenuCommand = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.resolveGroup = resolveGroup;
exports.renderGrouped = renderGrouped;

var _dom = require("../dom");

var _sortedinsert = require("../util/sortedinsert");

var _sortedinsert2 = _interopRequireDefault(_sortedinsert);

var _obj = require("../util/obj");

var _icons = require("./icons");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// !! This module defines a number of building blocks for ProseMirror
// menus, as consumed by the [`menubar`](#menu/menubar) and
// [`tooltipmenu`](#menu/tooltipmenu) modules.

// ;; #path=MenuElement #kind=interface
// The types defined in this module aren't the only thing you can
// display in your menu. Anything that conforms to this interface can
// be put into a menu structure.

// :: (pm: ProseMirror) → ?DOMNode #path=MenuElement.render
// Render the element for display in the menu. Returning `null` can be
// used to signal that this element shouldn't be displayed for the
// given editor state.

// ;; #path=MenuGroup #kind=interface
// A menu group represents a group of things that may appear in a
// menu. It may be either a `MenuElement`, a `MenuCommandGroup`, or an
// array of such values. Can be reduced to an array of `MenuElement`s
// using `resolveGroup`.

var prefix = "ProseMirror-menu";

function title(pm, command) {
  if (!command.label) return null;
  var label = pm.translate(command.label);
  var key = command.name && pm.keyForCommand(command.name);
  return key ? label + " (" + key + ")" : label;
}

// ;; Wraps a [command](#Command) so that it can be rendered in a
// menu.

var MenuCommand = exports.MenuCommand = function () {
  // :: (union<Command, string>, MenuCommandSpec)

  function MenuCommand(command, options) {
    _classCallCheck(this, MenuCommand);

    this.command_ = command;
    this.options = options;
  }

  // :: (ProseMirror) → Command
  // Retrieve the command associated with this object.


  _createClass(MenuCommand, [{
    key: "command",
    value: function command(pm) {
      return typeof this.command_ == "string" ? pm.commands[this.command_] : this.command_;
    }
  }, {
    key: "render",


    // :: (ProseMirror) → DOMNode
    // Renders the command according to its [display
    // spec](#MenuCommandSpec.display), and adds an event handler which
    // executes the command when the representation is clicked.
    value: function render(pm) {
      var cmd = this.command(pm),
          disabled = false;
      if (!cmd) return;
      if (this.options.select != "ignore" && !cmd.select(pm)) {
        if (this.options.select == null || this.options.select == "hide") return null;else if (this.options.select == "disable") disabled = true;
      }

      var disp = this.options.display;
      if (!disp) throw new RangeError("No display style defined for menu command " + cmd.name);

      var dom = void 0;
      if (disp.render) {
        dom = disp.render(cmd, pm);
      } else if (disp.type == "icon") {
        dom = (0, _icons.getIcon)(cmd.name, disp);
        if (!disabled && cmd.active(pm)) dom.classList.add(prefix + "-active");
      } else if (disp.type == "label") {
        var label = pm.translate(disp.label || cmd.spec.label);
        dom = (0, _dom.elt)("div", null, label);
      } else {
        throw new RangeError("Unsupported command display style: " + disp.type);
      }
      dom.setAttribute("title", title(pm, cmd));
      if (this.options.class) dom.classList.add(this.options.class);
      if (disabled) dom.classList.add(prefix + "-disabled");
      if (this.options.css) dom.style.cssText += this.options.css;
      dom.addEventListener(this.options.execEvent || "mousedown", function (e) {
        e.preventDefault();e.stopPropagation();
        pm.signal("interaction");
        cmd.exec(pm, null, dom);
      });
      dom.setAttribute("data-command", this.commandName);
      return dom;
    }
  }, {
    key: "commandName",
    get: function get() {
      return typeof this.command_ === "string" ? this.command_.command : this.command_.name;
    }
  }]);

  return MenuCommand;
}();

// ;; Represents a [group](#MenuCommandSpec.group) of commands, as
// they appear in the editor's schema.


var MenuCommandGroup = exports.MenuCommandGroup = function () {
  // :: (string, ?MenuCommandSpec)
  // Create a group for the given group name, optionally adding or
  // overriding fields in the commands' [specs](#MenuCommandSpec).

  function MenuCommandGroup(name, options) {
    _classCallCheck(this, MenuCommandGroup);

    this.name = name;
    this.options = options;
  }

  _createClass(MenuCommandGroup, [{
    key: "collect",
    value: function collect(pm) {
      var _this = this;

      var result = [];
      for (var name in pm.commands) {
        var cmd = pm.commands[name],
            spec = cmd.spec.menu;
        if (spec && spec.group == this.name) (0, _sortedinsert2.default)(result, { cmd: cmd, rank: spec.rank == null ? 50 : spec.rank }, function (a, b) {
          return a.rank - b.rank;
        });
      }
      return result.map(function (o) {
        var spec = o.cmd.spec.menu;
        if (_this.options) spec = (0, _obj.copyObj)(_this.options, (0, _obj.copyObj)(spec));
        return new MenuCommand(o.cmd, spec);
      });
    }

    // :: (ProseMirror) → [MenuCommand]
    // Get the group of matching commands in the given editor.

  }, {
    key: "get",
    value: function get(pm) {
      var groups = pm.mod.menuGroups || this.startGroups(pm);
      return groups[this.name] || (groups[this.name] = this.collect(pm));
    }
  }, {
    key: "startGroups",
    value: function startGroups(pm) {
      var clear = function clear() {
        pm.mod.menuGroups = null;
        pm.off("commandsChanging", clear);
      };
      pm.on("commandsChanging", clear);
      return pm.mod.menuGroups = Object.create(null);
    }
  }]);

  return MenuCommandGroup;
}();

// ;; A drop-down menu, displayed as a label with a downwards-pointing
// triangle to the right of it.


var Dropdown = exports.Dropdown = function () {
  // :: (Object, MenuGroup)
  // Create a dropdown wrapping the given group. Options may include
  // the following properties:
  //
  // **`label`**`: string`
  //   : The label to show on the drop-down control. When
  //     `activeLabel` is also given, this one is used as a
  //     fallback.
  //
  // **`activeLabel`**`: bool`
  //   : Instead of showing a fixed label, enabling this causes the
  //     element to search through its content, looking for an
  //     [active](#CommandSpec.active) command. If one is found, its
  //     [`activeLabel`](#MenuCommandSpec.activeLabel) property is
  //     shown as the drop-down's label.
  //
  // **`title`**`: string`
  //   : Sets the
  //     [`title`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/title)
  //     attribute given to the menu control.
  //
  // **`class`**`: string`
  //   : When given, adds an extra CSS class to the menu control.

  function Dropdown(options, content) {
    _classCallCheck(this, Dropdown);

    this.options = options || {};
    this.content = content;
  }

  // :: (ProseMirror) → DOMNode
  // Returns a node showing the collapsed menu, which expands when clicked.


  _createClass(Dropdown, [{
    key: "render",
    value: function render(pm) {
      var _this2 = this;

      var items = renderDropdownItems(resolveGroup(pm, this.content), pm);
      if (!items.length) return;

      var label = this.options.activeLabel && this.findActiveIn(this, pm) || this.options.label;
      label = pm.translate(label);
      var dom = (0, _dom.elt)("div", { class: prefix + "-dropdown " + (this.options.class || ""),
        style: this.options.css,
        title: this.options.title }, label);
      var open = null;
      dom.addEventListener("mousedown", function (e) {
        e.preventDefault();e.stopPropagation();
        if (open && open()) open = null;else open = _this2.expand(pm, dom, items);
      });
      return dom;
    }
  }, {
    key: "select",
    value: function select(pm) {
      return resolveGroup(pm, this.content).some(function (e) {
        return e.select(pm);
      });
    }
  }, {
    key: "expand",
    value: function expand(pm, dom, items) {
      var box = dom.getBoundingClientRect(),
          outer = pm.wrapper.getBoundingClientRect();
      var menuDOM = (0, _dom.elt)("div", { class: prefix + "-dropdown-menu " + (this.options.class || ""),
        style: "left: " + (box.left - outer.left) + "px; top: " + (box.bottom - outer.top) + "px" }, items);

      var done = false;
      function finish() {
        if (done) return;
        done = true;
        pm.off("interaction", finish);
        pm.wrapper.removeChild(menuDOM);
        return true;
      }
      pm.signal("interaction");
      pm.wrapper.appendChild(menuDOM);
      pm.on("interaction", finish);
      return finish;
    }
  }, {
    key: "findActiveIn",
    value: function findActiveIn(element, pm) {
      var items = resolveGroup(pm, element.content);
      for (var i = 0; i < items.length; i++) {
        var cur = items[i];
        if (cur instanceof MenuCommand) {
          var active = cur.command(pm).active(pm);
          if (active) return cur.options.activeLabel;
        } else if (cur instanceof DropdownSubmenu) {
          var found = this.findActiveIn(cur, pm);
          if (found) return found;
        }
      }
    }
  }]);

  return Dropdown;
}();

function renderDropdownItems(items, pm) {
  var rendered = [];
  for (var i = 0; i < items.length; i++) {
    var inner = items[i].render(pm);
    if (inner) rendered.push((0, _dom.elt)("div", { class: prefix + "-dropdown-item" }, inner));
  }
  return rendered;
}

// ;; Represents a submenu wrapping a group of items that start hidden
// and expand to the right when hovered over or tapped.

var DropdownSubmenu = exports.DropdownSubmenu = function () {
  // :: (Object, MenuGroup)
  // Creates a submenu for the given group of menu elements. The
  // following options are recognized:
  //
  // **`label`**`: string`
  //   : The label to show on the submenu.

  function DropdownSubmenu(options, content) {
    _classCallCheck(this, DropdownSubmenu);

    this.options = options || {};
    this.content = content;
  }

  // :: (ProseMirror) → DOMNode
  // Renders the submenu.


  _createClass(DropdownSubmenu, [{
    key: "render",
    value: function render(pm) {
      var items = renderDropdownItems(resolveGroup(pm, this.content), pm);
      if (!items.length) return;

      var label = (0, _dom.elt)("div", { class: prefix + "-submenu-label" }, pm.translate(this.options.label));
      var wrap = (0, _dom.elt)("div", { class: prefix + "-submenu-wrap" }, label, (0, _dom.elt)("div", { class: prefix + "-submenu" }, items));
      label.addEventListener("mousedown", function (e) {
        e.preventDefault();e.stopPropagation();
        wrap.classList.toggle(prefix + "-submenu-wrap-active");
      });
      return wrap;
    }
  }]);

  return DropdownSubmenu;
}();

// :: (ProseMirror, MenuGroup) → [MenuElement]
// Resolve the given `MenuGroup` into a flat array of renderable
// elements.


function resolveGroup(pm, content) {
  var result = void 0,
      isArray = Array.isArray(content);
  for (var i = 0; i < (isArray ? content.length : 1); i++) {
    var cur = isArray ? content[i] : content;
    if (cur instanceof MenuCommandGroup) {
      var elts = cur.get(pm);
      if (!isArray || content.length == 1) return elts;else result = (result || content.slice(0, i)).concat(elts);
    } else if (result) {
      result.push(cur);
    }
  }
  return result || (isArray ? content : [content]);
}

// :: (ProseMirror, [MenuGroup]) → ?DOMFragment
// Render the given menu groups into a document fragment, placing
// separators between them (and ensuring no superfluous separators
// appear when some of the groups turn out to be empty).
function renderGrouped(pm, content) {
  var result = document.createDocumentFragment(),
      needSep = false;
  for (var i = 0; i < content.length; i++) {
    var items = resolveGroup(pm, content[i]),
        added = false;
    for (var j = 0; j < items.length; j++) {
      var rendered = items[j].render(pm);
      if (rendered) {
        if (!added && needSep) result.appendChild(separator());
        result.appendChild((0, _dom.elt)("span", { class: prefix + "item" }, rendered));
        added = true;
      }
    }
    if (added) needSep = true;
  }
  return result;
}

function separator() {
  return (0, _dom.elt)("span", { class: prefix + "separator" });
}

// ;; #path=CommandSpec #kind=interface #noAnchor
// The `menu` module gives meaning to an additional property in
// [command specs](#CommandSpec).

// :: MenuCommandSpec #path=CommandSpec.menu
// Adds the command to a menu group, so that it is picked up by
// `MenuCommandGroup` objects with the matching
// [name](#MenuCommandSpec.name).

// ;; #path=MenuCommandSpec #kind=interface
// Configures the way a command shows up in a menu, when wrapped in a
// `MenuCommand`.

// :: string #path=MenuCommandSpec.group
// Identifies the group this command should be added to (for example
// `"inline"` or `"block"`). Only meaningful when associated with a
// `CommandSpec` (as opposed to passed directly to `MenuCommand`).

// :: number #path=MenuCommandSpec.rank
// Determines the command's position in its group (lower ranks come
// first). Only meaningful in a `CommandSpec`.

// :: Object #path=MenuCommandSpec.display
// Determines how the command is shown in the menu. It may have either
// a `type` property containing one of the strings shown below, or a
// `render` property that, when called with the command and a
// `ProseMirror` instance as arguments, returns a DOM node
// representing the command's menu representation.
//
// **`"icon"`**
//   : Show the command as an icon. The object may have `{path, width,
//     height}` properties, where `path` is an [SVG path
//     spec](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d),
//     and `width` and `height` provide the viewbox in which that path
//     exists. Alternatively, it may have a `text` property specifying
//     a string of text that makes up the icon, with an optional
//     `style` property giving additional CSS styling for the text,
//     _or_ a `dom` property containing a DOM node.
//
// **`"label"`**
//   : Render the command as a label. Mostly useful for commands
//     wrapped in a [drop-down](#Dropdown) or similar menu. The object
//     should have a `label` property providing the text to display.

// :: string #path=MenuCommandSpec.activeLabel
// When used in a `Dropdown` with `activeLabel` enabled, this should
// provide the text shown when the command is active.

// :: string #path=MenuCommandSpec.select
// Controls whether the command's [`select`](#CommandSpec.select)
// method has influence on its appearance. When set to `"hide"`, or
// not given, the command is hidden when it is not selectable. When
// set to `"ignore"`, the `select` method is not called. When set to
// `"disable"`, the command is shown in disabled form when `select`
// returns false.

// :: string #path=MenuCommandSpec.class
// Optionally adds a CSS class to the command's DOM representation.

// :: string #path=MenuCommandSpec.css
// Optionally adds a string of inline CSS to the command's DOM
// representation.

// :: string #path=MenuCommandSpec.execEvent
// Defines which event on the command's DOM representation should
// trigger the execution of the command. Defaults to mousedown.

// :: MenuCommandGroup
// The inline command group.
var inlineGroup = exports.inlineGroup = new MenuCommandGroup("inline");

// :: Dropdown
// The default insert dropdown menu.
var insertMenu = exports.insertMenu = new Dropdown({ label: "Insert" }, new MenuCommandGroup("insert"));

// :: Dropdown
// The default textblock type menu.
var textblockMenu = exports.textblockMenu = new Dropdown({ label: "Type..", displayActive: true, class: "ProseMirror-textblock-dropdown" }, [new MenuCommandGroup("textblock"), new DropdownSubmenu({ label: "Heading" }, new MenuCommandGroup("textblockHeading"))]);

// :: MenuCommandGroup
// The block command group.
var blockGroup = exports.blockGroup = new MenuCommandGroup("block");

// :: MenuCommandGroup
// The history command group.
var historyGroup = exports.historyGroup = new MenuCommandGroup("history");

(0, _dom.insertCSS)("\n\n.ProseMirror-textblock-dropdown {\n  min-width: 3em;\n}\n\n." + prefix + " {\n  margin: 0 -4px;\n  line-height: 1;\n}\n\n.ProseMirror-tooltip ." + prefix + " {\n  width: -webkit-fit-content;\n  width: fit-content;\n  white-space: pre;\n}\n\n." + prefix + "item {\n  margin-right: 3px;\n  display: inline-block;\n}\n\n." + prefix + "separator {\n  border-right: 1px solid #ddd;\n  margin-right: 3px;\n}\n\n." + prefix + "-dropdown, ." + prefix + "-dropdown-menu {\n  font-size: 90%;\n  white-space: nowrap;\n}\n\n." + prefix + "-dropdown {\n  padding: 1px 14px 1px 4px;\n  display: inline-block;\n  vertical-align: 1px;\n  position: relative;\n  cursor: pointer;\n}\n\n." + prefix + "-dropdown:after {\n  content: \"\";\n  border-left: 4px solid transparent;\n  border-right: 4px solid transparent;\n  border-top: 4px solid currentColor;\n  opacity: .6;\n  position: absolute;\n  right: 2px;\n  top: calc(50% - 2px);\n}\n\n." + prefix + "-dropdown-menu, ." + prefix + "-submenu {\n  position: absolute;\n  background: white;\n  color: #666;\n  border: 1px solid #aaa;\n  padding: 2px;\n}\n\n." + prefix + "-dropdown-menu {\n  z-index: 15;\n  min-width: 6em;\n}\n\n." + prefix + "-dropdown-item {\n  cursor: pointer;\n  padding: 2px 8px 2px 4px;\n}\n\n." + prefix + "-dropdown-item:hover {\n  background: #f2f2f2;\n}\n\n." + prefix + "-submenu-wrap {\n  position: relative;\n  margin-right: -4px;\n}\n\n." + prefix + "-submenu-label:after {\n  content: \"\";\n  border-top: 4px solid transparent;\n  border-bottom: 4px solid transparent;\n  border-left: 4px solid currentColor;\n  opacity: .6;\n  position: absolute;\n  right: 4px;\n  top: calc(50% - 4px);\n}\n\n." + prefix + "-submenu {\n  display: none;\n  min-width: 4em;\n  left: 100%;\n  top: -3px;\n}\n\n." + prefix + "-active {\n  background: #eee;\n  border-radius: 4px;\n}\n\n." + prefix + "-active {\n  background: #eee;\n  border-radius: 4px;\n}\n\n." + prefix + "-disabled {\n  opacity: .3;\n}\n\n." + prefix + "-submenu-wrap:hover ." + prefix + "-submenu, ." + prefix + "-submenu-wrap-active ." + prefix + "-submenu {\n  display: block;\n}\n");