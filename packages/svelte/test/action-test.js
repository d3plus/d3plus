import assert from "assert";
import {JSDOM} from "jsdom";
import {d3plus} from "../es/index.js";

before(() => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {url: "http://localhost"});
  global.window = dom.window;
  global.document = dom.window.document;
  ["Element", "SVGElement", "Node", "Event"].forEach(key => { global[key] = dom.window[key]; });
});

/** A tracking mock visualization class plus the state it records. */
function makeViz() {
  const state = {instances: 0, configs: [], renders: 0, destroys: 0, dataArgs: null};
  class MockViz {
    constructor() { state.instances++; }
    config(c) { state.configs.push(c); return this; }
    render(cb) { state.renders++; if (cb) cb(); return this; }
    destroy() { state.destroys++; }
    data(d, f) { state.dataArgs = [d, f]; }
  }
  return {MockViz, state};
}

it("creates an <svg> in the node and calls config()/render()", () => {
  const {MockViz, state} = makeViz();
  const node = document.createElement("div");
  d3plus(node, {constructor: MockViz, config: {a: 1}});
  assert.ok(node.querySelector("svg"), "svg created inside the node");
  assert.strictEqual(state.instances, 1, "one instance");
  assert.strictEqual(state.renders, 1, "rendered once");
  assert.strictEqual(state.configs[0].a, 1, "config forwarded");
  assert.strictEqual(state.configs[0].select, node.querySelector("svg"), "select is the svg");
});

it("update() re-renders the same instance without destroying it", () => {
  const {MockViz, state} = makeViz();
  const node = document.createElement("div");
  const action = d3plus(node, {constructor: MockViz, config: {a: 1}});
  action.update({constructor: MockViz, config: {a: 2}});
  assert.strictEqual(state.instances, 1, "reuses the instance");
  assert.strictEqual(state.renders, 2, "re-rendered");
  assert.strictEqual(state.destroys, 0, "not destroyed between updates");
});

it("update() with structurally-unchanged config is a no-op", () => {
  const {MockViz, state} = makeViz();
  const node = document.createElement("div");
  const action = d3plus(node, {constructor: MockViz, config: {a: 1}});
  action.update({constructor: MockViz, config: {a: 1}});
  assert.strictEqual(state.renders, 1, "identical config content does not re-render");
});

it("update() diffs function-valued config by source", () => {
  const {MockViz, state} = makeViz();
  const node = document.createElement("div");
  const action = d3plus(node, {constructor: MockViz, config: {x: d => d.a}});
  action.update({constructor: MockViz, config: {x: d => d.a}});
  assert.strictEqual(state.renders, 1, "same function source no-ops");
  action.update({constructor: MockViz, config: {x: d => d.b}});
  assert.strictEqual(state.renders, 2, "changed function source re-renders");
});

it("forceUpdate re-renders even when the config is unchanged", () => {
  const {MockViz, state} = makeViz();
  const node = document.createElement("div");
  const action = d3plus(node, {constructor: MockViz, config: {a: 1}, forceUpdate: true});
  action.update({constructor: MockViz, config: {a: 1}, forceUpdate: true});
  assert.strictEqual(state.renders, 2, "forceUpdate bypasses config diffing");
});

it("routes data + dataFormat to data() and strips them from config", () => {
  const {MockViz, state} = makeViz();
  const node = document.createElement("div");
  const fmt = d => d;
  d3plus(node, {constructor: MockViz, config: {data: [1, 2], dataFormat: fmt, keep: "yes"}});
  assert.deepStrictEqual(state.dataArgs, [[1, 2], fmt], "data() got the data + formatter");
  const cfg = state.configs[0];
  assert.ok(!("data" in cfg) && !("dataFormat" in cfg), "data/dataFormat stripped");
  assert.strictEqual(cfg.keep, "yes", "unrelated keys preserved");
});

it("destroy() disposes the instance and removes the svg", () => {
  const {MockViz, state} = makeViz();
  const node = document.createElement("div");
  const action = d3plus(node, {constructor: MockViz, config: {}});
  action.destroy();
  assert.strictEqual(state.destroys, 1, "destroy() called");
  assert.strictEqual(node.querySelector("svg"), null, "svg removed");
});

it("swapping the constructor rebuilds the instance", () => {
  const a = makeViz(), b = makeViz();
  const node = document.createElement("div");
  const action = d3plus(node, {constructor: a.MockViz, config: {}});
  action.update({constructor: b.MockViz, config: {}});
  assert.strictEqual(a.state.destroys, 1, "old instance destroyed on swap");
  assert.strictEqual(b.state.instances, 1, "new instance created");
});

it("merges globalConfig ahead of config", () => {
  const {MockViz, state} = makeViz();
  const node = document.createElement("div");
  d3plus(node, {
    constructor: MockViz,
    globalConfig: {globalSetting: "g", shared: "global"},
    config: {localSetting: "l", shared: "local"},
  });
  const cfg = state.configs[0];
  assert.strictEqual(cfg.globalSetting, "g", "global applied");
  assert.strictEqual(cfg.localSetting, "l", "local applied");
  assert.strictEqual(cfg.shared, "local", "local wins on conflict");
});
