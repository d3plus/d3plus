import {it} from "vitest";
import assert from "assert";
import {
  BarChart,
  Candlestick,
  configWarnings,
  LinePlot,
  Network,
  ParallelCoordinates,
  Sunburst,
  Treemap,
} from "../../index.ts";
import {
  fieldRows,
  fieldUses,
  MAX_LISTED_FIELDS,
  missingFieldMessage,
  rowFields,
  rowsHaveField,
  warnMissingFields,
} from "../../src/charts/viz/missingFields.ts";
import {captureWarnings} from "~test/helpers.js";

const rows = [
  {year: 2020, value: 10, region: "North"},
  {year: 2021, value: 14},
];

/** A chart configured with `config`, holding `data` as its loaded rows. */
const chart = (Chart, config, data = rows) => {
  const viz = new Chart().config(config);
  viz._data = data;
  return viz;
};

it("fieldUses lists the field names a user gave Plot keys", () => {
  const viz = chart(BarChart, {
    groupBy: ["region", "year"],
    x: "year",
    y: "value",
    x2: "x2",
    y2: d => d.y2,
    size: "size",
    color: "region",
    colorScale: "value",
    time: "year",
    total: "value",
    facet: "region",
    barWidth: "width",
    confidence: [
      ["lo", "hi"],
      ["lo50", false],
    ],
    stackOrder: {value: "share"},
    thresholdKey: "weight",
  });
  const uses = fieldUses(viz).map(({key, field}) => `${key}:${field}`);
  for (const use of [
    "x:year",
    "y:value",
    "x2:x2",
    "size:size",
    "stackOrder:share",
    "confidence:lo",
    "confidence:hi",
    "confidence:lo50",
    "groupBy:region",
    "groupBy:year",
    "color:region",
    "colorScale:value",
    "time:year",
    "total:value",
    "facet:region",
    "barWidth:width",
    "thresholdKey:weight",
  ])
    assert.ok(uses.includes(use), `${use} in ${uses}`);
  assert.ok(!uses.some(u => u.startsWith("y2:")), "a function names no field");
});

it("fieldUses skips defaults, functions, and constants", () => {
  const viz = chart(LinePlot, {label: "region", y: d => d.value});
  assert.deepStrictEqual(fieldUses(viz), []);
  assert.deepStrictEqual(
    fieldUses(new Candlestick()),
    [],
    "default open/close",
  );
});

it("fieldUses names an accessor shared with thresholdKey by its own key", () => {
  const viz = chart(Sunburst, {groupBy: "region", sum: "value"});
  assert.strictEqual(viz.schema.thresholdKey, viz.schema.sum);
  assert.deepStrictEqual(
    fieldUses(viz).filter(u => u.field === "value"),
    [{key: "sum", field: "value"}],
  );
});

it("fieldUses lists chart-specific keys and plain-string field lists", () => {
  const net = chart(Network, {nodeGroupBy: "key", x: "px", size: "weight"});
  const keys = fieldUses(net).map(({key, field}) => `${key}:${field}`);
  assert.deepStrictEqual(
    ["nodeGroupBy:key", "x:px", "size:weight"].filter(u => !keys.includes(u)),
    [],
  );
  const parallel = chart(ParallelCoordinates, {dimensions: ["value", "gdp"]});
  assert.deepStrictEqual(
    fieldUses(parallel).filter(u => u.key === "dimensions"),
    [
      {key: "dimensions", field: "value"},
      {key: "dimensions", field: "gdp"},
    ],
  );
});

it("fieldRows reads the user's rows, nodes, and links", () => {
  const viz = chart(Network, {});
  const nodes = [{id: "a"}];
  const links = [{source: "a", target: "a"}];
  viz.schema.nodes = nodes;
  viz.schema.links = links;
  assert.deepStrictEqual(fieldRows(viz), [rows, nodes, links]);
  const source = [{raw: 1}];
  viz._sourceData = source;
  assert.strictEqual(fieldRows(viz)[0], source, "derived rows give way");
  assert.deepStrictEqual(fieldRows(chart(Treemap, {})), [rows]);
});

it("rowsHaveField finds a field on any row, skipping non-objects", () => {
  assert.strictEqual(rowsHaveField([rows], "region"), true, "sparse field");
  assert.strictEqual(rowsHaveField([[], rows], "year"), true);
  assert.strictEqual(rowsHaveField([rows], "vlaue"), false);
  assert.strictEqual(rowsHaveField([[null, 3, "x"]], "length"), false);
});

it("rowFields lists every field in first-seen order", () => {
  assert.deepStrictEqual(rowFields([rows, [{id: 1, year: 2}], [null]]), [
    "year",
    "value",
    "region",
    "id",
  ]);
});

it("missingFieldMessage names the key and field and lists the fields", () => {
  assert.strictEqual(
    missingFieldMessage("LinePlot", {key: "y", field: "vlaue"}, [
      "year",
      "value",
    ]),
    "LinePlot y: no rows have 'vlaue'; fields are: year, value",
  );
  const many = Array.from({length: MAX_LISTED_FIELDS + 2}, (_, i) => `f${i}`);
  const message = missingFieldMessage("Pie", {key: "value", field: "v"}, many);
  assert.ok(message.endsWith(`f${MAX_LISTED_FIELDS - 1}, …`), message);
  assert.ok(!message.includes(`f${MAX_LISTED_FIELDS},`));
});

it("warnMissingFields warns once per key and field on each chart", () => {
  const viz = chart(LinePlot, {groupBy: "region", x: "year", y: "vlaue"});
  const other = chart(LinePlot, {groupBy: "region", x: "year", y: "vlaue"});
  const message =
    "LinePlot y: no rows have 'vlaue'; fields are: year, value, region";
  const first = captureWarnings(() => {
    warnMissingFields(viz);
    warnMissingFields(viz);
    warnMissingFields(other);
  });
  assert.deepStrictEqual(first, [message, message]);
  const renamed = captureWarnings(() => {
    viz.y("valu");
    warnMissingFields(viz);
    viz.y("value");
    warnMissingFields(viz);
  });
  assert.deepStrictEqual(renamed, [
    "LinePlot y: no rows have 'valu'; fields are: year, value, region",
  ]);
});

it("warnMissingFields stays quiet without rows or warnings", () => {
  const empty = chart(LinePlot, {y: "vlaue"}, []);
  assert.deepStrictEqual(
    captureWarnings(() => warnMissingFields(empty)),
    [],
  );
  const viz = chart(LinePlot, {y: "vlaue"});
  configWarnings(false);
  let warnings;
  try {
    warnings = captureWarnings(() => warnMissingFields(viz));
  } finally {
    configWarnings(true);
  }
  assert.deepStrictEqual(warnings, []);
  assert.strictEqual(
    captureWarnings(() => warnMissingFields(viz)).length,
    1,
    "warns once turned back on",
  );
});
