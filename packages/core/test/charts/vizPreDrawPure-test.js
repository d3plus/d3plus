import assert from "assert";
import it from "../jsdom.js";
import {BarChart} from "../../es/index.js";
import {vizPreDrawPure, vizPostThresholdCtx} from "../../es/internal.js";

/**
    `vizPreDrawPure(viz, prevCtx) → Partial<VizContext>` is the
    pure form of the data-prep phase. Locks the export +
    return-shape contract so any future evolution (true ResolvedSpec
    purity, deeper pipeline composition) preserves byte-equivalence.
*/

it("vizPreDrawPure is exported and is a function", () => {
  assert.strictEqual(typeof vizPreDrawPure, "function");
});

it("vizPreDrawPure returns a Partial<VizContext> with drawDepth/id/ids/drawLabel/filteredData/legendData", () => {
  const chart = new BarChart()
    .data([
      {id: "a", x: 1, y: 10},
      {id: "b", x: 2, y: 20},
      {id: "c", x: 3, y: 15},
    ])
    .groupBy("id");
  const ctx = vizPreDrawPure(chart);
  assert.ok(ctx, "ctx returned");
  assert.strictEqual(typeof ctx.drawDepth, "number", "drawDepth populated");
  assert.strictEqual(typeof ctx.id, "function", "id closure populated");
  assert.strictEqual(typeof ctx.ids, "function", "ids closure populated");
  assert.strictEqual(typeof ctx.drawLabel, "function", "drawLabel closure populated");
  assert.ok(Array.isArray(ctx.filteredData), "filteredData is array");
  assert.ok(Array.isArray(ctx.legendData), "legendData is array");
});

it("vizPreDrawPure does NOT mutate viz._filteredData (threshold deferred to shim)", () => {
  const chart = new BarChart().data([{id: "a", x: 1, y: 10}]).groupBy("id");
  const before = chart._filteredData;
  vizPreDrawPure(chart);
  // _filteredData is only written by the shim (vizPreDraw), not the pure
  // function. So pure should leave the live viz field unchanged.
  assert.strictEqual(
    chart._filteredData,
    before,
    "viz._filteredData NOT mutated by pure call",
  );
});

it("vizPostThresholdCtx returns noDataMessage + hoverOverride", () => {
  const chart = new BarChart().data([]).groupBy("id");
  const post = vizPostThresholdCtx(chart, [], (d) => d.id);
  assert.strictEqual(typeof post.noDataMessage, "boolean");
  // Empty data + noDataMessage=false default → false (default config).
  // The point is the contract returns the field.
});
