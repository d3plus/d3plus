/**
    Venn's tooltip rows: a region's size (every item in all of its sets),
    then, when smaller regions lie inside it, the count in it alone.
*/

import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "../viz/vizTypes.js";
import {exclusiveCounts} from "./applyLayout.js";
import {rowSize, sourceRow} from "./vennData.js";

/** The tooltip rows for a region's row. */
export function vennTooltipRows(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): [string, string][] {
  if (!d) return [];
  const row = sourceRow(d);
  const format = viz.schema.valueFormat as (v: number, d: DataPoint) => string;
  const size = rowSize(viz, row, i);
  const rows: [string, string][] = [];
  if (Number.isFinite(size))
    rows.push([viz.schema.translate("Value"), `${format(size, row)}`]);
  const only = exclusiveCounts(viz).get(row);
  if (only !== undefined && Number.isFinite(only) && only !== size)
    rows.push([
      viz.schema.translate("Only in This Region"),
      `${format(only, row)}`,
    ]);
  return rows;
}
