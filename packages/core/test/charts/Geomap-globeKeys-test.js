import {afterEach, it, vi} from "vitest";
import assert from "assert";

import {useJsdom} from "~test/jsdom.js";
import {Geomap, Treemap} from "../../index.ts";
import {
  GLOBE_KEY_DURATION,
  GLOBE_KEY_INSTRUCTIONS,
  GLOBE_KEY_SHORTCUTS,
  GLOBE_KEY_STEP,
  globeKeyStep,
  installGlobeKeys,
  rotateByStep,
  rotationBetween,
} from "../../src/charts/Geomap/globeKeys.ts";
import {
  createKeyboardNavHost,
  KEYBOARD_NAV_INSTRUCTIONS,
  updateKeyboardNavHost,
} from "../../src/charts/viz/keyboardNavHost.ts";

useJsdom();
afterEach(() => vi.unstubAllGlobals());

const closeAll = (a, b, msg) =>
  a.forEach((v, i) =>
    assert.ok(Math.abs(v - b[i]) < 1e-6, `${msg ?? ""} [${i}] ${a} ≈ ${b}`),
  );

const key = (k, mods = {}) => ({
  key: k,
  shiftKey: true,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  ...mods,
});

it("globeKeyStep reads Shift and an arrow key as a step of the view", () => {
  assert.strictEqual(GLOBE_KEY_STEP, 10);
  assert.deepStrictEqual(globeKeyStep(key("ArrowLeft")), [-10, 0]);
  assert.deepStrictEqual(globeKeyStep(key("ArrowRight")), [10, 0]);
  assert.deepStrictEqual(globeKeyStep(key("ArrowUp")), [0, 10]);
  assert.deepStrictEqual(globeKeyStep(key("ArrowDown")), [0, -10]);
  assert.strictEqual(globeKeyStep(key("ArrowLeft", {shiftKey: false})), null);
  for (const mod of ["altKey", "ctrlKey", "metaKey"])
    assert.strictEqual(globeKeyStep(key("ArrowUp", {[mod]: true})), null, mod);
  assert.strictEqual(globeKeyStep(key("Home")), null);
  assert.strictEqual(globeKeyStep(key("Enter")), null);
});

it("rotateByStep moves the view east and north, and stops at the poles", () => {
  // The view centers on [-lambda, -phi].
  closeAll(rotateByStep([74, -40], 10, 0), [64, -40, 0], "east");
  closeAll(rotateByStep([74, -40], -10, 0), [84, -40, 0], "west");
  closeAll(rotateByStep([74, -40], 0, 10), [74, -50, 0], "north");
  closeAll(rotateByStep([74, -40], 0, -10), [74, -30, 0], "south");
  closeAll(
    rotateByStep([0, -85], 0, 10),
    [0, -90, 0],
    "clamped at the north pole",
  );
  closeAll(
    rotateByStep([0, 85], 0, -10),
    [0, 90, 0],
    "clamped at the south pole",
  );
  closeAll(rotateByStep([0, -90], 0, 10), [0, -90, 0], "and stays there");
  closeAll(rotateByStep([175, 0, 0], -10, 0), [-175, 0, 0], "wraps longitude");
  closeAll(rotateByStep([0, 0, 12], 10, 0), [-10, 0, 12], "keeps gamma");
  closeAll(rotateByStep([], 0, 0), [0, 0, 0], "fills a missing rotation");
});

it("rotationBetween eases the short way round", () => {
  closeAll(rotationBetween([0, 0, 0], [20, -10, 4], 0.5), [10, -5, 2]);
  closeAll(rotationBetween([0, 0, 0], [20, -10, 4], 1), [20, -10, 4]);
  closeAll(
    rotationBetween([175, 0], [-175, 0], 0.5),
    [-180, 0, 0],
    "across 180°",
  );
  closeAll(rotationBetween([-175, 0], [175, 0], 0.25), [-177.5, 0, 0]);
});

/** Queues animation frames for the test to run, honoring cancellation. */
function stubFrames() {
  const queue = new Map();
  let id = 0;
  vi.stubGlobal("requestAnimationFrame", fn => (queue.set(++id, fn), id));
  vi.stubGlobal("cancelAnimationFrame", i => queue.delete(i));
  return {
    get length() {
      return queue.size;
    },
    shift() {
      const [i, fn] = queue.entries().next().value;
      queue.delete(i);
      return fn;
    },
  };
}

/** A Geomap globe with its keys installed and its relayout and paint counted. */
function keysFixture(projection = "geoOrthographic") {
  const viz = new Geomap().projection(projection);
  const calls = {layout: 0, paint: 0};
  viz._drawSceneToTarget = () => calls.paint++;
  installGlobeKeys(viz, () => calls.layout++);
  return {viz, calls, rotate: () => viz.schema.projection.rotate()};
}

it("installGlobeKeys turns a globe a step per key, instantly under reducedMotion", () => {
  const {viz, calls, rotate} = keysFixture();
  viz.reducedMotion(true).projectionRotate([74, -40]);
  const gesture = viz._keyboardGesture;
  assert.ok(gesture.keydown(key("ArrowRight")), "takes the key");
  closeAll(rotate(), [64, -40, 0]);
  assert.deepStrictEqual(calls, {layout: 1, paint: 1});
  assert.ok(gesture.keydown(key("ArrowUp")));
  closeAll(rotate(), [64, -50, 0]);
  assert.ok(
    !gesture.keydown(key("ArrowUp", {shiftKey: false})),
    "plain arrows",
  );
  assert.ok(!gesture.keydown(key("a")), "other keys");
  assert.deepStrictEqual(calls, {layout: 2, paint: 2});
});

it("installGlobeKeys remembers an unconfigured globe's home rotation", () => {
  const {viz, rotate} = keysFixture();
  viz.reducedMotion(true);
  viz.schema.projection.rotate([20, 10, 0]);
  viz._keyboardGesture.keydown(key("ArrowLeft"));
  closeAll(viz._globeHome.rotate, [20, 10, 0], "home");
  closeAll(rotate(), [30, 10, 0]);
});

it("installGlobeKeys eases a step, and a press meanwhile adds to it", () => {
  const frames = stubFrames();
  const {viz, rotate} = keysFixture();
  viz.reducedMotion(false).duration(600).projectionRotate([0, 0]);
  const start = performance.now();
  viz._keyboardGesture.keydown(key("ArrowRight"));
  closeAll(rotate(), [0, 0, 0], "not yet");
  frames.shift()(start + GLOBE_KEY_DURATION / 2);
  const mid = rotate()[0];
  assert.ok(mid < 0 && mid > -10, `partway: ${mid}`);
  viz._keyboardGesture.keydown(key("ArrowRight"));
  frames.shift()(performance.now() + GLOBE_KEY_DURATION);
  closeAll(rotate(), [-20, 0, 0], "both steps");
  assert.strictEqual(frames.length, 0, "and stops");
});

it("installGlobeKeys stops easing when something else turns the globe", () => {
  const frames = stubFrames();
  const {viz, rotate} = keysFixture();
  viz.reducedMotion(false).duration(600).projectionRotate([0, 0]);
  viz._keyboardGesture.keydown(key("ArrowRight"));
  // The zoom controls' reset (or a drag) turns it.
  viz.schema.projection.rotate([40, 0]);
  frames.shift()(performance.now() + GLOBE_KEY_DURATION);
  closeAll(rotate(), [40, 0, 0], "left where the reset put it");
  assert.strictEqual(frames.length, 0);
});

it("installGlobeKeys leaves flat maps alone", () => {
  const {viz, calls, rotate} = keysFixture("geoMercator");
  const before = rotate();
  assert.ok(!viz._keyboardGesture.keydown(key("ArrowRight")));
  assert.strictEqual(viz._keyboardGesture.keys(), null);
  assert.deepStrictEqual(rotate(), before);
  assert.deepStrictEqual(calls, {layout: 0, paint: 0});
});

it("Geomap installs the globe keys, and the keyboard host describes them on a globe", () => {
  const viz = new Geomap().projection("geoOrthographic");
  assert.strictEqual(typeof viz._keyboardGesture?.keydown, "function");
  const parent = document.createElement("div");
  const nav = createKeyboardNavHost(parent, viz._uuid);
  updateKeyboardNavHost(viz, nav);
  assert.strictEqual(
    nav.desc.textContent,
    `${KEYBOARD_NAV_INSTRUCTIONS} ${GLOBE_KEY_INSTRUCTIONS}`,
  );
  assert.strictEqual(
    nav.host.getAttribute("aria-keyshortcuts"),
    GLOBE_KEY_SHORTCUTS,
  );

  viz.locale("es-ES");
  updateKeyboardNavHost(viz, nav);
  assert.ok(
    nav.desc.textContent.endsWith(
      "Mantenga pulsada Mayús y use las flechas para girar el globo.",
    ),
    nav.desc.textContent,
  );

  viz.locale("en-US").projection("geoMercator");
  updateKeyboardNavHost(viz, nav);
  assert.strictEqual(nav.desc.textContent, KEYBOARD_NAV_INSTRUCTIONS);
  assert.ok(!nav.host.hasAttribute("aria-keyshortcuts"), "a flat map");

  const other = new Treemap();
  assert.strictEqual(other._keyboardGesture, undefined, "other charts");
  updateKeyboardNavHost(other, nav);
  assert.strictEqual(nav.desc.textContent, KEYBOARD_NAV_INSTRUCTIONS);
});
