/**
    DotPlot's circle placements: Plot's swarm mode resolves the value axis and
    the category lanes, and this lays each lane's dots out in Wilkinson stacks
    (see `dotLayout.ts`) in place of the swarm's packing.
*/

import type {DataPoint} from "@d3plus/data";

import type {
  SwarmPaintInputs,
  SwarmPlacement,
  SwarmState,
} from "../Plot/swarm.js";
import {uniqueIds} from "../../shapes/uniqueIds.js";
import {panelDiameter} from "./facetSize.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  fitDotDiameter,
  groupOrder,
  MIN_DOT_DIAMETER,
  separateStacks,
  stackCenters,
  stackOffsets,
  wilkinsonStacks,
  type StackDirection,
} from "./dotLayout.js";

/** The share of a category's band left empty between its stacks and the next lane's. */
export const LANE_GAP = 0.1;

/**
    The gap between neighboring dots, in pixels: 1, or a quarter of the
    diameter for dots smaller than 4 pixels.
    @param diameter The distance between dot centers.
*/
export const dotGap = (diameter: number): number => Math.min(1, diameter / 4);

const positive = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) && v > 0 ? v : undefined;

/**
    The pixel width of `width` data units along the value axis, measured
    from the smallest value.
*/
function binWidthPixels(
  scale: SwarmPaintInputs["x"],
  axis: "x" | "y",
  values: number[],
  width: number,
): number {
  const start = Math.min(...values);
  return Math.abs(scale(start + width, axis) - scale(start, axis));
}

/** A lane's rows, their values, and their pixel positions along the value axis. */
interface Lane {
  rows: DataPoint[];
  data: number[];
  pixels: number[];
}

/**
    The distance between dot centers: twice `dotRadius` when set; with a
    `binWidth`, the bin's pixel width, shrunk until the tallest stack fits
    `extent`; else the largest that fits (see `fitDotDiameter`). Small
    multiples share the smallest size any panel fits.
*/
function dotDiameter(
  viz: VizInstance,
  lanes: Lane[],
  extent: number,
  binPixels: (values: number[], width: number) => number,
): number {
  const radius = positive(viz.schema.dotRadius);
  if (radius) return radius * 2;
  const binWidth = positive(viz.schema.binWidth);
  const finite = lanes.flatMap(g => g.data.filter(Number.isFinite));
  let diameter: number;
  if (binWidth && finite.length) {
    const tallest = Math.max(
      1,
      ...lanes.map(g =>
        Math.max(0, ...wilkinsonStacks(g.data, binWidth).map(s => s.length)),
      ),
    );
    diameter = Math.max(
      MIN_DOT_DIAMETER,
      Math.min(binPixels(finite, binWidth), extent / tallest),
    );
  } else
    diameter = fitDotDiameter(
      lanes.map(g => g.pixels),
      {extent},
    );
  return panelDiameter(viz, diameter);
}

/**
    Lays out a DotPlot's dots, lane by lane: each lane's values are swept into
    stacks one dot wide (`binWidth` data units when set, else one dot's
    diameter in pixels), each stack starts at the mean of its values and
    is pushed off any neighbor it overlaps until they just touch, and its
    dots, ordered by group, pile up from the lane's baseline (or center, with
    `stackDirection: "center"`). Every lane shares one dot size: `dotRadius`
    when set, else the largest that fits the tallest stack in its lane (the
    smallest any panel fits, in small multiples).
    Returns each row's placement, keyed by row.
*/
export function dotPlacements(
  viz: VizInstance,
  inputs: SwarmPaintInputs,
): Map<DataPoint, SwarmPlacement> {
  const {axis, cross, lanes: hasLanes} = viz._swarm as SwarmState;
  const valueFn = axis === "x" ? inputs.x : inputs.y;
  const crossFn = cross === "x" ? inputs.x : inputs.y;
  const crossRange = cross === "x" ? inputs.xRange : inputs.yRange;
  const span = Math.abs(crossRange[crossRange.length - 1] - crossRange[0]);
  const middle = (crossRange[0] + crossRange[crossRange.length - 1]) / 2;

  const centers = new Map<string, number>();
  if (hasLanes)
    inputs.lanes.forEach(lane => centers.set(`${lane}`, crossFn(lane, cross)));
  const positions = Array.from(centers.values()).sort((a, b) => a - b);
  let band = positions.length > 1 ? Infinity : span;
  for (let i = 1; i < positions.length; i++)
    band = Math.min(band, positions[i] - positions[i - 1]);
  const extent = Math.max(
    0,
    positions.length > 1 ? band * (1 - LANE_GAP) : band,
  );

  const lanes = new Map<string, DataPoint[]>();
  for (const d of inputs.values) {
    const key = `${d[cross]}`;
    if (!lanes.has(key)) lanes.set(key, []);
    lanes.get(key)!.push(d);
  }
  const groups: Lane[] = Array.from(lanes.values()).map(rows => {
    const data = rows.map(d =>
      Number(d[axis] instanceof Date ? +d[axis] : d[axis]),
    );
    return {rows, data, pixels: data.map(v => valueFn(v, axis))};
  });

  const direction: StackDirection =
    viz.schema.stackDirection === "center" ? "center" : "up";
  const binWidth = positive(viz.schema.binWidth);
  const diameter = dotDiameter(viz, groups, extent, (values, width) =>
    binWidthPixels(valueFn, axis, values, width),
  );
  const r = Math.max(0.5, (diameter - dotGap(diameter)) / 2);
  // Stacks pile up the screen (toward smaller y) or to the right.
  const sign = cross === "y" ? -1 : 1;

  // One group order for every lane, so each group keeps its place in every stack.
  const rank = new Map(inputs.values.map((d, i) => [d, i]));
  const order = groupOrder(
    inputs.values.map(d => viz._ids(d.data as DataPoint, d.i as number)),
  );

  // Rows can share an id, so each dot takes a key of its own.
  const keys = uniqueIds(inputs.values.map(d => `${d.id}`));

  const out = new Map<DataPoint, SwarmPlacement>();
  for (const group of groups) {
    const key = `${group.rows[0][cross]}`;
    const center = centers.get(key) ?? middle;
    const base = direction === "center" ? center : center - (sign * extent) / 2;
    const stacks = binWidth
      ? wilkinsonStacks(group.data, binWidth)
      : wilkinsonStacks(group.pixels, diameter);
    // Each stack starts at its mean, and overlapping neighbors are pushed
    // apart until they just touch.
    const at = separateStacks(
      binWidth
        ? stackCenters(group.data, stacks).map(v => valueFn(v, axis))
        : stackCenters(group.pixels, stacks),
      diameter,
    );
    const index = group.rows.map(d => rank.get(d)!);
    stacks.forEach((stack, s) => {
      // By group, then by value (the stack's own order).
      const sorted = stack
        .map((i, k) => [i, k])
        .sort((a, b) => order(index[a[0]], index[b[0]]) || a[1] - b[1])
        .map(([i]) => i);
      const offsets = stackOffsets(sorted.length, diameter, direction);
      sorted.forEach((i, k) => {
        const along = base + sign * offsets[k];
        out.set(group.rows[i], {
          x: axis === "x" ? at[s] : along,
          y: axis === "x" ? along : at[s],
          r,
          key: keys[index[i]],
        });
      });
    });
  }
  return out;
}
