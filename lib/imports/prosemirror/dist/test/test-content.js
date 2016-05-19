"use strict";

var _content = require("../model/content");

var _model = require("../model");

var _tests = require("./tests");

var _build = require("./build");

var _cmp = require("./cmp");

function get(expr) {
      return _content.ContentExpr.parse(_model.defaultSchema.nodes.heading, expr, _model.defaultSchema.spec.groups);
}

function val(value) {
      return value.attr ? "." + value.attr : value;
}

function simplify(elt) {
      var attrs = null;
      if (elt.attrs) {
            attrs = {};
            for (var attr in elt.attrs) {
                  attrs[attr] = val(elt.attrs[attr]);
            }
      }
      return { types: elt.nodeTypes.map(function (t) {
                  return t.name;
            }).sort(),
            attrs: attrs,
            marks: Array.isArray(elt.marks) ? elt.marks.map(function (m) {
                  return m.name;
            }) : elt.marks,
            min: val(elt.min), max: elt.max == 2e9 ? Infinity : val(elt.max) };
}

function normalize(obj) {
      return { types: obj.types.sort(),
            attrs: obj.attrs || null,
            marks: obj.marks || false,
            min: obj.min == null ? 1 : obj.min,
            max: obj.max == null ? 1 : obj.max };
}

function parse(name, expr) {
      for (var _len = arguments.length, expected = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
            expected[_key - 2] = arguments[_key];
      }

      (0, _tests.defTest)("content_parse_" + name, function () {
            (0, _cmp.cmp)(JSON.stringify(get(expr).elements.map(simplify)), JSON.stringify(expected.map(normalize)));
      });
}

parse("plain", "paragraph", { types: ["paragraph"] });
parse("sequence", "heading paragraph heading", { types: ["heading"] }, { types: ["paragraph"] }, { types: ["heading"] });

parse("one_or_more", "paragraph+", { types: ["paragraph"], max: Infinity });
parse("zero_or_more", "paragraph*", { types: ["paragraph"], min: 0, max: Infinity });
parse("optional", "paragraph?", { types: ["paragraph"], min: 0, max: 1 });

parse("string_attr", "image[title=\"foo\"]*", { types: ["image"], attrs: { title: "foo" }, min: 0, max: Infinity });
parse("num_attr", "heading[level=2]*", { types: ["heading"], attrs: { level: 2 }, min: 0, max: Infinity });
parse("multi_attr", "image[title=\"foo\", href=\"bar\"]*", { types: ["image"], attrs: { title: "foo", href: "bar" }, min: 0, max: Infinity });
parse("attr_attr", "heading[level=.level]*", { types: ["heading"], attrs: { level: ".level" }, min: 0, max: Infinity });

parse("all_marks", "text<_>", { types: ["text"], marks: true });
parse("some_marks", "text<strong em>", { types: ["text"], marks: ["strong", "em"] });

parse("set", "(text | image | hard_break)", { types: ["text", "image", "hard_break"] });
parse("set_repeat", "(text | image | hard_break)+", { types: ["text", "image", "hard_break"], max: Infinity });
parse("group", "inline*", { types: ["image", "text", "hard_break"], min: 0, max: Infinity });

parse("range_count", "paragraph{2}", { types: ["paragraph"], min: 2, max: 2 });
parse("range_between", "paragraph{2, 5}", { types: ["paragraph"], min: 2, max: 5 });
parse("range_open", "paragraph{2,}", { types: ["paragraph"], min: 2, max: Infinity });

parse("range_attr", "paragraph{.level}", { types: ["paragraph"], min: ".level", max: ".level" });

function parseFail(name, expr) {
      (0, _tests.defTest)("content_parse_fail_" + name, function () {
            try {
                  _content.ContentExpr.parse(_model.defaultSchema.nodes.heading, expr, _model.defaultSchema.spec.groups);
                  (0, _cmp.is)(false, "parsing succeeded");
            } catch (e) {
                  if (!(e instanceof SyntaxError)) throw e;
            }
      });
}

parseFail("invalid_char", "paragraph/image");
parseFail("adjacent", "paragraph paragraph");
parseFail("adjacent_set", "inline image");
parseFail("bad_attr", "hard_break{.foo}");
parseFail("bad_node", "foo+");
parseFail("bad_mark", "hard_break<bar>");
parseFail("weird_mark", "image<_ em>");
parseFail("trailing_noise", "hard_break+ text* .");
parseFail("zero_times", "image{0}");

var attrs = { level: 3 };

function testValid(expr, frag, isValid) {
      (0, _cmp.cmp)(get(expr).matches(attrs, frag.content), isValid);
}

function valid(name, expr, frag) {
      (0, _tests.defTest)("content_valid_" + name, function () {
            return testValid(expr, frag, true);
      });
}
function invalid(name, expr, frag) {
      (0, _tests.defTest)("content_invalid_" + name, function () {
            return testValid(expr, frag, false);
      });
}

valid("nothing_empty", "", (0, _build.p)());
invalid("nothing_non_empty", "", (0, _build.p)(_build.img));

valid("star_empty", "image*", (0, _build.p)());
valid("star_one", "image*", (0, _build.p)(_build.img));
valid("star_multiple", "image*", (0, _build.p)(_build.img, _build.img, _build.img, _build.img, _build.img));
invalid("star_different", "image*", (0, _build.p)(_build.img, "text"));

valid("group", "inline", (0, _build.p)(_build.img));
invalid("group", "inline", (0, _build.doc)((0, _build.p)()));
valid("star_group", "inline*", (0, _build.p)(_build.img, "text"));
valid("set", "(paragraph | heading)", (0, _build.doc)((0, _build.p)()));
invalid("set", "(paragraph | heading)", (0, _build.p)(_build.img));

valid("seq_simple", "paragraph horizontal_rule paragraph", (0, _build.p)((0, _build.p)(), _build.hr, (0, _build.p)()));
invalid("seq_too_long", "paragraph horizontal_rule", (0, _build.p)((0, _build.p)(), _build.hr, (0, _build.p)()));
invalid("seq_too_short", "paragraph horizontal_rule paragraph", (0, _build.p)((0, _build.p)(), _build.hr));
invalid("seq_wrong_start", "paragraph horizontal_rule", (0, _build.p)(_build.hr, (0, _build.p)(), _build.hr));

valid("seq_star_single", "heading paragraph*", (0, _build.doc)((0, _build.h1)()));
valid("seq_star_multiple", "heading paragraph*", (0, _build.doc)((0, _build.h1)(), (0, _build.p)(), (0, _build.p)()));
valid("seq_plus_one", "heading paragraph+", (0, _build.doc)((0, _build.h1)(), (0, _build.p)()));
valid("seq_plus_two", "heading paragraph+", (0, _build.doc)((0, _build.h1)(), (0, _build.p)(), (0, _build.p)()));
invalid("seq_plus_none", "heading paragraph+", (0, _build.doc)((0, _build.h1)()));
invalid("seq_plus_start_missing", "heading paragraph+", (0, _build.doc)((0, _build.p)(), (0, _build.p)()));
valid("opt_present", "image?", (0, _build.p)(_build.img));
valid("opt_not_present", "image?", (0, _build.p)());
invalid("opt_two", "image?", (0, _build.p)(_build.img, _build.img));

valid("count_ok", "hard_break{2}", (0, _build.p)(_build.br, _build.br));
invalid("count_too_few", "hard_break{2}", (0, _build.p)(_build.br));
invalid("count_too_many", "hard_break{2}", (0, _build.p)(_build.br, _build.br, _build.br));
valid("range_lower_bound", "hard_break{2, 4}", (0, _build.p)(_build.br, _build.br));
valid("range_upper_bound", "hard_break{2, 4}", (0, _build.p)(_build.br, _build.br, _build.br, _build.br));
invalid("range_too_few", "hard_break{2, 4}", (0, _build.p)(_build.br));
invalid("range_too_many", "hard_break{2, 4}", (0, _build.p)(_build.br, _build.br, _build.br, _build.br, _build.br));
invalid("range_bad_after", "hard_break{2, 4} text*", (0, _build.p)(_build.br, _build.br, _build.img));
valid("range_good_after", "hard_break{2, 4} image?", (0, _build.p)(_build.br, _build.br, _build.img));
valid("open_range_lower_bound", "hard_break{2,}", (0, _build.p)(_build.br, _build.br));
valid("open_range_many", "hard_break{2,}", (0, _build.p)(_build.br, _build.br, _build.br, _build.br, _build.br));
invalid("open_range_too_few", "hard_break{2,}", (0, _build.p)(_build.br));

valid("mark_ok", "heading[level=2]", (0, _build.doc)((0, _build.h2)()));
invalid("mark_mismatch", "heading[level=2]", (0, _build.doc)((0, _build.h1)()));

valid("mark_all", "hard_break<_>", (0, _build.p)((0, _build.em)(_build.br)));
invalid("mark_none", "hard_break", (0, _build.p)((0, _build.em)(_build.br)));
valid("mark_some", "hard_break<em strong>", (0, _build.p)((0, _build.em)(_build.br)));
invalid("mark_some", "hard_break<code strong>", (0, _build.p)((0, _build.em)(_build.br)));

valid("count_attr", "hard_break{.level}", (0, _build.p)(_build.br, _build.br, _build.br));
invalid("count_attr", "hard_break{.level}", (0, _build.p)(_build.br, _build.br));

function fill(name, expr, before, after, result) {
      (0, _tests.defTest)("content_fill_" + name, function () {
            var filled = get(expr).getMatchAt(attrs, before.content).fillBefore(after.content, true);
            if (result) (0, _cmp.is)(filled, "Failed unexpectedly"), (0, _cmp.cmpNode)(filled, result.content);else (0, _cmp.is)(!filled, "Succeeded unexpectedly");
      });
}

fill("simple_seq_nothing", "paragraph horizontal_rule paragraph", (0, _build.doc)((0, _build.p)(), _build.hr), (0, _build.doc)((0, _build.p)()), (0, _build.doc)());
fill("simple_seq_one", "paragraph horizontal_rule paragraph", (0, _build.doc)((0, _build.p)()), (0, _build.doc)((0, _build.p)()), (0, _build.doc)(_build.hr));

fill("star_both_sides", "hard_break*", (0, _build.p)(_build.br), (0, _build.p)(_build.br), (0, _build.p)());
fill("star_only_left", "hard_break*", (0, _build.p)(_build.br), (0, _build.p)(), (0, _build.p)());
fill("star_only_right", "hard_break*", (0, _build.p)(), (0, _build.p)(_build.br), (0, _build.p)());
fill("star_neither", "hard_break*", (0, _build.p)(), (0, _build.p)(), (0, _build.p)());
fill("plus_both_sides", "hard_break+", (0, _build.p)(_build.br), (0, _build.p)(_build.br), (0, _build.p)());
fill("plus_neither", "hard_break+", (0, _build.p)(), (0, _build.p)(), (0, _build.p)(_build.br));
fill("plus_mismatch", "hard_break+", (0, _build.p)(), (0, _build.p)(_build.img), null);

fill("seq_stars", "heading* paragraph*", (0, _build.doc)((0, _build.h1)()), (0, _build.doc)((0, _build.p)()), (0, _build.doc)());
fill("seq_stars_empty_after", "heading* paragraph*", (0, _build.doc)((0, _build.h1)()), (0, _build.doc)(), (0, _build.doc)());
fill("seq_plus", "heading+ paragraph+", (0, _build.doc)((0, _build.h1)()), (0, _build.doc)((0, _build.p)()), (0, _build.doc)());
fill("seq_empty_after", "heading+ paragraph+", (0, _build.doc)((0, _build.h1)()), (0, _build.doc)(), (0, _build.doc)((0, _build.p)()));

fill("count_too_few", "hard_break{3}", (0, _build.p)(_build.br), (0, _build.p)(_build.br), (0, _build.p)(_build.br));
fill("count_too_many", "hard_break{3}", (0, _build.p)(_build.br, _build.br), (0, _build.p)(_build.br, _build.br), null);
fill("count_left_right", "code_block{2} paragraph{2}", (0, _build.doc)((0, _build.pre)()), (0, _build.doc)((0, _build.p)()), (0, _build.doc)((0, _build.pre)(), (0, _build.p)()));

function fill3(name, expr, before, mid, after, left, right) {
      (0, _tests.defTest)("content_fill3_" + name, function () {
            var content = get(expr);
            var a = content.getMatchAt(attrs, before.content).fillBefore(mid.content);
            var b = a && content.getMatchAt(attrs, before.content.append(a).append(mid.content)).fillBefore(after.content, true);
            if (left) (0, _cmp.is)(b, "Failed unexpectedly"), (0, _cmp.cmpNode)(a, left.content), (0, _cmp.cmpNode)(b, right.content);else (0, _cmp.is)(!b, "Succeeded unexpectedly");
      });
}

fill3("simple_seq", "paragraph horizontal_rule paragraph horizontal_rule paragraph", (0, _build.doc)((0, _build.p)()), (0, _build.doc)((0, _build.p)()), (0, _build.doc)((0, _build.p)()), (0, _build.doc)(_build.hr), (0, _build.doc)(_build.hr));
fill3("seq_plus_ok", "code_block+ paragraph+", (0, _build.doc)((0, _build.pre)()), (0, _build.doc)((0, _build.pre)()), (0, _build.doc)((0, _build.p)()), (0, _build.doc)(), (0, _build.doc)());
fill3("seq_plus_from_empty", "code_block+ paragraph+", (0, _build.doc)(), (0, _build.doc)(), (0, _build.doc)(), (0, _build.doc)(), (0, _build.doc)((0, _build.pre)(), (0, _build.p)()));
fill3("seq_count", "code_block{3} paragraph{3}", (0, _build.doc)((0, _build.pre)()), (0, _build.doc)((0, _build.p)()), (0, _build.doc)(), (0, _build.doc)((0, _build.pre)(), (0, _build.pre)()), (0, _build.doc)((0, _build.p)(), (0, _build.p)()));
fill3("invalid", "paragraph*", (0, _build.doc)((0, _build.p)()), (0, _build.doc)((0, _build.pre)()), (0, _build.doc)((0, _build.p)()), null);

fill3("count_across", "paragraph{4}", (0, _build.doc)((0, _build.p)()), (0, _build.doc)((0, _build.p)()), (0, _build.doc)((0, _build.p)()), (0, _build.doc)(), (0, _build.doc)((0, _build.p)()));
fill3("count_across_invalid", "paragraph{2}", (0, _build.doc)((0, _build.p)()), (0, _build.doc)((0, _build.p)()), (0, _build.doc)((0, _build.p)()), null);