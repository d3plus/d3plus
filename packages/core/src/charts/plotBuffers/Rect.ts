import type Plot from "../Plot.js";
import discreteBuffer from "./discreteBuffer.js";
import numericBuffer from "./numericBuffer.js";

/**
    @module rectBuffer
    Adds a buffer to either side of the non-discrete axis.


    @param buffer Defaults to the width/height of the largest Rect.
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
  }: {
    data: Record<string, unknown>[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    x: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    x2?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y2?: any;
    yScale?: string;
    xScale?: string;
    config?: Record<string, (...args: unknown[]) => unknown>;
  },
): [unknown, unknown] {
  x = x.copy();
  y = y.copy();

  const xKey = x2 ? "x2" : "x";
  const yKey = y2 ? "y2" : "y";

  let xD = x.domain().slice(),
    yD = y.domain().slice();

  const xR = x.range(),
    yR = y.range();

  if (!x.invert && x.padding) discreteBuffer(x, data, this.schema.discrete);
  if (!y.invert && y.padding) discreteBuffer(y, data, this.schema.discrete);

  if (x.invert || y.invert) {
    data.forEach((d: Record<string, unknown>) => {
      if (x.invert) {
        const w = (config?.width as (...args: unknown[]) => number)(d.data, d.i);
        xD = numericBuffer(x, xScale ?? "linear", d[xKey] as number, w, xR, xD, 0, false);
        xD = numericBuffer(x, xScale ?? "linear", d[xKey] as number, w, xR, xD, 1, false);
      }

      if (y.invert) {
        const h = (config?.height as (...args: unknown[]) => number)(d.data, d.i);
        yD = numericBuffer(y, yScale ?? "linear", d[yKey] as number, h, yR, yD, 0, true);
        yD = numericBuffer(y, yScale ?? "linear", d[yKey] as number, h, yR, yD, 1, true);
      }
    });
  }

  return [x, y];
}
