import {it} from "vitest";
import assert from "assert";
import {
  BubbleChart as BubbleChartClass,
  Scatter as ScatterClass,
  Streamgraph as StreamgraphClass,
} from "@d3plus/core";
import {BubbleChart, Scatter, Streamgraph} from "../index.tsx";
import Renderer from "../src/Renderer.tsx";

it("Scatter, BubbleChart, and Streamgraph render their d3plus classes", () => {
  const config = {data: []};
  for (const [Component, Class] of [
    [Scatter, ScatterClass],
    [BubbleChart, BubbleChartClass],
    [Streamgraph, StreamgraphClass],
  ]) {
    const element = Component({config});
    assert.strictEqual(element.type, Renderer);
    assert.strictEqual(element.props.constructor, Class);
    assert.strictEqual(element.props.className, "chart");
    assert.strictEqual(element.props.config, config);
  }
});
