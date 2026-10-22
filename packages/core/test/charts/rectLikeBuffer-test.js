import {it} from "vitest";
import assert from "assert";
import {scaleLinear} from "d3-scale";
import BarBuffer from "../../src/charts/plotBuffers/Bar.ts";
import BoxBuffer from "../../src/charts/plotBuffers/Box.ts";
import {rectLikeBuffer} from "../../src/charts/plotBuffers/rectLikeBuffer.ts";

const chart = (stacked = false) => ({schema: {discrete: "x", stacked}});
const scales = () => ({
  x: scaleLinear().domain([0, 1]).range([0, 100]),
  // A vertical value axis runs max to min, top to bottom.
  y: scaleLinear().domain([10, 0]).range([0, 100]),
});
const round = domain => domain.map(v => Math.round(v * 100) / 100);

it("rectLikeBuffer (Bar) pads the value axis away from 0 only", () => {
  const {x, y} = scales();
  BarBuffer.call(chart(), {data: [{x: 0, y: 10}, {x: 1, y: 4}], x, y, buffer: 10});
  assert.deepStrictEqual(round(y.domain()), [11, 0], "padded above the tallest bar, not below 0");
});

it("rectLikeBuffer (Box) pads both ends of the value axis", () => {
  const {x, y} = scales();
  y.domain([10, 2]);
  BoxBuffer.call(chart(), {data: [{x: 0, y: 2}, {x: 1, y: 10}], x, y, buffer: 10});
  assert.deepStrictEqual(round(y.domain()), [10.8, 1.2], "padded past both extremes");
});

it("rectLikeBuffer sums stacked rows by the stack key", () => {
  const {x, y} = scales();
  const data = [{x: 0, group: "a", y: 6}, {x: 0, group: "a", y: 6}, {x: 0, group: "b", y: 3}];
  BarBuffer.call(chart(true), {data, x, y, buffer: 10});
  assert.deepStrictEqual(round(y.domain()), [13, 0], "a's stack of 12 sets the top");
  const {x: x2, y: y2} = scales();
  rectLikeBuffer({stackKey: d => d.x, fromZero: true}).call(chart(true), {data, x: x2, y: y2, buffer: 10});
  assert.deepStrictEqual(round(y2.domain()), [16, 0], "one stack per category: 15 sets the top");
});
