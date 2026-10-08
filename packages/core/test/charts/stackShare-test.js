import assert from "assert";
import it from "../jsdom.js";
import {computePlotAxisValues, computePlotInitialDomains, formatPlotData} from "../../es/src/charts/Plot/pipeline.js";
import {BarChart, StackedArea} from "../../es/index.js";
import accessor from "../../es/src/utils/accessor.js";
import {Bar} from "../../es/src/shapes/index.js";
import {applyStackShareLabels, splitShareBox} from "../../es/src/charts/Plot/stackShareLabels.js";
import {resolveStackOrder, stackOffsetDiverging} from "../../es/src/charts/Plot/stackHelpers.js";

// Same hand-rolled viz stub as stackOrdering-test.js: drives Plot's real
// stacking stages without a chart instance or layout.
const makeStackedViz = data => ({
  _filteredData: data,
  _data: [],
  _ids: d => [d.id],
  _drawDepth: 0,
  _groupBy: [accessor("id")],
  _axisPersist: false,
  _confidence: false,
  _size: false,
  _x: accessor("x"),
  _y: accessor("y"),
  _x2: accessor("x2"),
  _y2: accessor("y2"),
  _xConfig: {}, _x2Config: {}, _yConfig: {}, _y2Config: {},
  _baseline: 0,
  _margin: {top: 0, right: 0, bottom: 0, left: 0},
  _stackOrder: resolveStackOrder("descending"),
  _stackOffset: stackOffsetDiverging,
  schema: {
    discrete: "x",
    stacked: true,
    shape: () => "Area",
    time: false,
    groupBy: [accessor("id")],
    xSort: false, x2Sort: false, ySort: false, y2Sort: false,
    xDomain: undefined, x2Domain: undefined, yDomain: undefined, y2Domain: undefined,
    sizeScale: "sqrt", sizeMax: 10, sizeMin: 5,
    height: 300, width: 400,
  },
});

const runStack = data => {
  const viz = makeStackedViz(data);
  const fmt = formatPlotData({viz});
  const av = computePlotAxisValues({viz, ...fmt});
  computePlotInitialDomains({viz, ...fmt, ...av});
  return fmt.plotFormattedData;
};

it("charts/stackShare stamps each point's fraction of its stack total (#783)", () => {
  const data = [
    {id: "a", x: 2000, y: 1},
    {id: "b", x: 2000, y: 3},
    {id: "a", x: 2001, y: 2},
    {id: "b", x: 2001, y: 2},
  ];
  const rows = runStack(data);
  const share = (id, x) => rows.find(r => r.id === id && r.x === x).share;
  assert.strictEqual(share("a", 2000), 0.25);
  assert.strictEqual(share("b", 2000), 0.75);
  assert.strictEqual(share("a", 2001), 0.5);
  // The source datum (what tooltip accessors receive) carries it too.
  assert.deepStrictEqual(data.map(d => d.share), [0.25, 0.75, 0.5, 0.5]);
});

it("charts/stackShare keeps a data field named share and stamps its own share alongside", () => {
  const data = [
    {id: "a", x: 2000, y: 1, share: 10},
    {id: "b", x: 2000, y: 3, share: 30},
  ];
  const rows = runStack(data);
  assert.deepStrictEqual(data.map(d => d.share), [10, 30], "the user's share is untouched");
  assert.deepStrictEqual(data.map(d => d.__d3plusShare), [0.25, 0.75]);
  assert.deepStrictEqual(rows.map(d => d.__d3plusShare).sort(), [0.25, 0.75], "the stacked rows carry it too");
  // A second stacking pass (a redraw) still leaves the user's field alone.
  data[0].y = 3;
  runStack(data);
  assert.deepStrictEqual(data.map(d => d.share), [10, 30]);
  assert.deepStrictEqual(data.map(d => d.__d3plusShare), [0.5, 0.5]);
});

it("charts/stackShare updates its own share on a redraw", () => {
  const data = [
    {id: "a", x: 2000, y: 1},
    {id: "b", x: 2000, y: 3},
  ];
  runStack(data);
  data[0].y = 3;
  runStack(data);
  assert.deepStrictEqual(data.map(d => d.share), [0.5, 0.5]);
  assert.deepStrictEqual(data.map(d => d.__d3plusShare), [0.5, 0.5]);
});

it("charts/stackShare leaves a series' real share intact when filler points reuse its datum", () => {
  // "b" is missing at 2001, so a zero filler point reusing b's 2000 datum is
  // pushed into the stack — it must not overwrite that datum's share with 0.
  const data = [
    {id: "a", x: 2000, y: 1},
    {id: "b", x: 2000, y: 1},
    {id: "a", x: 2001, y: 4},
  ];
  runStack(data);
  assert.deepStrictEqual(data.map(d => d.share), [0.5, 0.5, 1]);
});

it("charts/stackShare gives a diverging stack's negative segments positive shares", () => {
  const data = [
    {id: "a", x: 2000, y: 3},
    {id: "b", x: 2000, y: -1},
  ];
  runStack(data);
  assert.deepStrictEqual(data.map(d => d.share), [0.75, 0.25]);
});

it("charts/stackShare StackedArea tooltip shows the share, blank for legend aggregates", () => {
  const cell = new StackedArea().tooltipConfig().tbody()[0][1];
  assert.strictEqual(cell({}, 0, {__d3plusShare: 0.25}), "25%");
  assert.strictEqual(cell({}, 0, {__d3plusShare: [0.25, 0.5]}), "");
  assert.strictEqual(cell({}, 0, {share: 0.25}), "", "ignores a data field named share");
  assert.strictEqual(cell({}, 0, {}), "");
});

it("charts/stackShare BarChart shows the Share row only while stacked", () => {
  const bar = new BarChart();
  assert.deepStrictEqual(bar.tooltipConfig().tbody(), [], "unstacked: no Share row");
  bar.stacked(true);
  const rows = bar.tooltipConfig().tbody();
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0][0](), "Share");
  assert.strictEqual(rows[0][1]({}, 0, {__d3plusShare: 0.5}), "50%");
});

it("charts/stackShare stamps shares on stacked bars", () => {
  const viz = makeStackedViz([
    {id: "a", x: "A", y: 1},
    {id: "b", x: "A", y: 4},
  ]);
  viz.schema.shape = () => "Bar";
  const fmt = formatPlotData({viz});
  const av = computePlotAxisValues({viz, ...fmt});
  computePlotInitialDomains({viz, ...fmt, ...av});
  assert.deepStrictEqual(viz._filteredData.map(d => d.share), [0.2, 0.8]);
});

it("charts/stackShare splits a tall label box into name + share bands", () => {
  assert.strictEqual(splitShareBox({x: 0, y: 0, width: 80, height: 20}, 3), null, "too short");
  const [name, share] = splitShareBox({x: 5, y: 10, width: 80, height: 100}, 3);
  // share text is capped at 14px; the bands overlap by the padding so the
  // bottom-aligned name and top-aligned share meet at one line.
  assert.deepStrictEqual(name, {x: 5, y: 10, width: 80, height: 86});
  assert.deepStrictEqual(share, {x: 5, y: 90, width: 80, height: 20});
});

const shareShape = (data, height) => {
  const s = new Bar()
    .renderMode("compute")
    .data(data)
    .label(d => d.id)
    .labelBounds(() => ({x: 0, y: 0, width: 100, height}))
    .labelConfig({padding: 3, verticalAlign: "top"});
  const viz = {schema: {discrete: "x", locale: "en-US"}};
  applyStackShareLabels(viz, s);
  return s;
};

it("charts/stackShare adds a share line under stacked Bar labels", () => {
  const s = shareShape([{id: "a", x: 0, y: 1, __d3plusShare: 0.25}], 100);
  const records = s._buildLabelData();
  assert.deepStrictEqual(records.map(r => r.text), ["a", "25%"]);
  const align = s.labelConfig().verticalAlign;
  assert.deepStrictEqual(records.map(r => align(r, 0)), ["bottom", "top"]);
});

it("charts/stackShare keeps the name's own layout when the share won't fit", () => {
  const s = shareShape([{id: "a", x: 0, y: 1, __d3plusShare: 0.25}], 20);
  const records = s._buildLabelData();
  assert.strictEqual(records[0].height, 20, "name keeps the full box");
  assert.strictEqual(records[1].height, 0, "share gets no room");
  assert.strictEqual(s.labelConfig().verticalAlign(records[0], 0), "top");
});

it("charts/stackShare labels read d3plus's share, not a data field named share", () => {
  const s = shareShape([{id: "a", x: 0, y: 1, share: 30, __d3plusShare: 0.25}], 100);
  assert.deepStrictEqual(s._buildLabelData().map(r => r.text), ["a", "25%"]);
});
