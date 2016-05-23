"use strict";

var _edit = require("../../edit");

var _def = require("./def");

var _cmp = require("../cmp");

var test = (0, _def.namespace)("options");

(0, _edit.defineOption)("testOption", "default", function (pm, val, oldVal, isInit) {
  pm.mod.testOption = { val: val, oldVal: oldVal, isInit: isInit };
});

test("given_value", function (pm) {
  (0, _cmp.cmp)(pm.mod.testOption.val, "given");
  (0, _cmp.cmp)(pm.getOption("testOption"), "given");
  (0, _cmp.cmp)(pm.mod.testOption.isInit, true);
  (0, _cmp.cmp)(pm.mod.testOption.oldVal, null);
}, { testOption: "given" });

test("default_value", function (pm) {
  (0, _cmp.cmp)(pm.mod.testOption.val, "default");
  (0, _cmp.cmp)(pm.getOption("testOption"), "default");
  (0, _cmp.cmp)(pm.mod.testOption.isInit, true);
});

test("updated_value", function (pm) {
  pm.setOption("testOption", "updated");
  (0, _cmp.cmp)(pm.mod.testOption.val, "updated");
  (0, _cmp.cmp)(pm.getOption("testOption"), "updated");
  (0, _cmp.cmp)(pm.mod.testOption.isInit, false);
  (0, _cmp.cmp)(pm.mod.testOption.oldVal, "default");
});

(0, _edit.defineOption)("testOptionNoInit", "default", function (pm) {
  pm.mod.testOptionNoInitUpdated = true;
}, false);

test("no_init", function (pm) {
  (0, _cmp.cmp)(pm.mod.testOptionNoInitUpdated, undefined);
  pm.setOption("testOptionNoInit", "updated");
  (0, _cmp.cmp)(pm.mod.testOptionNoInitUpdated, true);
});

test("invalid_option", function (pm) {
  var error;
  try {
    pm.setOption("doesNotExist", "isInvalid");
  } catch (e) {
    error = e;
  }
  (0, _cmp.cmp)(pm.getOption("doesNotExist"), undefined);
  (0, _cmp.cmp)(error.message, "Option 'doesNotExist' is not defined");
});