import assert from "assert";
import {scaleLinear} from "d3-scale";
import {colorDefaults} from "@d3plus/color";
import {
  endsForward,
  KIND_LABELS,
  kindColor,
  LABEL_SPAN,
  labelAlign,
  labelBox,
  stepLabel,
  tooltipRows,
} from "../../es/src/charts/Waterfall/labels.js";
import {labelHeadroom, waterfallBuffer} from "../../es/src/charts/Waterfall/buffer.js";

/**
    Waterfall labels, colors, tooltip rows, and the value-axis room the labels
    need.
*/

const up = {kind: "increase", start: 100, end: 150, change: 50};
const down = {kind: "decrease", start: 150, end: 120, change: -30};
const total = {kind: "total", start: 0, end: 120, change: 0};
const below = {kind: "total", start: 0, end: -20, change: -20};
const format = n => `${n}`;

it("kindColor reads the chart's own color, else the color defaults", () => {
  assert.strictEqual(kindColor("increase", {}), colorDefaults.on);
  assert.strictEqual(kindColor("decrease", {}), colorDefaults.off);
  assert.strictEqual(kindColor("total", {}), colorDefaults.sequential);
  assert.strictEqual(kindColor("increase", {increaseColor: "#0f0"}), "#0f0");
  assert.strictEqual(kindColor("total", {totalColor: ""}, {sequential: "#abc"}), "#abc");
  assert.deepStrictEqual(KIND_LABELS, {increase: "Increase", decrease: "Decrease", total: "Total"});
});

it("stepLabel signs changes and shows a subtotal's running total", () => {
  assert.strictEqual(stepLabel(up, format), "+50");
  assert.strictEqual(stepLabel(down, format), "-30");
  assert.strictEqual(stepLabel({...up, change: 0}, format), "0");
  assert.strictEqual(stepLabel(total, format), "120");
});

it("endsForward follows a change's sign, or a subtotal's", () => {
  assert.strictEqual(endsForward(up), true);
  assert.strictEqual(endsForward(down), false);
  assert.strictEqual(endsForward(total), true);
  assert.strictEqual(endsForward(below), false);
  assert.strictEqual(endsForward({kind: "total", start: 980, end: 1020, change: 0}), true, "a subtotal above its baseline");
  assert.strictEqual(endsForward({kind: "total", start: 980, end: 970, change: 0}), false, "a subtotal below its baseline");
});

it("labelBox sits just past each bar's end", () => {
  const size = {width: 40, height: 60};
  const {height, gap, minWidth, width} = LABEL_SPAN;
  assert.deepStrictEqual(labelBox(up, size, true), {x: -minWidth / 2, y: -60 - height - gap, width: minWidth, height});
  assert.deepStrictEqual(labelBox(down, size, true), {x: -minWidth / 2, y: 60 + gap, width: minWidth, height});
  assert.strictEqual(labelBox(up, {width: 100, height: 10}, true).width, 100, "a wide bar's label spans it");
  assert.deepStrictEqual(labelBox(up, size, false), {x: 40 + gap, y: -30, width, height: 60});
  assert.deepStrictEqual(labelBox(down, size, false), {x: -40 - width - gap, y: -30, width, height: 60});
});

it("labelAlign keeps each label against its bar's end", () => {
  assert.deepStrictEqual(labelAlign(up, true), {textAnchor: "middle", verticalAlign: "bottom"});
  assert.deepStrictEqual(labelAlign(down, true), {textAnchor: "middle", verticalAlign: "top"});
  assert.deepStrictEqual(labelAlign(up, false), {textAnchor: "start", verticalAlign: "middle"});
  assert.deepStrictEqual(labelAlign(below, false), {textAnchor: "end", verticalAlign: "middle"});
});

it("tooltipRows adds a change's running total", () => {
  const translate = s => `[${s}]`;
  assert.deepStrictEqual(tooltipRows(down, format, translate), [["[Running Total]", "120"]]);
  assert.deepStrictEqual(tooltipRows(total, format, translate), []);
  assert.deepStrictEqual(tooltipRows(undefined, format, translate), []);
});

it("labelHeadroom widens the domain so labels fit past the outermost ends", () => {
  const [lo, hi] = labelHeadroom([0, 150], [up, down, total], 0.1);
  assert.ok(Math.abs((hi - 150) / (hi - lo) - 0.1) < 1e-3, "a tenth of the axis above the highest forward end");
  assert.strictEqual(lo, 0, "no bar ends backward below the domain");
  const [lo2] = labelHeadroom([-20, 150], [below], 0.1);
  assert.ok(lo2 < -20);
  assert.deepStrictEqual(labelHeadroom([0, 10], [], 0.1), [0, 10]);
  assert.deepStrictEqual(labelHeadroom([0, 10], [up], 0), [0, 10]);
  assert.deepStrictEqual(labelHeadroom([0, 500], [up], 0.1), [0, 500], "a domain with room already stays");
});

it("waterfallBuffer widens the value axis for its labels", () => {
  const steps = new Map([["a", up], ["b", total]]);
  const data = [{data: "a"}, {data: "b"}];
  const make = () => ({x: scaleLinear().domain([0, 1]).range([0, 400]), y: scaleLinear().domain([150, 0]).range([0, 220])});
  const on = {vertical: () => true, labels: () => true};
  const v = make();
  waterfallBuffer(d => steps.get(d), on)({data, ...v});
  const [top, bottom] = v.y.domain();
  assert.strictEqual(bottom, 0);
  assert.ok(top > 150, "the vertical value axis (stored high first) grows upward");
  assert.ok(Math.abs(v.y(150) - v.y(top) - (LABEL_SPAN.height + LABEL_SPAN.gap)) < 0.5, "exactly one label of room");

  const h = make();
  h.x.domain([0, 150]);
  waterfallBuffer(d => steps.get(d), {vertical: () => false, labels: () => true})({data, ...h});
  assert.ok(h.x.domain()[1] > 150, "a horizontal value axis grows rightward");

  const off = make();
  waterfallBuffer(d => steps.get(d), {...on, labels: () => false})({data, ...off});
  assert.deepStrictEqual(off.y.domain(), [150, 0], "no labels, no room");
  const secondary = make();
  waterfallBuffer(d => steps.get(d), on)({data, ...secondary, x2: true});
  assert.deepStrictEqual(secondary.y.domain(), [150, 0], "secondary axes are left alone");
});
