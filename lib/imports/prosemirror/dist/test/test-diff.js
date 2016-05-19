"use strict";

var _model = require("../model");

var _build = require("./build");

var _tests = require("./tests");

var _cmp = require("./cmp");

var _failure = require("./failure");

function t(name, type, a, b, pos) {
    (0, _tests.defTest)("diff_" + type + "_" + name, function () {
        var result = void 0;
        if (type == "start") {
            result = (0, _model.findDiffStart)(a.content, b.content);
        } else {
            var found = (0, _model.findDiffEnd)(a.content, b.content);
            result = found && found.a;
        }
        if (pos == null) {
            if (result != null) throw new _failure.Failure("Unexpectedly found a difference");
        } else {
            if (result == null) throw new _failure.Failure("Unexpectedly found no difference");
            (0, _cmp.cmpStr)(result, pos);
        }
    });
}

function sta(name, a, b) {
    t(name, "start", a, b, a.tag.a);
}
function end(name, a, b) {
    t(name, "end", a, b, a.tag.a);
}

sta("none", (0, _build.doc)((0, _build.p)("a", (0, _build.em)("b")), (0, _build.p)("hello"), (0, _build.blockquote)((0, _build.h1)("bye"))), (0, _build.doc)((0, _build.p)("a", (0, _build.em)("b")), (0, _build.p)("hello"), (0, _build.blockquote)((0, _build.h1)("bye"))));

sta("at_end_longer", (0, _build.doc)((0, _build.p)("a", (0, _build.em)("b")), (0, _build.p)("hello"), (0, _build.blockquote)((0, _build.h1)("bye")), "<a>"), (0, _build.doc)((0, _build.p)("a", (0, _build.em)("b")), (0, _build.p)("hello"), (0, _build.blockquote)((0, _build.h1)("bye")), (0, _build.p)("oops")));

sta("at_end_shorter", (0, _build.doc)((0, _build.p)("a", (0, _build.em)("b")), (0, _build.p)("hello"), (0, _build.blockquote)((0, _build.h1)("bye")), "<a>", (0, _build.p)("oops")), (0, _build.doc)((0, _build.p)("a", (0, _build.em)("b")), (0, _build.p)("hello"), (0, _build.blockquote)((0, _build.h1)("bye"))));

sta("diff_styles", (0, _build.doc)((0, _build.p)("a<a>", (0, _build.em)("b"))), (0, _build.doc)((0, _build.p)("a", (0, _build.strong)("b"))));

sta("longer_text", (0, _build.doc)((0, _build.p)("foo<a>bar", (0, _build.em)("b"))), (0, _build.doc)((0, _build.p)("foo", (0, _build.em)("b"))));

sta("different_text", (0, _build.doc)((0, _build.p)("foo<a>bar")), (0, _build.doc)((0, _build.p)("foocar")));

sta("different_node", (0, _build.doc)((0, _build.p)("a"), "<a>", (0, _build.p)("b")), (0, _build.doc)((0, _build.p)("a"), (0, _build.h1)("b")));

sta("at_start", (0, _build.doc)("<a>", (0, _build.p)("b")), (0, _build.doc)((0, _build.h1)("b")));

end("none", (0, _build.doc)((0, _build.p)("a", (0, _build.em)("b")), (0, _build.p)("hello"), (0, _build.blockquote)((0, _build.h1)("bye"))), (0, _build.doc)((0, _build.p)("a", (0, _build.em)("b")), (0, _build.p)("hello"), (0, _build.blockquote)((0, _build.h1)("bye"))));

end("at_start_longer", (0, _build.doc)("<a>", (0, _build.p)("a", (0, _build.em)("b")), (0, _build.p)("hello"), (0, _build.blockquote)((0, _build.h1)("bye"))), (0, _build.doc)((0, _build.p)("oops"), (0, _build.p)("a", (0, _build.em)("b")), (0, _build.p)("hello"), (0, _build.blockquote)((0, _build.h1)("bye"))));

end("at_start_shorter", (0, _build.doc)((0, _build.p)("oops"), "<a>", (0, _build.p)("a", (0, _build.em)("b")), (0, _build.p)("hello"), (0, _build.blockquote)((0, _build.h1)("bye"))), (0, _build.doc)((0, _build.p)("a", (0, _build.em)("b")), (0, _build.p)("hello"), (0, _build.blockquote)((0, _build.h1)("bye"))));

end("diff_styles", (0, _build.doc)((0, _build.p)("a", (0, _build.em)("b"), "<a>c")), (0, _build.doc)((0, _build.p)("a", (0, _build.strong)("b"), "c")));

end("longer_text", (0, _build.doc)((0, _build.p)("bar<a>foo", (0, _build.em)("b"))), (0, _build.doc)((0, _build.p)("foo", (0, _build.em)("b"))));

end("different_text", (0, _build.doc)((0, _build.p)("foob<a>ar")), (0, _build.doc)((0, _build.p)("foocar")));

end("different_node", (0, _build.doc)((0, _build.p)("a"), "<a>", (0, _build.p)("b")), (0, _build.doc)((0, _build.h1)("a"), (0, _build.p)("b")));

end("at_end", (0, _build.doc)((0, _build.p)("b"), "<a>"), (0, _build.doc)((0, _build.h1)("b")));

end("similar_start", (0, _build.doc)("<a>", (0, _build.p)("hello")), (0, _build.doc)((0, _build.p)("hey"), (0, _build.p)("hello")));