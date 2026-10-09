import assert from "assert";

import it from "./jsdom.js";
import {
  fadeSwapOpacity,
  interpolateScene,
  sameTextLayout,
  SvgRenderer,
} from "../es/index.js";

const swap = {out: 0.2, in: 0.2};
const label = (text, x, extra = {}) => ({
  type: "text",
  key: "label",
  x: 0,
  y: 0,
  lines: [{text, x: 0, y: 0, width: 20}],
  font: {size: 12},
  transform: {x, y: 50},
  paint: {fill: "#000"},
  fadeSwap: swap,
  ...extra,
});
const scene = children => ({
  width: 200,
  height: 100,
  root: {type: "group", key: "root", children},
});
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

it("fadeSwapOpacity fades out early, swaps while hidden, and fades in late", () => {
  const at = t => fadeSwapOpacity(t, swap, 1, 0.8, "update");
  assert.deepStrictEqual(at(0), {opacity: 1, swapped: false});
  assert.deepStrictEqual(at(0.1), {opacity: 0.5, swapped: false});
  assert.deepStrictEqual(at(0.5), {opacity: 0, swapped: true});
  assert.ok(Math.abs(at(0.9).opacity - 0.4) < 1e-9);
  assert.deepStrictEqual(at(1), {opacity: 0.8, swapped: true});
  assert.strictEqual(
    fadeSwapOpacity(0.1, swap, 1, 1, "enter").opacity,
    0,
    "an entering label waits",
  );
  assert.ok(
    Math.abs(fadeSwapOpacity(0.9, swap, 1, 1, "enter").opacity - 0.5) < 1e-9,
  );
  assert.strictEqual(
    fadeSwapOpacity(0.1, swap, 1, 1, "exit").opacity,
    0.5,
    "an exiting label fades out early",
  );
  assert.strictEqual(fadeSwapOpacity(0.9, swap, 1, 1, "exit").opacity, 0);
});

it("sameTextLayout compares text, place, and size", () => {
  assert.ok(sameTextLayout(label("A", 10), label("A", 10)));
  assert.ok(!sameTextLayout(label("A", 10), label("A", 20)), "moved");
  assert.ok(!sameTextLayout(label("A", 10), label("B", 10)), "new text");
  assert.ok(
    !sameTextLayout(label("A", 10), label("A", 10, {font: {size: 14}})),
    "resized",
  );
  assert.ok(
    !sameTextLayout(
      label("A", 10),
      label("A", 10, {transform: {x: 10, y: 50, rotate: 30}}),
    ),
    "turned",
  );
});

it("interpolateScene fade-swaps a moved label instead of gliding it", () => {
  const interp = interpolateScene(
    scene([label("A", 10)]),
    scene([label("B", 100)]),
  );
  const at = t => interp(t).root.children[0];
  assert.strictEqual(
    at(0.1).transform.x,
    10,
    "still at its old place while fading out",
  );
  assert.strictEqual(at(0.1).lines[0].text, "A");
  assert.strictEqual(at(0.1).paint.opacity, 0.5);
  for (const t of [0.05, 0.3, 0.5, 0.7, 0.95])
    assert.ok(
      [10, 100].includes(at(t).transform.x),
      `never in between at ${t}`,
    );
  assert.strictEqual(
    at(0.9).transform.x,
    100,
    "at its new place while fading in",
  );
  assert.strictEqual(at(0.9).lines[0].text, "B");
  assert.strictEqual(at(1).paint.opacity, 1);
});

it("interpolateScene leaves an unchanged fade-swap label alone, and fades entering and exiting ones late and early", () => {
  const still = interpolateScene(
    scene([label("A", 10)]),
    scene([label("A", 10)]),
  );
  assert.strictEqual(
    still(0.5).root.children[0].paint.opacity ?? 1,
    1,
    "unchanged stays opaque",
  );
  const enter = interpolateScene(scene([]), scene([label("A", 10)]));
  assert.strictEqual(enter(0.5).root.children[0].paint.opacity, 0);
  const exit = interpolateScene(scene([label("A", 10)]), scene([]));
  assert.strictEqual(exit(0.5).root.children[0].paint.opacity, 0);
  assert.strictEqual(exit(0.1).root.children[0].paint.opacity, 0.5);
});

it("SvgRenderer fade-swaps a moved label: old place fading out, then new place fading in", async () => {
  const renderer = new SvgRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});
  renderer.drawScene(scene([label("A", 10)]));
  const el = () => document.querySelector('[data-key="label"]');
  const state = () => ({
    transform: el().getAttribute("transform"),
    text: el().textContent,
    opacity: el().getAttribute("opacity"),
  });
  const start = state();
  renderer.drawScene(scene([label("B", 100)]), {duration: 600});
  const samples = [];
  for (let k = 0; k < 13; k++) {
    await wait(50);
    samples.push(state());
  }
  const end = state();
  assert.ok(
    samples.every(
      s => s.transform === start.transform || s.transform === end.transform,
    ),
    "never drawn in between",
  );
  const early = samples.find(
    s => s.opacity !== null && Number(s.opacity) > 0 && Number(s.opacity) < 1,
  );
  assert.ok(early, `fades: ${JSON.stringify(samples)}`);
  assert.strictEqual(samples[0].text, "A", "starts with its old text");
  assert.strictEqual(end.text, "B");
  assert.notStrictEqual(end.transform, start.transform);
  assert.strictEqual(end.opacity, null, "ends at its own (full) opacity");
  renderer.destroy();
});

it("SvgRenderer keeps an unchanged fade-swap label opaque through a draw", async () => {
  const renderer = new SvgRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});
  renderer.drawScene(scene([label("A", 10)]));
  renderer.drawScene(scene([label("A", 10)]), {duration: 300});
  await wait(100);
  const opacity = document
    .querySelector('[data-key="label"]')
    .getAttribute("opacity");
  assert.ok(opacity === null || Number(opacity) === 1);
  renderer.destroy();
});
