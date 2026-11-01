import {it} from "vitest";
import assert from "assert";
import {
  FORMAT_KEYS,
  formatPayload,
  formatterFor,
  isFormatKey,
  loaderFormatFields,
  queuedFormatter,
  setLoaderValue,
  storePayload,
  syncLoaderFormats,
} from "../../src/charts/viz/loaderFormat.ts";

/** A minimal chart stand-in: a `_data` slot, a schema, a queue and config(). */
function fakeViz(over = {}) {
  const configs = [];
  return {
    _data: [],
    _queue: [],
    schema: {},
    configs,
    config(c) {
      configs.push(c);
      return this;
    },
    ...over,
  };
}

const double = rows => rows.map(d => ({...d, value: d.value * 2}));

it("FORMAT_KEYS / isFormatKey: the four loaders with a *Format key", () => {
  assert.deepStrictEqual(
    [...FORMAT_KEYS],
    ["data", "links", "nodes", "topojson"],
  );
  for (const key of FORMAT_KEYS) assert.strictEqual(isFormatKey(key), true);
  assert.strictEqual(isFormatKey("fitObject"), false);
  assert.strictEqual(isFormatKey("dataFormat"), false);
});

it("formatterFor: reads <key>Format, ignoring anything but a function", () => {
  const viz = fakeViz({schema: {dataFormat: double, linksFormat: "nope"}});
  assert.strictEqual(formatterFor(viz, "data"), double);
  assert.strictEqual(formatterFor(viz, "links"), undefined);
  assert.strictEqual(formatterFor(viz, "nodes"), undefined);
});

it("formatPayload: passes through without a formatter, else runs it", () => {
  const viz = fakeViz();
  const rows = [{value: 1}];
  assert.strictEqual(formatPayload(viz, "data", rows, undefined), rows);
  assert.deepStrictEqual(formatPayload(viz, "data", rows, double), [
    {value: 2},
  ]);
  assert.deepStrictEqual(
    formatPayload(viz, "links", rows, () => null),
    [],
    "an empty result becomes []",
  );
});

it("formatPayload: a data formatter returning {data, ...config} applies the config", () => {
  const viz = fakeViz();
  const out = formatPayload(viz, "data", {rows: [{value: 1}]}, json => ({
    data: json.rows,
    title: "Loaded",
  }));
  assert.deepStrictEqual(out, [{value: 1}]);
  assert.deepStrictEqual(viz.configs, [{title: "Loaded"}]);
  const topo = {type: "Topology"};
  assert.strictEqual(
    formatPayload(viz, "topojson", {}, () => topo),
    topo,
    "only data treats an object as config",
  );
  assert.strictEqual(viz.configs.length, 1);
});

it("storePayload: a _<key> slot when the chart has one, else the schema", () => {
  const viz = fakeViz();
  storePayload(viz, "data", [1]);
  storePayload(viz, "links", [2]);
  assert.deepStrictEqual(viz._data, [1]);
  assert.deepStrictEqual(viz.schema.links, [2]);
  assert.ok(!("data" in viz.schema));
});

it("setLoaderValue: stores inline values, queues URLs, and records the source", () => {
  const viz = fakeViz();
  const rows = [{value: 1}];
  setLoaderValue(viz, "data", [rows]);
  assert.strictEqual(viz._data, rows);
  assert.deepStrictEqual(viz._loaders.data, {source: rows, applied: undefined});
  setLoaderValue(viz, "links", ["links.json"]);
  assert.strictEqual(viz._queue.length, 1);
  assert.strictEqual(viz._queue[0][3], "links");
  assert.strictEqual(viz._queue[0][2], undefined, "no formatter is queued");
});

it("setLoaderValue: a second argument sets <key>Format, one argument keeps it", () => {
  const viz = fakeViz();
  setLoaderValue(viz, "data", ["a.json", double]);
  assert.strictEqual(viz.schema.dataFormat, double);
  setLoaderValue(viz, "data", ["b.json"]);
  assert.strictEqual(viz.schema.dataFormat, double, "kept");
  setLoaderValue(viz, "data", ["c.json", undefined]);
  assert.strictEqual(
    viz.schema.dataFormat,
    undefined,
    "an explicit undefined clears",
  );
});

it("syncLoaderFormats: formats inline values once, from the value given", () => {
  const rows = [{value: 1}];
  const viz = fakeViz({schema: {dataFormat: double}});
  setLoaderValue(viz, "data", [rows]);
  syncLoaderFormats(viz);
  assert.deepStrictEqual(viz._data, [{value: 2}]);
  syncLoaderFormats(viz);
  assert.deepStrictEqual(viz._data, [{value: 2}], "not formatted twice");
  viz.schema.dataFormat = rows => rows.map(d => ({value: d.value + 10}));
  syncLoaderFormats(viz);
  assert.deepStrictEqual(viz._data, [{value: 11}], "re-runs from the source");
  viz.schema.dataFormat = undefined;
  syncLoaderFormats(viz);
  assert.strictEqual(viz._data, rows, "clearing restores the source");
  assert.strictEqual(viz._queue.length, 0, "inline values never queue");
});

it("syncLoaderFormats: re-queues a loaded URL whose formatter changed", () => {
  const viz = fakeViz();
  setLoaderValue(viz, "data", ["a.json"]);
  syncLoaderFormats(viz);
  assert.strictEqual(viz._queue.length, 1, "the first load stays queued");
  queuedFormatter(viz, "data", undefined);
  viz._queue = [];
  syncLoaderFormats(viz);
  assert.strictEqual(viz._queue.length, 0, "an unchanged formatter skips");
  viz.schema.dataFormat = double;
  syncLoaderFormats(viz);
  assert.strictEqual(viz._queue.length, 1);
  assert.deepStrictEqual(viz._queue[0][1], ["a.json"]);
  assert.strictEqual(viz._queue[0][3], "data");
});

it("syncLoaderFormats: a chart with no loader set does nothing", () => {
  const viz = fakeViz({schema: {dataFormat: double}});
  syncLoaderFormats(viz);
  assert.deepStrictEqual(viz._data, []);
  assert.strictEqual(viz._queue.length, 0);
});

it("queuedFormatter: the current <key>Format for loaders, the queued one otherwise", () => {
  const viz = fakeViz({schema: {dataFormat: double}});
  const queued = () => [];
  setLoaderValue(viz, "data", ["a.json"]);
  assert.strictEqual(queuedFormatter(viz, "data", queued), double);
  assert.strictEqual(viz._loaders.data.applied, double, "recorded as applied");
  assert.strictEqual(queuedFormatter(viz, "fitObject", queued), queued);
  assert.strictEqual(queuedFormatter(viz, "links", queued), undefined);
});

it("loaderFormatFields: a <key>Format field per loader; topojsonFormat re-fits", () => {
  const fields = loaderFormatFields("links", "nodes", "topojson");
  assert.deepStrictEqual(
    fields.map(f => f.key),
    ["linksFormat", "nodesFormat", "topojsonFormat"],
  );
  assert.strictEqual(fields[0].onSet, undefined);
  const viz = {_zoomSet: true};
  fields[2].onSet(viz, () => ({}));
  assert.strictEqual(viz._zoomSet, false);
});
