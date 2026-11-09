import {it} from "vitest";
import assert from "assert";
import {translateLocale} from "@d3plus/locales";

import {
  makeLinkDatum,
  NODE_STATS,
  networkMeasures,
  nodeConnectionRows,
  nodeStatRows,
  nodeStatsFields,
  nodeStatsGraph,
  nodeTooltipStatList,
  publishLinkGraph,
  setLinkValue,
} from "../../internal.ts";

/**
    Network measures in node tooltips: the measures on small graphs with
    known values, the degrees and arcs read from a chart's links, the rows a
    node's tooltip lists, and when the measures are worked out.
*/

/** An undirected graph's arcs: each `[a, b, length?]` both ways. */
const both = pairs =>
  pairs.flatMap(([a, b, length]) => [
    {source: a, target: b, length},
    {source: b, target: a, length},
  ]);

/** Each node's value from a measure, rounded to 4 places. */
const round = map =>
  Object.fromEntries([...map].map(([k, v]) => [k, Math.round(v * 1e4) / 1e4]));

it("networkMeasures — a path: the middle carries the most paths", () => {
  const {betweenness, closeness} = networkMeasures(
    ["a", "b", "c", "d", "e"],
    both([
      ["a", "b"],
      ["b", "c"],
      ["c", "d"],
      ["d", "e"],
    ]),
  );
  assert.deepStrictEqual(round(betweenness), {
    a: 0,
    b: 0.5,
    c: 0.6667,
    d: 0.5,
    e: 0,
  });
  assert.deepStrictEqual(round(closeness), {
    a: 0.4,
    b: 0.5714,
    c: 0.6667,
    d: 0.5714,
    e: 0.4,
  });
});

it("networkMeasures — a star: the center is 1 for both", () => {
  const {betweenness, closeness} = networkMeasures(
    ["hub", "a", "b", "c", "d"],
    both(["a", "b", "c", "d"].map(leaf => ["hub", leaf])),
  );
  assert.strictEqual(betweenness.get("hub"), 1);
  assert.strictEqual(closeness.get("hub"), 1);
  assert.strictEqual(betweenness.get("a"), 0);
  assert.strictEqual(Math.round(closeness.get("a") * 1e4) / 1e4, 0.5714);
});

it("networkMeasures — two clusters joined by a bridge: its ends carry every crossing path", () => {
  const {betweenness, closeness} = networkMeasures(
    ["a", "b", "c", "d", "e", "f"],
    both([
      ["a", "b"],
      ["b", "c"],
      ["a", "c"],
      ["d", "e"],
      ["e", "f"],
      ["d", "f"],
      ["c", "d"],
    ]),
  );
  assert.deepStrictEqual(round(betweenness), {
    a: 0,
    b: 0,
    c: 0.6,
    d: 0.6,
    e: 0,
    f: 0,
  });
  assert.strictEqual(Math.round(closeness.get("c") * 1e4) / 1e4, 0.7143);
  assert.strictEqual(Math.round(closeness.get("a") * 1e4) / 1e4, 0.5);
});

it("networkMeasures — directed: paths follow the arcs, closeness reads outward", () => {
  const {betweenness, closeness} = networkMeasures(
    ["a", "b", "c"],
    [
      {source: "a", target: "b"},
      {source: "b", target: "c"},
    ],
  );
  assert.deepStrictEqual(round(betweenness), {a: 0, b: 0.5, c: 0});
  assert.deepStrictEqual(round(closeness), {a: 0.6667, b: 0.5, c: 0});
  const undirected = networkMeasures(
    ["a", "b", "c"],
    both([
      ["a", "b"],
      ["b", "c"],
    ]),
  );
  assert.deepStrictEqual(round(undirected.betweenness), {a: 0, b: 1, c: 0});
  assert.deepStrictEqual(round(undirected.closeness), {
    a: 0.6667,
    b: 1,
    c: 0.6667,
  });
});

it("networkMeasures — weighted: a long link loses its paths to a shorter way round", () => {
  const square = lengths =>
    networkMeasures(
      ["a", "b", "c", "d"],
      both([
        ["a", "b", lengths[0]],
        ["b", "c", lengths[1]],
        ["c", "d", lengths[2]],
        ["d", "a", lengths[3]],
      ]),
    );
  const even = square([1, 1, 1, 1]);
  assert.deepStrictEqual(round(even.betweenness), {
    a: 0.1667,
    b: 0.1667,
    c: 0.1667,
    d: 0.1667,
  });
  // d–a is 3 long, as long as a–b–c–d: a to d ties between the two ways.
  const weighted = square([1, 1, 1, 3]);
  assert.deepStrictEqual(round(weighted.betweenness), {
    a: 0,
    b: 0.5,
    c: 0.5,
    d: 0,
  });
  assert.strictEqual(Math.round(weighted.closeness.get("a") * 1e4) / 1e4, 0.5);
  assert.strictEqual(Math.round(weighted.closeness.get("b") * 1e4) / 1e4, 0.75);
});

it("networkMeasures — disconnected components: closeness scales by the share reached", () => {
  const {betweenness, closeness} = networkMeasures(
    ["a", "b", "c", "d", "e", "f"],
    both([
      ["a", "b"],
      ["c", "d"],
      ["d", "e"],
    ]),
  );
  assert.deepStrictEqual(round(closeness), {
    a: 0.2,
    b: 0.2,
    c: 0.2667,
    d: 0.4,
    e: 0.2667,
    f: 0,
  });
  assert.strictEqual(betweenness.get("d"), 0.1);
  assert.strictEqual(betweenness.get("f"), 0);
});

it("networkMeasures — ignores loops, unknown nodes, and bad lengths; keeps the shortest parallel arc", () => {
  const {betweenness, closeness} = networkMeasures(
    ["a", "b", "c"],
    [
      ...both([
        ["a", "b"],
        ["b", "c"],
        ["a", "c", 5],
        ["a", "c", 2],
      ]),
      {source: "a", target: "a"},
      {source: "a", target: "zzz"},
      {source: "c", target: "a", length: 0},
      {source: "c", target: "a", length: NaN},
    ],
  );
  // a–c is 2 long, as long as a–b–c: b carries half the a–c paths.
  assert.deepStrictEqual(round(betweenness), {a: 0, b: 0.5, c: 0});
  assert.strictEqual(closeness.get("b"), 1);
  const tiny = networkMeasures(["a", "b"], both([["a", "b"]]));
  assert.deepStrictEqual(round(tiny.betweenness), {a: 0, b: 0});
  assert.deepStrictEqual(round(tiny.closeness), {a: 1, b: 1});
  assert.deepStrictEqual(networkMeasures([], []).betweenness.size, 0);
});

/** A link between two ids, with a value and its own datum. */
const statLink = (source, target, index, value) => ({
  source,
  target,
  index,
  value,
  datum: {source, target, kind: index % 2 ? "odd" : "even"},
});

it("nodeStatsGraph — undirected without arrows: every link both ways, counted once per end", () => {
  const g = nodeStatsGraph(
    ["a", "b", "c"],
    [statLink("a", "b", 0), statLink("a", "b", 1), statLink("c", "c", 2)],
    false,
    false,
  );
  assert.strictEqual(g.directed, false);
  assert.deepStrictEqual(Object.fromEntries(g.degree), {a: 2, b: 2, c: 1});
  assert.strictEqual(g.arcs.length, 6);
  assert.ok(g.arcs.every(a => a.length === 1));
});

it("nodeStatsGraph — arrows make links one-way and split the degree in and out", () => {
  const links = [statLink("a", "b", 0), statLink("b", "c", 1)];
  const forward = nodeStatsGraph(["a", "b", "c"], links, true, false);
  assert.strictEqual(forward.directed, true);
  assert.deepStrictEqual(Object.fromEntries(forward.outDegree), {
    a: 1,
    b: 1,
    c: 0,
  });
  assert.deepStrictEqual(Object.fromEntries(forward.inDegree), {
    a: 0,
    b: 1,
    c: 1,
  });
  assert.deepStrictEqual(
    forward.arcs.map(a => `${a.source}>${a.target}`),
    ["a>b", "b>c"],
  );
  const back = nodeStatsGraph(["a", "b", "c"], links, "source", false);
  assert.deepStrictEqual(
    back.arcs.map(a => `${a.source}>${a.target}`),
    ["b>a", "c>b"],
  );
  const twoWay = nodeStatsGraph(["a", "b", "c"], links, "both", false);
  assert.strictEqual(twoWay.directed, false);
  assert.strictEqual(twoWay.arcs.length, 4);
  // An accessor: only the even link has an arrow; the other runs both ways.
  const seen = [];
  const mixed = nodeStatsGraph(
    ["a", "b", "c"],
    links,
    (d, i) => (seen.push([d.kind, i]), d.kind === "even"),
    false,
  );
  assert.deepStrictEqual(seen, [
    ["even", 0],
    ["odd", 1],
  ]);
  assert.strictEqual(mixed.directed, true);
  assert.deepStrictEqual(Object.fromEntries(mixed.inDegree), {
    a: 0,
    b: 2,
    c: 1,
  });
  assert.deepStrictEqual(Object.fromEntries(mixed.outDegree), {
    a: 1,
    b: 1,
    c: 1,
  });
});

it("nodeStatsGraph — weighted: the strongest link is one step, a link half as strong two", () => {
  const links = [
    statLink("a", "b", 0, 8),
    statLink("b", "c", 1, 4),
    statLink("c", "d", 2, undefined),
    statLink("d", "a", 3, -2),
  ];
  const lengths = g => g.arcs.filter((_, i) => i % 2 === 0).map(a => a.length);
  assert.deepStrictEqual(
    lengths(nodeStatsGraph(["a", "b", "c", "d"], links, false, true)),
    [1, 2, 8, 8],
  );
  assert.deepStrictEqual(
    lengths(nodeStatsGraph(["a", "b", "c", "d"], links, false, false)),
    [1, 1, 1, 1],
  );
});

it("nodeTooltipStatList — `true` lists every measure, an Array the known ones in its order", () => {
  assert.deepStrictEqual(nodeTooltipStatList(true), [...NODE_STATS]);
  assert.deepStrictEqual(NODE_STATS, [
    "degree",
    "betweenness",
    "closeness",
    "cluster",
  ]);
  assert.deepStrictEqual(nodeTooltipStatList(false), []);
  assert.deepStrictEqual(nodeTooltipStatList(undefined), []);
  assert.deepStrictEqual(nodeTooltipStatList("degree"), []);
  assert.deepStrictEqual(
    nodeTooltipStatList(["closeness", "nope", "degree", "closeness"]),
    ["closeness", "degree"],
  );
});

it("nodeStatsFields — on by default, unweighted", () => {
  const fields = Object.fromEntries(nodeStatsFields().map(f => [f.key, f]));
  assert.strictEqual(fields.nodeTooltipStats.default, true);
  assert.strictEqual(fields.nodeTooltipStatsWeighted.default, false);
});

/** A stand-in chart: labels nodes by `name`, translating with `dictionary`. */
const fakeViz = (schema = {}, dictionary = {}) => ({
  ctx: {},
  schema: {
    locale: "en-US",
    translate: s => dictionary[s] ?? s,
    nodeTooltipStats: true,
    ...schema,
  },
  _drawLabel: d => d.name ?? d.id,
});

const nodeData = ["a", "b", "c", "d", "e"].map(id => ({
  id,
  name: id.toUpperCase(),
}));
const ends = nodeData.map((data, i) => ({data, i, id: data.id}));

/** Publishes the path a–b–c–d (and a lone e) on `viz`, each link sized by `values`. */
function publishPath(viz, values = [1, 1, 1]) {
  const at = id => ends.find(e => e.id === id);
  const rows = [
    {source: "a", target: "b", w: values[0]},
    {source: "b", target: "c", w: values[1]},
    {source: "c", target: "d", w: values[2]},
  ];
  const links = rows.map((row, i) => {
    const d = makeLinkDatum(row, at(row.source), at(row.target), i);
    setLinkValue(d, row.w);
    return d;
  });
  return publishLinkGraph(viz, links, ends);
}

it("nodeConnectionRows — the measures replace the connection count", () => {
  const viz = fakeViz();
  publishPath(viz);
  assert.deepStrictEqual(nodeConnectionRows(viz, nodeData[1]), [
    ["Degree", "2"],
    ["Betweenness", "0.33"],
    ["Closeness", "0.56"],
  ]);
  assert.deepStrictEqual(nodeConnectionRows(viz, nodeData[4]), [
    ["Degree", "0"],
    ["Betweenness", "0"],
    ["Closeness", "0"],
  ]);
});

it("nodeConnectionRows — without degree, the connection count stays; the links follow the measures", () => {
  const viz = fakeViz({
    nodeTooltipStats: ["closeness"],
    nodeTooltipLinks: 1,
  });
  publishPath(viz, [1, 5, 2]);
  assert.deepStrictEqual(nodeConnectionRows(viz, nodeData[1]), [
    ["Connections", "2"],
    ["Closeness", "0.56"],
    ["→ C", "5"],
  ]);
  viz.schema.nodeTooltipStats = false;
  assert.deepStrictEqual(nodeConnectionRows(viz, nodeData[1]), [
    ["Connections", "2"],
    ["→ C", "5"],
  ]);
});

it("nodeStatRows — in and out degree when the chart draws arrows", () => {
  const viz = fakeViz({arrows: true, nodeTooltipStats: ["degree"]});
  const graph = publishPath(viz);
  assert.deepStrictEqual(nodeConnectionRows(viz, nodeData[0]), [
    ["In-degree", "0"],
    ["Out-degree", "1"],
  ]);
  assert.deepStrictEqual(
    nodeStatRows(viz, graph, "b", () => {
      throw new Error("links already read");
    }).rows,
    [
      ["In-degree", "1"],
      ["Out-degree", "1"],
    ],
    "the links are read once per graph and setting",
  );
  viz.schema.arrows = "source";
  const viaLinks = nodeConnectionRows(viz, nodeData[0]);
  assert.deepStrictEqual(viaLinks, [
    ["In-degree", "1"],
    ["Out-degree", "0"],
  ]);
});

it("nodeStatRows — directed betweenness and closeness follow the arrows", () => {
  const viz = fakeViz({arrows: true, nodeTooltipStats: ["closeness"]});
  publishPath(viz);
  // d reaches no one along the arrows; a reaches all three of the others it can.
  assert.deepStrictEqual(nodeConnectionRows(viz, nodeData[3])[1], [
    "Closeness",
    "0",
  ]);
  assert.deepStrictEqual(nodeConnectionRows(viz, nodeData[0])[1], [
    "Closeness",
    "0.38",
  ]);
});

it("nodeStatRows — weighted paths prefer strong links", () => {
  const viz = fakeViz({nodeTooltipStats: ["betweenness"]});
  const at = id => ends.find(e => e.id === id);
  // A triangle a–b–c whose a–c link is weak: weighted, a to c goes by b.
  const rows = [
    {source: "a", target: "b", w: 4},
    {source: "b", target: "c", w: 4},
    {source: "a", target: "c", w: 1},
  ];
  const links = rows.map((row, i) => {
    const d = makeLinkDatum(row, at(row.source), at(row.target), i);
    setLinkValue(d, row.w);
    return d;
  });
  publishLinkGraph(viz, links, ends.slice(0, 3));
  const b = () =>
    nodeConnectionRows(viz, nodeData[1]).find(r => r[0] === "Betweenness");
  assert.deepStrictEqual(b(), ["Betweenness", "0"]);
  viz.schema.nodeTooltipStatsWeighted = true;
  assert.deepStrictEqual(b(), ["Betweenness", "1"]);
});

it("nodeStatRows — the cluster row, only while clusters color the chart and the node is in one", () => {
  const viz = fakeViz({nodeTooltipStats: ["cluster", "degree"]});
  publishPath(viz);
  const rows = id =>
    nodeConnectionRows(
      viz,
      nodeData.find(d => d.id === id),
    );
  assert.deepStrictEqual(rows("a"), [["Degree", "1"]]);
  viz.ctx.clusterState = {
    active: true,
    names: new Map([
      ["a", "B cluster"],
      ["b", "B cluster"],
      ["e", "E"],
    ]),
    clusters: [{index: 0, name: "B cluster", ids: ["a", "b"], hub: "b"}],
  };
  assert.deepStrictEqual(rows("a"), [
    ["Cluster", "B cluster"],
    ["Degree", "1"],
  ]);
  assert.deepStrictEqual(rows("e"), [["Degree", "0"]], "a lone node");
  viz.ctx.clusterState = {...viz.ctx.clusterState, active: false};
  assert.deepStrictEqual(rows("a"), [["Degree", "1"]]);
});

it("nodeStatRows — measures are worked out on first need and kept until the network changes", () => {
  const viz = fakeViz({nodeTooltipStats: ["degree"]});
  let reads = 0;
  const graph = publishPath(viz);
  const links = () => (
    reads++,
    graph.links.map((datum, index) => ({
      source: datum.source.id,
      target: datum.target.id,
      index,
      value: 1,
      datum,
    }))
  );
  nodeStatRows(viz, graph, "a", links);
  assert.strictEqual(viz.ctx.nodeStatsCache, undefined, "degree alone");
  viz.schema.nodeTooltipStats = true;
  nodeConnectionRows(viz, nodeData[0]);
  const first = viz.ctx.nodeStatsCache;
  assert.ok(first, "worked out for betweenness and closeness");
  nodeConnectionRows(viz, nodeData[2]);
  assert.strictEqual(viz.ctx.nodeStatsCache, first, "kept");
  // A redraw publishes a new graph of the same network: the same measures.
  publishPath(viz);
  nodeConnectionRows(viz, nodeData[0]);
  assert.strictEqual(viz.ctx.nodeStatsCache.measures, first.measures);
  // Weighted with every value the same: the same arcs, the same measures.
  viz.schema.nodeTooltipStatsWeighted = true;
  nodeConnectionRows(viz, nodeData[0]);
  assert.strictEqual(viz.ctx.nodeStatsCache.measures, first.measures);
  // New link values change the weighted lengths, and the measures.
  publishPath(viz, [1, 2, 1]);
  nodeConnectionRows(viz, nodeData[0]);
  assert.notStrictEqual(viz.ctx.nodeStatsCache.measures, first.measures);
  assert.strictEqual(reads, 1);
});

it("nodeStatRows — the labels translate and the values follow the locale", () => {
  const es = translateLocale["es-ES"];
  const viz = fakeViz({locale: "es-ES"}, es);
  publishPath(viz);
  assert.deepStrictEqual(nodeConnectionRows(viz, nodeData[1]), [
    ["Grado", "2"],
    ["Intermediación", "0,33"],
    ["Cercanía", "0,56"],
  ]);
  viz.schema.arrows = true;
  assert.deepStrictEqual(nodeConnectionRows(viz, nodeData[1]).slice(0, 2), [
    ["Grado de entrada", "1"],
    ["Grado de salida", "1"],
  ]);
  const labels = [
    "Betweenness",
    "Closeness",
    "Cluster",
    "Degree",
    "In-degree",
    "Out-degree",
  ];
  for (const [locale, strings] of Object.entries(translateLocale))
    for (const label of labels)
      assert.ok(strings[label], `${locale} translates "${label}"`);
});
