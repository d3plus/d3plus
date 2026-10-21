import {it} from "vitest";
import assert from "assert";
import {
  RADAR_LABEL_PADDING,
  radarAxisLabelLayout,
  radarFitRadius,
  radarLabelRoom,
} from "../../src/charts/Radar/axisLabels.ts";
import {near} from "~test/helpers.js";

const DEG = Math.PI / 180;

// 6px per character on one line; wrapping breaks on spaces.
const measure = l => l.text.length * 6;
const wrap = (l, width, maxLines) => {
  const lines = [];
  let truncated = false;
  for (const word of l.text.split(" ")) {
    const last = lines[lines.length - 1];
    if (last !== undefined && (last.length + 1 + word.length) * 6 <= width) lines[lines.length - 1] = `${last} ${word}`;
    else if (word.length * 6 > width) {
      truncated = true;
      break;
    }
    else if (lines.length === maxLines) {
      truncated = true;
      break;
    }
    else lines.push(word);
  }
  return {lines, widths: lines.map(s => s.length * 6), truncated};
};
const labels = (texts, lineHeight = 12) =>
  texts.map((text, i) => ({text, angle: (2 * Math.PI * i) / texts.length, lineHeight}));

it("radarLabelRoom measures the room along a spoke to the area's edge", () => {
  // 3 o'clock: half-width − radius − padding.
  near(radarLabelRoom(0, 100, 12, 400, 300), 200 - 100 - RADAR_LABEL_PADDING, 1e-6, "3 o'clock");
  // 6 o'clock: half-height − radius − padding.
  near(radarLabelRoom(90 * DEG, 100, 12, 400, 300), 150 - 100 - RADAR_LABEL_PADDING, 1e-6, "6 o'clock");
  // 45°: the tighter of the two edges, discounted by the label's half-thickness.
  const c = Math.SQRT1_2;
  near(radarLabelRoom(45 * DEG, 100, 12, 400, 300), (150 - 6 * c) / c - 110, 1e-6, "45°");
  near(radarLabelRoom(0, 100, 12, 400, 300, 0), 100, 1e-6, "custom padding");
});

it("radarFitRadius gives the largest radius whose labels fit the area", () => {
  // One 60px label at 3 o'clock → horizontal room bounds the radius.
  near(radarFitRadius([{angle: 0, width: 60, height: 12}], 400, 400), 200 - 10 - 60, 1e-6, "3 o'clock");
  // At 12 o'clock it bounds the vertical room instead.
  near(radarFitRadius([{angle: -90 * DEG, width: 60, height: 12}], 400, 300), 150 - 10 - 60, 1e-6, "12 o'clock");
  // Diagonal: the label only needs its projection.
  const c = Math.SQRT1_2;
  near(
    radarFitRadius([{angle: 45 * DEG, width: 150, height: 12}], 400, 400),
    (200 - 6 * c) / c - 10 - 150,
    1e-6,
    "45°",
  );
  // Several labels: the tightest one wins; a long label at a roomy angle doesn't.
  const r = radarFitRadius(
    [
      {angle: 0, width: 30, height: 12},
      {angle: 90 * DEG, width: 80, height: 12},
      {angle: 180 * DEG, width: 30, height: 12},
    ],
    500,
    400,
  );
  near(r, 200 - 10 - 80, 1e-6, "the 6 o'clock label bounds a wide area");
});

it("radarFitRadius never exceeds the area's half-size nor drops below 0", () => {
  assert.strictEqual(radarFitRadius([], 400, 300), 150);
  assert.strictEqual(radarFitRadius([{angle: 0, width: 999, height: 12}], 400, 300), 0);
});

it("radarAxisLabelLayout keeps short labels on one line at the fitted radius", () => {
  const input = labels(["North", "East", "South", "West"]);
  const layout = radarAxisLabelLayout({labels: input, width: 400, height: 400, measure, wrap});
  assert.ok(layout.labels.every(l => l.lines === 1 && !l.truncated));
  const expected = radarFitRadius(
    input.map(l => ({angle: l.angle, width: measure(l), height: l.lineHeight})),
    400,
    400,
  );
  near(layout.radius, expected, 1e-6, "radius");
  assert.ok(layout.radius > 100, "short labels leave a large web");
  assert.deepStrictEqual(layout.labels.map(l => l.width), input.map(measure));
});

it("radarAxisLabelLayout wraps a label that would shrink the web below its minimum", () => {
  // 162px on one line at 6 o'clock would leave a 28px web.
  const input = labels(["A", "Net Promoter Score Trailing", "C", "D"]);
  const layout = radarAxisLabelLayout({labels: input, width: 400, height: 400, measure, wrap});
  assert.ok(layout.radius >= 100, `radius ${layout.radius} keeps at least half of 200`);
  const long = layout.labels[1];
  assert.strictEqual(long.lines, 2, "the long label wraps onto two lines");
  assert.strictEqual(long.truncated, false);
  assert.ok(long.width <= long.wrapWidth, "wrapped lines fit their wrap width");
  assert.strictEqual(long.height, 24);
  assert.ok(layout.labels.filter((_l, i) => i !== 1).every(l => l.lines === 1), "short labels stay on one line");
  // The wrapped box still fits at the chosen radius.
  const fit = radarFitRadius(
    input.map((l, i) => ({angle: l.angle, width: layout.labels[i].width, height: layout.labels[i].height})),
    400,
    400,
  );
  assert.ok(fit >= layout.radius - 0.5, `boxes fit (fit ${fit}, radius ${layout.radius})`);
  // The largest such radius: "Score Trailing" (84px) needs 84px of room.
  near(layout.radius, 200 - 10 - 84, 0.6, "radius grows until the wrapped label just fits");
});

it("radarAxisLabelLayout clamps to the minimum radius and truncates what can't fit", () => {
  const input = labels(["A", "Supercalifragilisticexpialidocious Antidisestablishmentarianism", "C"]);
  const layout = radarAxisLabelLayout({labels: input, width: 300, height: 300, measure, wrap});
  near(layout.radius, 75, 1e-6, "half of the 150px half-size");
  assert.strictEqual(layout.labels[1].truncated, true);
});

it("radarAxisLabelLayout honors minRadiusShare, maxLines, and padding", () => {
  const input = labels(["A", "Net Promoter Score Trailing Twelve Months", "C", "D"]);
  const share = radarAxisLabelLayout({labels: input, width: 400, height: 400, measure, wrap, minRadiusShare: 0.9});
  near(share.radius, 180, 1e-6, "a high minimum share pins the radius");
  const lines = radarAxisLabelLayout({labels: input, width: 400, height: 400, measure, wrap, maxLines: 3});
  assert.ok(lines.labels[1].lines <= 3);
  const pad = radarAxisLabelLayout({labels: labels(["North"]), width: 400, height: 400, measure, wrap, padding: 0});
  near(pad.radius, 200 - 30, 1e-6, "no padding: the 30px label alone bounds the radius");
});
