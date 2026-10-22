import {describe, it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import * as core from "../../index.ts";
import {installFluent, isFluentAccessor, mergeConfig} from "../../src/fluent.ts";
import {default as BaseClass} from "../../src/utils/BaseClass.ts";
import {default as RESET} from "../../src/utils/RESET.ts";

const {Pie, Treemap} = core;

describe("installFluent", () => {
  it("installFluent accessors coerce values per field with arguments.length getter/setter semantics", () => {
    class Chart {}
    const f = new Chart();
    installFluent(f, [
      {key: "x", coerce: "accessor"},
      {key: "y", coerce: "accessor"},
      {key: "duration", coerce: "identity"},
    ]);

    assert.strictEqual(f.x(), undefined, "x() before set returns undefined");
    assert.strictEqual(f.x(100), f, "setter returns the instance for chaining");

    f.y("value");
    const yAccessor = f.y();
    assert.strictEqual(typeof yAccessor, "function", "string was wrapped in an accessor");
    assert.strictEqual(yAccessor({value: 42}), 42, "wrapped accessor reads the key");

    f.x(50);
    const xAccessor = f.x();
    assert.strictEqual(typeof xAccessor, "function", "scalar was wrapped in a constant");
    assert.strictEqual(xAccessor({}), 50, "constant returns the seed value");

    const fn = d => d.foo * 2;
    f.x(fn);
    assert.strictEqual(f.x(), fn, "function values pass through unchanged");

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
});

describe("merge fields", () => {
  const sharedDefault = {
    a: {b: {c: {d: 1, e: 2}, f: 3}, g: 4},
    list: [1, 2, 3],
    fn: () => "default",
  };

  class Bag extends BaseClass {
    constructor(parentSeed) {
      super();
      if (parentSeed) this.schema.bag = parentSeed;
      installFluent(this, [{key: "bag", merge: true, default: sharedDefault}]);
    }
  }

  it("mergeConfig deep-merges into a new object without touching its inputs", () => {
    const base = {a: {b: {c: {d: 1, e: 2}}}, list: [1], keep: true};
    const patch = {a: {b: {c: {d: 9}}}, list: [7, 8]};
    const baseCopy = JSON.parse(JSON.stringify(base));
    const patchCopy = JSON.parse(JSON.stringify(patch));
    const out = mergeConfig(base, patch);

    assert.deepStrictEqual(out, {a: {b: {c: {d: 9, e: 2}}}, list: [7, 8], keep: true});
    assert.deepStrictEqual(base, baseCopy, "base untouched");
    assert.deepStrictEqual(patch, patchCopy, "patch untouched");
    assert.notStrictEqual(out.a, base.a, "nested objects are copies");
    assert.notStrictEqual(out.list, patch.list, "arrays are copies");
  });

  it("mergeConfig replaces class instances instead of merging into them", () => {
    const date = new Date(0);
    const out = mergeConfig({when: {year: 1}}, {when: date});
    assert.strictEqual(out.when, date);
  });

  it("mergeConfig resolves RESET against the defaults at the same path", () => {
    const defaults = {a: {b: {c: 1}}, x: {y: 2}};
    const base = {a: {b: {c: 5, extra: true}}, x: {y: 9, z: 3}, custom: 1};
    const out = mergeConfig(base, {a: {b: {c: RESET}}, x: RESET, custom: RESET}, defaults);
    assert.deepStrictEqual(out, {a: {b: {c: 1, extra: true}}, x: {y: 2}});
    assert.notStrictEqual(out.x, defaults.x, "restored objects are copies");
  });

  it("merge fields deep-merge nested setter values and keep siblings", () => {
    const viz = new Bag();
    viz.bag({a: {b: {c: {d: 10}}}});
    assert.deepStrictEqual(viz.bag().a, {b: {c: {d: 10, e: 2}, f: 3}, g: 4}, "4 levels deep");

    viz.bag({a: {b: {f: 30}}});
    assert.strictEqual(viz.bag().a.b.c.d, 10, "earlier nested value kept");
    assert.strictEqual(viz.bag().a.b.f, 30);
  });

  it("merge fields replace arrays and functions", () => {
    const viz = new Bag();
    const list = [9];
    const fn = () => "user";
    viz.bag({list, fn});
    assert.deepStrictEqual(viz.bag().list, [9], "array replaced, not concatenated");
    assert.notStrictEqual(viz.bag().list, list, "stored array is a copy");
    assert.strictEqual(viz.bag().fn, fn, "function replaced");

    viz.bag({fn: {nowAnObject: true}});
    assert.deepStrictEqual(viz.bag().fn, {nowAnObject: true}, "function replaced by object");
    viz.bag({a: "flat"});
    assert.strictEqual(viz.bag().a, "flat", "object replaced by primitive");
  });

  it("merge fields never mutate the caller's object or the shared default", () => {
    const snapshot = JSON.stringify(sharedDefault);
    const one = new Bag();
    const two = new Bag();
    const patch = {a: {b: {c: {d: 100}}}};
    one.bag(patch);

    assert.deepStrictEqual(patch, {a: {b: {c: {d: 100}}}}, "caller's object untouched");
    assert.notStrictEqual(one.bag().a.b.c, patch.a.b.c, "stored value is a fresh object");
    assert.strictEqual(two.bag().a.b.c.d, 1, "other instance untouched");
    assert.strictEqual(JSON.stringify(sharedDefault), snapshot, "shared default untouched");
    assert.notStrictEqual(one.bag().a, two.bag().a, "instances never share nested objects");
    assert.notStrictEqual(two.bag().a, sharedDefault.a, "seeded value is a copy of the default");
  });

  it("merge field defaults deep-merge over the value a parent seeded", () => {
    const viz = new Bag({a: {b: {c: {d: 0, parentOnly: true}}, parentKey: "p"}, other: 1});
    assert.deepStrictEqual(viz.bag().a.b.c, {d: 1, e: 2, parentOnly: true});
    assert.strictEqual(viz.bag().a.parentKey, "p");
    assert.strictEqual(viz.bag().other, 1);
  });

  it("RESET restores a merge field's defaults at any depth", () => {
    const viz = new Bag();
    viz.config({bag: {a: {b: {c: {d: 50, added: true}, f: 60}, g: 70}, extra: 1}});

    const patch = {a: {b: {c: {d: RESET}}}};
    viz.config({bag: patch});
    assert.strictEqual(viz.bag().a.b.c.d, 1, "primitive 4 levels deep restored");
    assert.strictEqual(viz.bag().a.b.c.added, true, "siblings kept");
    assert.strictEqual(viz.bag().a.b.f, 60, "siblings kept");
    assert.strictEqual(patch.a.b.c.d, RESET, "caller's patch untouched");

    viz.config({bag: {a: {b: RESET}}});
    assert.deepStrictEqual(viz.bag().a.b, {c: {d: 1, e: 2}, f: 3}, "object restored exactly");
    assert.strictEqual(viz.bag().a.g, 70, "parent siblings kept");

    viz.config({bag: {extra: RESET}});
    assert.ok(!("extra" in viz.bag()), "key without a default removed");

    viz.config({bag: {a: {g: 0}, list: [5]}});
    viz.config({bag: RESET});
    assert.deepStrictEqual(viz.bag().a, sharedDefault.a, "whole field restored");
    assert.deepStrictEqual(viz.bag().list, [1, 2, 3]);
    assert.notStrictEqual(viz.bag().a, sharedDefault.a, "restored value is a copy");
  });

  it("RESET passed straight to a merge field's setter restores its default", () => {
    const viz = new Bag();
    viz.config({bag: {a: {b: {c: {d: 7, added: true}}}}});
    viz.bag({a: {b: {c: RESET}}});
    assert.deepStrictEqual(viz.bag().a.b.c, {d: 1, e: 2});
  });
});

describe("chart accessors", () => {
  useJsdom();

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
});

describe("exported classes", () => {
  useJsdom();

  /**
      A chart def's field whose key matches a hand-written method on a base class
      (`BaseClass.on`, `VizBase.shapeConfig`, …) only seeds `schema.<key>`; the
      hand-written method stays the public API. These tests walk every exported
      class so a new field or base-class method can't silently swap a method's
      semantics for a generated accessor's.
  */

  /**
      Def fields that share a key with a hand-written method. Each field's setter
      semantics must be covered by that method, since user calls reach the method.
  */
  const SEED_ONLY = {
    baseline: "identity seeds the chart's own baseline (where bars start); Plot.baseline stores the user's apart from it, as a value-domain bound",
    groupBy: "seeds an array of accessor functions, the form VizBase.groupBy stores keys as",
    noDataMessage: "identity matches VizBase.noDataMessage",
    on: "merge seeds the handler map; BaseClass.on registers on(typename, fn) and merges on({…})",
    shapeConfig: "merge seeds the bag; VizBase.shapeConfig validates and deep-merges sets",
  };

  const classes = Object.entries(core).filter(
    ([, C]) => typeof C === "function" && C.prototype instanceof core.BaseClass,
  );

  function prototypeChain(C) {
    const chain = [];
    for (let p = C.prototype; p && p !== Object.prototype; p = Object.getPrototypeOf(p)) chain.push(p);
    return chain;
  }

  function ownMethod(proto, key) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, key);
    return descriptor && descriptor.value;
  }

  it("no generated accessor shadows a hand-written method on any exported class", () => {
    const shadows = [];
    for (const [name, C] of classes) {
      new C();
      const chain = prototypeChain(C);
      chain.forEach((proto, i) => {
        for (const key of Object.getOwnPropertyNames(proto)) {
          if (!isFluentAccessor(ownMethod(proto, key))) continue;
          const base = chain
            .slice(i + 1)
            .find(p => Object.prototype.hasOwnProperty.call(p, key) && !isFluentAccessor(ownMethod(p, key)));
          if (base) shadows.push(`${name}: ${key}() shadows ${base.constructor.name}.${key}()`);
        }
      });
    }
    assert.ok(classes.length > 40, `walked ${classes.length} classes`);
    assert.deepStrictEqual(shadows, []);
  });

  it("chart def fields on Viz field keys coerce and merge like the Viz field", async () => {
    const {vizFields} = await import("../../src/charts/viz/vizFields.ts");
    const viz = Object.fromEntries(vizFields.map(f => [f.key, f]));
    const charts = classes.filter(([, C]) => C.prototype instanceof core.Viz && C !== core.Plot);
    const differ = [];
    const sample = ["key", "", 0, false, () => 1, {a: 1}];
    for (const [name] of charts) {
      const module = await import(`../../src/charts/${name}/index.ts`);
      const def = module[`${name[0].toLowerCase()}${name.slice(1)}Def`];
      for (const field of def.fields ?? []) {
        const base = viz[field.key];
        if (!base) continue;
        if (Boolean(field.merge) !== Boolean(base.merge)) differ.push(`${name}.${field.key}: merge`);
        // Compare what each coercion stores for a range of inputs.
        const store = (f, v) => {
          const c = f.coerce;
          const out = typeof c === "function" ? c(v) : c === "const" ? (typeof v === "function" ? v : () => v) : c === "accessor" ? (typeof v === "function" ? v : typeof v === "string" ? d => d[v] : () => v) : v;
          return typeof out === "function" ? (out === v ? "same fn" : String(out({key: "k"}))) : JSON.stringify(out);
        };
        for (const v of sample)
          if (store(field, v) !== store(base, v)) differ.push(`${name}.${field.key}: ${JSON.stringify(String(v))}`);
      }
    }
    assert.deepStrictEqual(differ, []);
  });

  it("chart def fields on hand-written keys are reviewed and declare no onSet", async () => {
    const charts = classes.filter(([, C]) => C.prototype instanceof core.Viz && C !== core.Plot);
    const unreviewed = [];
    let defs = 0;
    for (const [name, C] of charts) {
      const module = await import(`../../src/charts/${name}/index.ts`);
      const def = module[`${name[0].toLowerCase()}${name.slice(1)}Def`];
      assert.ok(def, `${name} exports its ChartDefinition`);
      defs++;
      const viz = new C();
      for (const field of def.fields ?? []) {
        const owner = prototypeChain(C).find(p => Object.prototype.hasOwnProperty.call(p, field.key));
        if (!owner || isFluentAccessor(ownMethod(owner, field.key))) continue;
        if (!(field.key in SEED_ONLY)) unreviewed.push(`${name}.${field.key} (${owner.constructor.name})`);
        assert.ok(!field.onSet, `${name}.${field.key} declares onSet, which ${owner.constructor.name}.${field.key}() would skip`);
        assert.notStrictEqual(viz.schema[field.key], undefined, `${name} seeds schema.${field.key}`);
      }
    }
    assert.strictEqual(defs, charts.length);
    assert.deepStrictEqual(unreviewed, [], "add each new key to SEED_ONLY once its setter semantics are checked");
  });
});
