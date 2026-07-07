import assert from "assert";
import it from "../jsdom.js";
import {Pie, Treemap} from "../../es/index.js";

// BaseClass.config() reflects over prototype methods.
// installFluent installs methods on the INSTANCE (not the prototype). This
// test verifies that the installed methods still surface in config() output —
// otherwise the React wrapper's hash() (and any other config-based diffing)
// would silently miss user-set values like `.padAngle(0.05)`.
it("installFluent-installed accessors round-trip through config()", () => {
  const pie = new Pie();
  pie.padAngle(0.1).padPixel(3).innerRadius(20);
  const config = pie.config();

  // If config() output omits these, the React wrapper hash would too.
  assert.ok(
    "padAngle" in config,
    `padAngle missing from config() output (keys: ${Object.keys(config).slice(0, 20).join(", ")})`,
  );
  assert.strictEqual(config.padAngle, 0.1, "padAngle value round-trips");
  assert.strictEqual(config.padPixel, 3, "padPixel value round-trips");
  assert.strictEqual(config.innerRadius, 20, "innerRadius value round-trips");
});

it("installFluent-installed accessors are writable via config({...})", () => {
  // The setter path (config(obj) → calls each method) MUST work — this is what
  // user code passes via React props. Already validated by the parity tests
  // (chart.config({width: ...}) flows through) but called out explicitly here.
  const pie = new Pie();
  pie.config({padAngle: 0.2, value: "score"});
  assert.strictEqual(pie.schema.padAngle, 0.2, "padAngle written via config()");
  assert.strictEqual(typeof pie.schema.value, "function", "value coerced to accessor");
  assert.strictEqual(pie.schema.value({score: 42}), 42, "accessor reads the key");
});

it("Treemap installFluent accessors round-trip through config()", () => {
  // Treemap has layoutPadding/sort installed via installFluent.
  const t = new Treemap();
  t.layoutPadding(5);
  const config = t.config();
  assert.ok("layoutPadding" in config, "layoutPadding in config() output");
  assert.strictEqual(config.layoutPadding, 5, "layoutPadding round-trips");
});
