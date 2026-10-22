import {groups, max, min, sum} from "d3-array";
import type Plot from "../Plot/index.js";
import type {D3Scale} from "../../utils/index.js";

/** What sets a bar's axis buffer apart from a box's. */
export interface RectLikeBufferOptions {
  /** The key stacked rows share (see `Plot.stacked`). */
  stackKey: (d: Record<string, unknown>, discrete: string) => unknown;
  /**
      Whether the marks grow from 0: positive and negative values are
      buffered apart, and only on the side away from 0.
  */
  fromZero: boolean;
}

/**
    Builds a buffer function that pads either end of the non-discrete axis so
    rect-like marks (bars, boxes) don't touch its edges.
    @param opts What sets this mark's buffer apart.
*/
export function rectLikeBuffer({stackKey, fromZero}: RectLikeBufferOptions) {
  return function (
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
      const groupedData = groups(data, (d: Record<string, unknown>) =>
        stackKey(d, this.schema.discrete),
      ).map(([, values]: [unknown, Record<string, unknown>[]]) =>
        values.map(
          (x: Record<string, unknown>) =>
            x[isDiscreteX ? yKey : xKey] as number,
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
      posVals = fromZero ? allValues.filter((d: number) => d > 0) : allValues;
      negVals = fromZero ? allValues.filter((d: number) => d < 0) : allValues;
    }

    let bMax = oppScale(max(posVals) as number);
    if (!fromZero || (isDiscreteX ? bMax < oppScale(0) : bMax > oppScale(0)))
      bMax += isDiscreteX ? -buffer : buffer;
    bMax = oppScale.invert!(bMax);

    let bMin = oppScale(min(negVals) as number);
    if (!fromZero || (isDiscreteX ? bMin > oppScale(0) : bMin < oppScale(0)))
      bMin += isDiscreteX ? buffer : -buffer;
    bMin = oppScale.invert!(bMin);

    if (bMax > oppDomain[1]) oppDomain[1] = bMax;
    if (bMin < oppDomain[0]) oppDomain[0] = bMin;

    if (isDiscreteX) oppDomain.reverse();

    oppScale.domain(oppDomain);

    return [x, y];
  };
}
