"use strict";

var _model = require("../model");

var _failure = require("./failure");

var _tests = require("./tests");

var _build = require("./build");

function assert(name, value) {
    if (!value) throw new _failure.Failure("Assertion failed: " + name);
}

var em_ = _model.defaultSchema.mark("em");
var strong = _model.defaultSchema.mark("strong");
var link = function link(href, title) {
    return _model.defaultSchema.mark("link", { href: href, title: title });
};
var code = _model.defaultSchema.mark("code");

(0, _tests.defTest)("mark_same", function () {
    assert("empty", _model.Mark.sameSet([], []));
    assert("two", _model.Mark.sameSet([em_, strong], [em_, strong]));
    assert("diff set", !_model.Mark.sameSet([em_, strong], [em_, code]));
    assert("diff size", !_model.Mark.sameSet([em_, strong], [em_, strong, code]));
    assert("links", link("http://foo").eq(link("http://foo")));
    assert("diff links", !link("http://foo").eq(link("http://bar")));
    assert("diff title", !link("http://foo", "A").eq(link("http://foo", "B")));
    assert("link in set", _model.Mark.sameSet([link("http://foo"), code], [link("http://foo"), code]));
    assert("diff link in set", !_model.Mark.sameSet([link("http://foo"), code], [link("http://bar"), code]));
});

(0, _tests.defTest)("mark_add", function () {
    assert("from empty", em_.addToSet([]), [em_]);
    assert("duplicate", em_.addToSet([em_]), [em_]);
    assert("at start", em_.addToSet([strong]), [em_, strong]);
    assert("at end", strong.addToSet([em_]), [em_, strong]);
    assert("replace link", link("http://bar").addToSet([em_, link("http://foo")]), [em_, link("http://bar")]);
    assert("same link", link("http://foo").addToSet([em_, link("http://foo")]), [em_, link("http://foo")]);
    assert("code at end", code.addToSet([em_, strong, link("http://foo")]), [em_, strong, link("http://foo"), code]);
    assert("strong in middle", strong.addToSet([em_, code]), [em_, strong, code]);
});

(0, _tests.defTest)("mark_remove", function () {
    assert("empty", em_.removeFromSet([]), []);
    assert("single", em_.removeFromSet([em_]), []), assert("not in set", strong.removeFromSet([em_]), [em_]);
    assert("link", link("http://foo").removeFromSet([link("http://foo")]), []);
    assert("different link", link("http://foo", "title").removeFromSet([link("http://foo")]), [link("http://foo")]);
});

function has(name, doc, mark, result) {
    (0, _tests.defTest)("has_mark_" + name, function () {
        if (mark.isInSet(doc.marksAt(doc.tag.a)) != result) throw new _failure.Failure("hasMark(" + doc + ", " + doc.tag.a + ", " + mark.type.name + ") returned " + !result);
    });
}

has("simple", (0, _build.doc)((0, _build.p)((0, _build.em)("fo<a>o"))), em_, true);
has("simple_not", (0, _build.doc)((0, _build.p)((0, _build.em)("fo<a>o"))), strong, false);
has("after", (0, _build.doc)((0, _build.p)((0, _build.em)("hi"), "<a> there")), em_, true);
has("before", (0, _build.doc)((0, _build.p)("one <a>", (0, _build.em)("two"))), em_, false);
has("start", (0, _build.doc)((0, _build.p)((0, _build.em)("<a>one"))), em_, true);
has("different_link", (0, _build.doc)((0, _build.p)((0, _build.a)("li<a>nk"))), link("http://baz"), false);