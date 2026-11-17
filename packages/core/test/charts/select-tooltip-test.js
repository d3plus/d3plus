import {it} from "vitest";
import assert from "assert";
import {selectionTooltipRows} from "../../src/charts/drawSteps/selectTooltip.ts";

const rows = ["a", "b", "c", "d"].map((id, i) => ({id, value: i + 1}));
const scene = rows.map((d, i) => ({
  type: "rect",
  key: d.id,
  index: i,
  datum: d,
}));
const chart = selection => ({_chartScene: scene, _selection: selection});

it("selectionTooltipRows: a hovered selected row shows every selected row", () => {
  const viz = chart(d => d.id === "a" || d.id === "c");
  assert.deepStrictEqual(selectionTooltipRows(viz, rows[2]), [
    rows[0],
    rows[2],
  ]);
  assert.deepStrictEqual(
    selectionTooltipRows(viz, {__d3plus__: true, data: rows[0]}),
    [rows[0], rows[2]],
    "through a wrapped datum",
  );
});

it("selectionTooltipRows: null off the selection, for one row, or for every row", () => {
  assert.strictEqual(selectionTooltipRows(chart(false), rows[0]), null);
  assert.strictEqual(
    selectionTooltipRows(
      chart(d => d.id !== "d"),
      rows[3],
    ),
    null,
    "a row outside it",
  );
  assert.strictEqual(
    selectionTooltipRows(
      chart(d => d.id === "a"),
      rows[0],
    ),
    null,
    "one row",
  );
  assert.strictEqual(
    selectionTooltipRows(
      chart(() => true),
      rows[0],
    ),
    null,
    "every row",
  );
  assert.strictEqual(
    selectionTooltipRows(
      chart(() => true),
      undefined,
    ),
    null,
  );
});
