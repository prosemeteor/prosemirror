"use strict";

var _tests = require("../tests");

var _def = require("./def");

var _cmp = require("../cmp");

var _build = require("../build");

var _edit = require("../../edit");

var used = Object.create(null);

function test(cmd, before, after) {
     var known = used[cmd] || 0;
     (0, _tests.defTest)("command_" + cmd + (known ? "_" + (known + 1) : ""), function () {
          var pm = (0, _def.tempEditor)({ doc: before });
          pm.execCommand(cmd);
          (0, _cmp.cmpNode)(pm.doc, after);
     });
     used[cmd] = known + 1;
}

test("hard_break:insert", (0, _build.doc)((0, _build.p)("fo<a>o")), (0, _build.doc)((0, _build.p)("fo", _build.br, "o")));
test("hard_break:insert", (0, _build.doc)((0, _build.pre)("fo<a>o")), (0, _build.doc)((0, _build.pre)("fo\no")));

test("strong:set", (0, _build.doc)((0, _build.p)("f<a>o<b>o")), (0, _build.doc)((0, _build.p)("f", (0, _build.strong)("o"), "o")));
test("strong:set", (0, _build.doc)((0, _build.p)("f<a>oo")), (0, _build.doc)((0, _build.p)("foo")));
test("strong:set", (0, _build.doc)((0, _build.p)("f<a>oo"), (0, _build.p)("ba<b>r")), (0, _build.doc)((0, _build.p)("f", (0, _build.strong)("oo")), (0, _build.p)((0, _build.strong)("ba"), "r")));
test("strong:set", (0, _build.doc)((0, _build.p)((0, _build.strong)("f<a>o<b>o"))), (0, _build.doc)((0, _build.p)((0, _build.strong)("f<a>o<b>o"))));

test("strong:unset", (0, _build.doc)((0, _build.p)((0, _build.strong)("f<a>o<b>o"))), (0, _build.doc)((0, _build.p)((0, _build.strong)("f"), "o", (0, _build.strong)("o"))));
test("strong:unset", (0, _build.doc)((0, _build.p)("f<a>o<b>o")), (0, _build.doc)((0, _build.p)("foo")));
test("strong:unset", (0, _build.doc)((0, _build.p)("f<a>oo"), (0, _build.p)((0, _build.strong)("ba<b>r"))), (0, _build.doc)((0, _build.p)("foo"), (0, _build.p)("ba", (0, _build.strong)("r"))));

test("strong:toggle", (0, _build.doc)((0, _build.p)("f<a>o<b>o")), (0, _build.doc)((0, _build.p)("f", (0, _build.strong)("o"), "o")));
test("strong:toggle", (0, _build.doc)((0, _build.p)((0, _build.strong)("f<a>o<b>o"))), (0, _build.doc)((0, _build.p)((0, _build.strong)("f"), "o", (0, _build.strong)("o"))));
test("strong:toggle", (0, _build.doc)((0, _build.p)("f<a>oo ", (0, _build.strong)("ba<b>r"))), (0, _build.doc)((0, _build.p)("foo ba", (0, _build.strong)("r"))));

test("em:set", (0, _build.doc)((0, _build.p)("f<a>o<b>o")), (0, _build.doc)((0, _build.p)("f", (0, _build.em)("o"), "o")));
test("em:unset", (0, _build.doc)((0, _build.p)((0, _build.em)("f<a>o<b>o"))), (0, _build.doc)((0, _build.p)((0, _build.em)("f"), "o", (0, _build.em)("o"))));
test("em:toggle", (0, _build.doc)((0, _build.p)("f<a>o<b>o")), (0, _build.doc)((0, _build.p)("f", (0, _build.em)("o"), "o")));
test("em:toggle", (0, _build.doc)((0, _build.p)((0, _build.em)("f<a>o<b>o"))), (0, _build.doc)((0, _build.p)((0, _build.em)("f"), "o", (0, _build.em)("o"))));

test("code:set", (0, _build.doc)((0, _build.p)("f<a>o<b>o")), (0, _build.doc)((0, _build.p)("f", (0, _build.code)("o"), "o")));
test("code:unset", (0, _build.doc)((0, _build.p)((0, _build.code)("f<a>o<b>o"))), (0, _build.doc)((0, _build.p)((0, _build.code)("f"), "o", (0, _build.code)("o"))));
test("code:toggle", (0, _build.doc)((0, _build.p)("f<a>o<b>o")), (0, _build.doc)((0, _build.p)("f", (0, _build.code)("o"), "o")));
test("code:toggle", (0, _build.doc)((0, _build.p)((0, _build.code)("f<a>o<b>o"))), (0, _build.doc)((0, _build.p)((0, _build.code)("f"), "o", (0, _build.code)("o"))));

test("joinBackward", (0, _build.doc)((0, _build.p)("hi"), (0, _build.p)("<a>there")), (0, _build.doc)((0, _build.p)("hithere")));
test("joinBackward", (0, _build.doc)((0, _build.p)("hi"), (0, _build.blockquote)((0, _build.p)("<a>there"))), (0, _build.doc)((0, _build.p)("hi"), (0, _build.p)("there")));
test("joinBackward", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("hi")), (0, _build.blockquote)((0, _build.p)("<a>there"))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("hi"), (0, _build.p)("there"))));
test("joinBackward", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("hi")), (0, _build.p)("<a>there")), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("hi"), (0, _build.p)("there"))));
test("joinBackward", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("hi")), (0, _build.p)("<a>there"), (0, _build.blockquote)((0, _build.p)("x"))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("hi"), (0, _build.p)("there"), (0, _build.p)("x"))));
test("joinBackward", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hi"))), (0, _build.p)("<a>there")), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hi")), (0, _build.li)((0, _build.p)("there")))));
test("joinBackward", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hi"))), (0, _build.ul)((0, _build.li)((0, _build.p)("<a>there")))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hi")), (0, _build.li)((0, _build.p)("there")))));
test("joinBackward", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hi")), (0, _build.li)((0, _build.p)("<a>there")))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hi"), (0, _build.p)("there")))));
test("joinBackward", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("<a>there")))), (0, _build.doc)((0, _build.p)("<a>there")));
test("joinBackward", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hi"))), (0, _build.p)("<a>there"), (0, _build.ul)((0, _build.li)((0, _build.p)("x")))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hi")), (0, _build.li)((0, _build.p)("there")), (0, _build.li)((0, _build.p)("x")))));
test("joinBackward", (0, _build.doc)(_build.hr, (0, _build.p)("<a>there")), (0, _build.doc)((0, _build.p)("there")));
test("joinBackward", (0, _build.doc)(_build.hr, (0, _build.p)("<a>"), _build.hr), (0, _build.doc)(_build.hr, _build.hr));
test("joinBackward", (0, _build.doc)(_build.hr, (0, _build.blockquote)((0, _build.p)("<a>there"))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("there"))));
test("joinBackward", (0, _build.doc)((0, _build.p)("<a>foo")), (0, _build.doc)((0, _build.p)("foo")));

test("deleteSelection", (0, _build.doc)((0, _build.p)("f<a>o<b>o")), (0, _build.doc)((0, _build.p)("fo")));
test("deleteSelection", (0, _build.doc)((0, _build.p)("f<a>oo"), (0, _build.p)("ba<b>r")), (0, _build.doc)((0, _build.p)("fr")));

test("deleteCharBefore", (0, _build.doc)((0, _build.p)("ba<a>r")), (0, _build.doc)((0, _build.p)("br")));
test("deleteCharBefore", (0, _build.doc)((0, _build.p)("fç̀<a>o")), // The c has two combining characters, which must be deleted along with it
(0, _build.doc)((0, _build.p)("fo")));
test("deleteCharBefore", (0, _build.doc)((0, _build.p)("çç<a>ç")), // The combining characters in nearby characters must be left alone
(0, _build.doc)((0, _build.p)("çç")));
test("deleteCharBefore", (0, _build.doc)((0, _build.p)("😅😆<a>😇😈")), // Must delete astral plane characters as one unit
(0, _build.doc)((0, _build.p)("😅😇😈")));

test("deleteWordBefore", (0, _build.doc)((0, _build.p)("foo bar <a>baz")), (0, _build.doc)((0, _build.p)("foo baz")));
test("deleteWordBefore", (0, _build.doc)((0, _build.p)("foo bar<a> baz")), (0, _build.doc)((0, _build.p)("foo  baz")));
test("deleteWordBefore", (0, _build.doc)((0, _build.p)("foo ...<a>baz")), (0, _build.doc)((0, _build.p)("foo baz")));
test("deleteWordBefore", (0, _build.doc)((0, _build.p)("<a>foo")), (0, _build.doc)((0, _build.p)("foo")));
test("deleteWordBefore", (0, _build.doc)((0, _build.p)("foo   <a>bar")), (0, _build.doc)((0, _build.p)("foobar")));

test("joinForward", (0, _build.doc)((0, _build.p)("foo<a>"), (0, _build.p)("bar")), (0, _build.doc)((0, _build.p)("foobar")));
test("joinForward", (0, _build.doc)((0, _build.p)("foo<a>")), (0, _build.doc)((0, _build.p)("foo")));
test("joinForward", (0, _build.doc)((0, _build.p)("foo<a>"), _build.hr, (0, _build.p)("bar")), (0, _build.doc)((0, _build.p)("foo"), (0, _build.p)("bar")));
test("joinForward", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("a<a>")), (0, _build.li)((0, _build.p)("b")))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("a"), (0, _build.p)("b")))));
test("joinForward", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("a<a>"), (0, _build.p)("b")))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("ab")))));
test("joinForward", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo<a>")), (0, _build.p)("bar")), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo<a>"), (0, _build.p)("bar"))));
test("joinForward", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("hi<a>")), (0, _build.blockquote)((0, _build.p)("there"))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("hi"), (0, _build.p)("there"))));
test("joinForward", (0, _build.doc)((0, _build.p)("foo<a>"), (0, _build.blockquote)((0, _build.p)("bar"))), (0, _build.doc)((0, _build.p)("foo"), (0, _build.p)("bar")));
test("joinForward", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hi<a>"))), (0, _build.ul)((0, _build.li)((0, _build.p)("there")))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hi")), (0, _build.li)((0, _build.p)("there")))));
test("joinForward", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("there<a>")))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("there")))));
test("joinForward", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("there<a>")), _build.hr), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("there"))));

test("deleteCharAfter", (0, _build.doc)((0, _build.p)("b<a>ar")), (0, _build.doc)((0, _build.p)("br")));
test("deleteCharAfter", (0, _build.doc)((0, _build.p)("f<a>ç̀o")), // The c has two combining characters, which must be deleted along with it
(0, _build.doc)((0, _build.p)("fo")));
test("deleteCharAfter", (0, _build.doc)((0, _build.p)("ç<a>çç")), // The combining characters in nearby characters must be left alone
(0, _build.doc)((0, _build.p)("çç")));
test("deleteCharAfter", (0, _build.doc)((0, _build.p)("😅😆<a>😇😈")), // Must delete astral plane characters as one unit
(0, _build.doc)((0, _build.p)("😅😆😈")));

test("deleteWordAfter", (0, _build.doc)((0, _build.p)("foo<a> bar baz")), (0, _build.doc)((0, _build.p)("foo baz")));
test("deleteWordAfter", (0, _build.doc)((0, _build.p)("foo <a>bar baz")), (0, _build.doc)((0, _build.p)("foo  baz")));
test("deleteWordAfter", (0, _build.doc)((0, _build.p)("foo<a>... baz")), (0, _build.doc)((0, _build.p)("foo baz")));
test("deleteWordAfter", (0, _build.doc)((0, _build.p)("foo<a>")), (0, _build.doc)((0, _build.p)("foo")));
test("deleteWordAfter", (0, _build.doc)((0, _build.p)("fo<a>o")), (0, _build.doc)((0, _build.p)("fo")));
test("deleteWordAfter", (0, _build.doc)((0, _build.p)("foo<a>   bar")), (0, _build.doc)((0, _build.p)("foobar")));

test("joinUp", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo")), (0, _build.blockquote)((0, _build.p)("<a>bar"))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo"), (0, _build.p)("<a>bar"))));
test("joinUp", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("<a>foo")), (0, _build.blockquote)((0, _build.p)("bar"))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo")), (0, _build.blockquote)((0, _build.p)("bar"))));
test("joinUp", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("foo"))), (0, _build.ul)((0, _build.li)((0, _build.p)("<a>bar")))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("foo")), (0, _build.li)((0, _build.p)("bar")))));
test("joinUp", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("foo")), (0, _build.li)((0, _build.p)("<a>bar")))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("foo"), (0, _build.p)("bar")))));
test("joinUp", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("foo")), (0, _build.li)("<a>", (0, _build.p)("bar")))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("foo")), (0, _build.li)((0, _build.p)("bar")))));
test("joinUp", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("foo")), "<a>", (0, _build.li)((0, _build.p)("bar")))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("foo"), (0, _build.p)("bar")))));

test("joinDown", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo<a>")), (0, _build.blockquote)((0, _build.p)("bar"))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo"), (0, _build.p)("<a>bar"))));
test("joinDown", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo")), (0, _build.blockquote)((0, _build.p)("<a>bar"))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo")), (0, _build.blockquote)((0, _build.p)("bar"))));
test("joinDown", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("foo<a>"))), (0, _build.ul)((0, _build.li)((0, _build.p)("bar")))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("foo")), (0, _build.li)((0, _build.p)("bar")))));
test("joinDown", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("<a>foo")), (0, _build.li)((0, _build.p)("bar")))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("foo"), (0, _build.p)("bar")))));
test("joinDown", (0, _build.doc)((0, _build.ul)((0, _build.li)("<a>", (0, _build.p)("foo")), (0, _build.li)((0, _build.p)("bar")))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("foo")), (0, _build.li)((0, _build.p)("bar")))));
test("joinDown", (0, _build.doc)((0, _build.ul)("<a>", (0, _build.li)((0, _build.p)("foo")), (0, _build.li)((0, _build.p)("bar")))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("foo"), (0, _build.p)("bar")))));

test("lift", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("<a>foo"))), (0, _build.doc)((0, _build.p)("foo")));
test("lift", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo"), (0, _build.p)("<a>bar"), (0, _build.p)("baz"))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo")), (0, _build.p)("bar"), (0, _build.blockquote)((0, _build.p)("baz"))));
test("lift", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("<a>foo")))), (0, _build.doc)((0, _build.p)("foo")));
test("lift", (0, _build.doc)((0, _build.p)("<a>foo")), (0, _build.doc)((0, _build.p)("foo")));
test("lift", (0, _build.doc)((0, _build.blockquote)((0, _build.ul)((0, _build.li)((0, _build.p)("foo<a>"))))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo<a>"))));
test("lift", (0, _build.doc)((0, _build.blockquote)("<a>", (0, _build.ul)((0, _build.li)((0, _build.p)("foo"))))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("foo")))));
test("lift", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("one"), (0, _build.ul)((0, _build.li)((0, _build.p)("<a>sub1")), (0, _build.li)((0, _build.p)("sub2")))), (0, _build.li)((0, _build.p)("two")))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("one"), (0, _build.p)("<a>sub1"), (0, _build.ul)((0, _build.li)((0, _build.p)("sub2")))), (0, _build.li)((0, _build.p)("two")))));

test("bullet_list:wrap", (0, _build.doc)((0, _build.p)("<a>foo")), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("foo")))));
test("bullet_list:wrap", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("<a>foo"))), (0, _build.doc)((0, _build.blockquote)((0, _build.ul)((0, _build.li)((0, _build.p)("foo"))))));
test("bullet_list:wrap", (0, _build.doc)((0, _build.p)("foo"), (0, _build.p)("ba<a>r"), (0, _build.p)("ba<b>z")), (0, _build.doc)((0, _build.p)("foo"), (0, _build.ul)((0, _build.li)((0, _build.p)("bar")), (0, _build.li)((0, _build.p)("baz")))));
test("bullet_list:wrap", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("<a>foo")))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("foo")))));
test("bullet_list:wrap", (0, _build.doc)((0, _build.ol)((0, _build.li)((0, _build.p)("<a>foo")))), (0, _build.doc)((0, _build.ol)((0, _build.li)((0, _build.p)("foo")))));
test("bullet_list:wrap", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("foo"), (0, _build.p)("<a>bar")))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("foo"), (0, _build.ul)((0, _build.li)((0, _build.p)("bar")))))));
test("bullet_list:wrap", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("foo")), (0, _build.li)((0, _build.p)("<a>bar")), (0, _build.li)((0, _build.p)("baz")))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("foo"), (0, _build.ul)((0, _build.li)((0, _build.p)("bar")))), (0, _build.li)((0, _build.p)("baz")))));

test("ordered_list:wrap", (0, _build.doc)((0, _build.p)("<a>foo")), (0, _build.doc)((0, _build.ol)((0, _build.li)((0, _build.p)("foo")))));
test("ordered_list:wrap", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("<a>foo"))), (0, _build.doc)((0, _build.blockquote)((0, _build.ol)((0, _build.li)((0, _build.p)("foo"))))));
test("ordered_list:wrap", (0, _build.doc)((0, _build.p)("foo"), (0, _build.p)("ba<a>r"), (0, _build.p)("ba<b>z")), (0, _build.doc)((0, _build.p)("foo"), (0, _build.ol)((0, _build.li)((0, _build.p)("bar")), (0, _build.li)((0, _build.p)("baz")))));
test("blockquote:wrap", (0, _build.doc)((0, _build.p)("fo<a>o")), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo"))));
test("blockquote:wrap", (0, _build.doc)((0, _build.p)("fo<a>o"), (0, _build.p)("bar"), (0, _build.p)("ba<b>z"), (0, _build.p)("quux")), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo"), (0, _build.p)("bar"), (0, _build.p)("baz")), (0, _build.p)("quux")));
test("blockquote:wrap", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("fo<a>o"))), (0, _build.doc)((0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("foo")))));
test("blockquote:wrap", (0, _build.doc)("<a>", (0, _build.ul)((0, _build.li)((0, _build.p)("foo")))), (0, _build.doc)((0, _build.blockquote)((0, _build.ul)((0, _build.li)((0, _build.p)("foo"))))));

test("splitBlock", (0, _build.doc)((0, _build.p)("foo<a>")), (0, _build.doc)((0, _build.p)("foo"), (0, _build.p)()));
test("splitBlock", (0, _build.doc)((0, _build.p)("foo<a>bar")), (0, _build.doc)((0, _build.p)("foo"), (0, _build.p)("bar")));
test("splitBlock", (0, _build.doc)((0, _build.h1)("foo<a>")), (0, _build.doc)((0, _build.h1)("foo"), (0, _build.p)()));
test("splitBlock", (0, _build.doc)((0, _build.h1)("foo<a>bar")), (0, _build.doc)((0, _build.h1)("foo"), (0, _build.h1)("bar")));
test("splitBlock", (0, _build.doc)((0, _build.p)("fo<a>ob<b>ar")), (0, _build.doc)((0, _build.p)("fo"), (0, _build.p)("ar")));
test("splitBlock", (0, _build.doc)((0, _build.ol)((0, _build.li)((0, _build.p)("a")), "<a>", (0, _build.li)((0, _build.p)("b")), (0, _build.li)((0, _build.p)("c")))), (0, _build.doc)((0, _build.ol)((0, _build.li)((0, _build.p)("a"))), (0, _build.ol)((0, _build.li)((0, _build.p)("b")), (0, _build.li)((0, _build.p)("c")))));
test("splitBlock", (0, _build.doc)((0, _build.ol)("<a>", (0, _build.li)((0, _build.p)("a")), (0, _build.li)((0, _build.p)("b")), (0, _build.li)((0, _build.p)("c")))), (0, _build.doc)((0, _build.ol)((0, _build.li)((0, _build.p)("a")), (0, _build.li)((0, _build.p)("b")), (0, _build.li)((0, _build.p)("c")))));
test("splitBlock", (0, _build.doc)((0, _build.h1)("<a>foo")), (0, _build.doc)((0, _build.p)(), (0, _build.h1)("foo")));

test("list_item:split", (0, _build.doc)((0, _build.p)("foo<a>bar")), (0, _build.doc)((0, _build.p)("foobar")));
test("list_item:split", (0, _build.doc)("<a>", (0, _build.p)("foobar")), (0, _build.doc)((0, _build.p)("foobar")));
test("list_item:split", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("foo<a>bar")))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("foo")), (0, _build.li)((0, _build.p)("bar")))));
test("list_item:split", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("foo<a>ba<b>r")))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("foo")), (0, _build.li)((0, _build.p)("r")))));

test("list_item:lift", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hello"), (0, _build.ul)((0, _build.li)((0, _build.p)("o<a><b>ne")), (0, _build.li)((0, _build.p)("two")))))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hello")), (0, _build.li)((0, _build.p)("one"), (0, _build.ul)((0, _build.li)((0, _build.p)("two")))))));
test("list_item:lift", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hello"), (0, _build.ul)((0, _build.li)((0, _build.p)("o<a>ne")), (0, _build.li)((0, _build.p)("two<b>")))))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hello")), (0, _build.li)((0, _build.p)("one")), (0, _build.li)((0, _build.p)("two")))));
test("list_item:lift", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hello"), (0, _build.ul)((0, _build.li)((0, _build.p)("o<a>ne")), (0, _build.li)((0, _build.p)("two<b>")), (0, _build.li)((0, _build.p)("three")))))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hello")), (0, _build.li)((0, _build.p)("one")), (0, _build.li)((0, _build.p)("two"), (0, _build.ul)((0, _build.li)((0, _build.p)("three")))))));

test("list_item:sink", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("one")), (0, _build.li)((0, _build.p)("t<a><b>wo")), (0, _build.li)((0, _build.p)("three")))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("one"), (0, _build.ul)((0, _build.li)((0, _build.p)("two")))), (0, _build.li)((0, _build.p)("three")))));
test("list_item:sink", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("o<a><b>ne")), (0, _build.li)((0, _build.p)("two")), (0, _build.li)((0, _build.p)("three")))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("one")), (0, _build.li)((0, _build.p)("two")), (0, _build.li)((0, _build.p)("three")))));
test("list_item:sink", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("one")), (0, _build.li)((0, _build.ul)((0, _build.li)((0, _build.p)("two")))), (0, _build.li)((0, _build.p)("t<a><b>hree")))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("one")), (0, _build.li)((0, _build.ul)((0, _build.li)((0, _build.p)("two")), (0, _build.li)((0, _build.p)("three")))))));

test("newlineInCode", (0, _build.doc)((0, _build.pre)("foo<a>bar")), (0, _build.doc)((0, _build.pre)("foo\nbar")));

test("liftEmptyBlock", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo"), (0, _build.p)("<a>"), (0, _build.p)("bar"))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo")), (0, _build.blockquote)((0, _build.p)(), (0, _build.p)("bar"))));
test("liftEmptyBlock", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo"), (0, _build.p)("<a>"))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo")), (0, _build.p)()));
test("liftEmptyBlock", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo")), (0, _build.blockquote)((0, _build.p)("<a>"))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo")), (0, _build.p)("<a>")));
test("liftEmptyBlock", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hi")), (0, _build.li)((0, _build.p)("<a>")))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hi"))), (0, _build.p)()));

test("createParagraphNear", (0, _build.doc)("<a>", _build.hr), (0, _build.doc)((0, _build.p)(), _build.hr));
test("createParagraphNear", (0, _build.doc)((0, _build.p)(), "<a>", _build.hr), (0, _build.doc)((0, _build.p)(), _build.hr, (0, _build.p)()));

test("heading:make1", (0, _build.doc)((0, _build.p)("fo<a>o")), (0, _build.doc)((0, _build.h1)("foo")));
test("heading:make2", (0, _build.doc)((0, _build.pre)("fo<a>o")), (0, _build.doc)((0, _build.h2)("foo")));

test("paragraph:make", (0, _build.doc)((0, _build.h1)("fo<a>o")), (0, _build.doc)((0, _build.p)("foo")));
test("paragraph:make", (0, _build.doc)((0, _build.h1)("fo<a>o", (0, _build.em)("bar"))), (0, _build.doc)((0, _build.p)("foo", (0, _build.em)("bar"))));
test("paragraph:make", (0, _build.doc)("<a>", (0, _build.h1)("foo")), (0, _build.doc)((0, _build.p)("foo")));

test("code_block:make", (0, _build.doc)((0, _build.h1)("fo<a>o")), (0, _build.doc)((0, _build.pre)("foo")));
test("code_block:make", (0, _build.doc)((0, _build.p)("fo<a>o", (0, _build.em)("bar"))), (0, _build.doc)((0, _build.pre)("foobar")));

test("horizontal_rule:insert", (0, _build.doc)((0, _build.p)("<a>foo")), (0, _build.doc)(_build.hr, (0, _build.p)("foo")));
test("horizontal_rule:insert", (0, _build.doc)((0, _build.p)("foo"), (0, _build.p)("<a>bar")), (0, _build.doc)((0, _build.p)("foo"), _build.hr, (0, _build.p)("bar")));
test("horizontal_rule:insert", (0, _build.doc)((0, _build.p)("foo"), (0, _build.p)("b<a>ar")), (0, _build.doc)((0, _build.p)("foo"), (0, _build.p)("b"), _build.hr, (0, _build.p)("ar")));
test("horizontal_rule:insert", (0, _build.doc)((0, _build.p)("fo<a>o"), (0, _build.p)("b<b>ar")), (0, _build.doc)((0, _build.p)("fo"), _build.hr, (0, _build.p)("ar")));
test("horizontal_rule:insert", (0, _build.doc)("<a>", (0, _build.p)("foo"), (0, _build.p)("bar")), (0, _build.doc)(_build.hr, (0, _build.p)("bar")));
test("horizontal_rule:insert", (0, _build.doc)("<a>", (0, _build.p)("bar")), (0, _build.doc)(_build.hr));
test("horizontal_rule:insert", (0, _build.doc)((0, _build.p)("foo<a>")), (0, _build.doc)((0, _build.p)("foo"), _build.hr));

var test_ = (0, _def.namespace)("command");

test_("delete_specific", function (pm) {
     (0, _cmp.is)(!pm.commands["lift"], "command disabled");
     (0, _cmp.is)(!pm.input.baseKeymap.bindings["Alt-Left"], "no key bound");
}, { commands: _edit.CommandSet.default.update({ lift: null }) });

test_("override_specific", function (pm) {
     pm.execCommand("lift");
     (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("Lift?")));
     (0, _cmp.is)(!pm.commands.lift.spec.label, "completely replaced");
}, { commands: _edit.CommandSet.default.update({ lift: { run: function run(pm) {
                    return pm.setContent("Lift?", "text");
               } } }) });

test_("extend_specific", function (pm) {
     pm.execCommand("lift");
     (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("hi")));
     (0, _cmp.is)(!pm.input.baseKeymap.bindings["Alt-Left"], "disabled old key");
     (0, _cmp.is)(pm.input.baseKeymap.bindings["Alt-L"], "enabled new key");
}, { commands: _edit.CommandSet.default.update({ lift: { keys: ["Alt-L"] } }),
     doc: (0, _build.doc)((0, _build.blockquote)((0, _build.p)("hi"))) });

var myCommands = {
     command1: {
          label: "DO IT",
          run: function run(pm) {
               pm.setContent("hi", "text");
          }
     },
     command2: {
          run: function run() {}
     }
};

test_("add_custom", function (pm) {
     (0, _cmp.is)(pm.commands["command1"], "command1 present");
}, { commands: _edit.CommandSet.default.add(myCommands) });

test_("add_filtered", function (pm) {
     (0, _cmp.is)(pm.commands["command1"], "command1 present");
     (0, _cmp.is)(!pm.commands["command2"], "command2 not present");
}, { commands: _edit.CommandSet.default.add(myCommands, function (name) {
          return name != "command2";
     }) });