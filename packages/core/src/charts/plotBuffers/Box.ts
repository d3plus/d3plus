import {groups, max, min, sum} from "d3-array";
import type Plot from "../Plot.js";

/**
    @module boxBuffer
    Adds a buffer to either side of the non-discrete axis.


    @param buffer @private
*/
export default function (
  this: Plot,
  {
    data,
    x,
    y,
    x2,
    y2,
    buffer = 10,
  }: {
    data: Record<string, unknown>[];
    x: any;
    y: any;
    x2?: any;
    y2?: any;
    buffer?: number;
  },
): [unknown, unknown] {
  const xKey = x2 ? "x2" : "x";
  const yKey = y2 ? "y2" : "y";

  const oppScale = this._discrete === "x" ? y : x;

  const oppDomain = oppScale.domain().slice();

  const isDiscreteX = this._discrete === "x";

  if (isDiscreteX) oppDomain.reverse();

  let negVals: number[], posVals: number[];
  if (this._stacked) {
    const groupedData = groups(
      data,
      (d: Record<string, unknown>) => d[this._discrete],
    ).map(([, values]: [unknown, Record<string, unknown>[]]) =>
      values.map(
        (x: Record<string, unknown>) => x[isDiscreteX ? yKey : xKey] as number,
      ),
    );
    posVals = groupedData.map((arr: number[]) =>
      sum(arr.filter((d: number) => d > 0)),
    );
    negVals = groupedData.map((arr: number[]) =>
      sum(arr.filter((d: number) => d < 0)),
    );
  } else {
    posVals = data.map(
      (d: Record<string, unknown>) => d[isDiscreteX ? yKey : xKey] as number,
    );
    negVals = posVals;
  }

  let bMax = oppScale(max(posVals));
  bMax += isDiscreteX ? -buffer : buffer;
  bMax = oppScale.invert(bMax);

  let bMin = oppScale(min(negVals));
  bMin += isDiscreteX ? buffer : -buffer;
  bMin = oppScale.invert(bMin);

  if (bMax > oppDomain[1]) oppDomain[1] = bMax;
  if (bMin < oppDomain[0]) oppDomain[0] = bMin;

  if (isDiscreteX) oppDomain.reverse();

  oppScale.domain(oppDomain);

  return [x, y];
}
