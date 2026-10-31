import {it} from "vitest";
import assert from "assert";
import * as core from "@d3plus/core";
import * as react from "../index.tsx";
import Renderer from "../src/Renderer.tsx";

const wrappers = Object.entries(react).filter(
  ([name, value]) => typeof value === "function" && name in core,
);

/** Every d3plus class: charts, components, shapes, and BaseClass itself. */
const classes = Object.entries(core)
  .filter(
    ([, value]) =>
      typeof value === "function" &&
      (value === core.BaseClass || value.prototype instanceof core.BaseClass),
  )
  .map(([name]) => name);

it("every d3plus class has a component", () => {
  assert.ok(classes.length > 60, `found ${classes.length} classes`);
  assert.deepStrictEqual(
    classes.filter(name => !(name in react)),
    [],
  );
});

it("every component renders the d3plus class it is named after", () => {
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

it("every chart renders as a chart component", () => {
  const charts = classes.filter(
    name => core[name] === core.Viz || core[name].prototype instanceof core.Viz,
  );
  assert.ok(charts.length > 40, `found ${charts.length} charts`);
  for (const name of charts)
    assert.strictEqual(
      react[name]({config: {}}).props.className,
      "chart",
      name,
    );
});
