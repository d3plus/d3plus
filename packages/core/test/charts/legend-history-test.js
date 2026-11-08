import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {Treemap} from "../../index.ts";
import {
  dropLegendHistory,
  goBack,
  isLegendEntry,
  latestDrillEntry,
  legendSnapshot,
  recordLegendChange,
  removeLatestDrillEntry,
  restoreLegendEntry,
  sameLegendIds,
  takeLegendState,
} from "../../internal.ts";

useJsdom();

const drill = (depth = 0) => ({depth, filter: undefined});
const legend = (hidden = [], solo = []) => ({kind: "legend", hidden, solo});

/** A chart stand-in for the history helpers and goBack. */
function mockViz(extra = {}) {
  const log = {renders: 0, config: []};
  const viz = {
    log,
    schema: {legendHistory: true},
    _hidden: [],
    _solo: [],
    _history: [],
    _drawDepth: 1,
    render() {
      log.renders++;
      return viz;
    },
    config(cfg) {
      log.config.push(cfg);
      return viz;
    },
    ...extra,
  };
  return viz;
}

it("legend history: isLegendEntry tells legend entries from drill-downs", () => {
  assert.strictEqual(isLegendEntry(legend()), true);
  assert.strictEqual(isLegendEntry(drill()), false);
  assert.strictEqual(isLegendEntry({kind: "drill", depth: 0}), false);
});

it("legend history: latestDrillEntry skips legend entries", () => {
  const a = drill(0);
  const b = drill(1);
  assert.strictEqual(latestDrillEntry(undefined), undefined);
  assert.strictEqual(latestDrillEntry([]), undefined);
  assert.strictEqual(latestDrillEntry([legend()]), undefined);
  assert.strictEqual(latestDrillEntry([a, legend(), b, legend()]), b);
});

it("legend history: removeLatestDrillEntry takes out only the newest drill-down", () => {
  const a = drill(0);
  const b = drill(1);
  const l1 = legend(["x"]);
  const l2 = legend(["y"]);
  const history = [a, l1, b, l2];
  assert.strictEqual(removeLatestDrillEntry(history), b);
  assert.deepStrictEqual(history, [a, l1, l2]);
  assert.strictEqual(removeLatestDrillEntry(history), a);
  assert.deepStrictEqual(history, [l1, l2]);
  assert.strictEqual(removeLatestDrillEntry(history), undefined);
  assert.deepStrictEqual(history, [l1, l2]);
  assert.strictEqual(removeLatestDrillEntry(undefined), undefined);
});

it("legend history: sameLegendIds ignores order", () => {
  assert.strictEqual(sameLegendIds([], []), true);
  assert.strictEqual(sameLegendIds(["a", 1], [1, "a"]), true);
  assert.strictEqual(sameLegendIds(["a"], ["a", "b"]), false);
  assert.strictEqual(sameLegendIds(["a", "b"], ["a", "c"]), false);
});

it("legend history: legendSnapshot copies the hide/solo state", () => {
  const viz = mockViz({_hidden: ["a"], _solo: ["b"]});
  const snap = legendSnapshot(viz);
  assert.deepStrictEqual(snap, legend(["a"], ["b"]));
  viz._hidden.push("c");
  assert.deepStrictEqual(snap.hidden, ["a"], "a copy, not the live array");
});

it("legend history: recordLegendChange pushes only a change, and only when legendHistory is on", () => {
  const viz = mockViz();
  const before = legendSnapshot(viz);
  assert.strictEqual(recordLegendChange(viz, before), false, "no change");
  assert.strictEqual(viz._history.length, 0);
  viz._hidden = ["a"];
  assert.strictEqual(recordLegendChange(viz, before), true);
  assert.deepStrictEqual(viz._history, [legend()]);

  const off = mockViz({schema: {legendHistory: false}, _history: undefined});
  const start = legendSnapshot(off);
  off._solo = ["a"];
  assert.strictEqual(recordLegendChange(off, start), false);
  assert.strictEqual(off._history, undefined);

  const fresh = mockViz({_history: undefined});
  const s = legendSnapshot(fresh);
  fresh._solo = ["a"];
  recordLegendChange(fresh, s);
  assert.deepStrictEqual(fresh._history, [legend()]);
});

it("legend history: restoreLegendEntry puts back copies of the recorded state", () => {
  const viz = mockViz({_hidden: ["x"], _solo: ["y"]});
  const entry = legend(["a"], []);
  restoreLegendEntry(viz, entry);
  assert.deepStrictEqual(viz._hidden, ["a"]);
  assert.deepStrictEqual(viz._solo, []);
  viz._hidden.push("b");
  assert.deepStrictEqual(entry.hidden, ["a"]);
});

it("legend history: takeLegendState clears the legend and returns what it cleared", () => {
  const viz = mockViz();
  assert.strictEqual(takeLegendState(viz), undefined, "nothing to clear");
  viz._hidden = ["a"];
  viz._solo = ["b"];
  assert.deepStrictEqual(takeLegendState(viz), {hidden: ["a"], solo: ["b"]});
  assert.deepStrictEqual(viz._hidden, []);
  assert.deepStrictEqual(viz._solo, []);
});

it("legend history: dropLegendHistory keeps the drill-downs, without their legend state", () => {
  const a = drill(0);
  const b = {...drill(1), legend: {hidden: ["x"], solo: []}};
  const viz = mockViz({_history: [legend(), a, legend(["x"]), b]});
  dropLegendHistory(viz);
  assert.deepStrictEqual(viz._history, [a, drill(1)]);
  const none = mockViz({_history: undefined});
  dropLegendHistory(none);
  assert.strictEqual(none._history, undefined);
});

it("legend history: goBack restores a legend entry, then a drill-down", () => {
  const filter = () => true;
  const viz = mockViz({
    _hidden: ["b"],
    _solo: [],
    _history: [{depth: 0, filter}, legend(["a"], [])],
  });
  goBack(viz);
  assert.deepStrictEqual(viz._hidden, ["a"]);
  assert.strictEqual(viz.log.renders, 1);
  assert.strictEqual(viz.log.config.length, 0, "the view stays");
  goBack(viz);
  assert.deepStrictEqual(viz.log.config, [{depth: 0, filter}]);
  assert.deepStrictEqual(viz._hidden, ["a"], "a drill-down leaves the legend");
  assert.strictEqual(viz._history.length, 0);
});

it("legend history: goBack puts back the legend state a drill-down cleared", () => {
  const viz = mockViz({
    _history: [{...drill(0), legend: {hidden: [], solo: ["c"]}}],
  });
  goBack(viz);
  assert.deepStrictEqual(viz._solo, ["c"]);
  assert.deepStrictEqual(viz._hidden, []);
  assert.deepStrictEqual(viz.log.config, [{depth: 0, filter: undefined}]);
});

it("legend history: new data drops the legend entries with the legend state", () => {
  const viz = new Treemap();
  const a = drill(0);
  viz._history = [a, legend(["x"])];
  viz._hidden = ["y"];
  viz.data([{id: "a", value: 1}]);
  assert.deepStrictEqual(viz._history, [a]);
  assert.deepStrictEqual(viz._hidden, []);
});

it("legend history: legendHistory defaults to true", () => {
  const viz = new Treemap();
  assert.strictEqual(viz.legendHistory(), true);
  assert.strictEqual(viz.legendHistory(false).legendHistory(), false);
  assert.strictEqual(viz.config({legendHistory: true}).legendHistory(), true);
});
