import assert from "assert";
import it from "../jsdom.js";
import * as core from "../../es/index.js";
import {isFluentAccessor} from "../../es/src/fluent.js";

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
  label: "coerce \"const\" matches VizBaseConfig.label (function, else constant)",
  legend: "coerce \"const\" matches VizBaseConfig.legend (function, else constant)",
  legendTooltip: "merge seeds the bag; VizBaseConfig.legendTooltip deep-merges sets",
  noDataMessage: "identity matches VizBase.noDataMessage",
  on: "merge seeds the handler map; BaseClass.on registers on(typename, fn) and merges on({…})",
  shape: "coerce \"const\" matches VizBase.shape (function, else constant)",
  shapeConfig: "merge seeds the bag; VizBase.shapeConfig validates and deep-merges sets",
  tooltipConfig: "merge seeds the bag; VizBase.tooltipConfig deep-merges sets",
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

it("chart def fields on hand-written keys are reviewed and declare no onSet", async () => {
  const charts = classes.filter(([, C]) => C.prototype instanceof core.Viz && C !== core.Plot);
  const unreviewed = [];
  let defs = 0;
  for (const [name, C] of charts) {
    const module = await import(`../../es/src/charts/${name}/index.js`);
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
