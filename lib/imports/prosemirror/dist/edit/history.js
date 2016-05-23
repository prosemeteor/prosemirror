"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.History = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _transform = require("../transform");

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// ProseMirror's history implements not a way to roll back to a
// previous state, because ProseMirror supports applying changes
// without adding them to the history (for example during
// collaboration).
//
// To this end, each 'Branch' (one for the undo history and one for
// the redo history) keeps an array of 'Items', which can optionally
// hold a step (an actual undoable change), and always hold a position
// map (which is needed to move changes below them to apply to the
// current document).
//
// An item that has both a step and a selection token field is the
// start of an 'event' -- a group of changes that will be undone or
// redone at once. (It stores only a token, since that way we don't
// have to provide a document until the selection is actually applied,
// which is useful when compressing.)

// Used to schedule history compression
var max_empty_items = 500;

var Branch = function () {
  function Branch(maxEvents) {
    _classCallCheck(this, Branch);

    this.events = 0;
    this.maxEvents = maxEvents;
    // Item 0 is always a dummy that's only used to have an id to
    // refer to at the start of the history.
    this.items = [new Item()];
  }

  // : (Node, bool, ?Item) → ?{transform: Transform, selection: SelectionToken, ids: [number]}
  // Pop the latest event off the branch's history and apply it
  // to a document transform, returning the transform and the step IDs.


  _createClass(Branch, [{
    key: "popEvent",
    value: function popEvent(doc, preserveItems, upto) {
      var preserve = preserveItems,
          transform = new _transform.Transform(doc);
      var remap = new BranchRemapping();
      var selection = void 0,
          ids = [],
          i = this.items.length;

      for (;;) {
        var cur = this.items[--i];
        if (upto && cur == upto) break;
        if (!cur.map) return null;

        if (!cur.step) {
          remap.add(cur);
          preserve = true;
          continue;
        }

        if (preserve) {
          var step = cur.step.map(remap.remap),
              map = void 0;

          this.items[i] = new MapItem(cur.map);
          if (step && transform.maybeStep(step).doc) {
            map = transform.maps[transform.maps.length - 1];
            this.items.push(new MapItem(map, this.items[i].id));
          }
          remap.movePastStep(cur, map);
        } else {
          this.items.pop();
          transform.maybeStep(cur.step);
        }

        ids.push(cur.id);
        if (cur.selection) {
          this.events--;
          if (!upto) {
            selection = cur.selection.type.mapToken(cur.selection, remap.remap);
            break;
          }
        }
      }

      return { transform: transform, selection: selection, ids: ids };
    }
  }, {
    key: "clear",
    value: function clear() {
      this.items.length = 1;
      this.events = 0;
    }

    // : (Transform, Selection, ?[number])
    // Create a new branch with the given transform added.

  }, {
    key: "addTransform",
    value: function addTransform(transform, selection, ids) {
      for (var i = 0; i < transform.steps.length; i++) {
        var step = transform.steps[i].invert(transform.docs[i]);
        this.items.push(new StepItem(transform.maps[i], ids && ids[i], step, selection));
        if (selection) {
          this.events++;
          selection = null;
        }
      }
      if (this.events > this.maxEvents) this.clip();
    }

    // Clip this branch to the max number of events.

  }, {
    key: "clip",
    value: function clip() {
      var seen = 0,
          toClip = this.events - this.maxEvents;
      for (var i = 0;; i++) {
        var cur = this.items[i];
        if (cur.selection) {
          if (seen < toClip) {
            ++seen;
          } else {
            this.items.splice(0, i, new Item(null, this.events[toClip - 1]));
            this.events = this.maxEvents;
            return;
          }
        }
      }
    }
  }, {
    key: "addMaps",
    value: function addMaps(array) {
      if (this.events == 0) return;
      for (var i = 0; i < array.length; i++) {
        this.items.push(new MapItem(array[i]));
      }
    }
  }, {
    key: "findChangeID",
    value: function findChangeID(id) {
      if (id == this.items[0].id) return this.items[0];

      for (var i = this.items.length - 1; i >= 0; i--) {
        var cur = this.items[i];
        if (cur.step) {
          if (cur.id == id) return cur;
          if (cur.id < id) return null;
        }
      }
    }

    // : ([PosMap], Transform, [number])
    // When the collab module receives remote changes, the history has
    // to know about those, so that it can adjust the steps that were
    // rebased on top of the remote changes, and include the position
    // maps for the remote changes in its array of items.

  }, {
    key: "rebased",
    value: function rebased(newMaps, rebasedTransform, positions) {
      if (this.events == 0) return;

      var rebasedItems = [],
          start = this.items.length - positions.length,
          startPos = 0;
      if (start < 1) {
        startPos = 1 - start;
        start = 1;
        this.items[0] = new Item();
      }

      if (positions.length) {
        var remap = new _transform.Remapping([], newMaps.slice());
        for (var iItem = start, iPosition = startPos; iItem < this.items.length; iItem++) {
          var item = this.items[iItem],
              pos = positions[iPosition++],
              id = void 0;
          if (pos != -1) {
            var map = rebasedTransform.maps[pos];
            if (item.step) {
              var step = rebasedTransform.steps[pos].invert(rebasedTransform.docs[pos]);
              var selection = item.selection && item.selection.type.mapToken(item.selection, remap);
              rebasedItems.push(new StepItem(map, item.id, step, selection));
            } else {
              rebasedItems.push(new MapItem(map));
            }
            id = remap.addToBack(map);
          }
          remap.addToFront(item.map.invert(), id);
        }

        this.items.length = start;
      }

      for (var i = 0; i < newMaps.length; i++) {
        this.items.push(new MapItem(newMaps[i]));
      }for (var _i = 0; _i < rebasedItems.length; _i++) {
        this.items.push(rebasedItems[_i]);
      }if (!this.compressing && this.emptyItems(start) + newMaps.length > max_empty_items) this.compress(start + newMaps.length);
    }
  }, {
    key: "emptyItems",
    value: function emptyItems(upto) {
      var count = 0;
      for (var i = 1; i < upto; i++) {
        if (!this.items[i].step) count++;
      }return count;
    }

    // Compressing a branch means rewriting it to push the air (map-only
    // items) out. During collaboration, these naturally accumulate
    // because each remote change adds one. The `upto` argument is used
    // to ensure that only the items below a given level are compressed,
    // because `rebased` relies on a clean, untouched set of items in
    // order to associate old ids to rebased steps.

  }, {
    key: "compress",
    value: function compress(upto) {
      var remap = new BranchRemapping();
      var items = [],
          events = 0;
      for (var i = this.items.length - 1; i >= 0; i--) {
        var item = this.items[i];
        if (i >= upto) {
          items.push(item);
        } else if (item.step) {
          var step = item.step.map(remap.remap),
              map = step && step.posMap();
          remap.movePastStep(item, map);
          if (step) {
            var selection = item.selection && item.selection.type.mapToken(item.selection, remap.remap);
            items.push(new StepItem(map.invert(), item.id, step, selection));
            if (selection) events++;
          }
        } else if (item.map) {
          remap.add(item);
        } else {
          items.push(item);
        }
      }
      this.items = items.reverse();
      this.events = events;
    }
  }, {
    key: "toString",
    value: function toString() {
      return this.items.join("\n");
    }
  }, {
    key: "changeID",
    get: function get() {
      for (var i = this.items.length - 1; i > 0; i--) {
        if (this.items[i].step) return this.items[i].id;
      }return this.items[0].id;
    }
  }]);

  return Branch;
}();

// History items all have ids, but the meaning of these is somewhat
// complicated.
//
// - For StepItems, the ids are kept ordered (inside a given branch),
//   and are kept associated with a given change (if you undo and then
//   redo it, the resulting item gets the old id)
//
// - For MapItems, the ids are just opaque identifiers, not
//   necessarily ordered.
//
// - The placeholder item at the base of a branch's list


var nextID = 1;

var Item = function () {
  function Item(map, id) {
    _classCallCheck(this, Item);

    this.map = map;
    this.id = id || nextID++;
  }

  _createClass(Item, [{
    key: "toString",
    value: function toString() {
      return this.id + ":" + (this.map || "") + (this.step ? ":" + this.step : "") + (this.mirror != null ? "->" + this.mirror : "");
    }
  }]);

  return Item;
}();

var StepItem = function (_Item) {
  _inherits(StepItem, _Item);

  function StepItem(map, id, step, selection) {
    _classCallCheck(this, StepItem);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(StepItem).call(this, map, id));

    _this.step = step;
    _this.selection = selection;
    return _this;
  }

  return StepItem;
}(Item);

var MapItem = function (_Item2) {
  _inherits(MapItem, _Item2);

  function MapItem(map, mirror) {
    _classCallCheck(this, MapItem);

    var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(MapItem).call(this, map));

    _this2.mirror = mirror;
    return _this2;
  }

  return MapItem;
}(Item);

// Assists with remapping a step with other changes that have been
// made since the step was first applied.


var BranchRemapping = function () {
  function BranchRemapping() {
    _classCallCheck(this, BranchRemapping);

    this.remap = new _transform.Remapping();
    this.mirrorBuffer = Object.create(null);
  }

  _createClass(BranchRemapping, [{
    key: "add",
    value: function add(item) {
      var id = this.remap.addToFront(item.map, this.mirrorBuffer[item.id]);
      if (item.mirror != null) this.mirrorBuffer[item.mirror] = id;
      return id;
    }
  }, {
    key: "movePastStep",
    value: function movePastStep(item, map) {
      var id = this.add(item);
      if (map) this.remap.addToBack(map, id);
    }
  }]);

  return BranchRemapping;
}();

// ;; An undo/redo history manager for an editor instance.


var History = exports.History = function () {
  function History(pm) {
    _classCallCheck(this, History);

    this.pm = pm;

    this.done = new Branch(pm.options.historyDepth);
    this.undone = new Branch(pm.options.historyDepth);

    this.lastAddedAt = 0;
    this.ignoreTransform = false;
    this.preserveItems = 0;

    pm.on("transform", this.recordTransform.bind(this));
  }

  // : (Transform, Selection, Object)
  // Record a transformation in undo history.


  _createClass(History, [{
    key: "recordTransform",
    value: function recordTransform(transform, selection, options) {
      if (this.ignoreTransform) return;

      if (options.addToHistory == false) {
        this.done.addMaps(transform.maps);
        this.undone.addMaps(transform.maps);
      } else {
        var now = Date.now();
        // Group transforms that occur in quick succession into one event.
        var newGroup = now > this.lastAddedAt + this.pm.options.historyEventDelay;
        this.done.addTransform(transform, newGroup ? selection.token : null);
        this.undone.clear();
        this.lastAddedAt = now;
      }
    }

    // :: () → bool
    // Undo one history event. The return value indicates whether
    // anything was actually undone. Note that in a collaborative
    // context, or when changes are [applied](#ProseMirror.apply)
    // without adding them to the history, it is possible for
    // [`undoDepth`](#History.undoDepth) to have a positive value, but
    // this method to still return `false`, when non-history changes
    // overwrote all remaining changes in the history.

  }, {
    key: "undo",
    value: function undo() {
      return this.shift(this.done, this.undone);
    }

    // :: () → bool
    // Redo one history event. The return value indicates whether
    // anything was actually redone.

  }, {
    key: "redo",
    value: function redo() {
      return this.shift(this.undone, this.done);
    }

    // :: number
    // The amount of undoable events available.

  }, {
    key: "shift",


    // : (Branch, Branch) → bool
    // Apply the latest event from one branch to the document and optionally
    // shift the event onto the other branch. Returns true when an event could
    // be shifted.
    value: function shift(from, to) {
      var pop = from.popEvent(this.pm.doc, this.preserveItems > 0);
      if (!pop) return false;
      var selectionBeforeTransform = this.pm.selection;

      if (!pop.transform.steps.length) return this.shift(from, to);

      var selection = pop.selection.type.fromToken(pop.selection, pop.transform.doc);
      this.applyIgnoring(pop.transform, selection);

      // Store the selection before transform on the event so that
      // it can be reapplied if the event is undone or redone (e.g.
      // redoing a character addition should place the cursor after
      // the character).
      to.addTransform(pop.transform, selectionBeforeTransform.token, pop.ids);

      this.lastAddedAt = 0;

      return true;
    }
  }, {
    key: "applyIgnoring",
    value: function applyIgnoring(transform, selection) {
      this.ignoreTransform = true;
      this.pm.apply(transform, { selection: selection, filter: false });
      this.ignoreTransform = false;
    }

    // :: () → Object
    // Get the current ‘version’ of the editor content. This can be used
    // to later [check](#History.isAtVersion) whether anything changed, or
    // to [roll back](#History.backToVersion) to this version.

  }, {
    key: "getVersion",
    value: function getVersion() {
      return this.done.changeID;
    }

    // :: (Object) → bool
    // Returns `true` when the editor history is in the state that it
    // was when the given [version](#History.getVersion) was recorded.
    // That means either no changes were made, or changes were
    // done/undone and then undone/redone again.

  }, {
    key: "isAtVersion",
    value: function isAtVersion(version) {
      return this.done.changeID == version;
    }

    // :: (Object) → bool
    // Rolls back all changes made since the given
    // [version](#History.getVersion) was recorded. Returns `false` if
    // that version was no longer found in the history, and thus the
    // action could not be completed.

  }, {
    key: "backToVersion",
    value: function backToVersion(version) {
      var found = this.done.findChangeID(version);
      if (!found) return false;

      var _done$popEvent = this.done.popEvent(this.pm.doc, this.preserveItems > 0, found);

      var transform = _done$popEvent.transform;

      this.applyIgnoring(transform);
      this.undone.clear();
      return true;
    }

    // Used by the collab module to tell the history that some of its
    // content has been rebased.

  }, {
    key: "rebased",
    value: function rebased(newMaps, rebasedTransform, positions) {
      this.done.rebased(newMaps, rebasedTransform, positions);
      this.undone.rebased(newMaps, rebasedTransform, positions);
    }
  }, {
    key: "undoDepth",
    get: function get() {
      return this.done.events;
    }

    // :: number
    // The amount of redoable events available.

  }, {
    key: "redoDepth",
    get: function get() {
      return this.undone.events;
    }
  }]);

  return History;
}();