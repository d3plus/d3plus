/**
    Hexbin's axis buffer (see `Plot.buffer`): fits each axis to its numeric
    observations and pads it by a bin, so the outermost bins sit inside the
    plot.

    @module
*/

import {extent} from "d3-array";

import type {D3Scale} from "../../utils/index.js";
import numericBuffer from "../plotBuffers/numericBuffer.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {isNumeric} from "./layers.js";
import {hexbinSettings} from "./settings.js";

/** Pads one axis's domain so `values`' extremes sit `size` pixels inside it. */
function padAxis(
  scale: D3Scale,
  type: string,
  values: unknown[],
  size: number,
  vertical: boolean,
): void {
  if (!scale.invert) return;
  const [lo, hi] = extent(values.filter(isNumeric));
  if (lo === undefined || hi === undefined) return;
  let domain = (scale.domain() as number[]).slice();
  domain = numericBuffer(scale, type, lo, size, domain, 0, vertical);
  numericBuffer(scale, type, hi, size, domain, 1, vertical);
}

export function hexbinBuffer(
  this: VizInstance,
  {
    data,
    x,
    y,
    x2,
    y2,
    xScale,
    yScale,
  }: {
    data: Record<string, unknown>[];
    x: D3Scale;
    y: D3Scale;
    x2?: boolean;
    y2?: boolean;
    xScale?: string;
    yScale?: string;
  },
): [D3Scale, D3Scale] {
  if (x2 || y2) return [x, y];
  const {size} = hexbinSettings(this);
  x = x.copy();
  y = y.copy();
  padAxis(
    x,
    xScale ?? "linear",
    data.map(d => d.x),
    size,
    false,
  );
  padAxis(
    y,
    yScale ?? "linear",
    data.map(d => d.y),
    size,
    true,
  );
  return [x, y];
}
