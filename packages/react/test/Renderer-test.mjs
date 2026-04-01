import assert from "assert";
import {JSDOM} from "jsdom";
import React, {act} from "react";
import {createRoot} from "react-dom/client";
import Renderer from "../es/src/Renderer.jsx";

// Set up DOM environment before any test bodies run.
// React and react-dom don't access globals at import time, only at call time,
// so setting them here (after static imports) is sufficient.
const dom = new JSDOM("<!doctype html><html><body></body></html>", {url: "http://localhost"});
global.window = dom.window;
global.document = dom.window.document;
// Expose DOM classes that @d3plus/dom and React depend on at runtime.
["Element", "HTMLElement", "SVGElement", "MutationObserver", "Node",
  "NodeList", "HTMLCollection", "Event", "CustomEvent"].forEach(key => {
  global[key] = dom.window[key];
});
global.location = dom.window.location;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

class MockViz {
  config() { return this; }
  render(cb) { if (cb) cb(); return this; }
  destroy() {}
}

describe("Renderer", function() {

  let container, root;

  beforeEach(function() {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async function() {
    await act(async () => { root.unmount(); });
    document.body.removeChild(container);
  });

  it("renders a wrapper div containing an svg", async function() {
    await act(async () => {
      root.render(React.createElement(Renderer, {constructor: MockViz, config: {}}));
    });
    assert.ok(container.querySelector("div.renderer"), "renders div.renderer");
    assert.ok(container.querySelector("svg"), "renders an svg");
  });

  it("supports a custom className", async function() {
    await act(async () => {
      root.render(React.createElement(Renderer, {constructor: MockViz, config: {}, className: "my-chart"}));
    });
    assert.ok(container.querySelector("div.my-chart"), "uses custom className");
    assert.strictEqual(container.querySelector("div.renderer"), null, "does not use default className");
  });

  it("calls config() and render() on the viz instance", async function() {
    let configCalled = false, renderCalled = false;
    class TrackingViz {
      config() { configCalled = true; return this; }
      render() { renderCalled = true; return this; }
    }
    await act(async () => {
      root.render(React.createElement(Renderer, {constructor: TrackingViz, config: {}}));
    });
    assert.ok(configCalled, "config() was called");
    assert.ok(renderCalled, "render() was called");
  });

  it("calls destroy() on the viz instance when unmounted", async function() {
    let destroyed = false;
    class TrackingViz {
      config() { return this; }
      render() { return this; }
      destroy() { destroyed = true; }
    }
    await act(async () => {
      root.render(React.createElement(Renderer, {constructor: TrackingViz, config: {}}));
    });
    await act(async () => { root.unmount(); });
    assert.ok(destroyed, "destroy() was called on unmount");
  });

});
