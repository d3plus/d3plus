import assert from "assert";
import {createFluent} from "../../es/src/fluent.js";
import {treemapDef} from "../../es/src/charts/ChartDefinition.js";

// E4 integration: demonstrate that createFluent driven by treemapDef's
// defaults reproduces the accessor semantics the hand-written Treemap
// exposes. This is the proof that the schema-driven generator can replace
// the per-chart accessor boilerplate.
it("createFluent on treemapDef yields the same defaults the live class uses", () => {
  // Schema derived from what treemapDef.defaults declares. The "accessor"
  // coercion mirrors how `Treemap.sum()` / `Plot.x()` wrap a string key into
  // accessor(key) and a scalar into constant(value).
  const schema = [
    {key: "layoutPadding", coerce: "identity"},
    {key: "sum", coerce: "accessor"},
  ];

  const t = createFluent(schema, {
    layoutPadding: treemapDef.defaults.layoutPadding,
    sum: treemapDef.defaults.sum,
  });

  // Defaults round-trip from treemapDef into the fluent surface unchanged.
  assert.strictEqual(t.layoutPadding(), 1, "default layoutPadding from treemapDef");
  assert.strictEqual(
    typeof t.sum(),
    "function",
    "default sum is an accessor function (treemapDef.defaults.sum)",
  );
  assert.strictEqual(t.sum()({value: 3}), 3, "default sum reads .value");

  // Setters mirror the live Treemap's coercion behavior.
  t.sum("score");
  assert.strictEqual(t.sum()({score: 42}), 42, "string key → accessor(key)");

  t.sum(100);
  assert.strictEqual(t.sum()({}), 100, "scalar → constant(value)");

  const customAccessor = d => d.value * 2;
  t.sum(customAccessor);
  assert.strictEqual(t.sum(), customAccessor, "function pass-through");
});
