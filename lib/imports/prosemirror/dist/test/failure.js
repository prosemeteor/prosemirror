"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Failure = Failure;
function Failure(message) {
  this.message = message;
  this.stack = new Error(message).stack;
}
Failure.prototype = Object.create(Error.prototype);
Failure.prototype.name = "Failure";