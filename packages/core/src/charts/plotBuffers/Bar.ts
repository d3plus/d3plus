import {groups, max, min, sum} from "d3-array";
import type Plot from "../Plot/index.js";
import type {D3Scale} from "../../utils/index.js";

/**
    @module barBuffer
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
    x: D3Scale;
    y: D3Scale;
    x2?: D3Scale;
    y2?: D3Scale;
    buffer?: number;
  },
): [unknown, unknown] {
  const xKey = x2 ? "x2" : "x";
  const yKey = y2 ? "y2" : "y";

  const oppScale = this.schema.discrete === "x" ? y : x;

  const oppDomain = oppScale.domain().slice() as number[];

  const isDiscreteX = this.schema.discrete === "x";

  if (isDiscreteX) oppDomain.reverse();

  let negVals: number[], posVals: number[];
  if (this.schema.stacked) {
    const groupedData = groups(
      data,
      (d: Record<string, unknown>) => `${d[this.schema.discrete]}_${d.group}`,
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
    const allValues = data.map(
      (d: Record<string, unknown>) => d[isDiscreteX ? yKey : xKey] as number,
    );
    posVals = allValues.filter((d: number) => d > 0);
    negVals = allValues.filter((d: number) => d < 0);
  }

  let bMax = oppScale(max(posVals) as number);
  if (isDiscreteX ? bMax < oppScale(0) : bMax > oppScale(0))
    bMax += isDiscreteX ? -buffer : buffer;
  bMax = oppScale.invert!(bMax);

  let bMin = oppScale(min(negVals) as number);
  if (isDiscreteX ? bMin > oppScale(0) : bMin < oppScale(0))
    bMin += isDiscreteX ? buffer : -buffer;
  bMin = oppScale.invert!(bMin);

  if (bMax > oppDomain[1]) oppDomain[1] = bMax;
  if (bMin < oppDomain[0]) oppDomain[0] = bMin;

  if (isDiscreteX) oppDomain.reverse();

  oppScale.domain(oppDomain);

  return [x, y];
}
