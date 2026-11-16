import {it} from "vitest";
import assert from "assert";
import {readFileSync} from "node:fs";

import {useJsdom} from "~test/jsdom.js";
import {Geomap} from "../../index.ts";
import {applyGeomapLayout} from "../../src/charts/Geomap/applyLayout.ts";
import {geomapEmit} from "../../src/charts/Geomap/emit.ts";
import {geomapPointLabels} from "../../src/charts/Geomap/pointLabels.ts";
import {
  CLUSTER_K_MAX,
  SPIDER_GAP,
  buildClusterLevels,
  clusterBounds,
  clusterLevelAt,
  clusterNodes,
  clusterScales,
  clusterSplitK,
  pointsOverlap,
  spiderOffsets,
} from "../../src/charts/Geomap/pointCluster.ts";
import {
  CLUSTER_R_MIN,
  CLUSTER_R_SHARE,
  CLUSTER_RADIUS,
  clusterBubbleScale,
  clusterRow,
  geoClusterMeta,
  geoClusterTitle,
  geoClusterTooltipRows,
  geomapPointClusters,
  pointClusterSettings,
} from "../../src/charts/Geomap/pointClusterLayout.ts";
import {
  CLUSTER_SCENE_KEYS,
  bubbleNodes,
  clusterColors,
  clusterWedges,
  emitClusterScene,
  pointNode,
} from "../../src/charts/Geomap/pointClusterEmit.ts";
import {rerouteFlowLinks} from "../../src/charts/Geomap/pointClusterLinks.ts";
import {
  clusterClick,
  clusterState,
  installPointClusterEvents,
  reclusterOnZoom,
  redrawClusters,
  replaceClusterNodes,
  revealClusters,
  stageClusterMoves,
  syncPointCluster,
} from "../../src/charts/Geomap/pointClusterZoom.ts";
import {syncDensityColorScale} from "../../src/charts/Geomap/densityFields.ts";

useJsdom();

/**
    Geomap's `pointCluster`: points near one another on screen clustered at
    a ladder of zoom scales, drawn as bubbles that split as the map zooms in,
    fanned out when they can't split, and the links to them rerouted.
*/

const states = JSON.parse(
  readFileSync(new URL("../../dev/charts/Geomap/State.json", import.meta.url)),
);

/** A clump of points in Kansas, a pair in Ohio, three in one place in Texas, and one in Florida. */
const rows = [
  ...Array.from({length: 6}, (_, i) => ({
    id: `k${i}`,
    kind: i % 2 ? "A" : "B",
    size: i + 1,
    point: [-98 + (i % 3) * 0.05, 38.5 + Math.floor(i / 3) * 0.05],
  })),
  {id: "o1", kind: "A", size: 1, point: [-83, 40]},
  {id: "o2", kind: "A", size: 1, point: [-82.95, 40]},
  ...Array.from({length: 3}, (_, i) => ({
    id: `t${i}`,
    kind: "B",
    size: 1,
    point: [-97.7, 30.3],
  })),
  {id: "f1", kind: "A", size: 1, point: [-81.5, 28]},
];

/** A Geomap over the states with its draw state filled in by hand, laid out. */
function laidOut(config = {}, data = rows) {
  const viz = new Geomap().config({
    width: 800,
    height: 500,
    tiles: false,
    topojson: states,
    projection: "geoAlbersUsa",
    groupBy: "id",
    legend: false,
    point: d => d.point,
    ...config,
  });
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  viz._filteredData = data;
  viz._drawDepth = 0;
  viz._id = d => d.id;
  viz._ids = d => [d.id];
  viz._drawLabel = d => d.name ?? d.id;
  applyGeomapLayout({viz});
  return viz;
}

/** Points as cluster leaves. */
const leaf = (x, y, r = 5, weight = 1) => ({x, y, r, weight});

it("clusterScales steps through each doubling of the zoom scale in two", () => {
  const ks = clusterScales(4);
  assert.deepStrictEqual(
    ks.map(k => +k.toFixed(6)),
    [1, Math.SQRT2, 2, 2 * Math.SQRT2, 4].map(k => +k.toFixed(6)),
  );
  assert.deepStrictEqual(clusterScales(1), [1]);
  assert.strictEqual(clusterScales().at(-1), CLUSTER_K_MAX);
});

it("clusterNodes merges each seed's neighbors in order, at their mean position", () => {
  const nodes = [leaf(0, 0), leaf(6, 0), leaf(30, 0), leaf(34, 0)].map(
    (l, i) => ({id: i, x: l.x, y: l.y, leaves: [i], weight: i + 1}),
  );
  const out = clusterNodes(nodes, 10);
  assert.deepStrictEqual(
    out.map(n => [n.id, n.x, n.leaves, n.weight]),
    [
      [0, 3, [0, 1], 3],
      [2, 32, [2, 3], 7],
    ],
  );
  assert.strictEqual(clusterNodes(nodes, 0), nodes, "no radius");
  const lone = clusterNodes(nodes, 1);
  assert.ok(
    lone.every((n, i) => n === nodes[i]),
    "nodes without neighbors stay",
  );
});

it("clusterNodes weighs each center by how many points a node holds", () => {
  const nodes = [
    {id: 0, x: 0, y: 0, leaves: [0, 1, 2], weight: 3},
    {id: 3, x: 8, y: 0, leaves: [3], weight: 1},
  ];
  assert.strictEqual(clusterNodes(nodes, 10)[0].x, 2);
});

it("buildClusterLevels nests every level's clusters in the next shallower one", () => {
  const leaves = [leaf(0, 0), leaf(4, 0), leaf(100, 0), leaf(103, 1)];
  const levels = buildClusterLevels(leaves, 40, 64);
  assert.strictEqual(levels.length, clusterScales(64).length);
  assert.deepStrictEqual(
    levels[0].nodes.map(n => n.leaves),
    [
      [0, 1],
      [2, 3],
    ],
  );
  assert.strictEqual(levels.at(-1).nodes.length, 4);
  for (let j = 1; j < levels.length; j++)
    for (const node of levels[j].nodes) {
      const parent = levels[j - 1].nodes[levels[j - 1].nodeOf[node.leaves[0]]];
      assert.ok(node.leaves.every(l => parent.leaves.includes(l)));
    }
  levels.forEach(level =>
    level.nodes.forEach((node, n) =>
      node.leaves.forEach(l => assert.strictEqual(level.nodeOf[l], n)),
    ),
  );
  assert.deepStrictEqual(
    buildClusterLevels(leaves, 40, 64).map(l => l.nodes.length),
    levels.map(l => l.nodes.length),
    "the same every time",
  );
});

it("clusterLevelAt picks the deepest level the zoom has reached", () => {
  const levels = buildClusterLevels([leaf(0, 0), leaf(4, 0)], 40, 16);
  assert.strictEqual(clusterLevelAt(levels, 1), 0);
  assert.strictEqual(clusterLevelAt(levels, 0.5), 0);
  assert.strictEqual(clusterLevelAt(levels, 1.5), 1);
  assert.strictEqual(clusterLevelAt(levels, 2), 2);
  assert.strictEqual(clusterLevelAt(levels, 1e9), levels.length - 1);
});

it("clusterSplitK is the first scale that draws a node's points apart", () => {
  const levels = buildClusterLevels([leaf(0, 0), leaf(4, 0)], 40, 64);
  // 40 / k < 4 first at 2^(7/2).
  assert.strictEqual(clusterSplitK(levels, 0, levels[0].nodes[0]), 2 ** 3.5);
  const same = buildClusterLevels([leaf(9, 9), leaf(9, 9)], 40, 64);
  assert.strictEqual(clusterSplitK(same, 0, same[0].nodes[0]), Infinity);
});

it("clusterBounds is the box around the points it names", () => {
  const leaves = [leaf(5, 1), leaf(-2, 8), leaf(40, 40)];
  assert.deepStrictEqual(clusterBounds(leaves, [0, 1]), [
    [-2, 1],
    [5, 8],
  ]);
});

it("pointsOverlap finds any two circles nearer than their radii", () => {
  assert.ok(pointsOverlap([leaf(0, 0), leaf(50, 0), leaf(9, 0)]));
  assert.ok(!pointsOverlap([leaf(0, 0), leaf(10, 0)]), "touching");
  assert.ok(pointsOverlap([leaf(0, 0, 2), leaf(10, 0, 9)]), "unequal radii");
  assert.ok(!pointsOverlap([leaf(0, 0)]));
  assert.ok(!pointsOverlap([]));
});

it("spiderOffsets fans points around a circle clear of the hub and one another", () => {
  const radii = [5, 5, 5, 5, 5, 5];
  const offsets = spiderOffsets(radii, 14);
  assert.strictEqual(offsets.length, 6);
  const ring = Math.hypot(...offsets[0]);
  offsets.forEach(o => assert.ok(Math.abs(Math.hypot(...o) - ring) < 1e-9));
  assert.ok(ring >= 14 + 5 + SPIDER_GAP * 2 - 1e-9);
  assert.ok(
    Math.abs(offsets[0][0]) < 1e-9 && offsets[0][1] < 0,
    "from the top",
  );
  assert.ok(offsets[1][0] > 0, "clockwise");
  const many = spiderOffsets(Array(40).fill(5), 14);
  const gap = Math.hypot(many[1][0] - many[0][0], many[1][1] - many[0][1]);
  assert.ok(gap >= 10, "neighbors don't overlap");
  assert.deepStrictEqual(spiderOffsets([], 10), []);
});

it("pointClusterSettings reads the radius, and turns off with false or hexbin", () => {
  const viz = new Geomap();
  assert.deepStrictEqual(pointClusterSettings(viz), {radius: CLUSTER_RADIUS});
  viz.config({pointCluster: {radius: 60}});
  assert.deepStrictEqual(pointClusterSettings(viz), {radius: 60});
  viz.config({pointCluster: {radius: -3}});
  assert.deepStrictEqual(pointClusterSettings(viz), {radius: CLUSTER_RADIUS});
  viz.config({pointCluster: false});
  assert.strictEqual(pointClusterSettings(viz), null);
  viz.config({pointCluster: true, hexbin: true});
  assert.strictEqual(pointClusterSettings(viz), null);
  viz.config({hexbin: false, cartogram: "dorling"});
  assert.strictEqual(pointClusterSettings(viz), null);
});

it("clusterBubbleScale runs from the lightest cluster to the heaviest", () => {
  const levels = [
    {k: 1, nodes: [{leaves: [0, 1, 2], weight: 30}], nodeOf: null},
    {
      k: 2,
      nodes: [
        {leaves: [0, 1], weight: 2},
        {leaves: [2], weight: 99},
      ],
    },
  ];
  const r = clusterBubbleScale(levels, 40);
  assert.strictEqual(r(2), CLUSTER_R_MIN);
  assert.strictEqual(r(30), 40 * CLUSTER_R_SHARE);
  assert.ok(r(10) > r(2) && r(10) < r(30));
  assert.strictEqual(r(1000), 40 * CLUSTER_R_SHARE, "clamped");
  assert.strictEqual(clusterBubbleScale(levels.slice(1), 40)(2), CLUSTER_R_MIN);
});

it("geomapPointClusters clusters the points only while circles overlap", () => {
  const viz = laidOut();
  const state = viz.ctx.geomapCtx.cluster;
  assert.ok(state, "the clump overlaps");
  assert.strictEqual(state.rows.length, rows.length);
  assert.strictEqual(state.level, 0);
  assert.strictEqual(state.k, 1);
  assert.ok(state.levels[0].nodes.length < rows.length);
  assert.ok(viz._pointsHoldSize);
  assert.ok(!state.sized, "one pointSize");

  const apart = laidOut({}, [rows[0], rows[7], rows[11]]);
  assert.strictEqual(apart.ctx.geomapCtx.cluster, null, "nothing overlaps");
  assert.ok(!apart._pointsHoldSize);
  assert.strictEqual(
    laidOut({pointCluster: false}).ctx.geomapCtx.cluster,
    null,
  );
  assert.strictEqual(laidOut({hexbin: true}).ctx.geomapCtx.cluster, null);
});

it("geomapPointClusters skips points the projection can't place, and needs two", () => {
  const viz = laidOut();
  const r = () => 5;
  assert.strictEqual(geomapPointClusters(viz, rows.slice(0, 1), r), null);
  const lost = {id: "x", point: "nowhere"};
  const state = geomapPointClusters(viz, [lost, ...rows], r, 2);
  assert.strictEqual(state.rows.length, rows.length);
  assert.strictEqual(state.k, 2);
  assert.ok(state.leaves.every(l => l.r === 5));
});

it("geomapPointClusters weighs each point by its pointSize", () => {
  const viz = laidOut({pointSize: d => d.size});
  const state = viz.ctx.geomapCtx.cluster;
  assert.ok(state.sized);
  assert.deepStrictEqual(
    state.leaves.slice(0, 6).map(l => l.weight),
    [1, 2, 3, 4, 5, 6],
  );
  const kansas = state.levels[0].nodes.find(n => n.leaves.includes(0));
  assert.strictEqual(kansas.weight, 21);
});

it("geomapPointClusters picks the level for the map's zoom", () => {
  const zoomed = laidOut({}, rows);
  zoomed._zoomTransform = {x: 0, y: 0, scale: 8};
  applyGeomapLayout({viz: zoomed});
  const state = zoomed.ctx.geomapCtx.cluster;
  assert.strictEqual(state.k, 8);
  assert.strictEqual(state.levels[state.level].k, 8);
});

it("clusterRow gives each node one row, carrying what it holds", () => {
  const viz = laidOut();
  const state = viz.ctx.geomapCtx.cluster;
  const node = state.levels[0].nodes.find(n => n.leaves.length > 1);
  const row = clusterRow(state, 0, node);
  assert.strictEqual(clusterRow(state, 0, node), row, "kept");
  const meta = geoClusterMeta(row);
  assert.strictEqual(meta.count, node.leaves.length);
  assert.deepStrictEqual(
    meta.rows,
    node.leaves.map(i => state.rows[i]),
  );
  assert.ok(meta.splitK > 1);
  assert.strictEqual(geoClusterMeta({__d3plus__: true, data: row}), meta);
  assert.strictEqual(geoClusterMeta(rows[0]), undefined);
  assert.strictEqual(geoClusterMeta(undefined), undefined);
});

it("geoClusterTitle counts the points, in the chart's locale", () => {
  const viz = laidOut();
  const state = viz.ctx.geomapCtx.cluster;
  const node = state.levels[0].nodes.find(n => n.leaves.length === 6);
  const row = clusterRow(state, 0, node);
  assert.strictEqual(geoClusterTitle(viz, row), "6 points");
  viz.locale("es-ES");
  assert.strictEqual(geoClusterTitle(viz, row), "6 puntos");
  assert.strictEqual(geoClusterTitle(viz, rows[0]), undefined);
});

it("geoClusterTooltipRows lists the first points, the largest first when sized", () => {
  const viz = laidOut({pointSize: d => d.size});
  const state = viz.ctx.geomapCtx.cluster;
  const node = state.levels[0].nodes.find(n => n.leaves.length === 6);
  const tbody = geoClusterTooltipRows(viz, clusterRow(state, 0, node), 3);
  assert.strictEqual(tbody.length, 4);
  assert.match(tbody[0][0], /k5/);
  assert.strictEqual(tbody[0][1], "6");
  assert.match(tbody[3][0], /\+3 more/);
  const plain = laidOut();
  const s2 = plain.ctx.geomapCtx.cluster;
  const n2 = s2.levels[0].nodes.find(n => n.leaves.length === 6);
  const rowsPlain = geoClusterTooltipRows(plain, clusterRow(s2, 0, n2));
  assert.match(rowsPlain[0][0], /k0/, "data order");
  assert.strictEqual(rowsPlain[0][1], "");
  assert.match(rowsPlain.at(-1)[0], /\+1 more/);
  assert.deepStrictEqual(geoClusterTooltipRows(plain, rows[0]), []);
});

it("clusterColors counts each fill, the most common first", () => {
  const fills = ["red", "blue", "blue", "green", "red", "blue"];
  assert.deepStrictEqual(clusterColors(fills, [0, 1, 2, 3, 4, 5]), [
    {fill: "blue", count: 3},
    {fill: "red", count: 2},
    {fill: "green", count: 1},
  ]);
  assert.deepStrictEqual(clusterColors(fills, [3]), [
    {fill: "green", count: 1},
  ]);
});

it("clusterWedges splits a ring by each color's share", () => {
  const wedges = clusterWedges(
    [
      {fill: "blue", count: 3},
      {fill: "red", count: 1},
    ],
    6,
    10,
  );
  assert.deepStrictEqual(
    wedges.map(w => w.fill),
    ["blue", "red"],
  );
  // The first wedge starts at the top and runs three quarters of the way round.
  assert.match(wedges[0].d, /^M0,-10A10,10,0,1,1,-10,0/);
  assert.ok(wedges.every(w => w.d.length));
});

it("pointNode draws a point's circle, centered by its transform", () => {
  const viz = laidOut();
  const node = pointNode(
    viz,
    {fill: "red", stroke: "black", trail: true},
    {d: rows[0], i: 0, x: 10, y: 20, r: 4},
  );
  assert.strictEqual(node.key, "geomap-point-k0");
  assert.deepStrictEqual(
    [node.cx, node.cy, node.r, node.transform],
    [0, 0, 4, {x: 10, y: 20}],
  );
  assert.strictEqual(node.paint.fill, "red");
  assert.strictEqual(node.paint.vectorEffect, "non-scaling-stroke");
  assert.ok(node.trail);
  const still = pointNode(
    viz,
    {trail: true},
    {d: rows[0], i: 0, x: 0, y: 0, r: 1},
    false,
  );
  assert.ok(!still.trail);
});

it("bubbleNodes draws a ring of colors around the count, or a plain circle", () => {
  const viz = laidOut({groupBy: "id"});
  const state = viz.ctx.geomapCtx.cluster;
  const node = state.levels[0].nodes.find(n => n.leaves.length === 6);
  state.fills = state.rows.map(d => (d.kind === "A" ? "#ff0000" : "#0000ff"));
  const mixed = bubbleNodes(viz, state, node, 2);
  const [circle, ...rest] = mixed;
  assert.strictEqual(circle.key, `geomap-cluster-${node.id}`);
  assert.strictEqual(circle.r, state.bubble(node.weight) / 2, "held in pixels");
  assert.strictEqual(geoClusterMeta(circle.datum).count, 6);
  const wedges = rest.filter(n => n.type === "path");
  assert.deepStrictEqual(wedges.map(n => n.paint.fill).sort(), [
    "#0000ff",
    "#ff0000",
  ]);
  assert.ok(wedges.every(n => n.interactive === false));
  const label = rest.find(n => n.type === "text");
  assert.strictEqual(label.lines[0].text, "6");
  assert.strictEqual(label.transform.scale, 1 / 2);
  assert.match(circle.aria.label, /6 points/);

  state.fills = state.rows.map(() => "#00aa00");
  const plain = bubbleNodes(viz, state, node, 1);
  assert.strictEqual(plain[0].paint.fill, "#00aa00");
  assert.ok(!plain.some(n => n.type === "path"));
});

it("emitClusterScene draws the level held, and where each point is", () => {
  const viz = laidOut();
  const state = viz.ctx.geomapCtx.cluster;
  const draw = emitClusterScene(viz, viz.ctx.geomapCtx);
  const keys = draw.nodes.map(n => String(n.key));
  const bubbles = keys.filter(k => /^geomap-cluster-\d+$/.test(k));
  const multi = state.levels[0].nodes.filter(n => n.leaves.length > 1);
  assert.strictEqual(bubbles.length, multi.length);
  assert.ok(keys.includes("geomap-point-f1"), "a lone point");
  assert.ok(keys.includes("geomap-point-labels"));
  assert.ok(draw.nodes.every(n => CLUSTER_SCENE_KEYS.test(String(n.key))));
  assert.strictEqual(draw.places.at.length, rows.length * 2);
  const kansas = multi.find(n => n.leaves.includes(0));
  assert.deepStrictEqual(
    [draw.places.at[0], draw.places.at[1]],
    [kansas.x, kansas.y],
  );
  assert.strictEqual(draw.places.node[0], kansas.id);

  state.level = state.levels.length - 1;
  state.k = state.levels[state.level].k;
  const deep = emitClusterScene(viz, viz.ctx.geomapCtx);
  const points = deep.nodes.filter(n => /^geomap-point-[a-z]\d$/.test(n.key));
  assert.strictEqual(
    points.length,
    rows.length - 3,
    "all but the stacked three",
  );
  assert.ok(
    points.every(p => p.r === state.leaves[0].r / state.k),
    "points keep their pixel size",
  );
});

it("emitClusterScene fans out the cluster held open, with legs to its points", () => {
  const viz = laidOut();
  const state = viz.ctx.geomapCtx.cluster;
  state.level = state.levels.length - 1;
  state.k = state.levels[state.level].k;
  const stack = state.levels[state.level].nodes.find(
    n => n.leaves.length === 3,
  );
  state.spider = stack.id;
  const draw = emitClusterScene(viz, viz.ctx.geomapCtx);
  const legs = draw.nodes.filter(n =>
    String(n.key).startsWith("geomap-spider-"),
  );
  assert.strictEqual(legs.length, 3);
  const fanned = draw.nodes.filter(n => /^geomap-point-t\d$/.test(n.key));
  assert.strictEqual(fanned.length, 3);
  const spots = new Set(fanned.map(n => `${n.transform.x},${n.transform.y}`));
  assert.strictEqual(spots.size, 3, "each in its own place");
  assert.ok(
    draw.nodes.some(n => n.key === `geomap-cluster-${stack.id}`),
    "the hub stays",
  );
});

it("geomapEmit draws the clusters, and notes them as drawn", () => {
  const viz = laidOut();
  const scene = geomapEmit({viz});
  assert.ok(scene.some(n => /^geomap-cluster-\d+$/.test(n.key)));
  assert.ok(scene.some(n => String(n.key).startsWith("geomap-path-")));
  assert.ok(viz.ctx.geomapCtx.cluster.drawn);
  const plain = geomapEmit({viz: laidOut({pointCluster: false})});
  assert.ok(!plain.some(n => /^geomap-cluster-/.test(n.key)));
  assert.strictEqual(
    plain.filter(n => /^geomap-point-[a-z]\d$/.test(n.key)).length,
    rows.length,
  );
});

it("geomapPointLabels keeps labels in the space given and off its obstacles", () => {
  const viz = laidOut({pointCluster: false});
  const d = {id: "p", name: "Some place"};
  const points = {
    points: [d],
    pointR: () => 5,
    pointX: () => 100,
    pointY: () => 100,
  };
  const base = geomapPointLabels(viz, points, {});
  assert.ok(base.length, "labeled");
  const box = () => ({x: 0, y: 0, width: 800, height: 500});
  const blocked = geomapPointLabels(
    viz,
    points,
    {},
    {
      bounds: box(),
      obstacles: [{x: 140, y: 100, r: 30}],
    },
  );
  const at = nodes =>
    nodes.map(n => `${n.x},${n.y},${JSON.stringify(n.transform)}`).join();
  assert.notStrictEqual(at(blocked), at(base), "moved off the obstacle");
});

it("rerouteFlowLinks runs links to the clusters their ends are drawn in", () => {
  const viz = laidOut({
    links: [
      {source: "k0", target: "f1"},
      {source: "k0", target: "k1"},
      {source: "o1", target: "f1"},
    ],
  });
  const c = viz.ctx.geomapCtx;
  const state = c.cluster;
  const draw = emitClusterScene(viz, c);
  const links = rerouteFlowLinks(viz, c.flowLinks, state, draw.places);
  assert.deepStrictEqual(
    links.map(l => l.index),
    [0, 2],
    "the link inside one cluster isn't drawn",
  );
  const kansas = state.levels[0].nodes.find(n => n.leaves.includes(0));
  assert.ok(Math.abs(links[0].sourceAt[0] - kansas.x) < 1e-6);
  assert.ok(Math.abs(links[0].sourceAt[1] - kansas.y) < 1e-6);
  assert.strictEqual(links[0].source.r, state.bubble(kansas.weight));
  const f1 = state.leaves[rows.length - 1];
  assert.strictEqual(links[0].target.r, f1.r, "a lone point keeps its own");
});

it("replaceClusterNodes swaps the clustered part of a scene in place", () => {
  const scene = [
    {key: "geomap-path-1"},
    {key: "geomap-link-a"},
    {key: "geomap-point-x"},
    {key: "geomap-cluster-2"},
    {key: "other"},
  ];
  assert.deepStrictEqual(
    replaceClusterNodes(scene, [{key: "geomap-point-y"}]).map(n => n.key),
    ["geomap-path-1", "geomap-point-y", "other"],
  );
  assert.deepStrictEqual(
    replaceClusterNodes([{key: "a"}], [{key: "geomap-point-y"}]).map(
      n => n.key,
    ),
    ["a", "geomap-point-y"],
  );
});

it("stageClusterMoves starts new nodes where their points were, and ends leaving ones where they go", () => {
  const places = (x, y) => ({
    at: Float64Array.from([x, y, x, y]),
    r: Float64Array.from([5, 5]),
    node: Int32Array.from([0, 0]),
  });
  const bubble = {key: "geomap-cluster-0", transform: {x: 50, y: 50}};
  const a = {key: "geomap-point-a", transform: {x: 10, y: 10}};
  const b = {key: "geomap-point-b", transform: {x: 90, y: 90}};
  const label = {key: "geomap-point-labels"};
  const prev = {
    nodes: [bubble, label],
    places: places(50, 50),
    leafOf: new Map([[bubble, 0]]),
  };
  const next = {
    nodes: [a, b, label],
    places: {...places(0, 0), at: Float64Array.from([10, 10, 90, 90])},
    leafOf: new Map([
      [a, 0],
      [b, 1],
    ]),
  };
  const {staged, final} = stageClusterMoves(prev, next);
  assert.deepStrictEqual(
    staged.map(n => [n.key, n.transform, n.paint?.opacity]),
    [
      ["geomap-cluster-0", {x: 50, y: 50}, undefined],
      ["geomap-point-a", {x: 50, y: 50}, 0],
      ["geomap-point-b", {x: 50, y: 50}, 0],
      ["geomap-point-labels", undefined, undefined],
    ],
  );
  assert.deepStrictEqual(
    final.map(n => [n.key, n.transform, n.paint?.opacity]),
    [
      ["geomap-cluster-0", {x: 10, y: 10}, 0],
      ["geomap-point-a", {x: 10, y: 10}, undefined],
      ["geomap-point-b", {x: 90, y: 90}, undefined],
      ["geomap-point-labels", undefined, undefined],
    ],
  );
  assert.strictEqual(staged[3], label, "kept nodes come from before");
});

it("reclusterOnZoom draws the level for the zoom, holding sizes in pixels", () => {
  const viz = laidOut();
  viz._chartScene = geomapEmit({viz});
  const state = clusterState(viz);
  const bubbles = () =>
    viz._chartScene.filter(n => /^geomap-cluster-\d+$/.test(n.key)).length;
  const before = bubbles();
  assert.strictEqual(reclusterOnZoom(viz, {k: 64, x: 0, y: 0}), false);
  assert.strictEqual(state.k, 64);
  assert.strictEqual(state.level, clusterLevelAt(state.levels, 64));
  assert.ok(bubbles() < before, "clusters split");
  const lone = viz._chartScene.find(n => n.key === "geomap-point-f1");
  assert.strictEqual(lone.r, state.leaves.at(-1).r / 64);
  const scene = viz._chartScene;
  assert.strictEqual(reclusterOnZoom(viz, {k: 64, x: 30, y: 0}), false);
  assert.strictEqual(viz._chartScene, scene, "a pan leaves the clusters be");
  assert.strictEqual(
    reclusterOnZoom(laidOut({pointCluster: false}), {k: 2}),
    false,
  );
});

it("reclusterOnZoom moves the map without the clusters, then reveals the new level", async () => {
  const viz = laidOut({duration: 40});
  viz._chartScene = geomapEmit({viz});
  const state = clusterState(viz);
  reclusterOnZoom(viz, {k: 64, x: 0, y: 0}, 40);
  assert.ok(
    !viz._chartScene.some(n => /^geomap-(cluster|point)-/.test(n.key)),
    "hidden while the map moves",
  );
  assert.ok(state.timer);
  await new Promise(r => setTimeout(r, 150));
  assert.ok(
    viz._chartScene.some(n => n.key === "geomap-point-f1"),
    "revealed",
  );
  assert.strictEqual(state.drawn.nodes.length > 0, true);
});

it("revealClusters animates from the level before to the level held", async () => {
  const viz = laidOut({duration: 20});
  viz._chartScene = geomapEmit({viz});
  const state = clusterState(viz);
  state.level = clusterLevelAt(state.levels, 64);
  state.k = 64;
  revealClusters(viz, state, 0);
  const lone = viz._chartScene.find(n => n.key === "geomap-point-k0");
  assert.notStrictEqual(lone.paint.opacity, 0, "final frame drawn");
  await new Promise(r => setTimeout(r, 80));
  assert.strictEqual(viz._chartScene.length > 0, true);
  revealClusters(laidOut({pointCluster: false}), state, 0);
});

it("redrawClusters swaps the clusters in at once, or animates them", async () => {
  const viz = laidOut({duration: 20});
  viz._chartScene = geomapEmit({viz});
  const state = clusterState(viz);
  state.spider = state.levels[0].nodes.find(n => n.leaves.length === 3).id;
  redrawClusters(viz, state, 0);
  assert.ok(
    viz._chartScene.some(n => String(n.key).startsWith("geomap-spider-")),
  );
  state.spider = null;
  redrawClusters(viz, state, 20);
  assert.ok(
    viz._chartScene.some(n => String(n.key).startsWith("geomap-spider-")),
    "legs fade out first",
  );
  await new Promise(r => setTimeout(r, 80));
  assert.ok(
    !viz._chartScene.some(n => String(n.key).startsWith("geomap-spider-")),
  );
});

it("clusterClick fans out a cluster the map can't zoom into, and folds it back", () => {
  const viz = laidOut({zoom: false});
  viz._chartScene = geomapEmit({viz});
  const state = clusterState(viz);
  const node = state.levels[0].nodes.find(n => n.leaves.length > 1);
  const row = clusterRow(state, 0, node);
  assert.strictEqual(clusterClick(viz, row), true);
  assert.strictEqual(state.spider, node.id);
  assert.ok(
    viz._chartScene.some(n => String(n.key).startsWith("geomap-spider-")),
  );
  clusterClick(viz, row);
  assert.strictEqual(state.spider, null);
  assert.strictEqual(clusterClick(viz, rows[0]), false);
});

it("installPointClusterEvents takes cluster clicks, and passes the rest on", () => {
  const viz = laidOut({zoom: false});
  viz._chartScene = geomapEmit({viz});
  const seen = [];
  viz.schema.on["click.shape"] = d => seen.push(d.id);
  viz.schema.on["mousemove.shape"] = d => seen.push(`move ${d.id}`);
  installPointClusterEvents(viz);
  const state = clusterState(viz);
  const row = clusterRow(
    state,
    0,
    state.levels[0].nodes.find(n => n.leaves.length > 1),
  );
  let stopped = false;
  viz.schema.on["click.shape"](row, 0, undefined, {
    stopPropagation: () => (stopped = true),
  });
  assert.ok(stopped);
  assert.deepStrictEqual(seen, []);
  viz.schema.on["click.shape"](rows[0], 0, undefined, {});
  viz.schema.on["mousemove.shape"](rows[0], 0, undefined, {});
  assert.deepStrictEqual(seen, ["k0", "move k0"]);
});

it("syncPointCluster points the zoom hook at the clusters, unless hexbin has it", () => {
  const viz = laidOut();
  syncDensityColorScale(viz);
  syncPointCluster(viz);
  assert.strictEqual(typeof viz._zoomRescale, "function");
  viz._chartScene = geomapEmit({viz});
  assert.strictEqual(viz._zoomRescale({k: 64, x: 0, y: 0}, 0), false);
  assert.strictEqual(clusterState(viz).k, 64);
  const binned = laidOut({hexbin: true});
  syncDensityColorScale(binned);
  const hook = binned._zoomRescale;
  syncPointCluster(binned);
  assert.strictEqual(binned._zoomRescale, hook);
});
