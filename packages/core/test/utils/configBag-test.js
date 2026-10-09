import assert from "assert";
import {assign} from "@d3plus/dom";
import {mergeConfigBag, resolvesReset, RESOLVES_RESET} from "../../es/src/fluent.js";
import {default as BaseClass} from "../../es/src/utils/BaseClass.js";
import {default as RESET} from "../../es/src/utils/RESET.js";

const defaults = () => ({
  a: {b: {c: {d: 1, e: 2}, f: 3}, g: 4},
  list: [1, 2, 3],
  fn: () => "default",
  off: false,
  zero: 0,
  empty: "",
  none: null,
});

/** A minimal host: a bag on `schema`, and a defaults snapshot like BaseClass's. */
function host(bag = defaults(), snapshot = defaults()) {
  return {schema: {bag}, _defaultConfig: () => ({bag: snapshot})};
}

it("mergeConfigBag deep-merges at every depth and keeps siblings", () => {
  const h = host();
  const out = mergeConfigBag(h, "bag", {a: {b: {c: {d: 10}}}});
  assert.deepStrictEqual(out.a, {b: {c: {d: 10, e: 2}, f: 3}, g: 4});
  assert.deepStrictEqual(out.list, [1, 2, 3]);
  assert.strictEqual(out.off, false);
});

it("mergeConfigBag replaces arrays, functions, and class instances", () => {
  const h = host();
  const list = [9];
  const fn = () => "user";
  const date = new Date(0);
  const out = mergeConfigBag(h, "bag", {list, fn, a: {b: date}});
  assert.deepStrictEqual(out.list, [9], "array replaced, not merged");
  assert.notStrictEqual(out.list, list, "stored array is a copy");
  assert.strictEqual(out.fn, fn, "function replaced");
  assert.strictEqual(out.a.b, date, "class instance replaced by reference");
  assert.strictEqual(out.a.g, 4);
});

it("mergeConfigBag returns a fresh object and mutates neither the bag nor the patch", () => {
  const h = host();
  const bag = h.schema.bag;
  const before = JSON.stringify(bag);
  const patch = {a: {b: {c: {d: 5}}}, extra: {x: 1}};
  const out = mergeConfigBag(h, "bag", patch);
  assert.notStrictEqual(out, bag);
  assert.notStrictEqual(out.a, bag.a, "nested objects are copies");
  assert.notStrictEqual(out.extra, patch.extra, "patch objects are copied in");
  assert.strictEqual(JSON.stringify(bag), before, "stored bag untouched");
  assert.deepStrictEqual(patch, {a: {b: {c: {d: 5}}}, extra: {x: 1}}, "patch untouched");
  assert.strictEqual(h.schema.bag, bag, "the caller stores the result, not the helper");
});

it("mergeConfigBag resolves nested RESET from the defaults snapshot", () => {
  const h = host(mergeConfigBag(host(), "bag", {a: {b: {c: {d: 50, added: true}, f: 60}, g: 70}}));
  const patch = {a: {b: {c: {d: RESET}}}};
  const out = mergeConfigBag(h, "bag", patch);
  assert.strictEqual(out.a.b.c.d, 1, "restored 4 levels deep");
  assert.strictEqual(out.a.b.c.added, true, "siblings kept");
  assert.strictEqual(out.a.b.f, 60);
  assert.strictEqual(patch.a.b.c.d, RESET, "patch untouched");

  const whole = mergeConfigBag(h, "bag", {a: {b: RESET}});
  assert.deepStrictEqual(whole.a.b, {c: {d: 1, e: 2}, f: 3}, "object restored exactly");
  assert.strictEqual(whole.a.g, 70, "parent siblings kept");
});

it("mergeConfigBag restores falsy defaults and removes keys without one", () => {
  const h = host({off: true, zero: 9, empty: "x", none: 1, custom: 1, a: {}});
  const out = mergeConfigBag(h, "bag", {off: RESET, zero: RESET, empty: RESET, none: RESET, custom: RESET});
  assert.strictEqual(out.off, false);
  assert.strictEqual(out.zero, 0);
  assert.strictEqual(out.empty, "");
  assert.strictEqual(out.none, null);
  assert.ok(!("custom" in out), "key without a default removed");
});

it("mergeConfigBag resolves a top-level RESET to a copy of the snapshot", () => {
  const snapshot = defaults();
  const h = host({a: {g: 0}, mine: true}, snapshot);
  const out = mergeConfigBag(h, "bag", RESET);
  assert.deepStrictEqual(Object.keys(out).sort(), Object.keys(snapshot).sort());
  assert.deepStrictEqual(out.a, snapshot.a);
  assert.notStrictEqual(out.a, snapshot.a, "restored value is a copy");

  const bare = {schema: {bag: {x: 1}}, _defaultConfig: () => ({})};
  assert.deepStrictEqual(mergeConfigBag(bare, "bag", RESET), {}, "no snapshot entry restores an empty bag");
});

it("mergeConfigBag reads the snapshot only when the patch holds a RESET", () => {
  let reads = 0;
  const h = {schema: {bag: {x: 1}}, _defaultConfig: () => (reads++, {bag: {x: 0}})};
  mergeConfigBag(h, "bag", {x: 2, y: {z: 3}});
  assert.strictEqual(reads, 0);
  mergeConfigBag(h, "bag", {y: {z: RESET}});
  assert.strictEqual(reads, 1);
});

it("mergeConfigBag merges into an explicit current value and ignores non-object patches", () => {
  const h = host();
  const current = {p: {q: 1, r: 2}};
  assert.deepStrictEqual(mergeConfigBag(h, "bag", {p: {q: 5}}, current), {p: {q: 5, r: 2}});
  assert.deepStrictEqual(current, {p: {q: 1, r: 2}});
  const kept = mergeConfigBag(h, "bag", undefined, current);
  assert.deepStrictEqual(kept, current);
  assert.notStrictEqual(kept, current);
  assert.deepStrictEqual(mergeConfigBag(h, "bag", {a: 1}, undefined), {a: 1}, "missing bag starts empty");
});

it("resolvesReset tags setters so config() passes their patch through", () => {
  class Tagged extends BaseClass {
    constructor() {
      super();
      this.schema.bag = {a: {b: 1, c: 2}, keep: true};
      this.received = [];
    }
    bag(_) {
      if (!arguments.length) return this.schema.bag;
      this.received.push(_);
      this.schema.bag = mergeConfigBag(this, "bag", _);
      return this;
    }
  }
  resolvesReset(Tagged.prototype, "bag");
  assert.strictEqual(Tagged.prototype.bag[RESOLVES_RESET], true);

  const viz = new Tagged();
  viz.config({bag: {a: {b: 9}, extra: 1}});
  const patch = {a: {b: RESET}, extra: RESET};
  viz.config({bag: patch});
  assert.strictEqual(viz.received[1], patch, "the raw patch reaches the setter");
  assert.deepStrictEqual(viz.bag(), {a: {b: 1, c: 2}, keep: true});

  viz.config({bag: RESET});
  assert.strictEqual(viz.received[2], RESET);
  assert.deepStrictEqual(viz.bag(), {a: {b: 1, c: 2}, keep: true});

  assert.throws(() => resolvesReset(Tagged.prototype, "nope"), /not a method/);
});

/** A setter that merges but leaves RESET to `config()`. */
class Untagged extends BaseClass {
  constructor() {
    super();
    this.schema.opts = {Circle: {trail: false, size: 0}, label: "", keep: 1};
  }
  opts(_) {
    return arguments.length
      ? ((this.schema.opts = assign({}, this.schema.opts, _)), this)
      : this.schema.opts;
  }
}

it("config() restores falsy defaults for setters that leave RESET to it", () => {
  const viz = new Untagged();
  viz.config({opts: {Circle: {trail: true, size: 4}, label: "x"}});
  const patch = {Circle: {trail: RESET, size: RESET}, label: RESET};
  viz.config({opts: patch});
  assert.deepStrictEqual(viz.opts(), {Circle: {trail: false, size: 0}, label: "", keep: 1});
  assert.deepStrictEqual(patch, {Circle: {trail: RESET, size: RESET}, label: RESET}, "caller's patch untouched");
});
