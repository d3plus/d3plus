import {it} from "vitest";
import assert from "assert";
import * as core from "@d3plus/core";
import * as react from "../index.tsx";
import Renderer from "../src/Renderer.tsx";

const wrappers = Object.entries(react).filter(
  ([name, value]) => typeof value === "function" && name in core,
);

it("every component renders the d3plus class it is named after", () => {
  assert.strictEqual(wrappers.length, 71);
  const config = {data: []};
  for (const [name, Component] of wrappers) {
    const element = Component({config});
    assert.strictEqual(element.type, Renderer, name);
    assert.strictEqual(element.props.constructor, core[name], name);
    assert.ok(
      ["chart", "component", "shape", "util"].includes(element.props.className),
      name,
    );
    assert.strictEqual(element.props.config, config, name);
  }
});

it("Scatter, BubbleChart, Streamgraph, and SlopeChart are chart components", () => {
  for (const name of ["Scatter", "BubbleChart", "Streamgraph", "SlopeChart"]) {
    const element = react[name]({config: {}});
    assert.strictEqual(element.props.constructor, core[name]);
    assert.strictEqual(element.props.className, "chart");
  }
});
