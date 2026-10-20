/**
    Pure Icicle geometry: the band each hierarchy depth occupies along the
    depth axis, the rectangle a node fills, and where a node a zoom removes
    (or brings back) collapses to.

    A node's breadth extent (`x0`/`x1`) is a share (0–1) of the whole; the
    `orient` decides which screen axis carries it.
*/

/** Which way the levels run: `"horizontal"` puts the root on the left, `"vertical"` on top. */
export type IcicleOrient = "horizontal" | "vertical";

/** A node's rectangle in the chart area. */
export interface IcicleRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The chart area a layout fills, and which way its levels run. */
export interface IcicleFrame {
  width: number;
  height: number;
  orient: IcicleOrient;
}

/** The node a zoom-in or zoom-out pivots on: its breadth extent and depth. */
export interface IcicleZoomOrigin {
  x0: number;
  x1: number;
  depth: number;
}

/** The chart area's length along the depth axis and across the breadth. */
export function icicleExtent(frame: IcicleFrame): {
  depth: number;
  breadth: number;
} {
  const {width, height, orient} = frame;
  const w = Math.max(0, width);
  const h = Math.max(0, height);
  return orient === "vertical"
    ? {depth: h, breadth: w}
    : {depth: w, breadth: h};
}

/**
    The [start, end] of every hierarchy depth along the depth axis, depth 0
    being the focused node's slot. Every drawn depth gets an equal share of
    `length`; without a focus, depth 0 is not drawn and collapses to [0, 0] at
    the root edge.
    @param length The chart area's length along the depth axis.
    @param levels The number of levels drawn beyond depth 0.
    @param focused Whether a focused node fills depth 0.
*/
export function icicleBands(
  length: number,
  levels: number,
  focused: boolean,
): [number, number][] {
  const L = Math.max(0, length);
  const slots = Math.max(0, levels) + (focused ? 1 : 0);
  if (slots < 1) return [[0, 0]];
  const size = L / slots;
  const bands: [number, number][] = focused ? [] : [[0, 0]];
  for (let k = 0; k < slots; k++) bands.push([k * size, (k + 1) * size]);
  return bands;
}

/**
    The rectangle a node fills: its band along the depth axis, its breadth
    extent (shares of the whole) across the other.
    @param span The node's breadth extent, 0–1.
    @param band The node's [start, end] along the depth axis.
    @param frame The chart area and orientation.
*/
export function icicleRect(
  span: {x0: number; x1: number},
  band: [number, number],
  frame: IcicleFrame,
): IcicleRect {
  const {breadth} = icicleExtent(frame);
  const b0 = span.x0 * breadth;
  const b1 = span.x1 * breadth;
  const [d0, d1] = band;
  return frame.orient === "vertical"
    ? {x: b0, y: d0, width: b1 - b0, height: d1 - d0}
    : {x: d0, y: b0, width: d1 - d0, height: b1 - b0};
}

/**
    Where a node a zoom removes collapses to (or a node a zoom-out brings back
    starts from): the zoom maps the pivot node's breadth extent onto the whole
    and its depth onto depth 0, so a node outside that extent folds to a
    zero-breadth sliver at the near or far edge, and a node above the pivot
    folds to a zero-length sliver at the root edge — the same mapping the
    nodes that stay follow.
    @param span The node's breadth extent.
    @param depth The node's depth.
    @param origin The pivot node's breadth extent and depth.
    @param bands The target layout's bands (see `icicleBands`).
    @param frame The target layout's chart area and orientation.
*/
export function icicleCollapse(
  span: {x0: number; x1: number},
  depth: number,
  origin: IcicleZoomOrigin,
  bands: [number, number][],
  frame: IcicleFrame,
): IcicleRect {
  const extent = origin.x1 - origin.x0 || 1;
  const map = (t: number): number =>
    Math.min(1, Math.max(0, (t - origin.x0) / extent));
  const level = depth - origin.depth;
  const end = bands[bands.length - 1]?.[1] ?? 0;
  const band: [number, number] =
    level < 0 ? [0, 0] : (bands[level] ?? [end, end]);
  return icicleRect({x0: map(span.x0), x1: map(span.x1)}, band, frame);
}
