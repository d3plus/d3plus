import {it} from "vitest";
import assert from "assert";

import {
  isLinkDatum,
  LINK_HIT_WIDTH,
  linkArrows,
  linkAriaLabel,
  linkCellText,
  linkEndLabel,
  linkHighlight,
  linkHitPath,
  linkMeta,
  linkNodeOf,
  linkTooltipConfig,
  linkTooltipRows,
  linkTooltipTitle,
  makeLinkDatum,
  nodeConnectionRows,
  nodeConnections,
  nodeHighlight,
  nodeTooltipLinkLimit,
  publishLinkGraph,
  rtlLocale,
  setLinkValue,
} from "../../src/charts/features/linkInteraction.ts";

const spanish = {Connections: "Conexiones", Value: "Valor", to: "a"};

/** A stand-in chart: labels nodes by `name`, translating with `dictionary`. */
const fakeViz = (schema = {}, dictionary = {}) => ({
  ctx: {},
  schema: {
    locale: "en-US",
    translate: s => dictionary[s] ?? s,
    ...schema,
  },
  _drawLabel: d => d.name ?? d.id,
});

const nodeData = [
  {id: "a", name: "Alpha"},
  {id: "b", name: "Bravo"},
  {id: "c", name: "Charlie"},
  {id: "d", name: "Delta"},
];
const ends = nodeData.map((data, i) => ({data, i, id: data.id}));

/** A chart with links a→b (4), a→c (9), c→a (1), each sized by `w`, published. */
function graphFixture(viz = fakeViz(), values = [4, 9, 1]) {
  const rows = [
    {source: "a", target: "b", w: values[0], kind: "trade"},
    {source: "a", target: "c", w: values[1], kind: "aid"},
    {source: "c", target: "a", w: values[2], kind: "trade"},
  ];
  const at = id => ends.find(e => e.id === id);
  const links = rows.map((row, i) => {
    const d = makeLinkDatum(row, at(row.source), at(row.target), i);
    setLinkValue(d, row.w);
    return d;
  });
  const graph = publishLinkGraph(viz, links, ends);
  return {viz, rows, links, graph};
}

it("makeLinkDatum sets source and target to node data and keeps the link's fields", () => {
  const raw = {source: "a", target: "b", weight: 3};
  const d = makeLinkDatum(raw, ends[0], ends[1], 7);
  assert.strictEqual(d.source, nodeData[0]);
  assert.strictEqual(d.target, nodeData[1]);
  assert.strictEqual(d.weight, 3);
  assert.notStrictEqual(d, raw, "a new object; the row is untouched");
  assert.strictEqual(raw.source, "a");
  const meta = linkMeta(d);
  assert.strictEqual(meta.index, 7);
  assert.strictEqual(meta.raw, raw);
  assert.deepStrictEqual(meta.endKeys, ["source", "target"]);
  assert.strictEqual(meta.source, ends[0]);
});

it("isLinkDatum and linkMeta recognize only link datums", () => {
  const d = makeLinkDatum({source: "a", target: "b"}, ends[0], ends[1], 0);
  assert.strictEqual(isLinkDatum(d), true);
  assert.strictEqual(
    isLinkDatum({source: {id: "a"}, target: {id: "b"}}),
    false,
  );
  assert.strictEqual(isLinkDatum(nodeData[0]), false);
  assert.strictEqual(isLinkDatum(null), false);
  assert.strictEqual(isLinkDatum("a"), false);
  assert.strictEqual(linkMeta(nodeData[0]), undefined);
});

it("setLinkValue records numeric values and returns what it was given", () => {
  const d = makeLinkDatum({}, ends[0], ends[1], 0);
  assert.strictEqual(setLinkValue(d, "12"), "12");
  assert.strictEqual(linkMeta(d).value, 12);
  const e = makeLinkDatum({}, ends[0], ends[1], 0);
  setLinkValue(e, "n/a");
  setLinkValue(e, null);
  assert.strictEqual(linkMeta(e).value, undefined);
  assert.strictEqual(setLinkValue({}, 3), 3, "ignores non-link datums");
});

it("publishLinkGraph indexes links by node and records each node datum", () => {
  const {viz, links, graph} = graphFixture();
  assert.strictEqual(viz.ctx.linkGraph, graph);
  assert.strictEqual(graph.sized, true, "the values differ");
  assert.deepStrictEqual(graph.byNode.get("a"), links);
  assert.deepStrictEqual(graph.byNode.get("b"), [links[0]]);
  assert.deepStrictEqual(graph.byNode.get("d"), [], "a node with no links");
  assert.strictEqual(linkMeta(links[0]).graph, graph);
  assert.deepStrictEqual(linkNodeOf(viz, nodeData[1]), {id: "b", graph});
  assert.strictEqual(linkNodeOf(viz, {id: "b"}), undefined, "by identity");
  assert.strictEqual(
    linkNodeOf(fakeViz(), nodeData[1]),
    undefined,
    "per chart",
  );
  assert.strictEqual(graphFixture(fakeViz(), [1, 1, 1]).graph.sized, false);
});

it("publishLinkGraph counts a self-link once", () => {
  const viz = fakeViz();
  const loop = makeLinkDatum({}, ends[0], ends[0], 0);
  const graph = publishLinkGraph(viz, [loop], ends);
  assert.deepStrictEqual(graph.byNode.get("a"), [loop]);
});

it("linkEndLabel and linkTooltipTitle name a link's ends by their labels", () => {
  const {viz, links} = graphFixture();
  assert.strictEqual(linkEndLabel(viz, ends[2]), "Charlie");
  assert.strictEqual(linkTooltipTitle(viz, links[0]), "Alpha → Bravo");
  assert.strictEqual(linkTooltipTitle(viz, links[2]), "Charlie → Alpha");
  assert.strictEqual(linkTooltipTitle(viz, nodeData[0]), "");
  const unlabeled = {...viz, _drawLabel: () => undefined};
  assert.strictEqual(
    linkEndLabel(unlabeled, ends[1]),
    "b",
    "falls back to the id",
  );
});

it("linkCellText formats numbers by locale and skips what it can't show", () => {
  const viz = fakeViz();
  assert.strictEqual(linkCellText(viz, 1200), "1.2k");
  assert.strictEqual(linkCellText(viz, "text"), "text");
  assert.strictEqual(linkCellText(viz, false), "false");
  assert.strictEqual(linkCellText(viz, NaN), null);
  assert.strictEqual(linkCellText(viz, {a: 1}), null);
  assert.strictEqual(linkCellText(viz, [1]), null);
  assert.strictEqual(linkCellText(viz, undefined), null);
  assert.strictEqual(typeof linkCellText(viz, new Date(2020, 0, 2)), "string");
});

it("linkTooltipRows lists the link's fields, with its value when no field shows it", () => {
  const {viz, links} = graphFixture();
  assert.deepStrictEqual(
    linkTooltipRows(viz, links[1]),
    [
      ["w", "9"],
      ["kind", "aid"],
    ],
    "w already shows the value, and the end keys are left out",
  );
  // A computed value no field holds gets its own row, first.
  const viz2 = fakeViz();
  const rows = [
    {source: "a", target: "b", w: 2},
    {source: "b", target: "c", w: 3},
  ];
  const links2 = rows.map((r, i) => {
    const d = makeLinkDatum(r, ends[i], ends[i + 1], i);
    setLinkValue(d, r.w * 10);
    return d;
  });
  publishLinkGraph(viz2, links2, ends);
  assert.deepStrictEqual(linkTooltipRows(viz2, links2[1]), [
    ["Value", "30"],
    ["w", "3"],
  ]);
  assert.deepStrictEqual(linkTooltipRows(viz2, nodeData[0]), []);
});

it("linkTooltipRows leaves out the value row when every link has the same value", () => {
  const {viz, links} = graphFixture(fakeViz(), [1, 1, 1]);
  const d = makeLinkDatum({source: "a", target: "b"}, ends[0], ends[1], 3);
  setLinkValue(d, 1);
  publishLinkGraph(viz, [...links, d], ends);
  assert.deepStrictEqual(linkTooltipRows(viz, d), []);
});

it("linkTooltipRows skips the configured end keys and internal fields", () => {
  const viz = fakeViz();
  const raw = {from: "a", to: "b", __d3plus__: true, amount: 5};
  const d = makeLinkDatum(raw, ends[0], ends[1], 0, ["from", "to"]);
  assert.deepStrictEqual(linkTooltipRows(viz, d), [["amount", "5"]]);
});

it("linkAriaLabel reads 'Source to Target', with the value when values differ", () => {
  const {viz, links} = graphFixture();
  assert.strictEqual(linkAriaLabel(viz, links[0]), "Alpha to Bravo, 4.");
  const same = graphFixture(fakeViz(), [2, 2, 2]);
  assert.strictEqual(linkAriaLabel(same.viz, same.links[0]), "Alpha to Bravo.");
  const es = graphFixture(fakeViz({}, spanish));
  assert.strictEqual(linkAriaLabel(es.viz, es.links[1]), "Alpha a Charlie, 9.");
  assert.strictEqual(linkAriaLabel(viz, nodeData[0]), "");
});

it("linkHighlight matches the link and the nodes at its ends", () => {
  const {viz, links} = graphFixture();
  const hover = linkHighlight(viz, links[0], d => d.key);
  assert.strictEqual(hover(links[0], 0), true);
  assert.strictEqual(hover(links[1], 1), false);
  assert.strictEqual(hover(nodeData[0], 0), true, "its source");
  assert.strictEqual(hover(nodeData[1], 1), true, "its target");
  assert.strictEqual(hover(nodeData[2], 2), false);
  assert.strictEqual(hover({key: "b"}, 0), true, "other rows match by key");
  assert.strictEqual(hover({key: "c"}, 0), false);
  // A redrawn link (a new datum at the same index) still matches.
  const again = makeLinkDatum({}, ends[0], ends[1], 0);
  assert.strictEqual(hover(again, 0), true);
  assert.strictEqual(linkHighlight(viz, links[0])({key: "b"}, 0), false);
});

it("nodeConnections lists a node's links, strongest first, with their direction", () => {
  const {links, graph} = graphFixture();
  const out = nodeConnections(graph, "a");
  assert.deepStrictEqual(
    out.map(c => [c.other.id, c.outgoing, c.value]),
    [
      ["c", true, 9],
      ["b", true, 4],
      ["c", false, 1],
    ],
  );
  assert.strictEqual(out[0].link, links[1]);
  assert.deepStrictEqual(nodeConnections(graph, "zzz"), []);
  // Unvalued links keep their order in `links`.
  const flat = graphFixture(fakeViz(), [undefined, undefined, undefined]);
  assert.deepStrictEqual(
    nodeConnections(flat.graph, "a").map(c => linkMeta(c.link).index),
    [0, 1, 2],
  );
});

it("nodeHighlight matches the node, its neighbors, and the links between them", () => {
  const {viz, links} = graphFixture();
  const hover = nodeHighlight(viz, nodeData[1], d => d.key);
  assert.strictEqual(hover(nodeData[1], 1), true);
  assert.strictEqual(hover(nodeData[0], 0), true, "its neighbor");
  assert.strictEqual(hover(nodeData[2], 2), false);
  assert.strictEqual(hover(links[0], 0), true);
  assert.strictEqual(hover(links[1], 1), false);
  assert.strictEqual(hover({key: "a"}, 0), true, "other rows match by key");
  assert.strictEqual(nodeHighlight(viz, {id: "b"}), null, "not a node");
});

it("nodeTooltipLinkLimit reads nodeTooltipLinks, defaulting to 3 for valued links", () => {
  const {graph} = graphFixture();
  const flat = graphFixture(fakeViz(), [1, 1, 1]).graph;
  const limit = (value, g = graph) =>
    nodeTooltipLinkLimit(fakeViz({nodeTooltipLinks: value}), g);
  assert.strictEqual(limit(undefined), 3);
  assert.strictEqual(limit(undefined, flat), 0);
  assert.strictEqual(limit(5, flat), 5);
  assert.strictEqual(limit(2.7), 2);
  assert.strictEqual(limit(-1), 0);
  assert.strictEqual(limit(false), 0);
  assert.strictEqual(limit(true, flat), 3);
});

it("nodeConnectionRows lists the connection count and the strongest links", () => {
  const {viz} = graphFixture();
  assert.deepStrictEqual(nodeConnectionRows(viz, nodeData[0]), [
    ["Connections", "3"],
    ["→ Charlie", "9"],
    ["→ Bravo", "4"],
    ["← Charlie", "1"],
  ]);
  viz.schema.nodeTooltipLinks = 1;
  assert.deepStrictEqual(nodeConnectionRows(viz, nodeData[0]), [
    ["Connections", "3"],
    ["→ Charlie", "9"],
  ]);
  viz.schema.nodeTooltipLinks = false;
  assert.deepStrictEqual(nodeConnectionRows(viz, nodeData[3]), [
    ["Connections", "0"],
  ]);
  assert.deepStrictEqual(nodeConnectionRows(viz, {id: "a"}), [], "not a node");
});

it("nodeConnectionRows lists only the count for unvalued links, unless asked", () => {
  const {viz} = graphFixture(fakeViz({}, spanish), [1, 1, 1]);
  assert.deepStrictEqual(nodeConnectionRows(viz, nodeData[1]), [
    ["Conexiones", "1"],
  ]);
  viz.schema.nodeTooltipLinks = 2;
  assert.deepStrictEqual(nodeConnectionRows(viz, nodeData[1]), [
    ["Conexiones", "1"],
    ["← Alpha", ""],
  ]);
});

it("linkTooltipConfig titles and fills tooltips for links and nodes", () => {
  const {viz, links} = graphFixture();
  const {title, tbody} = linkTooltipConfig(viz);
  assert.strictEqual(title(links[0], 0), "Alpha → Bravo");
  assert.strictEqual(title(nodeData[3], 3), "Delta");
  assert.deepStrictEqual(tbody(links[0], 0), [
    ["w", "4"],
    ["kind", "trade"],
  ]);
  assert.deepStrictEqual(tbody(nodeData[3], 3), [["Connections", "0"]]);
});

it("linkHitPath is a transparent path wider than the link", () => {
  const d = makeLinkDatum({}, ends[0], ends[1], 4);
  const hit = linkHitPath("link-a-b", "M0,0L1,1", d, 2);
  assert.strictEqual(hit.key, "link-a-b::hit");
  assert.strictEqual(hit.d, "M0,0L1,1");
  assert.strictEqual(hit.datum, d);
  assert.strictEqual(hit.index, 4);
  assert.deepStrictEqual(hit.paint, {
    fill: "none",
    stroke: "transparent",
    strokeWidth: LINK_HIT_WIDTH,
  });
  assert.strictEqual(linkHitPath("k", "", d, 20).paint.strokeWidth, 24);
  assert.strictEqual(linkHitPath("k", "", d, "2").paint.strokeWidth, 8);
});

it("rtlLocale reads the locale's language", () => {
  assert.strictEqual(rtlLocale("ar-SA"), true);
  assert.strictEqual(rtlLocale("he"), true);
  assert.strictEqual(rtlLocale("fa_IR"), true);
  assert.strictEqual(rtlLocale("es-ES"), false);
  assert.strictEqual(rtlLocale("en-US"), false);
  assert.strictEqual(rtlLocale(undefined), false);
});

it("linkArrows mirror for a right-to-left locale", () => {
  assert.deepStrictEqual(linkArrows(fakeViz()), ["→", "←"]);
  assert.deepStrictEqual(linkArrows(fakeViz({locale: "ar-SA"})), ["←", "→"]);
});

it("ar-SA node tooltips and link titles point their arrows right to left", () => {
  const {viz, links} = graphFixture(fakeViz({locale: "ar-SA"}));
  assert.deepStrictEqual(nodeConnectionRows(viz, nodeData[0]).slice(1), [
    ["← Charlie", "9"],
    ["← Bravo", "4"],
    ["→ Charlie", "1"],
  ]);
  assert.strictEqual(linkTooltipTitle(viz, links[0]), "Alpha ← Bravo");
});
