import {max} from "d3-array";
import type Plot from "../Plot.js";

/**
    @module lineBuffer
    @desc Adds a buffer to either side of the non-discrete axis.
    @param {Array} data
    @param {D3Scale} x
    @param {D3Scale} y
    @param {Object} [config]
    @param {Number} [buffer] Defaults to the radius of the largest Circle.
    @private
*/
export default function (
  this: Plot,
  {
    data,
    x,
    y,
    x2,
    y2,
  }: {data: Record<string, unknown>[]; x: any; y: any; x2?: any; y2?: any},
): [unknown, unknown] {
  const xKey = x2 ? "x2" : "x";
  const yKey = y2 ? "y2" : "y";

  const s = this._discrete === "x" ? y : x;

  const d = s.domain().slice();

  if (this._discrete === "x") d.reverse();

  const vals = data.map(
    (d: Record<string, unknown>) => d[this._discrete === "x" ? yKey : xKey],
  ) as number[];
  const b = s.invert(
    s(max(vals) as number) + (this._discrete === "x" ? -10 : 10),
  );

  if (b > d[1]) d[1] = b;

  if (this._discrete === "x") d.reverse();

  s.domain(d);

  return [x, y];
}
