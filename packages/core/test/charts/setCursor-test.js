import assert from "assert";
import {select} from "d3-selection";
import {resetCursor, setCursor} from "../../src/charts/viz/setCursor.ts";
import {jsdomit} from "~test/jsdom.js";

/**
    The chart cursor goes on the element under the pointer: the root svg, or
    the Canvas renderer's canvas. A reset returns both to the default.
*/

/** A chart stand-in: a root svg in a container, and a renderer's elements beside it. */
function chart(renderer, tags = []) {
  const container = document.createElement("div");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  container.appendChild(svg);
  const elements = tags.map(tag =>
    container.appendChild(document.createElement(tag)),
  );
  const viz = {
    schema: {},
    _renderer: renderer,
    _select: select(svg),
    _sceneRenderer: {elements: () => elements},
  };
  return {viz, svg, elements};
}

jsdomit("setCursor sets the root svg's cursor with the SVG renderer", () => {
  const {viz, svg} = chart("svg");
  setCursor(viz, "pointer");
  assert.strictEqual(svg.style.cursor, "pointer");
  setCursor(viz, "auto");
  assert.strictEqual(svg.style.cursor, "auto");
});

jsdomit("setCursor sets the canvas's cursor with the Canvas renderer", () => {
  const {viz, svg, elements} = chart("canvas", ["canvas", "div"]);
  const [canvas, overlays] = elements;
  setCursor(viz, "pointer");
  assert.strictEqual(canvas.style.cursor, "pointer");
  assert.strictEqual(svg.style.cursor, "", "the root svg is left alone");
  assert.strictEqual(overlays.style.cursor, "", "and the overlay layer");
  setCursor(viz, "auto");
  assert.strictEqual(canvas.style.cursor, "auto");
});

jsdomit("setCursor ignores a canvas the SVG renderer does not draw on", () => {
  const {viz, svg, elements} = chart("svg", ["canvas"]);
  setCursor(viz, "pointer");
  assert.strictEqual(svg.style.cursor, "pointer");
  assert.strictEqual(elements[0].style.cursor, "");
});

jsdomit(
  "setCursor falls back to the root svg while no canvas is mounted",
  () => {
    const headless = chart("canvas");
    setCursor(headless.viz, "pointer");
    assert.strictEqual(headless.svg.style.cursor, "pointer");

    const unrendered = chart("canvas");
    delete unrendered.viz._sceneRenderer;
    setCursor(unrendered.viz, "pointer");
    assert.strictEqual(unrendered.svg.style.cursor, "pointer");
  },
);

jsdomit("setCursor does nothing for a chart with no element", () => {
  assert.doesNotThrow(() => setCursor({schema: {}}, "pointer"));
  assert.doesNotThrow(() =>
    setCursor({schema: {}, _renderer: "canvas"}, "pointer"),
  );
});

jsdomit("resetCursor returns the root svg to the default cursor", () => {
  const {viz, svg} = chart("svg");
  setCursor(viz, "pointer");
  // The chart is set to draw on a canvas next; its renderer is still SVG.
  viz._renderer = "canvas";
  resetCursor(viz);
  assert.strictEqual(svg.style.cursor, "auto");
});

jsdomit(
  "resetCursor returns the canvas and the root svg to the default",
  () => {
    const {viz, svg, elements} = chart("canvas", ["canvas", "div"]);
    const [canvas, overlays] = elements;
    setCursor(viz, "pointer");
    svg.style.cursor = "pointer";
    // The chart is set to draw in SVG next; its renderer is still Canvas.
    viz._renderer = "svg";
    resetCursor(viz);
    assert.strictEqual(canvas.style.cursor, "auto");
    assert.strictEqual(svg.style.cursor, "auto");
    assert.strictEqual(overlays.style.cursor, "", "the overlay layer is left");
  },
);

jsdomit("resetCursor does nothing for a chart with no element", () => {
  assert.doesNotThrow(() => resetCursor({schema: {}}));
  assert.doesNotThrow(() => resetCursor({schema: {}, _renderer: "canvas"}));
});
