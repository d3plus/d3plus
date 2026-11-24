import {it} from "vitest";
import assert from "assert";
import {
  facetDataWindow,
  overlappingWindows,
  panelWindows,
  windowsOverlap,
} from "../../src/charts/Plot/facetZoom.ts";

/**
    `facetZoom.ts`: which window each small-multiples panel shows, from a
    range button (over the panel's own data) or a linked window (where it
    reaches the panel's data).
*/

it("windowsOverlap: whether two windows share any values, edges included", () => {
  assert.strictEqual(windowsOverlap([0, 10], [5, 20]), true);
  assert.strictEqual(windowsOverlap([0, 10], [10, 20]), true);
  assert.strictEqual(windowsOverlap([0, 10], [11, 20]), false);
  assert.strictEqual(windowsOverlap([30, 40], [0, 20]), false);
});

it("overlappingWindows: keeps the windows that reach the data, or undefined", () => {
  const extent = {x: [0, 100], y: [10, 20]};
  assert.deepStrictEqual(
    overlappingWindows({x: [50, 150], y: [30, 40]}, d => extent[d]),
    {x: [50, 150]},
  );
  assert.strictEqual(
    overlappingWindows({x: [200, 300]}, d => extent[d]),
    undefined,
  );
  assert.strictEqual(
    overlappingWindows({x: [0, 1]}, () => undefined),
    undefined,
  );
});

it("panelWindows: a range button reads each panel's own data", () => {
  const range = {
    axis: "x",
    index: 0,
    button: {step: "month", count: 1},
    utc: false,
  };
  const ends = [+new Date(2024, 0, 1), +new Date(2024, 5, 15)];
  assert.deepStrictEqual(
    panelWindows({range}, () => ends),
    {
      x: [+new Date(2024, 4, 15), ends[1]],
    },
  );
  const all = {...range, button: {step: "all"}};
  assert.strictEqual(
    panelWindows({range: all}, () => ends),
    undefined,
  );
  assert.strictEqual(
    panelWindows({range}, () => undefined),
    undefined,
  );
});

it("panelWindows: a linked window shows where it reaches the panel's data", () => {
  const zoom = {windows: {x: [50, 60]}};
  assert.deepStrictEqual(
    panelWindows(zoom, () => [0, 100]),
    {x: [50, 60]},
  );
  assert.strictEqual(
    panelWindows(zoom, () => [70, 100]),
    undefined,
  );
  assert.strictEqual(
    panelWindows(undefined, () => [0, 100]),
    undefined,
  );
});

it("facetDataWindow: spans every panel's data", () => {
  const panel = values => ({state: {_plotZoomBase: {pCtx: {xData: values}}}});
  const viz = {
    _facetPanels: [
      panel([new Date(2024, 0, 1), new Date(2024, 2, 1)]),
      panel([new Date(2023, 5, 1)]),
      {state: {}},
    ],
  };
  assert.deepStrictEqual(facetDataWindow(viz, "x"), [
    +new Date(2023, 5, 1),
    +new Date(2024, 2, 1),
  ]);
  assert.strictEqual(facetDataWindow(viz, "y"), undefined);
  assert.strictEqual(facetDataWindow({}, "x"), undefined);
});
