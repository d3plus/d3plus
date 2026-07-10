import assert from "assert";
import it from "../jsdom.js";
import {computePlotAxisValues, computePlotInitialDomains, formatPlotData} from "../../es/src/charts/Plot/pipeline.js";
import accessor from "../../es/src/utils/accessor.js";
import {resolveStackOrder, stackOffsetDiverging} from "../../es/src/charts/Plot/stackHelpers.js";

// Drives Plot's real stacking pipeline (format → axis values → initial
// domains) against a hand-rolled viz stub, so the ordering path is exercised
// exactly as it runs in a chart — no Plot instance, no DOM.
const makeStackedViz = (data, stackOrder) => ({
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
  _stackOrder: resolveStackOrder(stackOrder),
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

// Runs the three pipeline stages and returns the initial-domains ctx patch.
const runStack = (data, stackOrder) => {
  const viz = makeStackedViz(data, stackOrder);
  const fmt = formatPlotData({viz});
  const av = computePlotAxisValues({viz, ...fmt});
  return computePlotInitialDomains({viz, ...fmt, ...av});
};

// "low"/"high" series across two discrete positions.
const rows = x => [
  {id: "low",  x, y: 1},
  {id: "high", x, y: 9},
];
const intData = [...rows(2000), ...rows(2001)];
const strData = [...rows("2000"), ...rows("2001")];

it("charts/stackOrdering honors an explicit key order with an integer x axis (#527)", () => {
  // The original bug: custom stack ordering was ignored when x was numeric.
  const partial = runStack(intData, ["high", "low"]);
  assert.deepStrictEqual(partial.plotStackKeys, ["high", "low"], "explicit order applied");
});

it("charts/stackOrdering gives the same order for integer and string x axes", () => {
  const asInt = runStack(intData, ["high", "low"]);
  const asStr = runStack(strData, ["high", "low"]);
  assert.deepStrictEqual(
    asInt.plotStackKeys,
    asStr.plotStackKeys,
    "x data type does not affect stack order",
  );
});

it("charts/stackOrdering builds a valid, finite stack from an integer x axis", () => {
  const partial = runStack(intData, ["high", "low"]);
  // All-positive series stack from a zero baseline; each x totals 1 + 9 = 10.
  assert.deepStrictEqual(partial.plotInitialDomains.y, [0, 10], "y domain spans the stack");
  assert.ok(partial.plotStackData.length > 0, "stack data produced");
  assert.ok(
    partial.plotStackData.every(s => s.every(p => Number.isFinite(p[0]) && Number.isFinite(p[1]))),
    "no NaN coordinates",
  );
});

it("charts/stackOrdering default 'descending' puts the largest-total series on the bottom", () => {
  // "high" totals 18, "low" totals 3 → high sits on the zero baseline.
  const partial = runStack(intData, "descending");
  const high = partial.plotStackData.find(s => s.key === "high");
  assert.ok(high, "high series present");
  assert.ok(high.every(p => p[0] === 0), "largest-total series anchored at the baseline");
});
