import assert from "assert";
import {render, closeBrowser} from "../playwright.js";
import {shared, withIO} from "./stubIntersectionObserver.js";
import {
  syncUnloadObserver,
  vizReload,
} from "../../es/src/charts/viz/vizVisibility.js";

function mockViz(over = {}) {
  const calls = [];
  const el = {};
  const viz = {
    calls,
    schema: {detectVisible: true, detectVisibleUnload: true, scrollContainer: null},
    _select: {
      node: () => el,
      selectAll: () => ({remove: () => calls.push("table")}),
    },
    _tooltipClass: {data: () => ({render: () => calls.push("tooltip")})},
    _sceneRenderer: {destroy: () => calls.push("renderer")},
    render: () => calls.push("render"),
    ...over,
  };
  return {el, viz};
}

it(
  "visibility unload: unloads on exit, keeps the svg, reloads instantly on enter",
  withIO(() => {
    const {el, viz} = mockViz();
    syncUnloadObserver(viz);
    const io = shared();
    io.fire(el, false);
    assert.strictEqual(viz._unloaded, true);
    assert.strictEqual(viz._sceneRenderer, undefined);
    assert.deepStrictEqual(viz.calls, ["tooltip", "renderer", "table"]);
    io.fire(el, true);
    assert.strictEqual(viz._unloaded, false);
    assert.strictEqual(viz._instantNextDraw, true);
    assert.strictEqual(viz._forceVisible, true);
    assert.strictEqual(viz.calls.at(-1), "render");
    viz._unloadUnobserve();
  }),
);

it(
  "visibility unload: ignores enter when loaded and exit when already unloaded",
  withIO(() => {
    const {el, viz} = mockViz();
    syncUnloadObserver(viz);
    const io = shared();
    io.fire(el, true);
    assert.ok(!viz.calls.includes("render"));
    io.fire(el, false);
    io.fire(el, false);
    assert.strictEqual(viz.calls.filter(c => c === "renderer").length, 1);
    vizReload(viz);
    vizReload(viz);
    assert.strictEqual(viz.calls.filter(c => c === "render").length, 1);
    viz._unloadUnobserve();
  }),
);

it(
  "visibility unload: only observes when detectVisible and detectVisibleUnload are on",
  withIO(() => {
    const {viz} = mockViz();
    viz.schema.detectVisibleUnload = false;
    syncUnloadObserver(viz);
    assert.strictEqual(viz._unloadUnobserve, undefined);
    viz.schema.detectVisibleUnload = true;
    syncUnloadObserver(viz);
    assert.strictEqual(typeof viz._unloadUnobserve, "function");
    viz.schema.detectVisibleUnload = false;
    syncUnloadObserver(viz);
    assert.strictEqual(viz._unloadUnobserve, undefined);
  }),
);

it("visibility unload: is on by default and can be turned off", async () => {
  const result = await render("", () => {
    const viz = new window.d3plus.Treemap();
    const initial = viz.detectVisibleUnload();
    viz.detectVisibleUnload(false);
    return {initial, detectVisible: viz.detectVisible(), off: viz.detectVisibleUnload()};
  });
  assert.deepStrictEqual(result, {initial: true, detectVisible: true, off: false});
});

after(closeBrowser);
