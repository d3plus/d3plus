import assert from "assert";
import {JSDOM} from "jsdom";

// The base class evaluates `class extends HTMLElement` at module-load time, so
// the DOM globals must exist BEFORE it is imported — hence the dynamic import
// inside `before` rather than a static top-level import.
let D3plusElement, setGlobalConfig;
let tagCounter = 0;

/**
    Registers a fresh subclass (new tag each call, so custom-element
    registration never collides), instantiating a tracking mock viz. Returns
    the element plus the recorded state.
*/
function makeElement({data = false} = {}) {
  const state = {instances: 0, configs: [], renders: 0, destroys: 0, dataArgs: null};
  class MockViz {
    constructor() { state.instances++; }
    config(c) { state.configs.push(c); return this; }
    render(cb) { state.renders++; if (cb) cb(); return this; }
    destroy() { state.destroys++; }
    data(d, f) { state.dataArgs = [d, f]; }
  }
  if (!data) delete MockViz.prototype.data;
  const tag = `d3plus-mock-${tagCounter++}`;
  const cls = class extends D3plusElement {};
  cls.viz = MockViz;
  customElements.define(tag, cls);
  const el = document.createElement(tag);
  return {el, state, tag};
}

before(async () => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {url: "http://localhost"});
  global.window = dom.window;
  global.document = dom.window.document;
  ["HTMLElement", "Element", "SVGElement", "Node", "customElements", "CustomEvent", "Event"]
    .forEach(key => { global[key] = dom.window[key]; });
  ({D3plusElement, setGlobalConfig} = await import("../es/src/D3plusElement.js"));
});

it("renders an <svg> and calls config()/render() on connect", () => {
  const {el, state} = makeElement();
  el.config = {a: 1};
  document.body.appendChild(el);
  assert.ok(el.querySelector("svg"), "creates an internal svg");
  assert.strictEqual(state.instances, 1, "instantiates the viz once");
  assert.strictEqual(state.renders, 1, "renders once on connect");
  assert.strictEqual(state.configs[0].a, 1, "forwards the config");
});

it("passes the element's own <svg> as the `select` config", () => {
  const {el, state} = makeElement();
  document.body.appendChild(el);
  assert.strictEqual(state.configs[0].select, el.querySelector("svg"), "select is the element's svg");
});

it("destroys the instance and removes the svg on disconnect", () => {
  const {el, state} = makeElement();
  document.body.appendChild(el);
  el.remove();
  assert.strictEqual(state.destroys, 1, "destroy() called on disconnect");
  assert.strictEqual(el.querySelector("svg"), null, "svg removed");
});

it("re-renders on config change WITHOUT a new instance or destroy (so it can tween)", () => {
  const {el, state} = makeElement();
  el.config = {a: 1};
  document.body.appendChild(el);
  el.config = {a: 2};
  assert.strictEqual(state.instances, 1, "reuses the single instance");
  assert.strictEqual(state.renders, 2, "re-renders on the change");
  assert.strictEqual(state.destroys, 0, "does not destroy between config changes");
});

it("does not re-render when the config is structurally unchanged", () => {
  const {el, state} = makeElement();
  el.config = {a: 1};
  document.body.appendChild(el);
  el.config = {a: 1};
  assert.strictEqual(state.renders, 1, "identical config content is a no-op");
});

it("diffs function-valued config by source", () => {
  const {el, state} = makeElement();
  el.config = {x: d => d.a};
  document.body.appendChild(el);
  el.config = {x: d => d.a};
  assert.strictEqual(state.renders, 1, "identical function source does not re-render");
  el.config = {x: d => d.b};
  assert.strictEqual(state.renders, 2, "changed function source re-renders");
});

it("forceUpdate bypasses config diffing", () => {
  const {el, state} = makeElement();
  el.forceUpdate = true;
  el.config = {a: 1};
  document.body.appendChild(el);
  el.config = {a: 1};
  assert.strictEqual(state.renders, 2, "renders again despite unchanged config");
});

it("routes data + dataFormat to data() and strips them from the config payload", () => {
  const {el, state} = makeElement({data: true});
  const fmt = d => d;
  el.config = {data: [1, 2], dataFormat: fmt, keep: "yes"};
  document.body.appendChild(el);
  assert.deepStrictEqual(state.dataArgs, [[1, 2], fmt], "data() receives the data + formatter");
  const cfg = state.configs[0];
  assert.ok(!("data" in cfg) && !("dataFormat" in cfg), "data/dataFormat stripped");
  assert.strictEqual(cfg.keep, "yes", "unrelated keys preserved");
});

it("merges the global config ahead of the element config", () => {
  setGlobalConfig({globalSetting: "g", shared: "global"});
  const {el, state} = makeElement();
  el.config = {localSetting: "l", shared: "local"};
  document.body.appendChild(el);
  const cfg = state.configs[0];
  assert.strictEqual(cfg.globalSetting, "g", "global applied");
  assert.strictEqual(cfg.localSetting, "l", "local applied");
  assert.strictEqual(cfg.shared, "local", "element config wins on conflict");
  setGlobalConfig({});
});

it("re-renders with a fresh instance when reconnected", () => {
  const {el, state} = makeElement();
  el.config = {a: 1};
  document.body.appendChild(el);
  el.remove();
  document.body.appendChild(el);
  assert.strictEqual(state.instances, 2, "rebuilds the instance on reconnect");
  assert.ok(el.querySelector("svg"), "recreates the svg");
});
