import {it} from "vitest";
import assert from "assert";
import {zoom} from "d3-zoom";
import {useJsdom} from "~test/jsdom.js";
import {LinePlot} from "../../index.ts";
import {
  broadcastZoom,
  dispatchLinked,
  followZoom,
  linkMembers,
  resolveLink,
  sharedWindows,
  unregisterLink,
} from "../../internal.ts";
import {clampTransform} from "../../src/charts/drawSteps/zoomControls.ts";

useJsdom();

/**
    Linked zoom (`zoomLink.ts`) and the transform clamp it and the range
    selector share. The full flow, with real charts, is in
    `zoom-link.browser-test.js`.
*/

/** A chart stand-in: its `link`, time axes, and zoom state. */
const member = (link, {xTime = true, yTime = false, drawn = false} = {}) => {
  const viz = new LinePlot().link(link);
  viz._xTime = xTime;
  viz._yTime = yTime;
  if (!drawn) viz._plotZoomBase = undefined;
  return viz;
};

it("sharedWindows: passes a window only between axes of the same kind", () => {
  const time = member(false, {xTime: true});
  const numbers = member(false, {xTime: false});
  const windows = {x: [1, 2], y: [3, 4]};
  assert.deepStrictEqual(sharedWindows(time, member(false), windows), {
    x: [1, 2],
    y: [3, 4],
  });
  assert.deepStrictEqual(sharedWindows(time, numbers, windows), {y: [3, 4]});
  assert.deepStrictEqual(sharedWindows(time, numbers, {x: [1, 2]}), {});
});

it("followZoom: leaves a chart that hasn't drawn its zoomable axes alone", () => {
  const viz = member(false);
  viz._zoomBehavior = undefined;
  assert.doesNotThrow(() => followZoom(viz, {x: [0, 1]}, 0));
  assert.doesNotThrow(() => followZoom(member(false), null, 0));
});

it("dispatchLinked: visits every other member of the group, once", () => {
  const a = member("dispatch"),
    b = member("dispatch"),
    c = member("dispatch");
  const seen = [];
  dispatchLinked(a, resolveLink(a), target => {
    seen.push(target);
    // An echo from a member is suppressed while the group dispatches.
    dispatchLinked(target, resolveLink(target), () => seen.push("echo"));
  });
  assert.deepStrictEqual(seen, [b, c]);
  [a, b, c].forEach(unregisterLink);
  assert.strictEqual(linkMembers("dispatch").length, 0);
});

it("broadcastZoom: does nothing for a chart that doesn't link zoom, or hasn't drawn", () => {
  const plain = member("plain", {drawn: true});
  plain._plotZoomBase = {};
  const other = member("plain");
  let followed = false;
  other._zoomBehavior = {
    get scaleExtent() {
      followed = true;
      return () => [1, 1];
    },
  };
  broadcastZoom(plain, {k: 2, x: 0, y: 0}, 0);
  const undrawn = member({group: "plain", zoom: true});
  broadcastZoom(undrawn, {k: 2, x: 0, y: 0}, 0);
  assert.strictEqual(followed, false);
  [plain, other, undrawn].forEach(unregisterLink);
});

it("clampTransform: clamps the scale to scaleExtent and keeps the content covering the area", () => {
  const viz = {
    _zoomBehavior: zoom()
      .scaleExtent([1, 8])
      .translateExtent([
        [0, 0],
        [400, 300],
      ]),
  };
  // `+ 0` reads -0 (0 times a negative) as 0.
  const clamp = (...args) =>
    Object.fromEntries(
      Object.entries(clampTransform(viz, ...args)).map(([k, v]) => [k, v + 0]),
    );
  assert.deepStrictEqual(clamp(2, -100, -50), {
    k: 2,
    x: -100,
    y: -50,
  });
  // Past the right edge: the content's right edge (400·2 + x) can't come left of 400.
  assert.deepStrictEqual(clamp(2, -900, 0), {k: 2, x: -400, y: 0});
  // Past the left edge, and a scale past the extent.
  assert.deepStrictEqual(clamp(20, 50, 10), {k: 8, x: 0, y: 0});
  assert.deepStrictEqual(clamp(0.5, 30, 30), {k: 1, x: 0, y: 0});
});
