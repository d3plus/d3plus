import {it} from "vitest";
import assert from "assert";

import {explicitPathD, interpolateNode, interpolatePathD} from "../index.ts";
import {tweenOpacity} from "../src/svg/svgNodeAttrs.ts";

it("explicitPathD writes out each implicit repeat with its own command", () => {
  assert.strictEqual(explicitPathD("M0,0 10,0"), "M0,0L10,0");
  assert.strictEqual(explicitPathD("m1 2 3 4 5 6"), "m1,2l3,4l5,6");
  assert.strictEqual(explicitPathD("M0,0L1,1 2,2Z"), "M0,0L1,1L2,2Z");
  assert.strictEqual(
    explicitPathD("M0,0C1,1 2,2 3,3 4,4 5,5 6,6"),
    "M0,0C1,1,2,2,3,3C4,4,5,5,6,6",
  );
  assert.strictEqual(
    explicitPathD("M0,0A5,5 0 0,1 10,0 5,5 0 0,1 20,0"),
    "M0,0A5,5,0,0,1,10,0A5,5,0,0,1,20,0",
  );
});

it("explicitPathD returns a path with no repeats as given", () => {
  for (const d of [
    "M0,0L10,0",
    "M0 0 L 10 0",
    "M1,2C3,4 5,6 7,8Z",
    "M0,0A5,5 0 0,1 10,0",
    "",
  ])
    assert.strictEqual(explicitPathD(d), d);
});

it("interpolatePathD keeps a two-point line drawn all the way through", () => {
  const tween = interpolatePathD("M0,0 100,0", "M10,0 80,0");
  assert.strictEqual(tween(0), "M0,0L100,0");
  assert.strictEqual(tween(0.5), "M5,0L90,0");
  assert.strictEqual(tween(1), "M10,0 80,0", "ends on the path as given");
});

it("interpolatePathD keeps every repeat's points mid-tween", () => {
  const tween = interpolatePathD("M0,0L10,0 20,0", "M0,0L10,10 20,20");
  assert.strictEqual(tween(0.5), "M0,0L10,5L20,10");
});

it("interpolateNode tweens a path written with an implicit lineto", () => {
  const from = {type: "path", key: "a", d: "M0,0 100,0", paint: {}};
  const to = {type: "path", key: "a", d: "M0,0 50,50", paint: {}};
  const tween = interpolateNode(from, to);
  assert.strictEqual(tween(0.5).d, "M0,0L75,25");
  assert.strictEqual(tween(1).d, to.d);
});

/** A transition stand-in that keeps the tween `tweenOpacity` gives it. */
const fakeTransition = () => {
  const tweens = {};
  return {
    tweens,
    tween(name, factory) {
      tweens[name] = factory;
      return this;
    },
  };
};

/** An element stand-in holding its attributes. */
const fakeElement = (attrs = {}) => ({
  attrs: {...attrs},
  getAttribute(name) {
    return name in this.attrs ? this.attrs[name] : null;
  },
  setAttribute(name, value) {
    this.attrs[name] = String(value);
  },
  removeAttribute(name) {
    delete this.attrs[name];
  },
});

it("tweenOpacity fades an element with no opacity of its own in, then clears it", () => {
  const tsel = fakeTransition();
  tweenOpacity(tsel, undefined);
  const el = fakeElement({opacity: "0"});
  const step = tsel.tweens.opacity.call(el);
  step(0.25);
  assert.strictEqual(el.getAttribute("opacity"), "0.25");
  step(1);
  assert.strictEqual(el.getAttribute("opacity"), null, "cleared at the end");
});

it("tweenOpacity fades an unset opacity out from fully opaque", () => {
  const tsel = fakeTransition();
  tweenOpacity(tsel, 0);
  const el = fakeElement();
  const step = tsel.tweens.opacity.call(el);
  step(0.5);
  assert.strictEqual(el.getAttribute("opacity"), "0.5");
  step(1);
  assert.strictEqual(el.getAttribute("opacity"), "0");
});

it("tweenOpacity eases between two opacities and keeps the last", () => {
  const tsel = fakeTransition();
  tweenOpacity(tsel, 0.2);
  const el = fakeElement({opacity: "0.6"});
  const step = tsel.tweens.opacity.call(el);
  step(0.5);
  assert.ok(Math.abs(Number(el.getAttribute("opacity")) - 0.4) < 1e-9);
  step(1);
  assert.strictEqual(el.getAttribute("opacity"), "0.2");
});
