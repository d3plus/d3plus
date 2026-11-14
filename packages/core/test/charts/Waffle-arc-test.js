import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {Parliament, Waffle} from "../../index.ts";
import {parliamentDef} from "../../internal.ts";
import {applyWaffleLayout} from "../../src/charts/Waffle/applyLayout.ts";
import {
  MAX_ARC_RINGS,
  arcCapacity,
  arcRingCount,
  arcRingRadii,
  arcRingSeats,
  arcSeatPoint,
  arcSeatSize,
  arcSeats,
  majorityAngle,
  majoritySeats,
} from "../../src/charts/Waffle/arcLayout.ts";
import {
  MAJORITY_OVERHANG,
  arcAspect,
  arcInnerRadius,
  isArcLayout,
  waffleArcLayout,
} from "../../src/charts/Waffle/arcStage.ts";
import {
  MAJORITY_KEY,
  MAJORITY_LABEL_HEIGHT,
  majorityLabelStrip,
  majorityLinePoints,
  waffleArcDecor,
} from "../../src/charts/Waffle/arcEmit.ts";
import {waffleTooltipRows} from "../../src/charts/Waffle/tooltip.ts";

useJsdom();

const HALF = Math.PI / 2;
const near = (a, b, label, tolerance = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tolerance, `${label}: ${a} ≈ ${b}`);

/** A chart laid out by hand over `data` in a `width × height` chart area. */
function laidOut(Chart, data, config = {}, {width = 400, height = 220} = {}) {
  const viz = new Chart()
    .config({groupBy: "id", ...config})
    .width(width)
    .height(height);
  viz._filteredData = data;
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  viz._ids = d => [d.id];
  viz._drawLabel = d => d.id;
  return {viz, shapeData: applyWaffleLayout({viz}).shapeData};
}

const house = () => [
  {id: "left", value: 30},
  {id: "centre", value: 15},
  {id: "right", value: 55},
];

it("arcRingRadii — ring centerlines splitting the band evenly", () => {
  assert.deepStrictEqual(arcRingRadii(2, 0.5), [0.625, 0.875]);
  assert.deepStrictEqual(arcRingRadii(1, 0), [0.5]);
  assert.deepStrictEqual(arcRingRadii(0, 0.4), [0.7], "at least one ring");
  assert.deepStrictEqual(arcRingRadii(1, 2), [0.95], "inner capped at 90%");
});

it("arcCapacity — seats spaced as far apart as the rings", () => {
  // One ring at r = 0.5 with width 1: floor(π · 0.5 / 1) = 1.
  assert.strictEqual(arcCapacity(1, 0, Math.PI), 1);
  // Two rings at 0.625 and 0.875, width 0.25: floor(7.85) + floor(10.99).
  assert.strictEqual(arcCapacity(2, 0.5, Math.PI), 7 + 10);
  assert.ok(arcCapacity(3, 0.4, 2 * Math.PI) > arcCapacity(3, 0.4, Math.PI));
});

it("arcRingCount — the fewest rings that hold every seat", () => {
  assert.strictEqual(arcRingCount(0, 0.4, Math.PI), 1);
  assert.strictEqual(arcRingCount(1, 0.4, Math.PI), 1);
  const rings = arcRingCount(450, 0.4, Math.PI);
  assert.ok(arcCapacity(rings, 0.4, Math.PI) >= 450);
  assert.ok(arcCapacity(rings - 1, 0.4, Math.PI) < 450);
  assert.ok(arcRingCount(1e7, 0.4, Math.PI) <= MAX_ARC_RINGS);
});

it("arcRingSeats — seats shared in proportion to each ring's radius", () => {
  const seats = arcRingSeats(100, 4, 0.4);
  assert.strictEqual(
    seats.reduce((a, b) => a + b, 0),
    100,
  );
  for (let k = 1; k < seats.length; k++)
    assert.ok(seats[k] >= seats[k - 1], "outer rings hold more");
  assert.deepStrictEqual(arcRingSeats(0, 3, 0.4), [0, 0, 0]);
});

it("arcSeats — every seat by angle from the start, ties to the inner ring", () => {
  const seats = arcSeats([1, 2], 0.5, -HALF, HALF);
  assert.deepStrictEqual(
    seats.map(s => [s.ring, s.index]),
    [
      [1, 0],
      [0, 0],
      [1, 1],
    ],
  );
  near(seats[0].angle, -HALF / 2, "half a step in from the start");
  near(seats[1].angle, 0, "a lone seat at the middle");
  assert.deepStrictEqual(
    seats.map(s => s.radius),
    [0.875, 0.625, 0.875],
  );
  const reversed = arcSeats([2], 0, HALF, -HALF);
  assert.ok(reversed[0].angle > reversed[1].angle, "a backward sweep");
  const tie = arcSeats([1, 1], 0.5, -HALF, HALF);
  assert.deepStrictEqual(
    tie.map(s => s.ring),
    [0, 1],
  );
});

it("arcSeatSize — the tighter of ring and seat spacing, less padding", () => {
  // Rings 50px apart; 10 seats on the outer ring at 0.75 · 100 · π / 10.
  near(arcSeatSize([10], 0.5, Math.PI, 100, 0), 0.75 * 10 * Math.PI, "seats");
  near(arcSeatSize([1], 0.5, Math.PI, 100, 4), 46, "rings, padded");
  near(arcSeatSize([1], 0.5, Math.PI, 100, 40), 30, "padding at most 40%");
  assert.strictEqual(arcSeatSize([0], 0.5, Math.PI, 0, 0), 0);
});

it("arcSeatPoint — a seat's center around the arc's center", () => {
  const [x, y] = arcSeatPoint({angle: HALF, radius: 0.5}, 100);
  near(x, 50, "x");
  near(y, 0, "y");
  const [tx, ty] = arcSeatPoint({angle: 0, radius: 1}, 10);
  near(tx, 0, "top x");
  near(ty, -10, "12 o'clock is up");
});

it("majoritySeats — more than half, a set number, or none", () => {
  assert.strictEqual(majoritySeats(true, 450), 226);
  assert.strictEqual(majoritySeats(true, 101), 51);
  assert.strictEqual(majoritySeats(300, 450), 300);
  assert.strictEqual(majoritySeats(900, 450), 450, "capped at the house");
  assert.strictEqual(majoritySeats(false, 450), 0);
  assert.strictEqual(majoritySeats(true, 0), 0);
  assert.strictEqual(majoritySeats(-3, 10), 0);
});

it("majorityAngle — between the seats before the last a majority needs and that seat", () => {
  const seats = [{angle: 0}, {angle: 1}, {angle: 2}, {angle: 3}];
  assert.strictEqual(majorityAngle(seats, 3), 1.5);
  assert.strictEqual(majorityAngle(seats, 1), 0, "on the first seat");
  assert.strictEqual(majorityAngle(seats, 0), null);
  assert.strictEqual(majorityAngle(seats, 5), null);
  // An even house halves the arc.
  const even = arcSeats(arcRingSeats(100, 4, 0.4), 0.4, -HALF, HALF);
  near(majorityAngle(even, majoritySeats(true, 100)), 0, "the middle", 0.05);
});

it("arcInnerRadius — pixels or a function of the outer radius, at most 90%", () => {
  assert.strictEqual(arcInnerRadius(20, 100), 20);
  assert.strictEqual(
    arcInnerRadius(r => r / 4, 100),
    25,
  );
  assert.strictEqual(arcInnerRadius(500, 100), 90);
  assert.strictEqual(arcInnerRadius("x", 100), 0);
  assert.strictEqual(arcInnerRadius(-5, 100), 0);
});

it("isArcLayout and arcAspect — the arc's footprint", () => {
  assert.strictEqual(isArcLayout({schema: {layout: "arc"}}), true);
  assert.strictEqual(isArcLayout({schema: {layout: "grid"}}), false);
  near(arcAspect({schema: {startAngle: -90, endAngle: 90}}), 2, "half");
  near(arcAspect({schema: {startAngle: 0, endAngle: 360}}), 1, "full");
});

it("waffleArcLayout — fits the arc, keeping room above for the majority line", () => {
  const viz = new Parliament();
  const {arc, places} = waffleArcLayout(viz, 100, 600, 220);
  assert.strictEqual(places.length, 100);
  assert.strictEqual(arc.majority, 51);
  // A half circle 600 wide: its height, less the line's overhang, bounds it.
  assert.strictEqual(arc.radius, 220 - MAJORITY_OVERHANG);
  near(arc.inner, arc.radius * 0.4, "40% hole");
  near(arc.cy, 220, "the baseline at the bottom");
  for (const p of places) {
    const cx = p.x + p.size / 2 - arc.cx;
    const cy = p.y + p.size / 2 - arc.cy;
    const r = Math.hypot(cx, cy);
    assert.ok(r + p.size / 2 <= arc.radius + 1e-6, "inside the outer radius");
    assert.ok(r - p.size / 2 >= arc.inner - 1e-6, "outside the hole");
    assert.ok(cy <= 0, "above the baseline");
  }
  const set = waffleArcLayout(viz.rings(3).majority(false), 30, 400, 220);
  assert.strictEqual(new Set(set.places.map(p => p.row)).size, 3);
  assert.strictEqual(set.arc.majorityAngle, null);
  assert.strictEqual(set.arc.radius, 200, "no label room");
});

it("applyWaffleLayout — layout arc fills each category as a wedge, left to right", () => {
  const {viz, shapeData} = laidOut(Waffle, house(), {
    layout: "arc",
    sort: false,
  });
  assert.strictEqual(shapeData.length, 100);
  assert.ok(viz.ctx.waffleArc, "the fitted arc");
  const center = c => c.x + c.size / 2 - viz.ctx.waffleArc.cx;
  const angle = c =>
    Math.atan2(center(c), -(c.y + c.size / 2 - viz.ctx.waffleArc.cy));
  const ids = shapeData.map(c => c.data.id);
  assert.deepStrictEqual(
    [...new Set(ids)],
    ["left", "centre", "right"],
    "data order",
  );
  for (let k = 1; k < shapeData.length; k++)
    assert.ok(
      angle(shapeData[k]) >= angle(shapeData[k - 1]) - 1e-9,
      "cells fill by angle",
    );
  const grid = laidOut(Waffle, house());
  assert.strictEqual(grid.viz.ctx.waffleArc, undefined);
});

it("applyWaffleLayout — Parliament seats one dot per unit", () => {
  const {viz, shapeData} = laidOut(Parliament, [
    {id: "a", value: 7},
    {id: "b", value: 4},
  ]);
  assert.strictEqual(shapeData.length, 11);
  assert.strictEqual(viz.ctx.waffleArc.majority, 6);
  assert.deepStrictEqual(
    shapeData.map(c => c.data.id),
    [...Array(7).fill("a"), ...Array(4).fill("b")],
  );
});

it("majorityLinePoints — from the hole to past the outer ring", () => {
  const arc = {cx: 100, cy: 100, inner: 20, radius: 80, majorityAngle: 0};
  const [a, b] = majorityLinePoints(arc);
  near(a[0], 100, "x");
  near(a[1], 80, "inner end");
  near(b[1], 16, "past the outer ring");
  assert.strictEqual(majorityLinePoints({...arc, majorityAngle: null}), null);
});

it("majorityLabelStrip — under the center label, or across the hole's middle", () => {
  const under = majorityLabelStrip(
    {radius: 50},
    {x: -20, y: -30, width: 40, height: 20},
  );
  assert.deepStrictEqual(under, {
    x: -20,
    y: -10,
    width: 40,
    height: MAJORITY_LABEL_HEIGHT,
  });
  const half = {radius: 60, startAngle: -HALF, endAngle: HALF};
  const middle = majorityLabelStrip(half);
  assert.strictEqual(middle.height, MAJORITY_LABEL_HEIGHT);
  assert.ok(middle.y + middle.height <= 1e-6, "inside the half hole");
  assert.ok(middle.width > 60, "the widest box");
  assert.strictEqual(majorityLabelStrip({radius: 5}), null, "no room");
});

it("waffleArcDecor — the majority line, then the total and the majority label in the hole", () => {
  const {viz} = laidOut(Parliament, house());
  const arc = viz.ctx.waffleArc;
  const nodes = waffleArcDecor(viz, arc);
  const line = nodes.find(n => n.key === MAJORITY_KEY);
  assert.strictEqual(line.type, "line");
  assert.strictEqual(line.interactive, false);
  assert.deepStrictEqual(line.paint.strokeDasharray, [4, 3]);
  const groups = nodes.filter(n => n.type === "group");
  const text = g =>
    g.children.map(n => n.lines.map(l => l.text ?? l).join(" "));
  assert.deepStrictEqual(groups.map(text), [["100"], ["Majority: 51"]]);
  for (const g of groups)
    assert.deepStrictEqual(g.transform, {x: arc.cx, y: arc.cy});
  const [total, majority] = groups.map(g => g.children[0]);
  assert.ok(
    majority.transform.y > total.transform.y,
    "the majority under the total",
  );
  assert.ok(majority.transform.y < 0, "inside the hole");

  viz.centerLabel(false);
  const alone = waffleArcDecor(viz, arc).filter(n => n.type === "group");
  assert.deepStrictEqual(alone.map(text), [["Majority: 51"]]);

  viz.majority(false);
  applyWaffleLayout({viz});
  assert.deepStrictEqual(waffleArcDecor(viz, viz.ctx.waffleArc), []);
});

it("waffleArcDecor — translates the majority label", () => {
  const {viz} = laidOut(Parliament, house(), {locale: "es-ES"});
  const texts = waffleArcDecor(viz, viz.ctx.waffleArc)
    .filter(n => n.type === "group")
    .flatMap(g => g.children.map(n => n.lines.map(l => l.text ?? l).join(" ")));
  assert.ok(texts.includes("Mayoría: 51"), texts.join("|"));
});

it("waffleTooltipRows — labels the value row", () => {
  const viz = new Parliament().locale("pt-BR");
  assert.strictEqual(waffleTooltipRows(viz)[0][0](), "Valor");
  assert.strictEqual(waffleTooltipRows(viz, "Seats")[0][0](), "Assentos");
  assert.strictEqual(viz.schema.tooltipConfig.tbody[0][0](), "Assentos");
});

it("Parliament — Waffle's arc defaults", () => {
  const viz = new Parliament();
  assert.strictEqual(viz.layout(), "arc");
  assert.strictEqual(viz.unit(), 1);
  assert.strictEqual(viz.cellShape(), "circle");
  assert.strictEqual(viz.centerLabel(), true);
  assert.strictEqual(viz.majority(), true);
  assert.strictEqual(viz.sort(), false);
  assert.strictEqual(viz.startAngle(), -90);
  assert.strictEqual(viz.endAngle(), 90);
  assert.strictEqual(viz.rings(), undefined);
  assert.strictEqual(viz.innerRadius()(100), 40);
  const keys = Object.keys(parliamentDef);
  assert.deepStrictEqual(keys.slice(-2), ["ctx", "fields"]);
  const waffle = new Waffle();
  assert.strictEqual(waffle.layout(), "grid");
  assert.strictEqual(waffle.majority(), false);
  assert.strictEqual(waffle.centerLabel(), false);
});
