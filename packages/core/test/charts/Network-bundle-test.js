import {it} from "vitest";
import assert from "assert";

import {useJsdom} from "~test/jsdom.js";
import {Network} from "../../index.ts";
import {
  applyNetworkLayout,
  bundleNetworkLinks,
  bundledLinkAnchor,
  bundledLinkEdge,
  bundledTipBack,
  runStages,
} from "../../internal.ts";
import {networkSizeLegendScale} from "../../src/charts/Network/applyLayout.ts";
import {networkEmit} from "../../src/charts/Network/emit.ts";

useJsdom();

/**
    Network's `linkBundle`: the layout gives each link between two nodes a
    bundled path (loops keep theirs), the size legend's estimate skips the
    bundling, and the emitted stroke, arrowheads, labels, and hit paths
    follow the path.
*/

const close = (a, b, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `${a} is not close to ${b}`);
const numbers = d => (d.match(/-?\d+(\.\d+)?(e-?\d+)?/g) ?? []).map(Number);

/** Two columns of nodes, each left node linked to the right node across from it, and a loop. */
const nodes = [
  ...Array.from({length: 5}, (_, k) => ({id: `L${k}`, x: 0, y: k * 10})),
  ...Array.from({length: 5}, (_, k) => ({id: `R${k}`, x: 200, y: k * 10})),
];
const links = [
  ...Array.from({length: 5}, (_, k) => ({source: `L${k}`, target: `R${k}`})),
  {source: "L0", target: "L0"},
];

/** A Network laid out at 400 × 300 with no margins, ready to emit. */
function laidOut(config = {}) {
  const viz = new Network()
    .nodes(nodes)
    .links(links)
    .width(400)
    .height(300)
    .config(config);
  viz._preDraw();
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  viz._padding = {top: 0, right: 0, bottom: 0, left: 0};
  runStages({viz}, [applyNetworkLayout]);
  return viz;
}

it("linkBundle is off by default, and links keep their straight path", () => {
  const viz = laidOut();
  assert.strictEqual(viz.linkBundle(), false);
  assert.ok(viz.ctx.networkCtx.links.every(l => !l.points));
  assert.strictEqual(viz.ctx.linkBundleCache, undefined);
});

it("linkBundle gives each link between two nodes a bundled path, and loops none", () => {
  const viz = laidOut({linkBundle: true});
  const laid = viz.ctx.networkCtx.links;
  const loop = laid.find(l => l.source === l.target);
  assert.ok(loop.loop && !loop.points, "the loop keeps its own shape");
  for (const l of laid.filter(l => l !== loop)) {
    assert.deepStrictEqual(l.points[0], [l.source.x, l.source.y]);
    assert.deepStrictEqual(l.points.at(-1), [l.target.x, l.target.y]);
    // linkD draws the path.
    assert.strictEqual(
      numbers(viz.ctx.networkCtx.linkD(l)).length,
      l.points.length * 2,
    );
  }
  // The outer links bend in toward the middle one (which stays straight).
  const middle = l => l.points[Math.floor(l.points.length / 2)][1];
  const [top, , center, , bottom] = laid.filter(l => l !== loop);
  assert.ok(top.points.length > 2 && bottom.points.length > 2, "bent paths");
  assert.ok(middle(top) - top.source.y > 5, "the top link bends down");
  assert.ok(bottom.source.y - middle(bottom) > 5, "the bottom link bends up");
  assert.strictEqual(center.points.length, 2);
  assert.strictEqual(viz.ctx.linkBundleCache.runs, 1);
  // A second layout with the nodes in place reuses the bundling.
  runStages({viz}, [applyNetworkLayout]);
  assert.strictEqual(viz.ctx.linkBundleCache.runs, 1);
});

it("linkBundleConfig merges into the defaults", () => {
  const viz = laidOut({linkBundle: true, linkBundleConfig: {strength: 0}});
  assert.deepStrictEqual(viz.linkBundleConfig(), {
    strength: 0,
    cycles: 6,
    iterations: 50,
    compatibility: 0.4,
    smoothing: true,
  });
  for (const l of viz.ctx.networkCtx.links.filter(l => l.points))
    assert.strictEqual(l.points.length, 2, "strength 0 draws them straight");
});

it("the size legend's estimate skips the bundling", () => {
  const viz = new Network()
    .nodes(nodes.map((n, k) => ({...n, value: k + 1})))
    .links(links)
    .size("value")
    .linkBundle(true)
    .width(400)
    .height(300);
  viz._preDraw();
  assert.ok(networkSizeLegendScale(viz, 400, 300));
  assert.strictEqual(viz.ctx.linkBundleCache, undefined);
});

it("bundleNetworkLinks skips unplaced ends, loops, and a chart with linkBundle off", () => {
  const a = {id: "a", x: 0, y: 0};
  const b = {id: "b", x: 100, y: 0};
  const list = [
    {source: a, target: b},
    {source: a, target: {id: "c", x: NaN, y: 0}},
    {source: a, target: a, loop: {}},
  ];
  bundleNetworkLinks({ctx: {}, schema: {linkBundle: false}}, list);
  assert.ok(list.every(l => !l.points));
  bundleNetworkLinks({ctx: {}, schema: {linkBundle: true}}, list);
  assert.deepStrictEqual(list[0].points, [
    [0, 0],
    [100, 0],
  ]);
  assert.ok(!list[1].points && !list[2].points);
});

const bent = [
  [0, 0],
  [50, 30],
  [100, 0],
];

it("bundledTipBack measures along the path to a pixel past each node", () => {
  const {source, target} = bundledTipBack(bent, 9, 4);
  // The first segment runs straight out of the source, so 10px along is 10px out.
  close(source, 10);
  close(target, 5);
  const bare = bundledTipBack(bent);
  close(bare.source, 1);
  close(bare.target, 1);
});

it("bundledLinkEdge ends the stroke inside heads tipped a pixel off each node", () => {
  const viz = {schema: {arrows: "both", arrowSize: 8}};
  const link = {
    source: {id: "a", r: 9},
    target: {id: "b", r: 4},
    points: bent,
  };
  const {d, arrows} = bundledLinkEdge(viz, link, {
    datum: {},
    i: 0,
    strokeWidth: 2,
    keyPrefix: "k",
    fill: "#123",
  });
  assert.deepStrictEqual(
    arrows.map(n => n.key),
    ["k-t", "k-s"],
  );
  const tipT = numbers(arrows[0].d).slice(0, 2);
  const tipS = numbers(arrows[1].d).slice(0, 2);
  close(Math.hypot(tipT[0] - 100, tipT[1]), 5, 0.01);
  close(Math.hypot(tipS[0], tipS[1]), 10, 0.01);
  assert.strictEqual(arrows[0].paint.fill, "#123");
  // The stroke starts and ends inside the heads, short of the tips.
  const n = numbers(d);
  assert.ok(Math.hypot(n[0] - tipS[0], n[1] - tipS[1]) < 8);
  assert.ok(Math.hypot(n.at(-2) - tipT[0], n.at(-1) - tipT[1]) < 8);
  viz.schema.arrows = false;
  const plain = bundledLinkEdge(viz, link, {datum: {}, i: 0, keyPrefix: "k"});
  assert.deepStrictEqual(plain.arrows, []);
  assert.strictEqual(plain.d, "M0,0L50,30L100,0");
});

it("bundledLinkAnchor sits halfway along the run between the nodes' edges", () => {
  const at = bundledLinkAnchor({
    source: {r: 0},
    target: {r: 0},
    points: bent,
  });
  close(at.x, 50);
  close(at.y, 30);
  const shifted = bundledLinkAnchor({
    source: {r: 20},
    target: {r: 0},
    points: bent,
  });
  assert.ok(shifted.x > 50, "the source's radius moves it toward the target");
});

it("networkEmit draws bundled links: stroke, hit path, heads, and labels on the path", () => {
  const viz = laidOut({
    linkBundle: true,
    arrows: "target",
    linkLabel: () => "x",
  });
  const scene = networkEmit({viz});
  const laid = viz.ctx.networkCtx.links.filter(l => l.points);
  for (const l of laid) {
    const i = links.findIndex(
      r => r.source === l.source.id && r.target === l.target.id,
    );
    const key = `network-link-${l.source.id}-${l.target.id}-${i}`;
    const stroke = scene.find(n => n.key === key);
    const hit = scene.find(n => n.key === `${key}::hit`);
    const head = scene.find(
      n => n.key === `network-arrow-${l.source.id}-${l.target.id}-${i}-t`,
    );
    assert.ok(stroke && hit && head, key);
    assert.strictEqual(
      hit.d,
      viz.ctx.networkCtx.linkD(l),
      "the hit path is the whole path",
    );
    assert.ok(numbers(stroke.d).length >= 6, "the stroke follows the curve");
  }
});
