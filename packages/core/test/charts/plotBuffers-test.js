import assert from "assert";
import {scaleLinear} from "d3-scale";

import discreteBuffer from "../../es/src/charts/plotBuffers/discreteBuffer.js";
import numericBuffer from "../../es/src/charts/plotBuffers/numericBuffer.js";

it("charts/numericBuffer returns the domain untouched when the value is undefined", () => {
  const ax = scaleLinear().domain([0, 50]).range([0, 100]);
  assert.deepStrictEqual(
    numericBuffer(ax, "linear", undefined, 10, [0, 100], [0, 50], 0, false),
    [0, 50],
  );
});

it("charts/numericBuffer returns the domain untouched when an endpoint is NaN", () => {
  const ax = scaleLinear().range([0, 100]);
  assert.deepStrictEqual(
    numericBuffer(ax, "linear", 5, 10, [0, 100], [NaN, 50], 0, false),
    [NaN, 50],
  );
});

it("charts/numericBuffer expands a zero-width domain so the axis is renderable", () => {
  const ax = scaleLinear().domain([5, 5]).range([0, 100]);
  assert.deepStrictEqual(
    numericBuffer(ax, "linear", 5, 10, [0, 100], [5, 5], 0, false),
    [4, 6],
  );
});

it("charts/numericBuffer extends the domain when a shape would overflow the low edge", () => {
  // value 2 maps to pixel 10; a 20px-radius shape would reach pixel -10,
  // past the range start (0), so the lower domain bound is pushed out.
  const ax = scaleLinear().domain([0, 100]).range([0, 500]);
  assert.deepStrictEqual(
    numericBuffer(ax, "linear", 2, 20, [0, 500], [0, 100], 0, false),
    [-4, 100],
  );
});

it("charts/numericBuffer leaves the domain alone when the shape fits inside the range", () => {
  const ax = scaleLinear().domain([0, 100]).range([0, 500]);
  assert.deepStrictEqual(
    numericBuffer(ax, "linear", 50, 5, [0, 500], [0, 100], 0, false),
    [0, 100],
  );
});

it("charts/discreteBuffer sets half-step padding on a band/point scale", () => {
  let padding;
  const bandScale = {padding(p) { padding = p; }};
  discreteBuffer(bandScale, [], "x");
  assert.strictEqual(padding, 0.5);
});

it("charts/discreteBuffer pads a time scale's domain by half the closest step (x axis)", () => {
  // Closest spacing is 4ms, so each end shifts out by 2ms.
  let domain = [new Date(0), new Date(8)];
  const timeScale = {
    domain(d) {
      if (arguments.length) { domain = d; return timeScale; }
      return domain;
    },
  };
  discreteBuffer(timeScale, [{x: 0}, {x: 4}, {x: 8}], "x");
  assert.strictEqual(+domain[0], -2, "start shifted back half a step");
  assert.strictEqual(+domain[1], 10, "end shifted forward half a step");
});

it("charts/discreteBuffer pads a time scale's domain accounting for the y-axis reversal", () => {
  let domain = [new Date(0), new Date(8)];
  const timeScale = {
    domain(d) {
      if (arguments.length) { domain = d; return timeScale; }
      return domain;
    },
  };
  discreteBuffer(timeScale, [{y: 0}, {y: 4}, {y: 8}], "y");
  assert.strictEqual(+domain[0], 2);
  assert.strictEqual(+domain[1], 6);
});
