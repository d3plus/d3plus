import assert from "assert";
import * as napi from "@napi-rs/canvas";

import it from "./jsdom.js";
import {CanvasRenderer, getCanvasBackend, setCanvasBackend} from "../es/index.js";

// Paint coverage through a real 2D context: `@napi-rs/canvas` supplies the
// headless backend (and the global Path2D the paint path builds), so path,
// clip, gradient, pattern, text and image drawing run against Skia rather
// than jsdom's partial canvas.

function scene(children, meta) {
  return {width: 200, height: 120, meta, root: {type: "group", key: "root", children}};
}

/**
    Installs the napi backend + global Path2D for the duration of `run`.
    `loadImage` overrides the backend's decoder.
*/
async function headless(run, loadImage = src => napi.loadImage(src)) {
  const hadPath2D = Object.prototype.hasOwnProperty.call(globalThis, "Path2D");
  const prevPath2D = globalThis.Path2D;
  globalThis.Path2D = napi.Path2D;
  setCanvasBackend({
    dom: false,
    createCanvas: (w, h) => napi.createCanvas(w, h),
    loadImage,
  });
  try {
    await run();
  }
  finally {
    setCanvasBackend(null);
    if (hadPath2D) globalThis.Path2D = prevPath2D;
    else delete globalThis.Path2D;
  }
}

function mounted(pixelRatio = 1) {
  const renderer = new CanvasRenderer();
  renderer.mount({width: 200, height: 120, pixelRatio});
  return renderer;
}

/** RGBA of every pixel in the w×h CSS-pixel box at (x, y), at ratio 1. */
function pixels(renderer, x, y, w, h) {
  const data = renderer.toCanvas().getContext("2d").getImageData(x, y, w, h).data;
  const out = [];
  for (let i = 0; i < data.length; i += 4) out.push(Array.from(data.slice(i, i + 4)));
  return out;
}

/** RGBA of the CSS-pixel (x, y) on the renderer's canvas. */
function pixel(renderer, x, y, ratio = 1) {
  const ctx = renderer.toCanvas().getContext("2d");
  return Array.from(ctx.getImageData(Math.round(x * ratio), Math.round(y * ratio), 1, 1).data);
}

function solidPng(color, w = 4, h = 4) {
  const c = napi.createCanvas(w, h);
  const ctx = c.getContext("2d");
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  return c.toDataURL("image/png");
}

it("headless CanvasRenderer paints the background and skips DOM mounting", () => headless(() => {
  const renderer = mounted();
  assert.strictEqual(document.querySelector("canvas"), null, "nothing inserted into the document");
  assert.strictEqual(renderer.target().width, 200, "target() exposes the mount target");
  renderer.drawScene(scene([], {background: "#00ff00"}));
  assert.deepStrictEqual(pixel(renderer, 100, 60), [0, 255, 0, 255], "background filled");
  renderer.destroy();
  assert.strictEqual(renderer.target(), undefined, "target cleared on destroy");
}));

it("headless CanvasRenderer paints and picks path nodes", () => headless(() => {
  const renderer = mounted();
  renderer.drawScene(scene([
    {type: "path", key: "filled", d: "M10,10H60V60H10Z", paint: {fill: "#ff0000"}},
    {type: "path", key: "stroked", d: "M100,20L180,20", paint: {stroke: "#0000ff", strokeWidth: 6}},
    {type: "path", key: "thin", d: "M100,100L180,100", paint: {stroke: "#0000ff"}},
  ]));
  assert.deepStrictEqual(pixel(renderer, 30, 30), [255, 0, 0, 255], "path fill painted");
  assert.strictEqual(renderer.pick([30, 30]).node.key, "filled", "fill region hit");
  assert.strictEqual(renderer.pick([140, 22]).node.key, "stroked", "stroke hit within its width");
  assert.strictEqual(renderer.pick([140, 40]), null, "off the stroke misses");
  assert.strictEqual(renderer.pick([140, 103]), null, "an unwidthed stroke has no stroke hit area");
  renderer.destroy();
}));

it("headless CanvasRenderer clips groups to rect and path shapes", () => headless(() => {
  const renderer = mounted();
  renderer.drawScene(scene([
    {type: "group", key: "rectClip", clip: {type: "rect", x: 0, y: 0, width: 50, height: 120}, children: [
      {type: "rect", key: "a", x: 0, y: 0, width: 100, height: 50, paint: {fill: "#ff0000"}},
    ]},
    {type: "group", key: "pathClip", clip: {type: "path", d: "M100,0H150V120H100Z"}, children: [
      {type: "rect", key: "b", x: 100, y: 60, width: 100, height: 50, paint: {fill: "#0000ff"}},
    ]},
  ]));
  assert.deepStrictEqual(pixel(renderer, 25, 25), [255, 0, 0, 255], "inside the rect clip");
  assert.strictEqual(pixel(renderer, 75, 25)[3], 0, "outside the rect clip is empty");
  assert.deepStrictEqual(pixel(renderer, 125, 85), [0, 0, 255, 255], "inside the path clip");
  assert.strictEqual(pixel(renderer, 175, 85)[3], 0, "outside the path clip is empty");
  renderer.destroy();
}));

it("headless CanvasRenderer draws text lines, runs and anchors", () => headless(() => {
  const renderer = mounted();
  const lines = [{text: "Hello", x: 100, y: 40, width: 40}];
  renderer.drawScene(scene([
    {type: "text", key: "plain", x: 0, y: 0, lines: [{text: "Plain", x: 10, y: 20, width: 40}], font: {}},
    {type: "text", key: "middle", x: 0, y: 0, lines, font: {anchor: "middle", baseline: "middle", size: 14}},
    {type: "text", key: "end", x: 0, y: 0, lines: [{text: "End", x: 190, y: 70, width: 30}],
      font: {anchor: "end", baseline: "hanging", style: "italic", weight: 700, family: "serif"},
      paint: {fill: "#ff0000", fillOpacity: 0.5}},
    {type: "text", key: "runs", x: 0, y: 0, font: {size: 12},
      lines: [{text: "ab", x: 10, y: 110, width: 30, runs: [
        {text: "a", style: {weight: 700}},
        {text: "b", style: {style: "italic"}},
        {text: "c"},
      ]}]},
  ]));
  assert.strictEqual(renderer.pick([20, 15]).node.key, "plain", "start-anchored text hit");
  assert.strictEqual(renderer.pick([100, 38]).node.key, "middle", "middle-anchored text hit");
  assert.strictEqual(renderer.pick([175, 68]).node.key, "end", "end-anchored text hit");
  assert.strictEqual(renderer.pick([100, 90]), null, "between lines misses");
  renderer.destroy();
}));

it("headless CanvasRenderer draws images with each preserveAspectRatio mode", () => headless(async() => {
  const href = solidPng("#ff0000", 4, 2);
  const renderer = mounted();
  const draw = () => renderer.drawScene(scene([
    {type: "image", key: "stretch", x: 0, y: 0, width: 40, height: 40, href},
    {type: "image", key: "slice", x: 50, y: 0, width: 40, height: 40, href, preserveAspectRatio: "xMidYMid slice"},
    {type: "image", key: "meet", x: 100, y: 0, width: 40, height: 40, href, preserveAspectRatio: "xMidYMid meet"},
    {type: "image", key: "broken", x: 150, y: 0, width: 40, height: 40, href: "data:image/png;base64,AAAA"},
  ]));
  draw();
  assert.strictEqual(pixel(renderer, 20, 20)[3], 0, "image not drawn before it decodes");
  await renderer.whenSettled();
  assert.deepStrictEqual(pixel(renderer, 20, 20), [255, 0, 0, 255], "stretched image fills its box");
  assert.deepStrictEqual(pixel(renderer, 52, 2), [255, 0, 0, 255], "slice covers the whole box");
  assert.strictEqual(pixel(renderer, 120, 2)[3], 0, "meet letterboxes above the image");
  assert.deepStrictEqual(pixel(renderer, 120, 20), [255, 0, 0, 255], "meet draws the centered image");
  assert.strictEqual(pixel(renderer, 170, 20)[3], 0, "a broken image never draws");
  assert.strictEqual(renderer.pick([20, 20]).node.key, "stretch", "images are hit-testable");
  renderer.destroy();
}));

it("headless CanvasRenderer resolves gradient and pattern fills", () => headless(async() => {
  const box = "gradient:" + JSON.stringify({type: "linear", from: [0, 0], to: [1, 0],
    stops: [{offset: 0, color: "#ff0000"}, {offset: 1, color: "#ff0000"}]});
  const user = "gradient:" + JSON.stringify({type: "linear", units: "userSpaceOnUse", from: [0, 0], to: [200, 0],
    stops: [{offset: -1, color: "#0000ff"}, {offset: 2, color: "#0000ff"}]});
  const pattern = "pattern:" + JSON.stringify({texture: "lines", background: "#00ff00", stroke: "#000"});
  const renderer = mounted();
  renderer.drawScene(scene([
    {type: "rect", key: "box", x: 0, y: 0, width: 40, height: 40, paint: {fill: box}},
    {type: "circle", key: "circ", cx: 70, cy: 20, r: 15, paint: {fill: box}},
    {type: "rect", key: "user", x: 100, y: 0, width: 40, height: 40, paint: {fill: user}},
    {type: "path", key: "bounds", d: "M150,0H190V40H150Z", gradientBounds: {x: 150, y: 0, w: 40, h: 40},
      paint: {fill: box}},
    {type: "path", key: "nobox", d: "M0,60H40V100H0Z", paint: {fill: box}},
    {type: "rect", key: "pat", x: 100, y: 60, width: 40, height: 40, paint: {fill: pattern}},
  ]));
  assert.deepStrictEqual(pixel(renderer, 20, 20), [255, 0, 0, 255], "box-scaled gradient on a rect");
  assert.deepStrictEqual(pixel(renderer, 70, 20), [255, 0, 0, 255], "box-scaled gradient on a circle");
  assert.deepStrictEqual(pixel(renderer, 120, 20), [0, 0, 255, 255], "userSpaceOnUse gradient");
  assert.deepStrictEqual(pixel(renderer, 170, 20), [255, 0, 0, 255], "gradientBounds anchors the gradient");
  assert.deepStrictEqual(pixel(renderer, 20, 80), [255, 0, 0, 255], "unboxed gradient falls back to its first stop");
  const green = ([r, g, b, a]) => r === 0 && g === 255 && b === 0 && a === 255;
  const dark = ([r, g, b, a]) => r < 64 && g < 64 && b < 64 && a === 255;
  assert.ok(pixels(renderer, 100, 60, 40, 40).every(green), "pattern paints its solid background until rasterized");
  await renderer.whenSettled();
  const tiled = pixels(renderer, 100, 60, 40, 40);
  assert.ok(tiled.some(dark), "pattern strokes painted once rasterized");
  assert.ok(tiled.some(green), "pattern background painted once rasterized");
  renderer.destroy();
}));

it("headless CanvasRenderer requests a failed image or pattern decode only once", () => {
  const calls = new Map();
  const failing = src => {
    const kind = src.startsWith("data:image/svg+xml") ? "pattern" : "image";
    calls.set(kind, (calls.get(kind) || 0) + 1);
    return new Promise((_, reject) => setTimeout(() => reject(new Error("decode failed"))));
  };
  return headless(async() => {
    const pattern = "pattern:" + JSON.stringify({texture: "lines", background: "#00ff00", stroke: "#000"});
    const renderer = mounted();
    const draw = () => renderer.drawScene(scene([
      {type: "image", key: "img", x: 0, y: 0, width: 40, height: 40, href: solidPng("#ff0000")},
      {type: "rect", key: "pat", x: 100, y: 0, width: 40, height: 40, paint: {fill: pattern}},
    ]));
    try {
      draw();
      await renderer.whenSettled();
      draw();
      await renderer.whenSettled();
      assert.deepStrictEqual(Object.fromEntries(calls), {image: 1, pattern: 1}, "each decode requested once");
      assert.strictEqual(pixel(renderer, 20, 20)[3], 0, "a failed image never draws");
      assert.deepStrictEqual(pixel(renderer, 120, 20), [0, 255, 0, 255], "a failed pattern keeps its solid fallback");
    }
    finally {
      renderer.destroy();
    }
  }, failing);
});

it("headless CanvasRenderer picks through rotated and scaled transforms", () => headless(() => {
  const renderer = mounted(2);
  renderer.drawScene(scene([
    {type: "rect", key: "rot", x: 0, y: -5, width: 40, height: 10,
      transform: {x: 60, y: 60, rotate: 90}, paint: {fill: "#ff0000"}},
    {type: "rect", key: "anchored", x: 120, y: 10, width: 40, height: 10,
      transform: {rotate: 180, rotateAnchor: [140, 15]}, paint: {fill: "#0000ff"}},
    {type: "rect", key: "scaled", x: 0, y: 0, width: 10, height: 10,
      transform: {x: 150, y: 80, scale: 2}, paint: {fill: "#00ff00"}},
  ]));
  assert.strictEqual(renderer.pick([60, 80]).node.key, "rot", "rotation maps the rect onto the vertical");
  assert.strictEqual(renderer.pick([80, 60]), null, "the unrotated footprint misses");
  assert.strictEqual(renderer.pick([140, 15]).node.key, "anchored", "rotating about its own center stays in place");
  assert.strictEqual(renderer.pick([165, 95]).node.key, "scaled", "scale enlarges the hit area");
  assert.deepStrictEqual(pixel(renderer, 165, 95, 2), [0, 255, 0, 255], "painted at the device pixel ratio");
  renderer.destroy();
}));

it("headless CanvasRenderer cancel() snaps an in-flight animation to its target", () => headless(async() => {
  const renderer = mounted();
  renderer.drawScene(scene([{type: "rect", key: "a", x: 0, y: 0, width: 0, height: 0, paint: {fill: "#ff0000"}}]));
  const handle = renderer.drawScene(
    scene([{type: "rect", key: "a", x: 0, y: 0, width: 80, height: 80, paint: {fill: "#ff0000"}}]),
    {duration: 10000},
  );
  handle.cancel();
  await handle.finished;
  assert.deepStrictEqual(pixel(renderer, 70, 70), [255, 0, 0, 255], "target geometry painted after cancel");
  handle.cancel();
  renderer.destroy();
}));

it("headless CanvasRenderer ignores pointer handlers and uses the default backend after restore", () => headless(() => {
  const renderer = mounted();
  const off = renderer.on(() => {});
  off();
  renderer.destroy();
  assert.strictEqual(getCanvasBackend().dom, false, "napi backend still active inside the run");
}));

it("CanvasRenderer dispatches pointer events with hover enter/leave", () => {
  const renderer = new CanvasRenderer();
  renderer.mount({container: document.body, width: 200, height: 120});
  renderer.drawScene(scene([
    {type: "rect", key: "a", x: 0, y: 0, width: 50, height: 50, paint: {fill: "red"}},
    {type: "rect", key: "b", x: 100, y: 0, width: 50, height: 50, paint: {fill: "blue"}},
  ]));
  const events = [];
  renderer.on(e => events.push(`${e.type}:${e.pick ? e.pick.node.key : "-"}`));
  const canvas = renderer.toCanvas();
  const fire = (type, x, y) => canvas.dispatchEvent(new MouseEvent(type, {clientX: x, clientY: y}));
  fire("mousemove", 10, 10);
  fire("mousemove", 20, 20);
  fire("mousemove", 110, 10);
  fire("mousemove", 80, 80);
  fire("click", 110, 10);
  fire("dblclick", 110, 10);
  fire("contextmenu", 10, 10);
  fire("mouseleave", 0, 0);
  window.dispatchEvent(new window.Event("resize"));
  renderer.resize(220, 140);
  fire("click", 10, 10);
  assert.deepStrictEqual(events, [
    "mouseenter:a", "mousemove:a",
    "mousemove:a",
    "mouseleave:-", "mouseenter:b", "mousemove:b",
    "mouseleave:-", "mousemove:-",
    "click:b", "dblclick:b", "contextmenu:a",
    "mouseleave:-",
    "click:a",
  ]);
  renderer.destroy();
  fire("click", 10, 10);
  assert.strictEqual(events.length, 13, "listeners removed on destroy");
});
