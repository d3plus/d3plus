import assert from "assert";
import it from "../jsdom.js";
import {BarChart, resolveSpec} from "../../es/index.js";

/**
    `resolveSpec(viz)` is the config/context boundary — snapshots
    user-settable config into a frozen ResolvedSpec so the pipeline can in
    time stop mutating `this` and instead transform
    `(spec, prevCtx) → Partial<VizContext>` purely.

    It delegates to `viz.config()` reflection + Object.freeze. These tests
    lock the surface so a future evolution can swap the internals without
    breaking consumers.
*/

it("resolveSpec is exported and is a function", () => {
  assert.strictEqual(typeof resolveSpec, "function");
});

it("resolveSpec returns a frozen object mirroring viz.config()", () => {
  const chart = new BarChart()
    .baseline(7)
    .barPadding(3)
    .width(640);
  const spec = resolveSpec(chart);
  assert.ok(spec, "spec returned");
  assert.ok(Object.isFrozen(spec), "spec is frozen");
  assert.strictEqual(spec.baseline, 7, "baseline value preserved");
  assert.strictEqual(spec.barPadding, 3, "barPadding value preserved");
  assert.strictEqual(spec.width, 640, "width value preserved");
});

it("resolveSpec snapshots are independent of subsequent viz mutations", () => {
  const chart = new BarChart().width(100);
  const spec = resolveSpec(chart);
  // Mutate the chart after taking the snapshot.
  chart.width(200);
  // Re-snapshot — the original spec is independent.
  assert.strictEqual(spec.width, 100, "original spec captures the prior width");
  const spec2 = resolveSpec(chart);
  assert.strictEqual(spec2.width, 200, "fresh spec reflects current state");
});

it("resolveSpec is safe to call on an instance without arguments", () => {
  // Just making sure it doesn't throw on the bare default chart.
  assert.doesNotThrow(() => resolveSpec(new BarChart()));
});
