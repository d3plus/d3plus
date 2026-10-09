import assert from "assert";
import {installFluent, mergeConfig} from "../../es/src/fluent.js";
import {default as BaseClass} from "../../es/src/utils/BaseClass.js";
import {default as RESET} from "../../es/src/utils/RESET.js";

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
