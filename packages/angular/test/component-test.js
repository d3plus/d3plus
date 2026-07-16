import assert from "assert";
import {JSDOM} from "jsdom";

// Drives the *compiled* component (from the ng-packagr FESM bundle) directly,
// without Angular's renderer/TestBed: the component is a plain class, so we can
// instantiate it, stand in a fake ViewChild ref, and invoke its lifecycle hooks
// to exercise the render wiring. DOM globals must exist before @angular/core is
// imported, hence the dynamic import in `before`.
let D3plusVizComponent;

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

/** Instantiates the component with a fake svg ViewChild and the given inputs. */
function makeComponent(viz, inputs = {}) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const component = new D3plusVizComponent();
  component.svgRef = {nativeElement: svg};
  component.viz = viz;
  Object.assign(component, inputs);
  return {component, svg};
}

before(async () => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {url: "http://localhost"});
  global.window = dom.window;
  global.document = dom.window.document;
  ["Element", "SVGElement", "Node", "Event", "HTMLElement"].forEach(key => { global[key] = dom.window[key]; });
  // The FESM ships partial-compiled (the consumer's Angular Linker finalizes
  // it at build time). Loading it directly here needs the JIT compiler as a
  // fallback, so pull in @angular/compiler before the bundle.
  await import("@angular/compiler");
  ({D3plusVizComponent} = await import("../dist/fesm2022/d3plus-angular.mjs"));
});

it("renders into the svg and forwards config on ngOnInit", () => {
  const {MockViz, state} = makeViz();
  const {component, svg} = makeComponent(MockViz, {config: {a: 1}});
  component.ngOnInit();
  assert.strictEqual(state.instances, 1, "one instance");
  assert.strictEqual(state.renders, 1, "rendered once");
  assert.strictEqual(state.configs[0].a, 1, "config forwarded");
  assert.strictEqual(state.configs[0].select, svg, "select is the svg");
});

it("re-renders on ngOnChanges WITHOUT destroying the instance", () => {
  const {MockViz, state} = makeViz();
  const {component} = makeComponent(MockViz, {config: {a: 1}});
  component.ngOnInit();
  component.config = {a: 2};
  component.ngOnChanges();
  assert.strictEqual(state.instances, 1, "reuses the instance");
  assert.strictEqual(state.renders, 2, "re-rendered");
  assert.strictEqual(state.destroys, 0, "not destroyed between changes");
});

it("does not re-render when the config content is unchanged", () => {
  const {MockViz, state} = makeViz();
  const {component} = makeComponent(MockViz, {config: {a: 1}});
  component.ngOnInit();
  component.config = {a: 1};
  component.ngOnChanges();
  assert.strictEqual(state.renders, 1, "identical config content is a no-op");
});

it("forceUpdate re-renders even when the config is unchanged", () => {
  const {MockViz, state} = makeViz();
  const {component} = makeComponent(MockViz, {config: {a: 1}, forceUpdate: true});
  component.ngOnInit();
  component.ngOnChanges();
  assert.strictEqual(state.renders, 2, "forceUpdate bypasses config diffing");
});

it("routes data + dataFormat to data() and strips them from config", () => {
  const {MockViz, state} = makeViz();
  const fmt = d => d;
  const {component} = makeComponent(MockViz, {config: {data: [1, 2], dataFormat: fmt, keep: "yes"}});
  component.ngOnInit();
  assert.deepStrictEqual(state.dataArgs, [[1, 2], fmt], "data() got the data + formatter");
  const cfg = state.configs[0];
  assert.ok(!("data" in cfg) && !("dataFormat" in cfg), "data/dataFormat stripped");
  assert.strictEqual(cfg.keep, "yes", "unrelated keys preserved");
});

it("merges globalConfig ahead of config", () => {
  const {MockViz, state} = makeViz();
  const {component} = makeComponent(MockViz, {
    globalConfig: {globalSetting: "g", shared: "global"},
    config: {localSetting: "l", shared: "local"},
  });
  component.ngOnInit();
  const cfg = state.configs[0];
  assert.strictEqual(cfg.globalSetting, "g", "global applied");
  assert.strictEqual(cfg.localSetting, "l", "local applied");
  assert.strictEqual(cfg.shared, "local", "local wins on conflict");
});

it("destroys the instance on ngOnDestroy", () => {
  const {MockViz, state} = makeViz();
  const {component} = makeComponent(MockViz, {config: {}});
  component.ngOnInit();
  component.ngOnDestroy();
  assert.strictEqual(state.destroys, 1, "destroy() called on teardown");
});

it("no-ops when the ViewChild svg is not yet resolved", () => {
  const {MockViz, state} = makeViz();
  const component = new D3plusVizComponent();
  component.viz = MockViz;
  component.config = {a: 1};
  // svgRef undefined (first ngOnChanges, before the static query resolves)
  component.ngOnChanges();
  assert.strictEqual(state.instances, 0, "nothing rendered without a target svg");
});
