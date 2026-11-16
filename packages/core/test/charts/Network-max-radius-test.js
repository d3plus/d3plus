import {it} from "vitest";
import assert from "assert";
import {axisFitShare, layoutMaxRadius} from "../../internal.ts";

/**
    The largest radius Network's layout gives its nodes before the fit, and
    how much of it the fit keeps on each axis.
*/

it("layoutMaxRadius: half the closest two nodes' distance", () => {
  assert.strictEqual(layoutMaxRadius(20, 800, 500), 10);
});

it("layoutMaxRadius: no more than a twelfth of the chart's smaller side", () => {
  assert.strictEqual(layoutMaxRadius(400, 800, 480), 40);
  assert.strictEqual(layoutMaxRadius(400, 360, 900), 30);
});

it("layoutMaxRadius: at least 1, for nodes that overlap", () => {
  assert.strictEqual(layoutMaxRadius(0, 800, 500), 1);
  assert.strictEqual(layoutMaxRadius(1, 800, 500), 1);
  assert.strictEqual(layoutMaxRadius(NaN, 800, 500), 1);
});

it("layoutMaxRadius: a single node (no closest pair) takes the cap", () => {
  assert.strictEqual(layoutMaxRadius(undefined, 600, 480), 40);
});

it("axisFitShare: the domain's growth on an axis the nodes spread along", () => {
  assert.strictEqual(axisFitShare(100, 125, 100, 900, 400), 0.8);
});

it("axisFitShare: an axis the nodes sit in one row along keeps them whole while they fit", () => {
  // A rotation leaves a level row a rounding error tall.
  assert.strictEqual(axisFitShare(1e-15, 2.6, 30, 80, 470), 1);
  assert.strictEqual(axisFitShare(0, 0, 0, 80, 470), 1);
});

it("axisFitShare: a row taller than the chart shrinks to fit", () => {
  assert.strictEqual(axisFitShare(0, 4, 30, 500, 400), 0.8);
});
