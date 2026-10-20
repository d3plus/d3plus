import assert from "assert";

import it from "./jsdom.js";
import {interpolateScene, SvgRenderer} from "../es/index.js";
import {groupEnterStart, isWrapperGroup} from "../es/src/animate/interpolate.js";
import {enterStart} from "../es/src/svg/svgFlip.js";

/** Builds a minimal scene from a list of root children. */
const scene = children => ({width: 200, height: 100, root: {type: "group", key: "root", children}});

/** A bar nested three wrapper groups deep, the way a chart wraps its marks. */
const bar = {type: "rect", key: "bar", x: 0, y: 0, width: 40, height: 80, paint: {fill: "red", opacity: 1}};
const nested = (leaf = bar) => ({
  type: "group", key: "body",
  children: [{type: "group", key: "zoom", children: [{type: "group", key: "content", children: [leaf]}]}],
});

/** Walks a frame's groups down to `bar`, multiplying their opacities. */
function painted(frame) {
  let node = frame.root.children[0], opacity = 1;
  const groups = [];
  while (node.type === "group") {
    groups.push(node.paint?.opacity);
    opacity *= node.paint?.opacity ?? 1;
    node = node.children[0];
  }
  return {groups, node, opacity: opacity * (node.paint?.opacity ?? 1)};
}

it("isWrapperGroup is true only for a group without an opacity of its own", () => {
  assert.ok(isWrapperGroup({type: "group", key: "g", children: []}));
  assert.ok(isWrapperGroup({type: "group", key: "g", children: [], paint: {fill: "red"}}));
  assert.ok(!isWrapperGroup({type: "group", key: "g", children: [], paint: {opacity: 1}}));
  assert.ok(!isWrapperGroup(bar));
  assert.strictEqual(groupEnterStart(bar), null);
});

it("Canvas shows entering wrapper groups at once and animates the mark inside", () => {
  const interp = interpolateScene(null, scene([nested()]));
  const mid = painted(interp(0.5));
  assert.deepStrictEqual(mid.groups, [undefined, undefined, undefined], "no group fades");
  assert.strictEqual(mid.node.paint.opacity, 0.5, "the bar is half faded in");
  assert.strictEqual(mid.opacity, 0.5, "the bar paints at its own opacity, not multiplied down");
  assert.deepStrictEqual([mid.node.width, mid.node.height], [20, 40], "the bar is half grown");
});

it("Canvas shows a wrapper group entering beside existing nodes at once", () => {
  const stay = {type: "circle", key: "stay", cx: 5, cy: 5, r: 2, paint: {opacity: 1}};
  const interp = interpolateScene(scene([stay]), scene([nested(), stay]));
  const entering = interp(0.25).root.children.find(n => n.key === "body");
  assert.strictEqual(painted({root: {children: [entering]}}).opacity, 0.25);
});

it("an entering group with its own opacity still fades in, on both backends", () => {
  const group = {type: "group", key: "image", paint: {opacity: 0.8}, children: [bar]};
  assert.strictEqual(enterStart(group, undefined).paint.opacity, 0, "SVG starts it at 0");
  const mid = interpolateScene(null, scene([group]))(0.5).root.children[0];
  assert.strictEqual(mid.paint.opacity, 0.4, "Canvas fades it halfway in");
});

it("SVG starts an entering wrapper group as it is", () => {
  const group = nested();
  assert.strictEqual(enterStart(group, undefined), group);
});

it("SvgRenderer never hides an entering wrapper group", () => {
  const renderer = new SvgRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});
  const handle = renderer.drawScene(scene([nested()]), {duration: 400});
  for (const key of ["body", "zoom", "content"])
    assert.strictEqual(document.querySelector(`[data-key="${key}"]`).getAttribute("opacity"), null, key);
  assert.strictEqual(document.querySelector('[data-key="bar"]').getAttribute("opacity"), "0", "the bar fades in");
  handle.cancel();
  renderer.destroy();
});

it("Canvas hides an exiting wrapper group at once, as SVG does", () => {
  const interp = interpolateScene(scene([nested()]), scene([]));
  assert.deepStrictEqual(interp(0.25).root.children, [], "gone from the first frame");
  assert.deepStrictEqual(interp(1).root.children, []);
});

it("Canvas fades an exiting group with its own opacity over its children as they stand", () => {
  const group = {type: "group", key: "image", paint: {opacity: 0.8}, children: [bar]};
  const mid = interpolateScene(scene([group]), scene([]))(0.5).root.children[0];
  assert.strictEqual(mid.paint.opacity, 0.4, "the group fades halfway out");
  assert.deepStrictEqual(mid.children, [bar], "its children hold still");
});
