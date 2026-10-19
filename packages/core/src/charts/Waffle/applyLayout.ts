/**
    `applyWaffleLayout` — Waffle's chart-specific layout stage: sorts the
    categories, allocates their cells, and places every cell in the grid.
*/

import type {DataPoint} from "@d3plus/data";

import type {TransformStage} from "../pipeline/stages.js";
import {chartBounds} from "../features/chartGeometry.js";
import {stampShare} from "../features/shareKey.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  waffleCellGeometry,
  waffleCellPosition,
  waffleCounts,
  waffleGrid,
} from "./waffleLayout.js";
import type {WaffleFillDirection, WaffleFillStart} from "./waffleLayout.js";

/** One laid-out cell: its category's row and the cell's square in the grid. */
export interface WaffleCell {
  __d3plus__: true;
  /** The category's merged row. */
  data: DataPoint;
  /** The category's index in the drawn data. */
  i: number;
  /** A key stable across redraws: the category's ids plus the cell's place in it. */
  id: string;
  /** The cell's place in fill order across the whole grid. */
  k: number;
  /** The cell's place within its category. */
  n: number;
  row: number;
  column: number;
  x: number;
  y: number;
  size: number;
  /** The category's share of the total. */
  share: number;
}

const FILL_STARTS: WaffleFillStart[] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

/** The fill options from the schema, falling back to the defaults. */
export function waffleFillOptions(viz: VizInstance): {
  fillDirection: WaffleFillDirection;
  fillStart: WaffleFillStart;
  unit?: number;
} {
  const fillStart = viz.schema.fillStart as WaffleFillStart;
  const unit = Number(viz.schema.unit);
  return {
    fillDirection: viz.schema.fillDirection === "column" ? "column" : "row",
    fillStart: FILL_STARTS.includes(fillStart) ? fillStart : "top-left",
    unit: unit > 0 && Number.isFinite(unit) ? unit : undefined,
  };
}

export const applyWaffleLayout: TransformStage = ({viz}) => {
  const data = (viz._filteredData ?? []) as DataPoint[];
  if (!data.length) return {shapeData: []};

  const sumFn = viz.schema.sum as (d: DataPoint, i: number) => number;
  const sort = viz.schema.sort as
    ((a: DataPoint, b: DataPoint) => number) | null;
  const order = data.map((d, i) => i);
  if (typeof sort === "function")
    order.sort((a, b) => sort(data[a], data[b]) || a - b);

  const values = order.map(i => Number(sumFn(data[i], i)));
  const total = values.reduce(
    (a, v) => a + (Number.isFinite(v) && v > 0 ? v : 0),
    0,
  );
  const shares = values.map(v =>
    total && Number.isFinite(v) && v > 0 ? v / total : 0,
  );
  order.forEach((i, c) => stampShare(data[i], shares[c]));

  const {fillDirection, fillStart, unit} = waffleFillOptions(
    viz as VizInstance,
  );
  const size = waffleGrid(0, {
    rows: Number(viz.schema.rows),
    columns: Number(viz.schema.columns),
    fillDirection,
  });
  const counts = waffleCounts(values, {cells: size.rows * size.columns, unit});
  const filled = counts.reduce((a, b) => a + b, 0);
  const grid = waffleGrid(filled, {...size, fillDirection, unit});

  const {width, height} = chartBounds(viz);
  const geometry = waffleCellGeometry(width, height, {
    ...grid,
    padding: Number(viz.schema.cellPadding) || 0,
  });
  const pitch = geometry.size + geometry.padding;

  const shapeData: WaffleCell[] = [];
  let k = 0;
  order.forEach((i, c) => {
    const d = data[i];
    const id = viz._ids(d, i).join("-");
    const share = shares[c];
    for (let n = 0; n < counts[c]; n++, k++) {
      const pos = waffleCellPosition(k, {...grid, fillDirection, fillStart});
      shapeData.push({
        __d3plus__: true,
        data: d,
        i,
        id: `${id}-${n}`,
        k,
        n,
        ...pos,
        x: geometry.x + pos.column * pitch,
        y: geometry.y + pos.row * pitch,
        size: geometry.size,
        share,
      });
    }
  });

  viz.ctx.waffleTotal = total;
  viz.ctx.waffleGrid = grid;
  viz.ctx.waffleGeometry = geometry;

  return {shapeData};
};
