import assert from "assert";
import {default as validate} from "../es/src/validate.js";
import {default as ramp} from "../es/src/ramp.js";
import {default as defaults} from "../es/src/defaults.js";

const state = (result, name) => result.checks.find(c => c.name === name).state;

it("validate — categorical", () => {
  // The default palette's identity tier (first 8) passes the computable checks
  // as a bars/lines/stacks (adjacent) palette. This is the regression gate:
  // reordering or re-stepping the defaults must keep it passing.
  const primary = defaults.scale.range().slice(0, 8);
  const light = validate(primary, {mode: "light"});
  assert.ok(light.ok, "default primary 8 passes (light)");
  assert.strictEqual(state(light, "Lightness band"), "pass", "in band");
  assert.strictEqual(state(light, "Chroma floor"), "pass", "above chroma floor");
  assert.notStrictEqual(state(light, "CVD separation"), "fail", "CVD not failing");

  // Two near-identical colors collapse under CVD and hard-fail.
  const collapse = validate(["#2f9e44", "#33a048"], {pairs: "all"});
  assert.strictEqual(state(collapse, "CVD separation"), "fail", "near-identical greens collapse");
  assert.ok(!collapse.ok, "collapse is not ok");
  assert.strictEqual(collapse.checks.length, 4, "four categorical checks");

  // A too-light color trips the lightness band and (usually) contrast.
  const tooLight = validate(["#eeeeee", "#4c6ef5"], {mode: "light"});
  assert.strictEqual(state(tooLight, "Lightness band"), "fail", "near-white out of band");
});

it("validate — ordinal ramp", () => {
  // A proper single-hue ramp passes the ordinal checks…
  const good = ramp(defaults.sequential, 5, {ordinal: true});
  const okResult = validate(good, {ordinal: true, mode: "light"});
  assert.ok(okResult.ok, "OKLab ordinal ramp passes");
  assert.strictEqual(okResult.checks.length, 4, "four ordinal checks");
  assert.strictEqual(state(okResult, "Single hue"), "pass", "single hue");
  assert.strictEqual(state(okResult, "Lightness monotone"), "pass", "monotone");

  // …a multi-hue set fails "Single hue".
  const multi = validate(["#cde2fb", "#e03131", "#2f9e44"], {ordinal: true});
  assert.strictEqual(state(multi, "Single hue"), "fail", "multi-hue is not a ramp");
});
