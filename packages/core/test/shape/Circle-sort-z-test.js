import assert from "assert";
import {SvgRenderer} from "@d3plus/render";
import {Circle} from "../../es/index.js";
import configPrep from "../../es/src/utils/configPrep.js";
import {sortRanks} from "../../es/src/shapes/sceneSort.js";
import it from "../jsdom.js";

/**
    A `sort` comparator on a shape must NOT reorder the data array — it maps to
    per-datum `z` (layering order) so the render backends draw larger circles
    behind smaller ones. Covers the two seams that make it work on a Plot:
    (1) `configPrep` passes the two-arg comparator through un-wrapped, and
    (2) `Shape.toScene` stamps the comparator's rank onto each node's `z`.
*/

it("Circle.sort() maps to per-datum z without reordering data", () => {
  const data = [
    {id: "big", r: 40},
    {id: "small", r: 5},
    {id: "mid", r: 20},
  ];
  const circle = new Circle()
    .data(data)
    .r(d => d.r)
    .x((d, i) => 50 + i * 50)
    .y(30)
    // Configure via .config({sort}) — the same call a Plot's emit makes on each
    // shape (`s.config(shapeConfigFor(viz, key))`). Largest first → largest gets
    // the lowest z (painted behind), smallest the highest z (painted on top).
    .config({sort: (a, b) => b.r - a.r});

  const scene = circle.toScene();
  const nodes = scene.children;

  // Data order is preserved (no in-place sort): index still matches input.
  assert.deepStrictEqual(nodes.map(n => n.key), ["big", "small", "mid"], "data order untouched");

  // z reflects the comparator: big=0 (behind), mid=1, small=2 (on top).
  const zByKey = Object.fromEntries(nodes.map(n => [n.key, n.z]));
  assert.strictEqual(zByKey.big, 0, "largest painted first (lowest z)");
  assert.strictEqual(zByKey.mid, 1, "middle in between");
  assert.strictEqual(zByKey.small, 2, "smallest painted last (highest z)");

  // The backend draws in ascending z, so DOM order = big, mid, small.
  const renderer = new SvgRenderer();
  renderer.mount({container: document.body, width: 300, height: 100});
  renderer.drawScene({width: 300, height: 100, root: scene});
  const domOrder = Array.from(
    document.querySelectorAll("circle.d3plus-render-circle"),
  ).map(c => c.closest("[data-key]")?.getAttribute("data-key"));
  assert.deepStrictEqual(domOrder, ["big", "mid", "small"], "DOM paints big→mid→small (small on top)");
  renderer.destroy();
});

it("no sort → no z stamped (append-order fast path preserved)", () => {
  const scene = new Circle().data([{id: "a", r: 10}, {id: "b", r: 20}]).r(d => d.r).toScene();
  assert.ok(scene.children.every(n => n.z === undefined), "z left undefined when no comparator");
});

it("sortRanks ranks without mutating and is null when inapplicable", () => {
  const data = [{v: 3}, {v: 1}, {v: 2}];
  const rank = sortRanks(data, (a, b) => a.v - b.v);
  assert.deepStrictEqual(rank, [2, 0, 1], "rank[i] = paint position of datum i");
  assert.deepStrictEqual(data.map(d => d.v), [3, 1, 2], "input array untouched");
  assert.strictEqual(sortRanks(data, null), null, "null comparator → null");
  assert.strictEqual(sortRanks([{v: 1}], (a, b) => a.v - b.v), null, "single datum → null");
});

it("configPrep passes a sort comparator through un-wrapped (Plot shapeConfig path)", () => {
  const cmp = (a, b) => b.r - a.r;
  const viz = {schema: {duration: 0, shapeConfig: {}}};
  const prepped = configPrep.call(viz, {Circle: {sort: cmp}}, "shape", "Circle");
  assert.strictEqual(prepped.sort, cmp, "comparator reaches the shape identical, not wrapped");
  // A mangled (wrapped) comparator would ignore its second argument; assert the
  // real two-arg comparison still works after prep.
  assert.ok(prepped.sort({r: 10}, {r: 30}) > 0, "still a real two-argument comparator");
});
