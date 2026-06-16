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

  it("re-renders on config change WITHOUT destroying the instance (so it can tween)", async function() {
    let instances = 0, renders = 0, destroys = 0;
    class TrackingViz {
      constructor() { instances++; }
      config() { return this; }
      render() { renders++; return this; }
      destroy() { destroys++; }
    }
    await act(async () => {
      root.render(React.createElement(Renderer, {constructor: TrackingViz, config: {a: 1}}));
    });
    await act(async () => {
      root.render(React.createElement(Renderer, {constructor: TrackingViz, config: {a: 2}}));
    });
    assert.strictEqual(instances, 1, "reuses a single instance across config changes");
    assert.strictEqual(renders, 2, "re-renders when the config changes");
    assert.strictEqual(destroys, 0, "does not destroy between config changes (preserves the scene for tweening)");
  });

  it("invokes the callback after render", async function() {
    let callbackCalled = false;
    class CallbackViz {
      config() { return this; }
      render(cb) { if (cb) cb(); return this; }
    }
    await act(async () => {
      root.render(React.createElement(Renderer, {
        constructor: CallbackViz,
        config: {},
        callback: () => { callbackCalled = true; },
      }));
    });
    assert.ok(callbackCalled, "callback was invoked");
  });

  it("handles forceUpdate prop", async function() {
    let renderCount = 0;
    class CountingViz {
      config() { return this; }
      render() { renderCount++; return this; }
    }
    await act(async () => {
      root.render(React.createElement(Renderer, {
        constructor: CountingViz,
        config: {},
        forceUpdate: true,
      }));
    });
    assert.ok(renderCount >= 1, "renders at least once with forceUpdate");
  });

  it("handles dataFormat config by calling data() method", async function() {
    let dataCalled = false;
    let dataFormatValue = null;
    class DataViz {
      config() { return this; }
      render() { return this; }
      data(d, fmt) { dataCalled = true; dataFormatValue = fmt; }
    }
    const formatter = d => d;
    await act(async () => {
      root.render(React.createElement(Renderer, {
        constructor: DataViz,
        config: {data: [1, 2, 3], dataFormat: formatter},
      }));
    });
    assert.ok(dataCalled, "data() was called when dataFormat is present");
    assert.strictEqual(dataFormatValue, formatter, "dataFormat was passed to data()");
  });

  it("handles config with function values", async function() {
    let configReceived = null;
    class ConfigViz {
      config(c) { configReceived = c; return this; }
      render() { return this; }
    }
    const accessor = d => d.value;
    await act(async () => {
      root.render(React.createElement(Renderer, {
        constructor: ConfigViz,
        config: {x: accessor, label: "test"},
      }));
    });
    assert.ok(configReceived, "config was received");
    assert.strictEqual(configReceived.label, "test", "non-function config passed through");
  });

});
