import {it} from "vitest";
import assert from "assert";
import {AxisLeft} from "../../index.ts";
import {measureAxis} from "../../src/components/Axis/axisLayout.ts";
import {
  axisLabelEllipsis,
  labelEllipsis,
} from "../../src/components/Axis/axisDefaults.ts";
import {fitLabelRoom} from "../../src/components/Axis/axisLabelRoom.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

/**
    A cut axis label is measured with the ellipsis it is painted with, so
    its measured width is the width it draws.
*/

it("labelEllipsis — '...' by default, nothing when no text fits", () => {
  const ellipsis = labelEllipsis({});
  assert.strictEqual(ellipsis, axisLabelEllipsis);
  assert.strictEqual(
    ellipsis("Administrative and", 1),
    "Administrative and...",
  );
  assert.strictEqual(ellipsis("", 0), "");
  assert.strictEqual(labelEllipsis(undefined), axisLabelEllipsis);
});

it("labelEllipsis — the label config's ellipsis, as TextBox reads it", () => {
  const custom = (text, line) => `${text} (${line})`;
  assert.strictEqual(labelEllipsis({labelConfig: {ellipsis: custom}}), custom);
  assert.strictEqual(
    labelEllipsis({labelConfig: {ellipsis: "…"}})("Administrative", 1),
    "…",
    "a string stands in for the cut line",
  );
});

const names = [
  "Agriculture, Forestry, Fishing and Hunting",
  "Professional, Scientific, and Technical Services",
  "Health Care and Social Assistance",
  "Arts, Entertainment, and Recreation",
  "Accommodation and Food Services",
  "Administrative and Support Services",
];

const axis = config =>
  new AxisLeft()
    .renderMode("compute")
    .select(null)
    .width(400)
    .height(120)
    .maxSize(120)
    .scale("point")
    .domain(names)
    .config(config)
    .render();

/** Each painted label's lines, by tick. */
const painted = a =>
  new Map(
    a._tickShape._labelClass
      ._textData()
      .map(t => [t.data.data.id, {lines: t.lines, widths: t.widths, w: t.w}]),
  );

it("fitLabelRoom wraps cut labels again until the widest label holds", () => {
  const cut = {lines: ["Professional, Scien..."], width: 100, fits: false};
  const whole = {lines: ["Health Care"], width: 90, fits: true};
  const rooms = [];
  fitLabelRoom([cut, whole], t => {
    rooms.push(t.room);
    return {
      lines: ["Professional, Sci..."],
      widths: [94.5],
      width: 95,
      height: 15,
    };
  });
  assert.deepStrictEqual(rooms, [100, 95], "wrapped in each narrower box");
  assert.strictEqual(cut.room, 95);
  assert.strictEqual(whole.room, 95, "every label gets the box");
  assert.deepStrictEqual(cut.lines, ["Professional, Sci..."]);
  assert.deepStrictEqual(
    whole.lines,
    ["Health Care"],
    "a label that fits is kept",
  );
  const none = {lines: [], width: 0, fits: false};
  fitLabelRoom([none], () => ({lines: [], widths: [], width: 0, height: 0}));
  assert.strictEqual(none.room, 0);
});

it("a vertical axis's labels wrap in the box they are painted in", () => {
  const a = axis({});
  const {textData} = measureAxis(a);
  const room = Math.max(...textData.map(t => t.width));
  assert.ok(
    textData.every(t => t.room === room),
    `each label wraps as wide as the widest (${room}px)`,
  );
  for (const [id, p] of painted(a))
    assert.strictEqual(p.w, room, `${id} is painted ${room}px wide`);
});

it("a cut axis label is measured as it is painted", () => {
  for (const [config, end] of [
    [{}, "..."],
    [{shapeConfig: {labelConfig: {ellipsis: t => `${t}~`}}}, "~"],
  ]) {
    const a = axis(config);
    const drawn = painted(a);
    const cut = measureAxis(a).textData.filter(
      t => !t.truncated && t.lines.length && drawn.has(t.d) && !t.fits,
    );
    assert.ok(cut.length, `${JSON.stringify(config)}: some labels are cut`);
    for (const t of cut) {
      const p = drawn.get(t.d);
      assert.ok(t.lines.at(-1).endsWith(end), `${t.d}: ${t.lines}`);
      assert.deepStrictEqual(t.lines, p.lines, t.d);
      assert.strictEqual(t.width, Math.ceil(Math.max(...p.widths)), t.d);
    }
  }
});
