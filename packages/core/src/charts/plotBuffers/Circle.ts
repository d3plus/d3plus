import type Plot from "../Plot/index.js";
import discreteBuffer from "./discreteBuffer.js";
import numericBuffer from "./numericBuffer.js";
import type {D3Scale} from "../../utils/index.js";

/**
    @module circleBuffer
    Adds a buffer to either side of the non-discrete axis.


    @param buffer Defaults to the radius of the largest Circle.
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
    yScale,
    xScale,
    config,
    buffer,
  }: {
    data: Record<string, unknown>[];
    x: D3Scale;
    y: D3Scale;
    x2?: D3Scale;
    y2?: D3Scale;
    yScale?: string;
    xScale?: string;
    config?: Record<string, (...args: unknown[]) => unknown>;
    buffer?: number;
  },
): [unknown, unknown] {
  x = x.copy();
  y = y.copy();

  const xKey = x2 ? "x2" : "x";
  const yKey = y2 ? "y2" : "y";

  let xD = x.domain().slice() as number[],
    yD = y.domain().slice() as number[];

  const xR = x.range(),
    yR = y.range();

  if (!x.invert && x.padding) discreteBuffer(x, data, this.schema.discrete);
  if (!y.invert && y.padding) discreteBuffer(y, data, this.schema.discrete);

  if (x.invert || y.invert) {
    data.forEach((d: Record<string, unknown>) => {
      const s = buffer ? buffer : (config?.r as (...args: unknown[]) => number)(d.data, d.i) * 2;

      if (x.invert) {
        xD = numericBuffer(x, xScale ?? "linear", d[xKey] as number, s, xR, xD, 0, false);
        xD = numericBuffer(x, xScale ?? "linear", d[xKey] as number, s, xR, xD, 1, false);
      }

      if (y.invert) {
        yD = numericBuffer(y, yScale ?? "linear", d[yKey] as number, s, yR, yD, 0, true);
        yD = numericBuffer(y, yScale ?? "linear", d[yKey] as number, s, yR, yD, 1, true);
      }
    });
  }

  return [x, y];
}
