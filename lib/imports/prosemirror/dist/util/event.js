"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.eventMixin = eventMixin;
// ;; #path=EventMixin #kind=interface
// A set of methods for objects that emit events. Added by calling
// `eventMixin` on a constructor.

var noHandlers = [];

function getHandlers(obj, type) {
  return obj._handlers && obj._handlers[type] || noHandlers;
}

var methods = {
  // :: (type: string, handler: (...args: [any])) #path=EventMixin.on
  // Register an event handler for the given event type.

  on: function on(type, handler) {
    var map = this._handlers || (this._handlers = Object.create(null));
    map[type] = type in map ? map[type].concat(handler) : [handler];
  },


  // :: (type: string, handler: (...args: [any])) #path=EventMixin.off
  // Unregister an event handler for the given event type.
  off: function off(type, handler) {
    var map = this._handlers,
        arr = map && map[type];
    if (arr) for (var i = 0; i < arr.length; ++i) {
      if (arr[i] == handler) {
        map[type] = arr.slice(0, i).concat(arr.slice(i + 1));
        break;
      }
    }
  },


  // :: (type: string, ...args: [any]) #path=EventMixin.signal
  // Signal an event of the given type, passing any number of
  // arguments. Will call the handlers for the event, passing them the
  // arguments.
  signal: function signal(type) {
    var arr = getHandlers(this, type);

    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    for (var i = 0; i < arr.length; ++i) {
      arr[i].apply(arr, args);
    }
  },


  // :: (type: string, ...args: [any]) → any
  // #path=EventMixin.signalHandleable Signal a handleable event of
  // the given type. All handlers for the event will be called with
  // the given arguments, until one of them returns something that is
  // not the value `null` or `undefined`. When that happens, the
  // return value of that handler is returned. If that does not
  // happen, `undefined` is returned.
  signalHandleable: function signalHandleable(type) {
    var arr = getHandlers(this, type);

    for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }

    for (var i = 0; i < arr.length; ++i) {
      var result = arr[i].apply(arr, args);
      if (result != null) return result;
    }
  },


  // :: (type: string, value: any) → any #path=EventMixin.signalPipelined
  // Give all handlers for an event a chance to transform a value. The
  // value returned from a handler will be passed to the next handler.
  // The method returns the value returned by the final handler (or
  // the original value, if there are no handlers).
  signalPipelined: function signalPipelined(type, value) {
    var arr = getHandlers(this, type);
    for (var i = 0; i < arr.length; ++i) {
      value = arr[i](value);
    }return value;
  },


  // :: (DOMEvent, ?string) → bool
  // Fire all handlers for `event.type` (or override the type name
  // with the `type` parameter), until one of them calls
  // `preventDefault` on the event or returns `true` to indicate it
  // handled the event. Return `true` when one of the handlers handled
  // the event.
  signalDOM: function signalDOM(event, type) {
    var arr = getHandlers(this, type || event.type);
    for (var i = 0; i < arr.length; ++i) {
      if (arr[i](event) || event.defaultPrevented) return true;
    }return false;
  },


  // :: (type: string) → bool #path=EventMixin.hasHandler
  // Query whether there are any handlers for this event type.
  hasHandler: function hasHandler(type) {
    return getHandlers(this, type).length > 0;
  }
};

// :: (())
// Add the methods in the `EventMixin` interface to the prototype
// object of the given constructor.
function eventMixin(ctor) {
  var proto = ctor.prototype;
  for (var prop in methods) {
    if (methods.hasOwnProperty(prop)) proto[prop] = methods[prop];
  }
}