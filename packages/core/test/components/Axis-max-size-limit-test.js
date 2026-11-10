import {it} from "vitest";
import assert from "assert";
import {textWrap} from "@d3plus/text";
import {Axis} from "../../index.ts";
import {measureAxis} from "../../internal.ts";
import {slantWithin} from "../../src/components/Axis/axisLabelSize.ts";
import {staggerFits} from "../../src/components/Axis/axisLayout.ts";
import {limitLabels} from "../../src/components/Axis/axisLayoutLabels.ts";
import {
  defaultMaxSize,
  strictMaxSize,
} from "../../src/components/Axis/axisMaxSize.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

/**
    An axis keeps what it claims across its labels within its `maxSize`,
    whatever layout its labels take, and leaves out the labels and title
    that don't fit; a chart's own default limit doesn't (see
    `defaultMaxSize`).
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

it("limitLabels — leaves out each label deeper than the room, and claims nothing for it", () => {
  const textData = [flat(0, 22), flat(1, 39), flat(2, 39, {truncated: true})];
  assert.strictEqual(
    limitLabels(textData, true, 30),
    1,
    "one shown label left out (a hidden one isn't counted)",
  );
  assert.deepStrictEqual(
    textData.map(t => [!!t.truncated, t.lines.length, t.height, t.width]),
    [
      [false, 1, 22, 80],
      [true, 0, 0, 0],
      [true, 0, 0, 0],
    ],
  );
});

it("limitLabels — counts a staggered label's offset", () => {
  const textData = [flat(0, 22), flat(1, 22, {offset: 22})];
  assert.strictEqual(limitLabels(textData, true, 40), 1);
  assert.strictEqual(textData[1].lines.length, 0);
});

it("limitLabels — a vertical axis's labels reach out by their width", () => {
  const textData = [flat(0, 60, {width: 30}), flat(1, 20, {width: 50})];
  assert.strictEqual(limitLabels(textData, false, 40), 1);
  assert.deepStrictEqual(
    textData.map(t => !!t.truncated),
    [false, true],
  );
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

/** A standalone bottom axis with three long labels. */
const longAxis = config =>
  new Axis()
    .domain([0, 100])
    .labels([0, 50, 100])
    .tickFormat(d => `A long label of ${d} units that wraps onto lines`)
    .labelRotation(false)
    .gridSize(0)
    .width(400)
    .height(300)
    .config(config);

/** The depth an axis claims across its labels, and what it draws. */
const claim = axis => {
  const {textData} = measureAxis(axis);
  return {
    depth: axis.outerBounds().height,
    labels: textData.filter(t => !t.truncated && t.lines.length).length,
    title: !axis._dropTitle && !!axis.title(),
  };
};

it("measureAxis — with room for both, the labels and title stay", () => {
  const out = claim(longAxis({maxSize: 120, title: "A title"}));
  assert.ok(out.depth <= 120, `${out.depth}`);
  assert.ok(out.labels > 0 && out.title, JSON.stringify(out));
});

it("measureAxis — the title gives way when that lets the labels fit", () => {
  // One line of labels fits 40px, but not beside a title.
  const titled = claim(longAxis({maxSize: 40, title: "A title"}));
  const plain = claim(longAxis({maxSize: 40}));
  assert.strictEqual(titled.title, false, "no title");
  assert.ok(titled.labels > 0, "labels drawn");
  assert.deepStrictEqual(titled, plain, "as with no title");
});

it("measureAxis — without room for one line of labels, the labels give way and the title stays", () => {
  const axis = longAxis({
    maxSize: 40,
    title: "A title",
    shapeConfig: {labelConfig: {fontSize: 30}},
  });
  const out = claim(axis);
  assert.strictEqual(out.labels, 0, "no labels");
  assert.strictEqual(out.title, true, "the title stays");
  assert.ok(out.depth <= 40, `${out.depth}`);
});

it("measureAxis — with room for neither, only the ticks draw", () => {
  const out = claim(longAxis({maxSize: 20, title: "A title"}));
  assert.deepStrictEqual(
    {labels: out.labels, title: out.title},
    {labels: 0, title: false},
  );
  assert.ok(out.depth <= 20, `${out.depth}`);
});

it("measureAxis — a chart's own default limit keeps one line of labels and the title", () => {
  const axis = longAxis({maxSize: 20, title: "A title"});
  axis._softMaxSize = true;
  const out = claim(axis);
  assert.ok(out.labels > 0 && out.title, JSON.stringify(out));
  assert.ok(out.depth > 20, "past the limit, as an axis with no limit would");
});

it("measureAxis — a limit the labels fit within changes nothing", () => {
  const unlimited = longAxis({title: "A title"});
  const roomy = longAxis({title: "A title", maxSize: 1000});
  const a = measureAxis(unlimited);
  const b = measureAxis(roomy);
  assert.deepStrictEqual(
    b.textData.map(t => t.lines),
    a.textData.map(t => t.lines),
  );
  assert.deepStrictEqual(roomy.outerBounds(), unlimited.outerBounds());
});
