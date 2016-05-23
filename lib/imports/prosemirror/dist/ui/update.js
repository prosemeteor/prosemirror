"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.scheduleDOMUpdate = scheduleDOMUpdate;
exports.unscheduleDOMUpdate = unscheduleDOMUpdate;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var UPDATE_TIMEOUT = 50;
var MIN_FLUSH_DELAY = 100;

var CentralScheduler = function () {
  function CentralScheduler(pm) {
    var _this = this;

    _classCallCheck(this, CentralScheduler);

    this.waiting = [];
    this.timeout = null;
    this.lastForce = 0;
    this.pm = pm;
    this.timedOut = function () {
      if (_this.pm.operation) _this.timeout = setTimeout(_this.timedOut, UPDATE_TIMEOUT);else _this.force();
    };
    pm.on("flush", this.onFlush.bind(this));
  }

  _createClass(CentralScheduler, [{
    key: "set",
    value: function set(f) {
      if (this.waiting.length == 0) this.timeout = setTimeout(this.timedOut, UPDATE_TIMEOUT);
      if (this.waiting.indexOf(f) == -1) this.waiting.push(f);
    }
  }, {
    key: "unset",
    value: function unset(f) {
      var index = this.waiting.indexOf(f);
      if (index > -1) this.waiting.splice(index, 1);
    }
  }, {
    key: "force",
    value: function force() {
      clearTimeout(this.timeout);
      this.lastForce = Date.now();

      while (this.waiting.length) {
        for (var i = 0; i < this.waiting.length; i++) {
          var result = this.waiting[i]();
          if (result) this.waiting[i] = result;else this.waiting.splice(i--, 1);
        }
      }
    }
  }, {
    key: "onFlush",
    value: function onFlush() {
      if (this.waiting.length && Date.now() - this.lastForce > MIN_FLUSH_DELAY) this.force();
    }
  }], [{
    key: "get",
    value: function get(pm) {
      return pm.mod.centralScheduler || (pm.mod.centralScheduler = new this(pm));
    }
  }]);

  return CentralScheduler;
}();

// :: (ProseMirror, () -> ?() -> ?())
// Schedule a DOM update function to be called either the next time
// the editor is [flushed](#ProseMirror.flush), or if no flush happens
// immediately, after 200 milliseconds. This is used to synchronize
// DOM updates and read to prevent [DOM layout
// thrashing](http://eloquentjavascript.net/13_dom.html#p_nnTb9RktUT).
//
// Often, your updates will need to both read and write from the DOM.
// To schedule such access in lockstep with other modules, the
// function you give can return another function, which may return
// another function, and so on. The first call should _write_ to the
// DOM, and _not read_. If a _read_ needs to happen, that should be
// done in the function returned from the first call. If that has to
// be followed by another _write_, that should be done in a function
// returned from the second function, and so on.


function scheduleDOMUpdate(pm, f) {
  CentralScheduler.get(pm).set(f);
}

// :: (ProseMirror, () -> ?() -> ?())
// Cancel an update scheduled with `scheduleDOMUpdate`. Calling this with
// a function that is not actually scheduled is harmless.
function unscheduleDOMUpdate(pm, f) {
  CentralScheduler.get(pm).unset(f);
}

// ;; Helper for scheduling updates whenever any of a series of events
// happen.

var UpdateScheduler = exports.UpdateScheduler = function () {
  // :: (ProseMirror, string, () -> ?())
  // Creates an update scheduler for the given editor. `events` should
  // be a space-separated list of event names (for example
  // `"selectionChange change"`). `start` should be a function as
  // expected by `scheduleDOMUpdate`.

  function UpdateScheduler(pm, events, start) {
    var _this2 = this;

    _classCallCheck(this, UpdateScheduler);

    this.pm = pm;
    this.start = start;

    this.events = events.split(" ");
    this.onEvent = this.onEvent.bind(this);
    this.events.forEach(function (event) {
      return pm.on(event, _this2.onEvent);
    });
  }

  // :: ()
  // Detach the event handlers registered by this scheduler.


  _createClass(UpdateScheduler, [{
    key: "detach",
    value: function detach() {
      var _this3 = this;

      unscheduleDOMUpdate(this.pm, this.start);
      this.events.forEach(function (event) {
        return _this3.pm.off(event, _this3.onEvent);
      });
    }
  }, {
    key: "onEvent",
    value: function onEvent() {
      scheduleDOMUpdate(this.pm, this.start);
    }

    // :: ()
    // Force an update. Note that if the editor has scheduled a flush,
    // the update is still delayed until the flush occurs.

  }, {
    key: "force",
    value: function force() {
      if (this.pm.operation) {
        this.onEvent();
      } else {
        unscheduleDOMUpdate(this.pm, this.start);
        for (var run = this.start; run; run = run()) {}
      }
    }
  }]);

  return UpdateScheduler;
}();