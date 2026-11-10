import {it} from "vitest";
import assert from "assert";
import {textWrap} from "@d3plus/text";
import {slantWithin} from "../../src/components/Axis/axisLabelSize.ts";
import {staggerFits} from "../../src/components/Axis/axisLayout.ts";
import {
  defaultMaxSize,
  strictMaxSize,
} from "../../src/components/Axis/axisMaxSize.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

/**
    An axis keeps what it claims across its labels within its `maxSize`,
    whatever layout its labels take; a chart's own default limit doesn't
    (see `defaultMaxSize`).
*/

it("defaultMaxSize — a chart's limit is its own unless a config sets one", () => {
  const axis = {};
  assert.strictEqual(defaultMaxSize(axis, {}, undefined), axis);
  assert.strictEqual(axis._softMaxSize, true);
  defaultMaxSize(axis, {labels: []}, {maxSize: 40});
  assert.strictEqual(axis._softMaxSize, false, "a config's maxSize");
  defaultMaxSize(axis, {maxSize: size => size / 4});
  assert.strictEqual(axis._softMaxSize, false, "a function too");
  defaultMaxSize(axis, {maxSize: undefined});
  assert.strictEqual(axis._softMaxSize, true, "an unset one is no limit");
});

it("strictMaxSize — any finite limit but a chart's own default", () => {
  const schema = {maxSize: 40, width: 400, height: 300};
  assert.strictEqual(strictMaxSize({schema}, true), true);
  assert.strictEqual(
    strictMaxSize({schema: {...schema, maxSize: size => size / 4}}, false),
    true,
    "a function's limit",
  );
  assert.strictEqual(strictMaxSize({schema, _softMaxSize: true}, true), false);
  assert.strictEqual(
    strictMaxSize({schema: {...schema, maxSize: undefined}}, true),
    false,
  );
  assert.strictEqual(
    strictMaxSize({schema: {...schema, maxSize: Infinity}}, true),
    false,
    "no limit at all",
  );
});

/** A flat label on a horizontal axis, `height` deep. */
const flat = (i, height, extra = {}) => ({
  i,
  height,
  width: 80,
  fP: 5,
  lines: ["x"],
  rotate: false,
  ...extra,
});

it("staggerFits — both rows of staggered labels within the room", () => {
  const rows = [flat(0, 22), flat(1, 22, {offset: 22}), flat(2, 22)];
  assert.strictEqual(staggerFits(rows, 44, true), true);
  assert.strictEqual(staggerFits(rows, 43, true), false);
  assert.strictEqual(
    staggerFits([flat(0, 22), flat(1, 0, {lines: [], offset: 22})], 30, true),
    true,
    "a label with no lines reaches nowhere",
  );
});

it("slantWithin — wraps a slanted label onto fewer lines until it fits the depth", () => {
  const text = "Agriculture, Forestry, Fishing and Hunting";
  const wrap = textWrap()
    .fontFamily("sans-serif")
    .fontSize(12)
    .lineHeight(17)
    .width(60)
    .height(17 * 4);
  const first = wrap(text);
  assert.ok(first.lines.length > 2, `wraps onto ${first.lines.length} lines`);
  const slant = {angle: -30, horizontal: true, depth: 60, width: 200};
  const res = slantWithin(wrap, text, first, slant);
  // The label reaches out by its length across the slant plus its lines' height.
  const lines = res.lines.length;
  const width = Math.ceil(Math.max(...res.widths));
  const reach =
    width * Math.sin(Math.PI / 6) + lines * 17 * Math.cos(Math.PI / 6);
  assert.ok(lines >= 1 && lines < first.lines.length, `${lines} lines`);
  assert.ok(reach <= 60, `reaches ${reach.toFixed(1)} <= 60`);
});

it("slantWithin — leaves a label that already fits as it is", () => {
  const wrap = textWrap().fontFamily("sans-serif").fontSize(12).width(100);
  const first = wrap("Mining");
  const slant = {angle: -30, horizontal: true, depth: 60, width: 100};
  assert.strictEqual(slantWithin(wrap, "Mining", first, slant), first);
});
