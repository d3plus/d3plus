import {it} from "vitest";
import assert from "assert";
import {jsdomit} from "~test/jsdom.js";
import {Network} from "../../index.ts";
import {
  computeTimeFilter,
  graphNodeRows,
  graphPeriod,
  resolveGraphLinks,
  resolveGraphNodes,
  timeRows,
  timelessPass,
} from "../../internal.ts";

/**
    Networks over time: `nodes` and `links` rows with a `time` value follow
    the timeline's selected period (rows without one are in every period),
    and they feed the timeline's periods.
*/

const year = d => d.year;

/** A stand-in node-link chart, filtered to `selected`. */
const fakeGraph = ({nodes, links, selected}) => ({
  ctx: {},
  schema: {
    nodes,
    links,
    time: year,
    timeFilter: selected === undefined ? undefined : d => d.year === selected,
    nodeGroupBy: [d => d.id],
    linkSize: () => 1,
    shape: () => "Circle",
    sizeMin: 5,
  },
  _id: () => undefined,
  _drawDepth: 0,
  _data: [],
  _filteredData: [],
});

it("timelessPass: rows without a time pass, the rest go by the filter", () => {
  const viz = {schema: {time: year}};
  const pass = timelessPass(viz, d => d.year === 2020);
  assert.ok(pass({year: 2020}, 0));
  assert.ok(!pass({year: 2019}, 0));
  assert.ok(pass({}, 0));
  assert.ok(pass({year: null}, 0));
  const plain = d => d.year === 1;
  assert.strictEqual(timelessPass({schema: {}}, plain), plain);
});

it("timeRows: the chart's own time rows, else its data", () => {
  const data = [{year: 1}];
  assert.strictEqual(timeRows({_data: data}), data);
  assert.strictEqual(timeRows({_data: data, _timeRows: () => undefined}), data);
  const own = [{year: 2}];
  assert.strictEqual(timeRows({_data: data, _timeRows: () => own}), own);
});

it("graphPeriod: none without time; else the period's rows and the timeless ones", () => {
  assert.strictEqual(graphPeriod({schema: {}}), undefined);
  const viz = fakeGraph({nodes: [], links: [], selected: 2020});
  const period = graphPeriod(viz);
  assert.ok(period({year: 2020}, 0));
  assert.ok(!period({year: 2021}, 0));
  assert.ok(period({id: "static"}, 0));
});

it("graphNodeRows: the nodes in the selected period", () => {
  const viz = fakeGraph({
    nodes: [
      {id: "a", year: 2020},
      {id: "a", year: 2021},
      {id: "b", year: 2021},
      {id: "c"},
    ],
    links: [],
    selected: 2021,
  });
  assert.deepStrictEqual(graphNodeRows(viz), [
    {id: "a", year: 2021},
    {id: "b", year: 2021},
    {id: "c"},
  ]);
});

it("graphNodeRows: without nodes, only the period's links add nodes", () => {
  const viz = fakeGraph({
    nodes: [],
    links: [
      {source: "a", target: "b", year: 2020},
      {source: "b", target: "c", year: 2021},
    ],
    selected: 2021,
  });
  assert.deepStrictEqual(
    graphNodeRows(viz).map(d => d.id),
    ["b", "c"],
  );
});

it("resolveGraphLinks: a link outside the period resolves neither end", () => {
  const viz = fakeGraph({
    nodes: [{id: "a"}, {id: "b"}, {id: "c"}],
    links: [
      {source: "a", target: "b", year: 2020},
      {source: "b", target: "c", year: 2021},
      {source: "a", target: "c"},
    ],
    selected: 2021,
  });
  const nodes = resolveGraphNodes(viz);
  const links = resolveGraphLinks(viz, nodes);
  assert.strictEqual(links.length, 3, "index-aligned with links");
  assert.ok(!links[0].datum && !links[0].source);
  assert.ok(links[1].datum && links[2].datum);
  assert.deepStrictEqual(
    viz.ctx.linkLookup.a.map(n => n.id),
    ["c"],
  );
});

it("graphNodeRows: every node without a time filter", () => {
  const viz = fakeGraph({nodes: [{id: "a", year: 1}], links: []});
  viz.schema.time = undefined;
  assert.strictEqual(graphNodeRows(viz).length, 1);
});

jsdomit(
  "Network: its nodes' and links' times join the data's, and pick the starting period",
  () => {
    const viz = new Network()
      .nodes([{id: "a", year: 2019}, {id: "b", year: 2021}, {id: "c"}])
      .links([{source: "a", target: "c", year: 2020}])
      .time("year");
    viz._data = [{id: "a", year: 2022}, {id: "c"}];
    assert.deepStrictEqual(
      viz._timeRows().map(d => d.year),
      [2022, 2019, 2021, 2020],
    );
    // Without a timeline selection, the latest period.
    const filter = computeTimeFilter(viz);
    assert.ok(filter({year: 2022}, 0) && !filter({year: 2021}, 0));
    viz.time(false);
    assert.strictEqual(viz._timeRows(), viz._data);
  },
);
