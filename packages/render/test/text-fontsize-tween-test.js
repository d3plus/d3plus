import assert from "assert";

import it from "./jsdom.js";
import {SvgRenderer, interpolateNode} from "../es/index.js";
import {textFontTween} from "../es/src/svg/svgNodeAttrs.js";
import {textVisualCenter} from "../es/src/scene.js";

function scene(children) {
  return {width: 200, height: 100, root: {type: "group", key: "root", children}};
}
// A single-line label whose text width tracks the font size (≈ real wrapping).
function textNode({size, x, y, rotate = 0, anchor = "start", lineX = 0, lineWidth, rotateAnchor}) {
  return {
    type: "text", key: "t1", datum: {}, index: 0, x: 0, y: 0,
    width: 2 * size, height: 2 * size,
    lines: [{text: "Hi", x: lineX, y: size, width: lineWidth ?? 2 * size}],
    font: {family: "sans-serif", size, weight: 400, anchor, baseline: "alphabetic"},
    paint: {fill: "black"},
    transform: rotateAnchor ? {x, y, rotate, rotateAnchor} : {x, y, rotate},
  };
}

it("textVisualCenter reflects text-anchor, not the box center", () => {
  const base = {type: "text", width: 100, height: 20};
  // start: short text at the left of a wide box → center at the text (10,7),
  // NOT the box center (50,10).
  assert.deepStrictEqual(
    textVisualCenter({...base, font: {size: 10, anchor: "start"}, lines: [{x: 0, y: 10, width: 20}]}),
    [10, 7],
  );
  // middle: line.x is the anchor point → center at lineX.
  assert.deepStrictEqual(
    textVisualCenter({...base, font: {size: 10, anchor: "middle"}, lines: [{x: 50, y: 10, width: 20}]}),
    [50, 7],
  );
  // end: text extends left of lineX.
  assert.deepStrictEqual(
    textVisualCenter({...base, font: {size: 10, anchor: "end"}, lines: [{x: 50, y: 10, width: 20}]}),
    [40, 7],
  );
});

it("textFontTween eases a center-anchored scale with no jump at the start", () => {
  const prev = textNode({size: 10, x: 30, y: 40});
  const node = textNode({size: 20, x: 60, y: 80});
  const interp = textFontTween(prev, node)();
  // k=0: the scaled new label lands on the previous label (no jump).
  assert.strictEqual(interp(0), "translate(30,40) scale(0.5)", "start lands on the previous label");
  assert.strictEqual(interp(1), "translate(60,80) scale(1)", "end: final pos, scale 1");
  assert.strictEqual(interp(0.5), "translate(45,60) scale(0.75)", "midpoint glides center + scales");
});

it("textFontTween has no jump even when the text-anchor flips (Rings ring → center)", () => {
  // prev: end-anchored ring label; its visual center is at parent (60,47).
  const prev = textNode({size: 10, x: 30, y: 40, anchor: "end", lineX: 40, lineWidth: 20});
  // node: middle-anchored center label.
  const node = textNode({size: 20, x: 60, y: 80, anchor: "middle", lineX: 20, lineWidth: 40});
  const interp = textFontTween(prev, node)();
  // k=0 places the new (middle-anchored) glyphs' visual center on the OLD
  // (end-anchored) label's visual center → no jump across the anchor flip.
  // translate(50,40) scale(0.5): local center (20,14) → (50+10, 40+7) = (60,47).
  assert.strictEqual(interp(0), "translate(50,40) scale(0.5)", "no jump across anchor change");
  assert.strictEqual(interp(1), "translate(60,80) scale(1)", "settles to the new label");
});

it("textFontTween glides rotation when it changes", () => {
  const prev = textNode({size: 10, x: 0, y: 0, rotate: 90});
  const node = textNode({size: 20, x: 0, y: 0, rotate: 0, rotateAnchor: [10, 4]});
  const interp = textFontTween(prev, node)();
  assert.ok(/rotate\(45,10,4\)/.test(interp(0.5)), `rotation glides 90→0, got: ${interp(0.5)}`);
  assert.ok(!/rotate\(/.test(interp(1)), `no rotate term at rest, got: ${interp(1)}`);
});

it("Canvas: interpolateNode eases a center-anchored scale and glides position", () => {
  const prev = textNode({size: 10, x: 30, y: 40});
  const node = textNode({size: 20, x: 60, y: 80});
  const interp = interpolateNode(prev, node);
  const at0 = interp(0), at1 = interp(1);
  assert.ok(Math.abs(at0.transform.scale - 0.5) < 1e-9, `t=0 scale 0.5, got ${at0.transform.scale}`);
  assert.ok(Math.abs(at0.transform.x - 30) < 1e-9, `t=0 x=30 (no jump), got ${at0.transform.x}`);
  assert.ok(Math.abs(at0.transform.y - 40) < 1e-9, `t=0 y=40 (no jump), got ${at0.transform.y}`);
  assert.strictEqual(at0.font.size, 20, "font size stays at target while scale animates");
  assert.ok(Math.abs(at1.transform.scale - 1) < 1e-9, `t=1 scale 1, got ${at1.transform.scale}`);
  assert.ok(Math.abs(at1.transform.x - 60) < 1e-9, `t=1 settles to final x=60, got ${at1.transform.x}`);
  assert.ok(Math.abs(at1.transform.y - 80) < 1e-9, `t=1 settles to final y=80, got ${at1.transform.y}`);
});

it("SVG: font-size snaps to target immediately and stashes the node for the next tween", () => {
  const r = new SvgRenderer();
  r.mount({container: document.body, width: 200, height: 100});
  r.drawScene(scene([textNode({size: 10, x: 30, y: 40})]), {duration: 0});
  const el = document.querySelector('[data-key="t1"]');
  assert.strictEqual(el.getAttribute("font-size"), "10", "initial font-size");
  assert.ok(el.__d3plusTextPrev__, "first render stashes the text node for diffing");
  const h = r.drawScene(scene([textNode({size: 20, x: 60, y: 80})]), {duration: 600});
  assert.strictEqual(el.getAttribute("font-size"), "20", "font-size snaps to target while scale tweens");
  h.cancel();
  r.destroy();
});
