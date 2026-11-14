/**
    ScatterMatrix's linked hover: a point highlights its observation in
    every panel, and a histogram bar highlights the observations in its bin
    (of its group) in every panel, with the bar itself.

    @module
*/
import type {DataPoint} from "@d3plus/data";

import {matrixMeta} from "./matrixData.js";
import type {MatrixBin, RowFn} from "./matrixData.js";

/** Whether `value` falls in `bin`'s range. */
export function inBin(
  bin: Pick<MatrixBin, "x0" | "x1" | "last">,
  value: unknown,
): boolean {
  if (typeof value !== "number" || !Number.isFinite(value)) return false;
  return value >= bin.x0 && (value < bin.x1 || (bin.last && value === bin.x1));
}

/**
    The hover filter for a hovered mark: the marks of the same observation
    for a point; for a bar, the bar and the points of its group whose value
    on its dimension falls in its bin. Undefined for a mark that isn't one
    of the matrix's.
    @param target The hovered mark's datum.
    @param dims Each dimension's accessor, in matrix order.
    @param group Each row's group key, as the bins were grouped.
*/
export function matrixHoverFilter(
  target: DataPoint,
  dims: RowFn[],
  group: (d: DataPoint, i: number) => string,
): ((h: DataPoint, i: number) => boolean) | undefined {
  const meta = matrixMeta(target);
  if (!meta) return undefined;
  if (meta.kind === "point")
    return h => {
      const m = matrixMeta(h);
      return m?.kind === "point" && m.row === meta.row;
    };
  const read = dims[meta.i];
  return (h, i) => {
    const m = matrixMeta(h);
    if (!m) return false;
    if (m.kind === "bin")
      return m.i === meta.i && m.x0 === meta.x0 && m.group === meta.group;
    let row = h;
    while (row && row.__d3plus__ && row.data) row = row.data as DataPoint;
    return !!read && group(row, i) === meta.group && inBin(meta, read(row, i));
  };
}
