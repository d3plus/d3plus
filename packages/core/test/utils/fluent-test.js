import assert from "assert";
import {createFluent, installFluent} from "../../es/src/fluent.js";

it("createFluent generates accessors with arguments.length getter/setter semantics", () => {
  const f = createFluent([
    {key: "x", coerce: "accessor"},
    {key: "y", coerce: "accessor"},
    {key: "duration", coerce: "identity"},
  ]);

  // No-arg → getter (initially undefined)
  assert.strictEqual(f.x(), undefined, "x() before set returns undefined");

  // Setter returns `this` for chaining
  const ret = f.x(100);
  assert.strictEqual(ret, f, "setter returns the api for chaining");

  // string → accessor()
  f.y("value");
  const yAccessor = f.y();
  assert.strictEqual(typeof yAccessor, "function", "string was wrapped in an accessor");
  assert.strictEqual(yAccessor({value: 42}), 42, "wrapped accessor reads the key");

  // number → constant() when coerce is "accessor"
  f.x(50);
  const xAccessor = f.x();
  assert.strictEqual(typeof xAccessor, "function", "scalar was wrapped in a constant");
  assert.strictEqual(xAccessor({}), 50, "constant returns the seed value");

  // Function passes through unchanged
  const fn = d => d.foo * 2;
  f.x(fn);
  assert.strictEqual(f.x(), fn, "function values pass through unchanged");

  // "identity" coercion stores raw values
  f.duration(750);
  assert.strictEqual(f.duration(), 750, "identity coercion preserves the literal");
});

it("installFluent installs accessors on a class instance that read/write _<key>", () => {
  class Chart {}
  const c = new Chart();
  installFluent(c, [
    {key: "layoutPadding", coerce: "identity"},
    {key: "sum", coerce: "accessor"},
  ], {layoutPadding: 5, sum: "value"});

  // Defaults applied to the underscored slots.
  assert.strictEqual(c._layoutPadding, 5, "default seeded onto _layoutPadding");
  assert.strictEqual(typeof c._sum, "function", "accessor default seeded onto _sum");
  assert.strictEqual(c._sum({value: 7}), 7, "_sum reads via accessor");

  // Accessor returns the underscored value.
  assert.strictEqual(c.layoutPadding(), 5, "layoutPadding() reads _layoutPadding");

  // Setter writes through and returns `this` for chaining.
  const ret = c.layoutPadding(10);
  assert.strictEqual(ret, c, "setter returns the instance for chaining");
  assert.strictEqual(c._layoutPadding, 10, "setter wrote to _layoutPadding");

  // Coercion respected on set.
  c.sum("score");
  assert.strictEqual(c._sum({score: 99}), 99, "string→accessor on set");
});

it("installFluent does NOT overwrite pre-existing slot values", () => {
  class Chart {
    constructor() {
      // Parent class wrote this first; installFluent should respect it.
      this._sum = "PRE_EXISTING";
    }
  }
  const c = new Chart();
  installFluent(c, [{key: "sum", coerce: "accessor"}], {sum: "value"});
  assert.strictEqual(c._sum, "PRE_EXISTING", "pre-existing _sum preserved");
  // But the accessor method is still installed.
  c.sum("newKey");
  assert.strictEqual(typeof c._sum, "function", "setter still works post-install");
});

it("createFluent.config() is round-trip-symmetric with the per-key accessors", () => {
  const f = createFluent(
    [
      {key: "x", coerce: "accessor"},
      {key: "duration", coerce: "identity"},
    ],
    {x: "value", duration: 600},
  );

  const snapshot = f.config();
  assert.strictEqual(typeof snapshot.x, "function", "defaults applied accessor coercion");
  assert.strictEqual(snapshot.duration, 600, "defaults stored for identity fields");

  // Bulk apply
  f.config({x: "newKey", duration: 0});
  assert.strictEqual(f.x()({newKey: 7}), 7, "config({x: ...}) coerced like x(...)");
  assert.strictEqual(f.duration(), 0, "config({duration: 0}) stored verbatim");
});
