import {it} from "vitest";
import assert from "assert";

import {useJsdom} from "~test/jsdom.js";
import {
  CanvasRenderer,
  enterWindowProgress,
  interpolateScene,
  SvgRenderer,
} from "../index.ts";

useJsdom({augment: false});

const scene = children => ({
  width: 200,
  height: 100,
  root: {type: "group", key: "root", children},
});
const rect = (key, extra = {}) => ({
  type: "rect",
  key,
  x: 0,
  y: 0,
  width: 100,
  height: 40,
  enterRect: {x: 0, y: 20, width: 0, height: 0},
  paint: {fill: "#000", opacity: 1},
  ...extra,
});
const label = (key, extra = {}) => ({
  type: "text",
  key,
  x: 0,
  y: 0,
  lines: [{text: key, x: 0, y: 0, width: 20}],
  font: {size: 12},
  transform: {x: 10, y: 20},
  paint: {fill: "#000"},
  ...extra,
});
const near = (a, b, msg) =>
  assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} vs ${b}`);
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

it("enterWindowProgress holds at 0 before the window, runs across it, and holds at 1 after", () => {
  const w = {start: 0.25, end: 0.75};
  assert.strictEqual(
    enterWindowProgress(0.4, undefined),
    0.4,
    "no window: the progress itself",
  );
  assert.strictEqual(enterWindowProgress(0, w), 0);
  assert.strictEqual(enterWindowProgress(0.2, w), 0, "held before it starts");
  near(enterWindowProgress(0.5, w), 0.5, "halfway through the window");
  assert.strictEqual(enterWindowProgress(0.8, w), 1, "done once it ends");
  assert.strictEqual(enterWindowProgress(1, w), 1);
  assert.strictEqual(
    enterWindowProgress(0.4, {start: 0.5, end: 0.5}),
    0,
    "an empty window waits",
  );
  assert.strictEqual(
    enterWindowProgress(0.5, {start: 0.5, end: 0.5}),
    1,
    "then jumps",
  );
  near(
    enterWindowProgress(0.5, {start: -1, end: 2}),
    0.5,
    "shares clamp to 0–1",
  );
  assert.strictEqual(
    enterWindowProgress(1, {start: 1, end: 1}),
    1,
    "always finishes",
  );
});

it("interpolateScene runs each entering node over its own enterWindow", () => {
  const first = rect("a", {enterWindow: {start: 0, end: 0.5}});
  const second = rect("b", {enterWindow: {start: 0.5, end: 1}});
  const plain = rect("c");
  const interp = interpolateScene(scene([]), scene([first, second, plain]));
  const at = t =>
    Object.fromEntries(interp(t).root.children.map(n => [n.key, n]));
  near(at(0.25).a.width, 50, "the first is halfway at a quarter");
  assert.strictEqual(at(0.25).b.width, 0, "the second holds its enter start");
  assert.strictEqual(at(0.25).b.y, 20);
  near(at(0.25).c.width, 25, "a node without a window runs over the whole");
  assert.strictEqual(at(0.75).a.width, 100, "the first has arrived");
  near(at(0.75).b.width, 50, "the second is halfway");
  assert.deepStrictEqual(
    [at(1).a.width, at(1).b.width, at(1).b.y],
    [100, 100, 0],
    "both end at their targets",
  );
});

it("interpolateScene ignores enterWindow on updating nodes, and windows an entering group's own enter only", () => {
  const prev = rect("a", {width: 20});
  const next = rect("a", {enterWindow: {start: 0.5, end: 1}});
  near(
    interpolateScene(scene([prev]), scene([next]))(0.25).root.children[0].width,
    40,
    "an update runs over the whole transition",
  );
  const group = {
    type: "group",
    key: "g",
    transform: {x: 100},
    paint: {opacity: 1},
    enterWindow: {start: 0.5, end: 1},
    children: [rect("child")],
  };
  const g = interpolateScene(scene([]), scene([group]))(0.25).root.children[0];
  assert.strictEqual(g.paint.opacity, 0, "the group itself waits");
  near(g.children[0].width, 25, "its children keep their own timing");
});

it("interpolateScene holds an entering fade-swap label until its window's fade-in", () => {
  const swapping = label("l", {
    fadeSwap: {out: 0.2, in: 0.2},
    enterWindow: {start: 0, end: 0.5},
  });
  const interp = interpolateScene(scene([]), scene([swapping]));
  const opacity = t => interp(t).root.children[0].paint.opacity;
  assert.strictEqual(opacity(0.3), 0, "hidden early in its window");
  near(opacity(0.45), 0.5, "fading in over the window's last share");
  assert.strictEqual(opacity(0.6), 1, "shown once its window ends");
});

it("SvgRenderer runs each entering element over its own enterWindow", async () => {
  const renderer = new SvgRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});
  const width = key =>
    Number(document.querySelector(`[data-key="${key}"]`).getAttribute("width"));
  const opacity = key =>
    document.querySelector(`[data-key="${key}"]`).getAttribute("opacity");
  renderer.drawScene(
    scene([
      rect("a", {enterWindow: {start: 0, end: 0.4}}),
      rect("b", {enterWindow: {start: 0.6, end: 1}}),
      label("l", {
        fadeSwap: {out: 0.1, in: 0.1},
        enterWindow: {start: 0.6, end: 1},
      }),
    ]),
    {duration: 800},
  );
  await wait(250);
  // ~30% of the time is ~20% of cubicInOut's eased progress.
  assert.ok(
    width("a") > 0 && width("a") < 100,
    `the first grows early: ${width("a")}`,
  );
  assert.strictEqual(width("b"), 0, "the second holds its enter start");
  assert.strictEqual(opacity("l"), "0", "its label waits with it");
  await wait(320);
  // ~70% of the time is ~90% of the eased progress.
  assert.strictEqual(width("a"), 100, "the first has arrived");
  assert.ok(
    width("b") > 0 && width("b") < 100,
    `the second is growing: ${width("b")}`,
  );
  await wait(400);
  assert.deepStrictEqual(
    [width("a"), width("b")],
    [100, 100],
    "both end at their targets",
  );
  assert.strictEqual(opacity("l"), null, "the label ends at its own opacity");
  renderer.destroy();
});

it("SvgRenderer animates an updating element over the whole transition, whatever its enterWindow", async () => {
  const renderer = new SvgRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});
  renderer.drawScene(scene([rect("a", {width: 20})]));
  renderer.drawScene(scene([rect("a", {enterWindow: {start: 0.6, end: 1}})]), {
    duration: 800,
  });
  await wait(250);
  const w = Number(
    document.querySelector('[data-key="a"]').getAttribute("width"),
  );
  assert.ok(w > 20 && w < 100, `it moves from the start: ${w}`);
  renderer.destroy();
});

it("CanvasRenderer paints each entering node over its own enterWindow", async () => {
  const renderer = new CanvasRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});
  const frames = [];
  const paint = renderer._paint.bind(renderer);
  renderer._paint = frame => {
    frames.push(
      Object.fromEntries(frame.root.children.map(n => [n.key, n.width])),
    );
    return paint(frame);
  };
  let progress = 0;
  const handle = renderer.drawScene(
    scene([
      rect("a", {enterWindow: {start: 0, end: 0.5}}),
      rect("b", {enterWindow: {start: 0.5, end: 1}}),
    ]),
    {
      duration: 120,
      ease: t => t,
      onFrame: t => ((progress = t), (frames[frames.length - 1].t = t)),
    },
  );
  await handle.finished;
  assert.ok(progress === 1 && frames.length > 2, "it animated");
  for (const f of frames.filter(f => f.t !== undefined)) {
    near(f.a, 100 * Math.min(1, f.t * 2), `the first at ${f.t}`);
    near(f.b, 100 * Math.max(0, f.t * 2 - 1), `the second at ${f.t}`);
  }
  renderer.destroy();
});
