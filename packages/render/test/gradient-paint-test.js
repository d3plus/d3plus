import {it} from "vitest";
import assert from "assert";
import * as napi from "@napi-rs/canvas";

import {useJsdom} from "~test/jsdom.js";
import {
  CanvasRenderer,
  gradientToken,
  interpolateNode,
  setCanvasBackend,
  SvgRenderer,
} from "../index.ts";
import {GradientDefs} from "../src/svg/svgGradients.ts";

useJsdom({augment: false});

// Gradient strokes, and a node's own (userSpaceOnUse) gradients kept per node.

/** A vertical gradient, red above `at` and blue below. */
const split = (at, units = "userSpaceOnUse") =>
  gradientToken({
    type: "linear",
    ...(units && {units}),
    from: [0, 0],
    to: [0, 100],
    stops: [
      {offset: 0, color: "#ff0000"},
      {offset: at, color: "#ff0000"},
      {offset: at, color: "#0000ff"},
      {offset: 1, color: "#0000ff"},
    ],
  });

const scene = children => ({
  width: 200,
  height: 100,
  root: {type: "group", key: "root", children},
});

it("GradientDefs — one element per token, or one per node's paint, rewritten in place", () => {
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  document.body.appendChild(defs);
  const grads = new GradientDefs(
    () => defs,
    () => 7,
  );
  const a = grads.resolve(split(0.5));
  assert.strictEqual(a, grads.resolve(split(0.5)), "a token is cached");
  assert.notStrictEqual(
    a,
    grads.resolve(split(0.25)),
    "another token, another",
  );
  assert.strictEqual(defs.children.length, 2);
  const box = split(0.6, null);
  assert.strictEqual(
    grads.resolve(box, "a:fill"),
    grads.resolve(box, "b:fill"),
    "an objectBoundingBox gradient is shared, whatever its owner",
  );
  assert.strictEqual(defs.children.length, 3);

  grads.nextDraw();
  const k1 = grads.resolve(split(0.7), "line:stroke");
  grads.nextDraw();
  const k2 = grads.resolve(split(0.8), "line:stroke");
  assert.strictEqual(k1, k2, "a node's paint keeps its url");
  assert.strictEqual(defs.children.length, 4, "and its one element");
  const el = defs.querySelector(k2.slice(4, -1));
  assert.strictEqual(el.getAttribute("gradientUnits"), "userSpaceOnUse");
  assert.deepStrictEqual(
    Array.from(el.children, s => s.getAttribute("offset")),
    ["0", "0.8", "0.8", "1"],
    "rewritten with its latest stops",
  );
  assert.strictEqual(
    grads.resolve(split(0.8), "line:stroke"),
    k2,
    "the same token again in a draw",
  );
  const other = grads.resolve(split(0.9), "line:stroke");
  assert.notStrictEqual(
    other,
    k2,
    "a second node claiming the owner in one draw gets its own element",
  );
  assert.strictEqual(el.children[1].getAttribute("offset"), "0.8");
  assert.ok(/^url\(#d3plus-gradient-7-\d+\)$/.test(k1), "ids carry the uid");
  assert.strictEqual(grads.resolve("gradient:{bad"), "none");
  grads.clear();
  const before = defs.children.length;
  grads.resolve(split(0.5));
  assert.strictEqual(
    defs.children.length,
    before + 1,
    "cleared, it starts over",
  );
  defs.remove();
});

it("SvgRenderer paints a gradient stroke, keeping a node's gradient url across draws", () => {
  const renderer = new SvgRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});
  const line = at => ({
    type: "path",
    key: "line",
    d: "M0,0L200,100",
    paint: {fill: "none", stroke: split(at), strokeWidth: 2},
  });
  renderer.drawScene(scene([line(0.5)]));
  const path = () =>
    document.querySelector('svg.d3plus-render-svg [data-key="line"]');
  const first = path().getAttribute("stroke");
  assert.ok(first.startsWith("url(#d3plus-gradient-"), "stroke is a gradient");
  renderer.drawScene(scene([line(0.3)]));
  assert.strictEqual(path().getAttribute("stroke"), first, "same url");
  assert.strictEqual(
    document.querySelectorAll("svg.d3plus-render-svg linearGradient").length,
    1,
    "one gradient element",
  );
  renderer.destroy();
});

it("CanvasRenderer strokes with a gradient token", async () => {
  const hadPath2D = Object.prototype.hasOwnProperty.call(globalThis, "Path2D");
  const prevPath2D = globalThis.Path2D;
  globalThis.Path2D = napi.Path2D;
  setCanvasBackend({
    dom: false,
    createCanvas: (w, h) => napi.createCanvas(w, h),
  });
  try {
    const renderer = new CanvasRenderer();
    renderer.mount({width: 200, height: 100, pixelRatio: 1});
    renderer.drawScene(
      scene([
        {
          type: "path",
          key: "line",
          d: "M100,0L100,100",
          transform: {x: 0, y: 0},
          paint: {fill: "none", stroke: split(0.5), strokeWidth: 6},
        },
      ]),
    );
    const ctx = renderer.toCanvas().getContext("2d");
    const at = y => Array.from(ctx.getImageData(100, y, 1, 1).data);
    assert.deepStrictEqual(at(20), [255, 0, 0, 255], "red above the split");
    assert.deepStrictEqual(at(80), [0, 0, 255, 255], "blue below it");
    renderer.destroy();
  } finally {
    setCanvasBackend(null);
    if (hadPath2D) globalThis.Path2D = prevPath2D;
    else delete globalThis.Path2D;
  }
});

it("interpolateNode snaps between a color and a gradient token", () => {
  const token = split(0.5);
  const from = {type: "rect", key: "r", x: 0, y: 0, width: 10, height: 10};
  const interp = interpolateNode(
    {...from, paint: {fill: "#00ff00", stroke: "#00ff00"}},
    {...from, paint: {fill: token, stroke: token}},
  );
  const mid = interp(0.5);
  assert.strictEqual(mid.paint.fill, token, "fill takes the token at once");
  assert.strictEqual(mid.paint.stroke, token, "and so does stroke");
  const back = interpolateNode(
    {...from, paint: {fill: token}},
    {...from, paint: {fill: "#00ff00"}},
  )(0.5);
  assert.strictEqual(back.paint.fill, "#00ff00", "and back to a color");
});
