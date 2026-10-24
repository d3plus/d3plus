import {afterEach, it, vi} from "vitest";
import assert from "assert";
import {
  dataSignature,
  isPollable,
  onDataPollingIntervalSet,
  pollPaths,
  recordDataSignature,
  stopDataPolling,
  syncDataPolling,
} from "../../src/charts/viz/vizDataPolling.ts";

afterEach(() => vi.restoreAllMocks());

/** A minimal drawn-chart stand-in for the polling helpers. */
function fakeViz(over = {}) {
  return {
    schema: {dataPollingInterval: 1000, detectVisible: false},
    _userData: "data.json",
    _queue: [],
    _select: {node: () => ({ownerDocument: undefined})},
    _sceneRenderer: {},
    ...over,
  };
}

it("isPollable: URLs, request objects and Arrays holding one are polled", () => {
  assert.strictEqual(isPollable("data.json"), true);
  assert.strictEqual(isPollable({url: "data.json", headers: {}}), true);
  assert.strictEqual(isPollable([[{id: 1}], "more.json"]), true);
  assert.strictEqual(isPollable([{id: 1}]), false);
  assert.strictEqual(isPollable([{id: 1, url: "x"}]), false);
  assert.strictEqual(isPollable(undefined), false);
});

it("pollPaths: revalidates each request unless it sets its own cache mode", () => {
  const rows = [{id: 1}];
  assert.deepStrictEqual(pollPaths("a.json"), [
    {url: "a.json", cache: "no-cache"},
  ]);
  assert.deepStrictEqual(
    pollPaths([
      rows,
      {url: "b.json", headers: {A: "1"}},
      {url: "c.json", cache: "reload"},
    ]),
    [
      rows,
      {url: "b.json", headers: {A: "1"}, cache: "no-cache"},
      {url: "c.json", cache: "reload"},
    ],
  );
});

it("dataSignature: equal data matches, any change differs", () => {
  const a = [{id: "x", value: 1}];
  assert.strictEqual(dataSignature(a), dataSignature([{id: "x", value: 1}]));
  assert.notStrictEqual(dataSignature(a), dataSignature([{id: "x", value: 2}]));
  assert.notStrictEqual(dataSignature(a), dataSignature([{id: "y", value: 1}]));
  assert.match(dataSignature(a), /^\d+:[0-9a-z]+$/);
  assert.strictEqual(
    dataSignature(undefined),
    "0:" + (0x811c9dc5).toString(36),
  );
});

it("recordDataSignature: stores a fingerprint only while polling is on", () => {
  const viz = fakeViz();
  recordDataSignature(viz, [{a: 1}]);
  assert.strictEqual(viz._dataSignature, dataSignature([{a: 1}]));
  viz.schema.dataPollingInterval = false;
  recordDataSignature(viz, [{a: 1}]);
  assert.strictEqual(viz._dataSignature, undefined);
});

it("syncDataPolling: starts once, keeps a matching poll, restarts on change, stops when off", () => {
  vi.useFakeTimers();
  try {
    const viz = fakeViz();
    syncDataPolling(viz);
    const first = viz._dataPollStop;
    assert.strictEqual(typeof first, "function");
    syncDataPolling(viz);
    assert.strictEqual(viz._dataPollStop, first, "a redraw keeps the poll");
    viz.schema.dataPollingInterval = 500;
    syncDataPolling(viz);
    assert.notStrictEqual(viz._dataPollStop, first, "a new interval restarts");
    assert.strictEqual(vi.getTimerCount(), 1, "the old timer is cleared");
    viz.schema.dataPollingInterval = false;
    syncDataPolling(viz);
    assert.strictEqual(viz._dataPollStop, undefined);
    assert.strictEqual(vi.getTimerCount(), 0);
  } finally {
    vi.useRealTimers();
  }
});

it("syncDataPolling: never polls rows or server renders, and warns once about rows", () => {
  vi.useFakeTimers();
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  try {
    const ssr = fakeViz({_ssr: true});
    syncDataPolling(ssr);
    assert.strictEqual(ssr._dataPollStop, undefined);
    class RowsChart {}
    const rows = Object.assign(
      new RowsChart(),
      fakeViz({_userData: [{id: 1}]}),
    );
    syncDataPolling(rows);
    syncDataPolling(rows);
    assert.strictEqual(rows._dataPollStop, undefined);
    assert.strictEqual(vi.getTimerCount(), 0);
    assert.strictEqual(
      warn.mock.calls.filter(c => /RowsChart: dataPollingInterval/.test(c[0]))
        .length,
      1,
    );
  } finally {
    vi.useRealTimers();
  }
});

it("onDataPollingIntervalSet: waits for the first draw, then applies changes", () => {
  vi.useFakeTimers();
  try {
    const undrawn = fakeViz({_sceneRenderer: undefined});
    onDataPollingIntervalSet(undrawn);
    assert.strictEqual(undrawn._dataPollStop, undefined);
    const loading = fakeViz({_queue: [[null, "data.json", undefined, "data"]]});
    onDataPollingIntervalSet(loading);
    assert.strictEqual(loading._dataPollStop, undefined);
    const drawn = fakeViz();
    onDataPollingIntervalSet(drawn);
    assert.strictEqual(typeof drawn._dataPollStop, "function");
    drawn.schema.dataPollingInterval = false;
    onDataPollingIntervalSet(drawn);
    assert.strictEqual(drawn._dataPollStop, undefined);
    stopDataPolling(drawn);
    assert.strictEqual(vi.getTimerCount(), 0);
  } finally {
    vi.useRealTimers();
  }
});
