import assert from "assert";
import it from "../jsdom.js";
import {
  computePlotAxisValues,
  computePlotScales,
  formatPlotData,
} from "../../es/src/charts/Plot/pipeline.js";
import accessor from "../../es/src/utils/accessor.js";

// Plot's chart-specific layout runs as pure TransformStages. These tests
// exercise three of them in isolation against a hand-rolled "viz-like"
// object — no Plot instance, no DOM.

const makeViz = (overrides = {}) => {
  // Plot's pipeline reads config fields (stacked, sizeMax, etc.) via
  // `viz.schema.<key>`. Hand-rolled viz stubs populate `schema` alongside
  // the `_<key>` data slots the pipeline uses for non-schema state
  // (`_filteredData`, `_groupBy`).
  const schemaOverrides = overrides.schema || {};
  return {
    _filteredData: [
      {id: "A", x: 0, y: 1},
      {id: "A", x: 1, y: 2},
      {id: "B", x: 0, y: 3},
      {id: "B", x: 1, y: 4},
    ],
    _data: [],
    _ids: (d) => [d.id],
    _drawDepth: 0,
    _groupBy: [accessor("id")],
    _axisPersist: false,
    _aggs: {},
    _confidence: false,
    _time: false,
    _x: accessor("x"),
    _y: accessor("y"),
    _x2: accessor("x2"),
    _y2: accessor("y2"),
    _xConfig: {},
    _x2Config: {},
    _yConfig: {},
    _y2Config: {},
    _baseline: undefined,
    _size: false,
    _margin: {top: 0, right: 0, bottom: 0, left: 0},
    schema: {
      discrete: "x",
      stacked: false,
      shape: () => "Circle",
      xSort: false,
      x2Sort: false,
      ySort: false,
      y2Sort: false,
      xDomain: undefined,
      x2Domain: undefined,
      yDomain: undefined,
      y2Domain: undefined,
      sizeScale: "sqrt",
      sizeMax: 10,
      sizeMin: 5,
      height: 300,
      width: 400,
      ...schemaOverrides,
    },
    ...overrides,
  };
};

it("formatPlotData maps filteredData into PlotDatum + sets time/size flags", () => {
  const viz = makeViz();
  const partial = formatPlotData({viz});

  assert.ok(Array.isArray(partial.plotFormattedData), "formattedData array");
  assert.strictEqual(partial.plotFormattedData.length, 4, "one per row");

  // Each row has the canonical PlotDatum shape.
  const row = partial.plotFormattedData[0];
  assert.strictEqual(row.__d3plus__, true, "tagged");
  assert.strictEqual(row.x, 0);
  assert.strictEqual(row.y, 1);
  assert.strictEqual(row.id, "A", "id from _ids");
  assert.strictEqual(row.shape, "Circle");

  // Time flags written back to viz.
  assert.strictEqual(viz._xTime, false, "no time axis when _time is false");
  assert.strictEqual(viz._yTime, false);

  // sizeScale defaulted to a constant function when _size unset.
  assert.strictEqual(typeof viz._sizeScaleD3, "function");
  assert.strictEqual(viz._sizeScaleD3({}), 5, "default returns sizeMin");

  assert.strictEqual(partial.x2Exists, false);
  assert.strictEqual(partial.y2Exists, false);
});

it("computePlotAxisValues returns sorted/unique per-axis arrays", () => {
  const viz = makeViz();
  const fmt = formatPlotData({viz});
  const partial = computePlotAxisValues({
    viz,
    plotFormattedData: fmt.plotFormattedData,
    plotAxisData: fmt.plotAxisData,
  });

  assert.ok(Array.isArray(partial.xData), "xData array");
  // x values 0,1 across 4 rows → 2 unique values.
  assert.deepStrictEqual(partial.xData.sort(), [0, 1], "x is the discrete axis (unique)");
  // y is the non-discrete axis — extent ordered, includes all values.
  assert.ok(partial.yData.length >= 2, `yData populated (got ${partial.yData.length})`);
});

it("computePlotScales constructs four d3 scale instances + configScales", () => {
  const viz = makeViz();
  const fmt = formatPlotData({viz});
  const av = computePlotAxisValues({
    viz,
    plotFormattedData: fmt.plotFormattedData,
    plotAxisData: fmt.plotAxisData,
  });

  // Build a minimal initial domains for the stage's input (the
  // stacked/non-stacked branch in Plot._draw computes this).
  const initialDomains = {
    x: av.xData,
    x2: av.x2Data,
    y: av.yData,
    y2: av.y2Data,
  };

  const partial = computePlotScales({
    viz,
    plotFormattedData: fmt.plotFormattedData,
    plotAxisData: fmt.plotAxisData,
    plotInitialDomains: initialDomains,
  });

  assert.ok(partial.plotScales, "scales object returned");
  assert.strictEqual(typeof partial.plotScales.x, "function", "x is a d3 scale");
  assert.strictEqual(typeof partial.plotScales.y, "function", "y is a d3 scale");
  assert.strictEqual(typeof partial.plotScales.x2, "function");
  assert.strictEqual(typeof partial.plotScales.y2, "function");

  // configScales returned in the stage's ctx patch.
  assert.strictEqual(partial.plotConfigScales.xConfigScale, "point", "x discrete → point scale");
  assert.strictEqual(typeof partial.plotConfigScales.yConfigScale, "string");

  // Plot opps captured.
  assert.strictEqual(partial.plotOpps.opp, "y", "opp computed");
});
