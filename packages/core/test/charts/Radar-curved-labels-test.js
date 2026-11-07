import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {textWrap} from "@d3plus/text";
import {Radar} from "../../index.ts";
import {
  RADAR_CURVE_MAX_LINES,
  RADAR_CURVE_PADDING,
  balancedLines,
  radarAllCurved,
  radarCurveBand,
  radarCurveLines,
  radarCurvedLayout,
  radarCurves,
} from "../../src/charts/Radar/curvedLabels.ts";

useJsdom();

const TAU = Math.PI * 2;
const font = {fontSize: 10, fontFamily: "sans-serif", lineHeight: 12};
const labels = texts =>
  texts.map((text, i) => ({
    text,
    data: {axis: text},
    angle: (TAU / texts.length) * i,
    font,
  }));
const long = "Net Promoter Score (Trailing 12 Months)";

it("radarCurveBand — the lines' height and padding on either side", () => {
  assert.strictEqual(
    radarCurveBand(labels(["A", "B"])),
    10 + RADAR_CURVE_PADDING * 2,
  );
  assert.strictEqual(
    radarCurveBand(labels(["A", "B"]), 2),
    10 + 12 + RADAR_CURVE_PADDING * 2,
  );
  const mixed = labels(["A", "B"]);
  mixed[1] = {...mixed[1], font: {fontSize: 14}};
  assert.strictEqual(radarCurveBand(mixed), 14 + RADAR_CURVE_PADDING * 2);
});

it("radarCurves — each name along the web, centered on its spoke", () => {
  const viz = new Radar();
  const six = labels(["North", "East", "South", "West", "Up", "Down"]);
  const curves = radarCurves(viz, six, 150);
  assert.ok(radarAllCurved(six, curves), "six short names fit");
  curves.forEach((c, i) => {
    assert.strictEqual(c.lines.length, 1);
    const {text, fit} = c.lines[0];
    assert.strictEqual(text, six[i].text);
    assert.strictEqual(fit.fontSize, 10, `${text} keeps its size`);
    assert.strictEqual(fit.truncated, false);
    // The glyphs sit just outside the web.
    const center = fit.radius + (fit.clockwise ? 0.3 : -0.3) * fit.fontSize;
    assert.ok(
      Math.abs(center - (150 + RADAR_CURVE_PADDING + 5)) < 1e-6,
      `${text} at ${center}`,
    );
  });
  // 3 o'clock (the first spoke) is centered on the right of the web.
  const {d, radius} = curves[0].lines[0].fit;
  const [x0, y0] = d
    .match(/^M([-\d.]+),([-\d.]+)/)
    .slice(1)
    .map(Number);
  assert.ok(x0 > 0 && Math.abs(y0) < radius, d);
});

it("radarCurves — a name too long for its arc stays on its spoke", () => {
  const viz = new Radar();
  const names = labels([
    "A",
    "A very long metric name that cannot fit between its neighbors",
    "C",
    "D",
  ]);
  const curves = radarCurves(viz, names, 60, 2);
  assert.ok(curves[0], "a short name curves");
  assert.strictEqual(curves[1], null, "the long one doesn't");
  assert.strictEqual(radarAllCurved(names, curves), false);
});

it("radarCurves — a long name wraps onto two curved lines, reading top to bottom", () => {
  const viz = new Radar();
  const names = labels(["A", "B", "C", long, "E", "F", "G", "H"]);
  // Spoke 3 points down and to the left (the bottom half); spoke 7 up and
  // to the right (the top half).
  const bottom = radarCurves(viz, names, 150, 1)[3];
  assert.strictEqual(bottom, null, "too long for one line");
  const [down] = radarCurves(viz, names, 150, 2).slice(3);
  assert.strictEqual(down.lines.length, 2);
  assert.strictEqual(down.lines.map(l => l.text).join(" "), long);
  const [first, second] = down.lines.map(l => l.fit);
  assert.ok(!first.clockwise, "the bottom half reads anticlockwise");
  assert.ok(first.radius < second.radius, "the first line nearer the web");
  assert.ok(Math.abs(second.radius - first.radius - 12) < 1e-6, "a line apart");

  const up = labels(["A", "B", "C", "D", "E", "F", "G", long]);
  const top = radarCurves(viz, up, 150, 2)[7];
  assert.strictEqual(top.lines.length, 2);
  const [a, b] = top.lines.map(l => l.fit);
  assert.ok(a.clockwise, "the top half reads clockwise");
  assert.ok(a.radius > b.radius, "the first line outermost");
});

it("radarCurves — labelPosition keeps spoke labels or allows a cut-short curve", () => {
  const names = labels(["North", "A very long metric name indeed", "C"]);
  const straight = radarCurves(
    new Radar().labelPosition("inside"),
    names,
    150,
    2,
  );
  assert.deepStrictEqual(straight, [null, null, null]);
  const along = radarCurves(new Radar().labelPosition("along"), names, 40);
  assert.strictEqual(along[1].lines.length, 1);
  assert.ok(along[1].lines[0].fit.truncated, "cut short with an ellipsis");
});

it("radarAllCurved — a metric without text needs no curve", () => {
  const names = labels(["North", ""]);
  assert.strictEqual(radarAllCurved(names, [{lines: []}, null]), true);
  assert.strictEqual(radarAllCurved(names, [null, null]), false);
});

it("balancedLines — the narrowest wrap that keeps the line count", () => {
  const wrap = textWrap()
    .fontFamily("sans-serif")
    .fontSize(10)
    .lineHeight(12)
    .height(24)
    .maxLines(2);
  const greedy = wrap.width(170)(long).lines;
  const even = balancedLines(wrap, long, 170, greedy.length);
  assert.strictEqual(even.length, greedy.length);
  assert.strictEqual(even.join(" "), long);
  const spread = ls => Math.abs(ls[0].length - ls[ls.length - 1].length);
  assert.ok(spread(even) <= spread(greedy), `${even} vs ${greedy}`);
  assert.deepStrictEqual(balancedLines(wrap, "Short", 170, 1), ["Short"]);
});

it("radarCurveLines — as many lines as the room around the web holds", () => {
  const names = labels(["A", "B"]);
  const one = radarCurveBand(names, 1);
  const two = radarCurveBand(names, 2);
  assert.strictEqual(radarCurveLines(names, 100, 100 + two), 2);
  assert.strictEqual(radarCurveLines(names, 100, 100 + one), 1);
  assert.strictEqual(radarCurveLines(names, 100, 100 + one - 1), 0);
  assert.strictEqual(RADAR_CURVE_MAX_LINES, 2);
});

it("radarCurvedLayout — one line when every name fits, else two, else null", () => {
  const viz = new Radar();
  const short = labels(["North", "East", "South", "West", "Up", "Down"]);
  const room = 200;
  const one = radarCurvedLayout(viz, short, room);
  assert.strictEqual(one.radius, room - radarCurveBand(short, 1));
  assert.ok(one.curves.every(c => c.lines.length === 1));

  const wrapped = labels(["A", "B", "C", long, "E", "F", "G", "H"]);
  const two = radarCurvedLayout(viz, wrapped, room);
  assert.strictEqual(two.radius, room - radarCurveBand(wrapped, 2));
  assert.strictEqual(two.curves[3].lines.length, 2);

  const tooLong = labels([
    "A",
    "A very long metric name that cannot fit between its neighbors at all",
    "C",
    "D",
  ]);
  assert.strictEqual(radarCurvedLayout(viz, tooLong, 80), null);
  assert.strictEqual(radarCurvedLayout(viz, [], room), null);
});
