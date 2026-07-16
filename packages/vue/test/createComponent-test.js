import assert from "assert";
import {JSDOM} from "jsdom";

// Vue's runtime-dom caches `document` at import time, so the DOM globals must
// be installed BEFORE `vue` is imported — hence the dynamic imports here rather
// than static top-level ones.
let createApp, h, nextTick, reactive, createD3plusComponent, D3plusConfigKey;

before(async () => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {url: "http://localhost"});
  global.window = dom.window;
  global.document = dom.window.document;
  ["Element", "SVGElement", "Node", "Event"].forEach(key => { global[key] = dom.window[key]; });
  ({createApp, h, nextTick, reactive} = await import("vue"));
  ({createD3plusComponent, D3plusConfigKey} = await import("../es/src/createComponent.js"));
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

/** Mounts a component into a fresh host, returning app + host. */
function mount(rootComponent, provides) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const app = createApp(rootComponent);
  if (provides) for (const [key, value] of provides) app.provide(key, value);
  app.mount(host);
  return {app, host};
}

it("renders div.<className> > svg and calls config()/render() on mount", () => {
  const {MockViz, state} = makeViz();
  const Comp = createD3plusComponent(MockViz);
  const {app, host} = mount({render: () => h(Comp, {config: {a: 1}})});
  assert.ok(host.querySelector("div.chart"), "wrapper div with default className");
  const svg = host.querySelector("svg");
  assert.ok(svg, "internal svg");
  assert.strictEqual(state.instances, 1, "one instance");
  assert.strictEqual(state.renders, 1, "rendered once");
  assert.strictEqual(state.configs[0].a, 1, "config forwarded");
  assert.strictEqual(state.configs[0].select, svg, "select is the svg");
  app.unmount();
});

it("honors a custom className", () => {
  const {MockViz} = makeViz();
  const Comp = createD3plusComponent(MockViz);
  const {app, host} = mount({render: () => h(Comp, {config: {}, className: "my-chart"})});
  assert.ok(host.querySelector("div.my-chart"), "uses the provided className");
  app.unmount();
});

it("re-renders on reactive config change WITHOUT destroying the instance", async () => {
  const {MockViz, state} = makeViz();
  const Comp = createD3plusComponent(MockViz);
  const store = reactive({config: {a: 1}});
  const {app} = mount({render: () => h(Comp, {config: store.config})});
  assert.strictEqual(state.renders, 1);
  store.config = {a: 2};
  await nextTick();
  assert.strictEqual(state.instances, 1, "reuses the instance");
  assert.strictEqual(state.renders, 2, "re-rendered on change");
  assert.strictEqual(state.destroys, 0, "not destroyed between changes");
  app.unmount();
});

it("does not re-render when the config content is unchanged", async () => {
  const {MockViz, state} = makeViz();
  const Comp = createD3plusComponent(MockViz);
  const store = reactive({config: {a: 1}});
  const {app} = mount({render: () => h(Comp, {config: store.config})});
  store.config = {a: 1};
  await nextTick();
  assert.strictEqual(state.renders, 1, "identical config content is a no-op");
  app.unmount();
});

it("forceUpdate re-renders even when the config is unchanged", async () => {
  const {MockViz, state} = makeViz();
  const Comp = createD3plusComponent(MockViz);
  const store = reactive({config: {a: 1}});
  const {app} = mount({render: () => h(Comp, {config: store.config, forceUpdate: true})});
  store.config = {a: 1};
  await nextTick();
  assert.strictEqual(state.renders, 2, "forceUpdate bypasses config diffing");
  app.unmount();
});

it("destroys the instance on unmount", () => {
  const {MockViz, state} = makeViz();
  const Comp = createD3plusComponent(MockViz);
  const {app} = mount({render: () => h(Comp, {config: {}})});
  app.unmount();
  assert.strictEqual(state.destroys, 1, "destroy() called on unmount");
});

it("routes data + dataFormat to data() and strips them from config", () => {
  const {MockViz, state} = makeViz();
  const Comp = createD3plusComponent(MockViz);
  const fmt = d => d;
  const {app} = mount({render: () => h(Comp, {config: {data: [1, 2], dataFormat: fmt, keep: "yes"}})});
  assert.deepStrictEqual(state.dataArgs, [[1, 2], fmt], "data() got the data + formatter");
  const cfg = state.configs[0];
  assert.ok(!("data" in cfg) && !("dataFormat" in cfg), "data/dataFormat stripped");
  assert.strictEqual(cfg.keep, "yes", "unrelated keys preserved");
  app.unmount();
});

it("merges provided global config ahead of the component config", () => {
  const {MockViz, state} = makeViz();
  const Comp = createD3plusComponent(MockViz);
  const {app} = mount(
    {render: () => h(Comp, {config: {localSetting: "l", shared: "local"}})},
    [[D3plusConfigKey, {globalSetting: "g", shared: "global"}]],
  );
  const cfg = state.configs[0];
  assert.strictEqual(cfg.globalSetting, "g", "global applied");
  assert.strictEqual(cfg.localSetting, "l", "local applied");
  assert.strictEqual(cfg.shared, "local", "local wins on conflict");
  app.unmount();
});
