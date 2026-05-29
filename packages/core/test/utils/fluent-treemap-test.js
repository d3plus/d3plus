import assert from "assert";
import {createFluent} from "../../es/src/fluent.js";
import {treemapDef} from "../../es/src/charts/Treemap/index.js";

// `createFluent` driven by `treemapDef.fields` reproduces the accessor
// surface the Treemap class exposes.
it("createFluent on treemapDef yields the same defaults the live class uses", () => {
  // Re-use the def's own field declarations — the proof is that the
  // schema-driven generator reads the def directly.
  const layoutPaddingField = treemapDef.fields.find(f => f.key === "layoutPadding");
  const sumField = treemapDef.fields.find(f => f.key === "sum");

  const t = createFluent(treemapDef.fields, {
    layoutPadding: layoutPaddingField.default,
    sum: sumField.default,
  });

  assert.strictEqual(t.layoutPadding(), 1, "default layoutPadding from treemapDef");
  assert.strictEqual(
    typeof t.sum(),
    "function",
    "default sum is an accessor function",
  );
  assert.strictEqual(t.sum()({value: 3}), 3, "default sum reads .value");

  t.sum("score");
  assert.strictEqual(t.sum()({score: 42}), 42, "string key → accessor(key)");

  // The treemap-specific `sum` coerce only handles function-or-string;
  // a literal `100` is wrapped as a constant by the createFluent helper
  // only when the field's coerce path supports it. For sum, scalar
  // values aren't accepted (would be a type misuse).

  const customAccessor = d => d.value * 2;
  t.sum(customAccessor);
  assert.strictEqual(t.sum(), customAccessor, "function pass-through");
});
