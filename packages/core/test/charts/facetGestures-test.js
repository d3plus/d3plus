import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {
  clampToArea,
  facetZoomable,
  scaleAbout,
} from "../../src/charts/drawSteps/facetGestures.ts";

useJsdom();

/**
    `facetGestures.ts`: the transform math behind zooming one panel of small
    multiples. The gestures themselves are in `facet-zoom.browser-test.js`.
*/

const area = [
  [100, 50],
  [300, 150],
];

it("scaleAbout: keeps the point under the pointer in place", () => {
  const t = scaleAbout({k: 1, x: 0, y: 0}, 2, [150, 100]);
  assert.deepStrictEqual(t, {k: 2, x: -150, y: -100});
  // The point maps back onto itself.
  assert.strictEqual(150 * t.k + t.x, 150);
});

it("clampToArea: keeps the scale between 1 and kMax and the content covering the panel", () => {
  assert.deepStrictEqual(clampToArea({k: 2, x: -150, y: -100}, area, 8), {
    k: 2,
    x: -150,
    y: -100,
  });
  // Panned past the panel's left edge: its content's left edge stops there.
  assert.deepStrictEqual(clampToArea({k: 2, x: 50, y: -100}, area, 8), {
    k: 2,
    x: -100,
    y: -100,
  });
  // Zoomed out past 1: back to the natural view.
  const out = clampToArea({k: 0.5, x: 100, y: 50}, area, 8);
  assert.strictEqual(out.k, 1);
  assert.strictEqual(out.x + 0, 0);
  assert.strictEqual(out.y + 0, 0);
  // Past kMax: the scale stops there, about the panel's middle.
  const capped = clampToArea({k: 16, x: -3000, y: -1500}, area, 8);
  assert.strictEqual(capped.k, 8);
  assert.ok(capped.x <= 100 * (1 - 8) && capped.x >= 300 * (1 - 8));
});

it("facetZoomable: small multiples of a Plot that zooms", () => {
  const panels = [{state: {_plotZoomBase: {}}}];
  assert.strictEqual(
    facetZoomable({schema: {zoom: true}, _facetPanels: panels}),
    true,
  );
  assert.strictEqual(
    facetZoomable({schema: {zoom: false}, _facetPanels: panels}),
    false,
  );
  assert.strictEqual(
    facetZoomable({schema: {zoom: true}, _facetPanels: [{state: {}}]}),
    false,
  );
  assert.strictEqual(facetZoomable({schema: {zoom: true}}), false);
});
