import assert from "assert";
import {createFluent, installFluent, isFluentAccessor} from "../../es/src/fluent.js";

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

it("installFluent installs accessors on a class instance that read/write schema.<key>", () => {
  class Chart {}
  const c = new Chart();
  installFluent(c, [
    {key: "layoutPadding", coerce: "identity"},
    {key: "sum", coerce: "accessor"},
  ], {layoutPadding: 5, sum: "value"});

  // Defaults applied to the schema store.
  assert.strictEqual(c.schema.layoutPadding, 5, "default seeded onto schema.layoutPadding");
  assert.strictEqual(typeof c.schema.sum, "function", "accessor default seeded onto schema.sum");
  assert.strictEqual(c.schema.sum({value: 7}), 7, "schema.sum reads via accessor");

  // Accessor returns the schema value.
  assert.strictEqual(c.layoutPadding(), 5, "layoutPadding() reads schema.layoutPadding");

  // Setter writes through and returns `this` for chaining.
  const ret = c.layoutPadding(10);
  assert.strictEqual(ret, c, "setter returns the instance for chaining");
  assert.strictEqual(c.schema.layoutPadding, 10, "setter wrote to schema.layoutPadding");

  // Coercion respected on set.
  c.sum("score");
  assert.strictEqual(c.schema.sum({score: 99}), 99, "string→accessor on set");
});

it("installFluent does NOT overwrite pre-existing schema values", () => {
  class Chart {
    constructor() {
      this.schema = {};
      // Parent class wrote this first; installFluent should respect it.
      this.schema.sum = "PRE_EXISTING";
    }
  }
  const c = new Chart();
  installFluent(c, [{key: "sum", coerce: "accessor"}], {sum: "value"});
  assert.strictEqual(c.schema.sum, "PRE_EXISTING", "pre-existing schema.sum preserved");
  // But the accessor method is still installed.
  c.sum("newKey");
  assert.strictEqual(typeof c.schema.sum, "function", "setter still works post-install");
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

it("installFluent seeds, but never shadows, an inherited hand-written method", () => {
  class Base {
    on(key, fn) {
      if (arguments.length === 2) {
        this.schema.on[key] = fn;
        return this;
      }
      return this.schema.on;
    }
  }
  class Chart extends Base {}
  const c = new Chart();
  c.schema = {on: {"click.shape": "base"}};
  installFluent(c, [{key: "on", merge: true, factory: () => ({"mousemove.shape": "chart"})}]);

  assert.deepStrictEqual(
    c.schema.on,
    {"click.shape": "base", "mousemove.shape": "chart"},
    "the field still seeds (and merges into) schema.on",
  );
  assert.ok(!Object.prototype.hasOwnProperty.call(Chart.prototype, "on"), "no accessor was installed on the chart prototype");
  const fn = () => undefined;
  assert.strictEqual(c.on("click.foo", fn), c, "the base class method still handles on(key, fn)");
  assert.strictEqual(c.schema.on["click.foo"], fn, "the handler was registered under its key");
});

it("installFluent leaves a method the class itself defines alone", () => {
  class Chart {
    size(_) {
      return arguments.length ? ((this.schema.size = _ * 2), this) : this.schema.size;
    }
  }
  const c = new Chart();
  installFluent(c, [{key: "size", default: 1}]);
  assert.strictEqual(c.schema.size, 1, "seeded");
  assert.strictEqual(c.size(3).size(), 6, "hand-written setter still runs");
});

it("a subclass schema replaces the accessor its parent's schema generated, in either construction order", () => {
  const parentSchema = [{key: "value", coerce: "identity"}];
  const childSchema = [{key: "value", coerce: "accessor"}];
  for (const childFirst of [false, true]) {
    class Parent {
      constructor() {
        installFluent(this, parentSchema);
      }
    }
    class Child extends Parent {
      constructor() {
        super();
        installFluent(this, childSchema);
      }
    }
    const first = childFirst ? new Child() : new Parent();
    const second = childFirst ? new Parent() : new Child();
    const [parent, child] = childFirst ? [second, first] : [first, second];
    assert.strictEqual(parent.value("score").schema.value, "score", "the parent keeps identity coercion");
    assert.strictEqual(child.value("score").schema.value({score: 4}), 4, "the child's accessor coercion wins");
  }
});

it("isFluentAccessor tells generated accessors from hand-written methods", () => {
  class Chart {
    render() {
      return this;
    }
  }
  installFluent(new Chart(), [{key: "width", default: 400}]);
  assert.strictEqual(isFluentAccessor(Chart.prototype.width), true, "generated accessor");
  assert.strictEqual(isFluentAccessor(Chart.prototype.render), false, "hand-written method");
  assert.strictEqual(isFluentAccessor(undefined), false, "non-function");
});
