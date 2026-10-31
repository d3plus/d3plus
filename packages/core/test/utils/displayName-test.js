import {it} from "vitest";
import assert from "assert";
import * as core from "../../index.ts";
import {displayName} from "../../src/utils/displayName.ts";
import {captureWarnings} from "~test/helpers.js";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

/** Every exported class built on BaseClass: charts, components, and shapes. */
const classes = Object.entries(core).filter(
  ([, value]) =>
    typeof value === "function" && value.prototype instanceof core.BaseClass,
);

it("every exported class states its name, so minifying can't change it", () => {
  assert.ok(classes.length > 50, `found ${classes.length} classes`);
  for (const [name, Class] of classes) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(Class, "_displayName"),
      `${name} has its own _displayName`,
    );
    assert.strictEqual(Class._displayName, name, `${name}._displayName`);
  }
});

it("displayName names an instance by its class, minified or not", () => {
  const {Legend, Treemap} = core;
  const original = Object.getOwnPropertyDescriptor(Legend, "name");
  // What a minifier leaves: the class itself goes by another name.
  Object.defineProperty(Legend, "name", {value: "Ch"});
  try {
    assert.strictEqual(displayName(new Legend()), "Legend");
  } finally {
    Object.defineProperty(Legend, "name", original);
  }
  assert.strictEqual(displayName(new Treemap()), "Treemap");
});

it("a subclass without its own name goes by its class name, not its parent's", () => {
  class MyLegend extends core.Legend {}
  assert.strictEqual(displayName(new MyLegend()), "MyLegend");
});

it("config warnings name the class as written, minified or not", () => {
  const {Legend} = core;
  const original = Object.getOwnPropertyDescriptor(Legend, "name");
  Object.defineProperty(Legend, "name", {value: "Ch"});
  try {
    const warnings = captureWarnings(() =>
      new Legend().config({titelForDisplayNameTest: "Sales"}),
    );
    assert.deepStrictEqual(warnings, [
      'Legend.config() received unknown property "titelForDisplayNameTest".',
    ]);
  } finally {
    Object.defineProperty(Legend, "name", original);
  }
});
