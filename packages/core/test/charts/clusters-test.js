import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";

import {ArcDiagram, Network} from "../../index.ts";
import {
  CLUSTER_LABEL_DEFAULTS,
  clusterAutoActive,
  clusterFields,
  clusterHubs,
  clusterLabelObstacles,
  clusterLabelSettings,
  clusterName,
  clusterOf,
  clusterRegion,
  clustersMeaningful,
  emitClusterLabels,
  findClusters,
  installClusters,
  layoutClusterLabels,
  nearestPoint,
  networkClusterLabels,
  placeClusterLabel,
  prepareClusters,
} from "../../internal.ts";
import {backgroundInk} from "../../src/charts/viz/backgroundInk.ts";
import {translateLocale} from "@d3plus/locales";

useJsdom();

/**
    Cluster colors on the node-link charts: when they apply, how clusters
    are found and named, the color accessor they install, and the names a
    Network writes inside its clusters.
*/

const node = id => ({id});
const link = (source, target, size = 1) => ({
  source: node(source),
  target: node(target),
  size,
});

/** Two triangles joined by one bridge, plus a node with no links. */
const graph = () => {
  const nodes = ["a", "b", "c", "d", "e", "f", "lonely"].map(node);
  const links = [
    link("a", "b"),
    link("b", "c"),
    link("c", "a"),
    link("d", "e"),
    link("e", "f"),
    link("f", "d"),
    link("c", "d"),
  ];
  return {nodes, links};
};

it("clusterFields — `cluster` defaults on and stores booleans; `clusterConfig` merges", () => {
  const [cluster, config] = clusterFields();
  assert.strictEqual(cluster.key, "cluster");
  assert.strictEqual(cluster.default, true);
  assert.strictEqual(cluster.coerce(false), false);
  assert.strictEqual(cluster.coerce(0), true);
  assert.strictEqual(config.key, "clusterConfig");
  assert.strictEqual(config.merge, true);
  const viz = new Network();
  assert.strictEqual(viz.cluster(), true);
  assert.strictEqual(viz.cluster(false).cluster(), false);
  viz.clusterConfig({label: () => "x"}).clusterConfig({labelConfig: false});
  assert.strictEqual(typeof viz.clusterConfig().label, "function");
  assert.strictEqual(viz.clusterConfig().labelConfig, false);
});

it("clusterAutoActive — only on the chart's default colors and a single groupBy", () => {
  const color = () => "default";
  const fill = () => "fill";
  const defaults = {color, fill};
  const base = () => ({
    cluster: true,
    color,
    groupBy: [d => d.id],
    shapeConfig: {fill},
  });
  assert.strictEqual(clusterAutoActive(base(), defaults), true);
  const off = [
    {cluster: false},
    {colorScale: d => d.value},
    {colorOrdinal: true},
    {color: () => "mine"},
    {shapeConfig: {fill: "red"}},
    {shapeConfig: {fill, Circle: {fill: "red"}}},
    {shapeConfig: {fill, Rect: {fill: () => "red"}}},
    {groupBy: [d => d.group, d => d.id]},
  ];
  for (const change of off)
    assert.strictEqual(
      clusterAutoActive({...base(), ...change}, defaults),
      false,
      JSON.stringify(Object.keys(change)),
    );
});

it("findClusters — Louvain communities as id lists, largest first, weighted by size", () => {
  const {nodes, links} = graph();
  assert.deepStrictEqual(findClusters(nodes, links), [
    ["a", "b", "c"],
    ["d", "e", "f"],
    ["lonely"],
  ]);
  // A heavy bridge and light triangles pull c and d together.
  const heavy = links.map(l =>
    l.source.id === "c" && l.target.id === "d" ? {...l, size: 50} : l,
  );
  const clusters = findClusters(nodes, heavy);
  assert.ok(clusters.some(c => c.includes("c") && c.includes("d")));
  // Self-loops and unresolved ends are left out; bad sizes count as 1.
  assert.deepStrictEqual(
    findClusters(
      [node("x"), node("y"), node("z")],
      [
        link("x", "x", 100),
        {source: undefined, target: node("y"), size: 1},
        link("y", "z", NaN),
      ],
    ),
    [["y", "z"], ["x"]],
  );
});

it("clustersMeaningful — needs two clusters of two or more nodes", () => {
  assert.strictEqual(
    clustersMeaningful([
      ["a", "b"],
      ["c", "d"],
    ]),
    true,
  );
  assert.strictEqual(
    clustersMeaningful([["a", "b", "c"], ["d"], ["e"]]),
    false,
  );
  assert.strictEqual(clustersMeaningful([["a"], ["b"], ["c"]]), false);
  assert.strictEqual(clustersMeaningful([]), false);
});

it("clusterHubs — the member with the most links, then the heaviest, then the first", () => {
  const links = [
    link("a", "b"),
    link("a", "c"),
    link("d", "e", 1),
    link("d", "f", 1),
    link("e", "f", 5),
    link("g", "h"),
    link("g", "g", 9),
  ];
  assert.deepStrictEqual(
    clusterHubs(
      [
        ["b", "c", "a"],
        ["d", "e", "f"],
        ["h", "g"],
      ],
      links,
    ),
    ["a", "e", "h"],
  );
});

it("clusterName — the translated template with the hub's label", () => {
  assert.strictEqual(
    clusterName(s => s, "Valjean"),
    "Valjean cluster",
  );
  const es = s => translateLocale["es-ES"][s] ?? s;
  assert.strictEqual(clusterName(es, "Valjean"), "Grupo de Valjean");
  for (const [locale, strings] of Object.entries(translateLocale))
    assert.ok(
      strings["{node} cluster"]?.includes("{node}"),
      `${locale} translates "{node} cluster"`,
    );
});

/** A Network over `graph()`, its pre-draw run so its clusters are worked out. */
function prepared(config = {}) {
  const {nodes, links} = graph();
  const viz = new Network()
    .nodes(nodes.map(n => ({...n, name: n.id.toUpperCase()})))
    .links(links.map(l => ({source: l.source.id, target: l.target.id})))
    .label(d => d.name)
    .config(config);
  viz._preDraw();
  return viz;
}

it("prepareClusters — names clusters, lists every node in the legend, and claims colors largest first", () => {
  const viz = prepared();
  const state = viz.ctx.clusterState;
  assert.strictEqual(state.active, true);
  assert.deepStrictEqual(
    state.clusters.map(c => [c.name, c.ids, c.hub]),
    [
      ["C cluster", ["a", "b", "c"], "c"],
      ["D cluster", ["d", "e", "f"], "d"],
    ],
  );
  assert.strictEqual(state.names.get("lonely"), "LONELY");
  assert.strictEqual(viz._legendData.length, 7);
  const scale = viz.schema.colorDefaults.scale;
  assert.deepStrictEqual(scale.domain().slice(0, 2), [
    "C cluster",
    "D cluster",
  ]);
});

it("prepareClusters — runs on its own, and turning `cluster` off clears the state", () => {
  const viz = prepared();
  viz.cluster(false);
  prepareClusters(viz);
  assert.strictEqual(viz.ctx.clusterState.active, false);
  viz.cluster(true);
  prepareClusters(viz);
  assert.strictEqual(viz.ctx.clusterState.clusters.length, 2);
});

it("prepareClusters — a `clusterConfig.label` names each cluster", () => {
  const viz = prepared({
    clusterConfig: {label: (d, i, rows) => `${d.name}/${i}/${rows.length}`},
  });
  assert.deepStrictEqual(
    viz.ctx.clusterState.clusters.map(c => c.name),
    ["C/0/3", "D/1/3"],
  );
});

it("prepareClusters — inactive without meaningful clusters or with user colors", () => {
  const noLinks = new Network().nodes(["a", "b", "c"].map(node)).links([]);
  noLinks._preDraw();
  assert.strictEqual(noLinks.ctx.clusterState.active, false);
  assert.deepStrictEqual(noLinks._legendData, []);
  for (const config of [
    {cluster: false},
    {color: "id"},
    {shapeConfig: {fill: "red"}},
  ])
    assert.strictEqual(
      prepared(config).ctx.clusterState.active,
      false,
      JSON.stringify(config),
    );
});

it("clusterOf and the installed color — a node's cluster, a merged row's shared cluster, else the default", () => {
  const viz = prepared();
  const color = viz.schema.color;
  assert.strictEqual(clusterOf(viz, {id: "a"}, 0), "C cluster");
  assert.strictEqual(color({id: "e"}, 0), "D cluster");
  assert.strictEqual(color({id: "lonely", name: "LONELY"}, 0), "LONELY");
  assert.strictEqual(clusterOf(viz, {id: ["a", "b"]}, 0), "C cluster");
  assert.strictEqual(clusterOf(viz, {id: ["a", "d"]}, 0), undefined);
  // Off: the default `groupBy` color.
  viz.cluster(false)._preDraw();
  assert.strictEqual(clusterOf(viz, {id: "a"}, 0), undefined);
  assert.strictEqual(color({id: "a"}, 0), "a");
});

it("installClusters — records the defaults and runs after the base pre-draw", () => {
  const order = [];
  const viz = {
    ctx: {},
    schema: {color: d => d.id, shapeConfig: {fill: "f"}},
    _preDraw: () => order.push("base"),
  };
  installClusters(viz);
  assert.strictEqual(viz.ctx.clusterDefaults.color, viz.schema.color);
  assert.strictEqual(viz.ctx.clusterDefaults.fill, "f");
  assert.strictEqual(viz.schema.color({id: "q"}, 0), "q");
  viz._preDraw();
  assert.deepStrictEqual(order, ["base"]);
  assert.strictEqual(viz.ctx.clusterState.active, false);
});

it("ArcDiagram clusters by default too", () => {
  const {nodes, links} = graph();
  const viz = new ArcDiagram()
    .nodes(nodes)
    .links(links.map(l => ({source: l.source.id, target: l.target.id})));
  viz._preDraw();
  assert.strictEqual(viz.ctx.clusterState.active, true);
  assert.strictEqual(viz.schema.color({id: "f"}, 0), "d cluster");
});

it("clusterLabelSettings — the defaults, overrides, `false`, and the rest as TextBox config", () => {
  const viz = new Network();
  assert.deepStrictEqual(clusterLabelSettings(viz), {
    ...CLUSTER_LABEL_DEFAULTS,
    text: {},
  });
  viz.clusterConfig({
    labelConfig: {fontMax: 12, fontMin: 20, padding: -1, fontWeight: 400},
  });
  assert.deepStrictEqual(clusterLabelSettings(viz), {
    fontMax: 12,
    fontMin: 12,
    padding: CLUSTER_LABEL_DEFAULTS.padding,
    text: {fontWeight: 400},
  });
  viz.clusterConfig({labelConfig: false});
  assert.strictEqual(clusterLabelSettings(viz), null);
});

it("clusterLabelObstacles — circles and boxes, near and far, and added boxes", () => {
  const obstacles = clusterLabelObstacles(
    [{x: 50, y: 50, r: 10}],
    [{x: 200, y: 0, width: 20, height: 20}],
  );
  assert.strictEqual(obstacles.hits({x: 55, y: 55, width: 5, height: 5}), true);
  // Inside the circle's box but outside the circle.
  assert.strictEqual(
    obstacles.hits({x: 40, y: 40, width: 2, height: 2}),
    false,
  );
  assert.strictEqual(
    obstacles.hits({x: 210, y: 10, width: 50, height: 5}),
    true,
  );
  assert.strictEqual(
    obstacles.hits({x: 400, y: 400, width: 5, height: 5}),
    false,
  );
  obstacles.add({x: 400, y: 400, width: 10, height: 10});
  assert.strictEqual(
    obstacles.hits({x: 405, y: 405, width: 5, height: 5}),
    true,
  );
});

it("nearestPoint — the closest point, across buckets", () => {
  const points = [
    {id: "a", x: 0, y: 0},
    {id: "b", x: 100, y: 0},
    {id: "c", x: 500, y: 500},
  ];
  const nearest = nearestPoint(points, 32);
  assert.strictEqual(nearest(10, 5).id, "a");
  assert.strictEqual(nearest(70, 0).id, "b");
  assert.strictEqual(nearest(400, 380).id, "c");
  assert.strictEqual(nearest(-1000, -1000).id, "a");
  assert.strictEqual(nearestPoint([])(0, 0), undefined);
});

it("clusterRegion — a grown hull around three or more nodes, and their mean", () => {
  const region = clusterRegion(
    [
      {x: 0, y: 0, r: 2},
      {x: 100, y: 0, r: 2},
      {x: 50, y: 80, r: 2},
    ],
    10,
  );
  assert.deepStrictEqual(region.target, [50, 80 / 3]);
  const xs = region.hull.map(p => p[0]);
  assert.strictEqual(Math.min(...xs), -12);
  assert.strictEqual(Math.max(...xs), 112);
  assert.strictEqual(clusterRegion([{x: 0, y: 0, r: 1}], 10), null);
});

it("placeClusterLabel — nearest open spot inside the hull, or null", () => {
  const square = [
    [0, 0],
    [100, 0],
    [100, 100],
    [0, 100],
  ];
  const size = {width: 40, height: 10};
  const free = placeClusterLabel(square, size, [50, 50], () => false);
  // The nearest spot on the grid (at most 4px apart) to the middle.
  assert.ok(
    Math.hypot(free.x + free.width / 2 - 50, free.y + free.height / 2 - 50) < 4,
    JSON.stringify(free),
  );
  // The middle is taken: the spot moves off it, still inside the square.
  const taken = {x: 30, y: 40, width: 40, height: 20};
  const moved = placeClusterLabel(
    square,
    size,
    [50, 50],
    b =>
      b.x < taken.x + taken.width &&
      taken.x < b.x + b.width &&
      b.y < taken.y + taken.height &&
      taken.y < b.y + b.height,
  );
  assert.ok(
    moved.y + moved.height <= 40 || moved.y >= 60,
    JSON.stringify(moved),
  );
  assert.ok(moved.x >= 0 && moved.x + moved.width <= 100);
  // Padding grows the box `blocked` sees.
  let seen;
  placeClusterLabel(square, size, [50, 50], b => ((seen = b), false), 3);
  assert.deepStrictEqual([seen.width, seen.height], [46, 16]);
  assert.strictEqual(
    placeClusterLabel(square, {width: 200, height: 10}, [50, 50], () => false),
    null,
  );
  assert.strictEqual(
    placeClusterLabel(square, size, [50, 50], () => true),
    null,
  );
});

/** Two well-separated clusters of five nodes each, laid out. */
function laidOut() {
  const ring = (cx, prefix) =>
    [0, 1, 2, 3, 4].map(k => ({
      id: `${prefix}${k}`,
      x: cx + 80 * Math.cos((k * 2 * Math.PI) / 5),
      y: 200 + 80 * Math.sin((k * 2 * Math.PI) / 5),
      r: 6,
    }));
  return [...ring(150, "a"), ...ring(550, "b")];
}

/** A Network whose clusters are the two rings. */
function clustered(config = {}) {
  const viz = new Network().config(config);
  viz.ctx.clusterState = {
    active: true,
    names: new Map(),
    clusters: [
      {
        index: 0,
        name: "Alpha cluster",
        ids: ["a0", "a1", "a2", "a3", "a4"],
        hub: "a0",
      },
      {
        index: 1,
        name: "Beta cluster",
        ids: ["b0", "b1", "b2", "b3", "b4"],
        hub: "b0",
      },
    ],
  };
  return viz;
}

it("layoutClusterLabels — one name per cluster, near its middle, clear of nodes and labels beside them", () => {
  const nodes = laidOut();
  const viz = clustered();
  const besides = [{x: 120, y: 180, width: 60, height: 40}];
  const labels = layoutClusterLabels(viz, nodes, besides);
  assert.deepStrictEqual(
    labels.map(l => l.text),
    ["Alpha cluster", "Beta cluster"],
  );
  for (const l of labels) {
    assert.strictEqual(l.fontSize, CLUSTER_LABEL_DEFAULTS.fontMax);
    for (const n of nodes) {
      const dx = n.x - Math.max(l.box.x, Math.min(n.x, l.box.x + l.box.width));
      const dy = n.y - Math.max(l.box.y, Math.min(n.y, l.box.y + l.box.height));
      assert.ok(dx * dx + dy * dy >= n.r * n.r, `${l.text} covers ${n.id}`);
    }
    const [b] = besides;
    assert.ok(
      l.box.x >= b.x + b.width ||
        b.x >= l.box.x + l.box.width ||
        l.box.y >= b.y + b.height ||
        b.y >= l.box.y + l.box.height,
      `${l.text} covers the label beside a node`,
    );
  }
  const alpha = labels[0].box;
  assert.ok(alpha.x + alpha.width / 2 < 350, "Alpha's name sits by its nodes");
  const beta = labels[1].box;
  assert.ok(beta.x + beta.width / 2 > 350, "Beta's name sits by its nodes");
});

it("layoutClusterLabels — nothing when off, inactive, or too small", () => {
  const nodes = laidOut();
  assert.deepStrictEqual(
    layoutClusterLabels(
      clustered({clusterConfig: {labelConfig: false}}),
      nodes,
      [],
    ),
    [],
  );
  const inactive = clustered();
  inactive.ctx.clusterState.active = false;
  assert.deepStrictEqual(layoutClusterLabels(inactive, nodes, []), []);
  // Two drawn nodes have no hull.
  assert.deepStrictEqual(
    layoutClusterLabels(
      clustered(),
      nodes.filter(n => /[ab][01]/.test(n.id)),
      [],
    ),
    [],
  );
});

it("emitClusterLabels / networkClusterLabels — inert text in the chart's ink over a halo", () => {
  const viz = clustered();
  const nodes = laidOut();
  const {scene, boxes} = networkClusterLabels(
    viz,
    nodes,
    new Map([[nodes[0], {position: "inside"}]]),
  );
  assert.strictEqual(boxes.length, 2);
  const texts = scene.filter(n => n.type === "text");
  assert.strictEqual(texts.length, 2);
  for (const t of texts) {
    assert.strictEqual(t.interactive, false);
    assert.strictEqual(t.datum, undefined);
    assert.strictEqual(t.halo, true);
    assert.strictEqual(t.paint.fill, backgroundInk(viz));
    assert.strictEqual(t.font.size, CLUSTER_LABEL_DEFAULTS.fontMax);
  }
  assert.deepStrictEqual(emitClusterLabels(viz, []), []);
});
