/**
    The scene side of a Plot's `connectGaps`: each line's gaps, read from its
    rows, and the edits that break the line there. A line keeps its one path
    through every point, so it follows its curve across a gap; its dash array
    leaves the gaps out, its hit area stops at them, and a bridge (the same
    path, drawn only across the gaps) is decoration that takes no pointer or
    keyboard focus. Confidence bands are clipped to the runs between gaps.
*/
import type {GroupNode, SceneNode} from "@d3plus/render";

import {parseDash} from "../../shapes/Shape.js";
import type {PlotDatum} from "../features/plotPaint.js";
import type {ShapeEmitContext} from "../features/shapeEmit.js";
import {
  complementIntervals,
  gapsAfter,
  intersectIntervals,
  intervalsDash,
  patternIntervals,
  pointLengths,
  resolveConnectGaps,
  runIndices,
  runPath,
  type GapBridge,
  type Interval,
} from "./connectGaps.js";
import {curvePolyline} from "./curveLength.js";
import {discreteRank} from "./forecast.js";
import {lineCurve} from "./lineCurve.js";

type Point = [number, number];

/** One line's gaps, measured along its path. */
export interface SeriesGaps {
  /** The line's points, in plot space and drawn order. */
  points: Point[];
  /** The indices a gap follows. */
  gaps: number[];
  /** The stretches of the path that cross a gap. */
  gapIntervals: Interval[];
  /** The path's length. */
  total: number;
}

/** Every gapped line of a Line group, by series id, and how to draw the gaps. */
export interface LineGaps {
  series: Map<string, SeriesGaps>;
  bridge: GapBridge | null;
  curve: string;
  /** `0` when the discrete axis is x, `1` when it is y. */
  axis: 0 | 1;
}

/** Far enough past the plot that a clip band reaches every edge. */
const FAR = 1e5;

/**
    The gaps in each line of a Line group, or null when `connectGaps` draws
    lines straight through them or no line has one. A gap is a step of the
    discrete axis that some line in the group has and this one skips, or one
    of this line's own rows whose value can't be plotted (`null`, `NaN`).
    @param ctx The Line group's emit context.
*/
export function lineGaps(ctx: ShapeEmitContext): LineGaps | null {
  const {viz, values} = ctx;
  const setting = resolveConnectGaps(viz.schema.connectGaps);
  if (!setting || !values.length) return null;
  const rows = values as PlotDatum[];
  const missing = ctx.missingRows ?? [];
  const discrete = viz.schema.discrete === "y" ? "y" : "x";
  const axis = discrete === "y" ? 1 : 0;
  const rank = discreteRank([
    ...rows.map(d => d[discrete]),
    ...missing.map(d => d[discrete]),
  ]);
  const steps = rows.map(d => rank(d[discrete]));
  const ownMissing = new Map<string, number[]>();
  missing.forEach(d => {
    const id = `${d.id}`;
    if (!ownMissing.has(id)) ownMissing.set(id, []);
    ownMissing.get(id)!.push(rank(d[discrete]));
  });
  const bySeries = new Map<string, PlotDatum[]>();
  rows.forEach(d => {
    const id = `${d.id}`;
    if (!bySeries.has(id)) bySeries.set(id, []);
    bySeries.get(id)!.push(d);
  });

  const px = ctx.shapeConfig.x as (d: PlotDatum) => number;
  const py = ctx.shapeConfig.y as (d: PlotDatum) => number;
  const curve = lineCurve(viz, rows[0]);
  const series = new Map<string, SeriesGaps>();
  bySeries.forEach((list, id) => {
    const gaps = gapsAfter(
      list.map(d => rank(d[discrete])),
      steps.concat(ownMissing.get(id) ?? []),
    );
    if (!gaps.length) return;
    const points = list.map(d => [px(d), py(d)] as Point);
    const {at, total} = pointLengths(
      curvePolyline(points, curve),
      axis,
      points.map(p => p[axis]),
    );
    const gapIntervals = gaps.map(k => [at[k], at[k + 1]] as Interval);
    series.set(id, {points, gaps, gapIntervals, total});
  });
  if (!series.size) return null;
  return {series, bridge: setting.bridge, curve, axis};
}

/** The series id a Line or Area node draws, read from its first point's row. */
function seriesOf(node: SceneNode): string | undefined {
  const first = node.interactionPoints?.[0]?.datum as PlotDatum | undefined;
  return first ? `${first.id}` : undefined;
}

/** The dash array that draws `own`'s pattern along a line's runs and leaves its gaps empty. */
function brokenDash(own: number[] | undefined, line: SeriesGaps): number[] {
  const runs = complementIntervals(line.gapIntervals, line.total);
  return intervalsDash(
    intersectIntervals(patternIntervals(own, 0, line.total), runs),
    line.total,
  );
}

/** A non-interactive copy of a line drawn only across its gaps, in the bridge's style. */
function bridgeNode(
  node: SceneNode,
  line: SeriesGaps,
  bridge: GapBridge,
): SceneNode {
  const paint = node.paint ?? {};
  const dash = intervalsDash(
    line.gapIntervals.flatMap(([start, end]) =>
      patternIntervals(bridge.strokeDasharray, start, end),
    ),
    line.total,
  );
  return {
    ...node,
    key: `${node.key}::gap`,
    interactive: false,
    interactionPoints: undefined,
    aria: {hidden: true},
    paint: {
      ...paint,
      stroke: bridge.stroke ?? paint.stroke,
      strokeWidth: bridge.strokeWidth ?? paint.strokeWidth,
      strokeDasharray: dash,
      opacity: (paint.opacity ?? 1) * bridge.opacity,
    },
  } as SceneNode;
}

/**
    Breaks each gapped line among a Line group's nodes: the line's dash array
    leaves its gaps empty, its hit area stops at them, and a bridge follows
    it when `connectGaps` asks for one.
    @param nodes The Line shape's computed nodes.
    @param gaps The group's gaps (see `lineGaps`).
*/
export function breakLines(nodes: SceneNode[], gaps: LineGaps): SceneNode[] {
  return nodes.flatMap(node => {
    if (node.type !== "path" || node.shapeType !== "Line") return [node];
    const id = seriesOf(node);
    const line = id === undefined ? undefined : gaps.series.get(id);
    if (!line) return [node];
    const tx = node.transform?.x ?? 0,
      ty = node.transform?.y ?? 0;
    if (String(node.key).endsWith("::hit")) {
      const local = line.points.map(([x, y]) => [x - tx, y - ty] as Point);
      return [{...node, d: runPath(local, line.gaps, gaps.curve, gaps.axis)}];
    }
    const own = parseDash(node.paint?.strokeDasharray);
    const broken = {
      ...node,
      paint: {...node.paint, strokeDasharray: brokenDash(own, line)},
    } as SceneNode;
    return gaps.bridge
      ? [broken, bridgeNode(node, line, gaps.bridge)]
      : [broken];
  });
}

/** A clip path covering a line's runs along the discrete axis, open past its ends. */
function runsClip(line: SeriesGaps, axis: 0 | 1): string {
  const {points} = line;
  const runs = runIndices(points.length, line.gaps);
  // Which way the line runs in pixels: `false` on a reversed axis.
  const forward = points[points.length - 1][axis] >= points[0][axis];
  return runs
    .map(([first, last], k) => {
      const a = points[first][axis],
        b = points[last][axis];
      let lo = Math.min(a, b),
        hi = Math.max(a, b);
      // The first run reaches back past the line's start, the last on past its end.
      if (!k && forward) lo = -FAR;
      if (!k && !forward) hi = FAR;
      if (k === runs.length - 1 && forward) hi = FAR;
      if (k === runs.length - 1 && !forward) lo = -FAR;
      return axis
        ? `M${-FAR},${lo}H${FAR}V${hi}H${-FAR}Z`
        : `M${lo},${-FAR}H${hi}V${FAR}H${lo}Z`;
    })
    .join("");
}

/**
    Clips each gapped line's confidence bands to the runs between its gaps,
    so no band spans a stretch with no value.
    @param nodes The band Areas' computed nodes.
    @param gaps The group's gaps (see `lineGaps`).
*/
export function clipBands(nodes: SceneNode[], gaps: LineGaps): SceneNode[] {
  return nodes.map(node => {
    const id = seriesOf(node);
    const line = id === undefined ? undefined : gaps.series.get(id);
    if (!line || node.shapeType !== "Area") return node;
    const group: GroupNode = {
      type: "group",
      key: `${node.key}::gaps`,
      clip: {type: "path", d: runsClip(line, gaps.axis)},
      children: [node],
    };
    return group;
  });
}
