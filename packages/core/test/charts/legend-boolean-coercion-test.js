import assert from "assert";
import it from "../jsdom.js";
import {BarChart, Donut, Matrix, Pack, Pie, Treemap} from "../../es/index.js";

// Charts that declare `legend`/`shape`/`label` in their def `fields` get a
// generated fluent accessor that shadows the hand-written VizBaseConfig setter.
// The generated accessor honours the field's `coerce`, so without an explicit
// `"const"` a `.legend(false)`/`.shape("Circle")` call stored the raw primitive
// instead of wrapping it in `constant(...)`. Readers that treat the value as a
// function then blew up — `featuresLegend` does `viz.schema.legend.bind(viz)(…)`,
// and `false.bind` is not a function.
it("legend accessor keeps schema.legend callable for boolean args", () => {
  for (const Chart of [BarChart, Pie, Donut, Treemap, Pack]) {
    const viz = new Chart();

    viz.legend(false);
    assert.strictEqual(
      typeof viz.schema.legend,
      "function",
      `${Chart.name}: .legend(false) must store a function`,
    );
    // Exercise the exact featuresLegend call shape.
    assert.doesNotThrow(
      () => viz.schema.legend.bind(viz)({}, []),
      `${Chart.name}: schema.legend.bind() must not throw`,
    );
    assert.strictEqual(viz.schema.legend.bind(viz)({}, []), false, `${Chart.name}: legend(false) → false`);

    viz.legend(true);
    assert.strictEqual(typeof viz.schema.legend, "function", `${Chart.name}: .legend(true) stays a function`);
    assert.strictEqual(viz.schema.legend.bind(viz)({}, []), true, `${Chart.name}: legend(true) → true`);

    // A function argument still passes straight through.
    const fn = () => false;
    viz.legend(fn);
    assert.strictEqual(viz.schema.legend, fn, `${Chart.name}: function arg passes through`);
  }
});

it("shape accessor coerces string args to constant functions", () => {
  const viz = new BarChart();
  viz.shape("Circle");
  assert.strictEqual(typeof viz.schema.shape, "function", "shape string → constant fn");
  assert.strictEqual(viz.schema.shape({}, 0), "Circle", "shape fn returns the constant");
});

it("label accessor coerces string args to constant functions", () => {
  const viz = new Matrix();
  viz.label("Region");
  assert.strictEqual(typeof viz.schema.label, "function", "label string → constant fn");
  assert.strictEqual(viz.schema.label({}, 0), "Region", "label fn returns the constant");
});
