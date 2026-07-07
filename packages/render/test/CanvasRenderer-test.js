import assert from "assert";

import it from "./jsdom.js";
import {CanvasRenderer} from "../es/index.js";

function scene(children) {
  return {width: 200, height: 100, root: {type: "group", key: "root", children}};
}

it("CanvasRenderer mounts a canvas and picks primitives", () => {
  const renderer = new CanvasRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});

  const canvas = document.querySelector("canvas.d3plus-render-canvas");
  assert.ok(canvas, "canvas mounted");
  assert.ok(canvas.getContext("2d"), "2d context available");

  renderer.drawScene(
    scene([
      {type: "rect", key: "a", x: 10, y: 10, width: 40, height: 40, paint: {fill: "red"}},
      {type: "circle", key: "b", cx: 150, cy: 50, r: 20, paint: {fill: "blue"}},
    ]),
  );

  assert.strictEqual(renderer.pick([30, 30]).node.key, "a", "rect picked at its center");
  assert.strictEqual(renderer.pick([150, 50]).node.key, "b", "circle picked at its center");
  assert.strictEqual(renderer.pick([150, 80]), null, "miss outside the circle radius");
  assert.strictEqual(renderer.pick([100, 5]), null, "miss in empty space");

  renderer.destroy();
});

it("CanvasRenderer pick accounts for group transforms", () => {
  const renderer = new CanvasRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});

  renderer.drawScene(
    scene([
      {
        type: "group",
        key: "g",
        transform: {x: 50, y: 50},
        children: [{type: "rect", key: "inner", x: 0, y: 0, width: 10, height: 10, paint: {fill: "green"}}],
      },
    ]),
  );

  assert.strictEqual(renderer.pick([55, 55]).node.key, "inner", "hit through translated group");
  assert.strictEqual(renderer.pick([5, 5]), null, "untranslated location misses");

  renderer.destroy();
});

it("CanvasRenderer pick returns the topmost (highest z) node", () => {
  const renderer = new CanvasRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});

  renderer.drawScene(
    scene([
      {type: "rect", key: "under", x: 0, y: 0, width: 50, height: 50, z: 1, paint: {fill: "#aaa"}},
      {type: "rect", key: "over", x: 0, y: 0, width: 50, height: 50, z: 10, paint: {fill: "#333"}},
    ]),
  );

  assert.strictEqual(renderer.pick([25, 25]).node.key, "over", "higher z wins");

  renderer.destroy();
});

it("CanvasRenderer picks an area by its filled region", () => {
  const renderer = new CanvasRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});

  renderer.drawScene(
    scene([
      {
        type: "area",
        key: "ar",
        topline: [[0, 10], [100, 10]],
        baseline: [[0, 90], [100, 90]],
        paint: {fill: "purple"},
      },
    ]),
  );

  assert.strictEqual(renderer.pick([50, 50]).node.key, "ar", "inside the filled band");
  assert.strictEqual(renderer.pick([50, 95]), null, "below the band misses");

  renderer.destroy();
});

it("CanvasRenderer animates and resolves finished with the final scene retained", async () => {
  const renderer = new CanvasRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});

  renderer.drawScene(scene([{type: "rect", key: "a", x: 0, y: 0, width: 0, height: 0, paint: {fill: "red"}}]));

  let frames = 0;
  const handle = renderer.drawScene(
    scene([{type: "rect", key: "a", x: 0, y: 0, width: 80, height: 80, paint: {fill: "red"}}]),
    {duration: 60, onFrame: () => frames++},
  );
  await handle.finished;

  assert.ok(frames > 0, "at least one animation frame ran");
  assert.strictEqual(renderer.pick([40, 40]).node.key, "a", "final geometry is hit-testable after animation");

  renderer.destroy();
});

it("CanvasRenderer.toSVGString re-renders the scene through the SVG backend", () => {
  const renderer = new CanvasRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});

  renderer.drawScene(scene([{type: "rect", key: "a", x: 5, y: 5, width: 30, height: 30, paint: {fill: "orange"}}]));

  const svg = renderer.toSVGString();
  assert.match(svg, /d3plus-render-svg/, "produces an svg element");
  assert.match(svg, /data-key="a"/, "includes the rect node");
  assert.match(svg, /fill="orange"/, "carries resolved paint");

  renderer.destroy();
});
