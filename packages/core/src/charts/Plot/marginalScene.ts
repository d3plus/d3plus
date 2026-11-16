/**
    Paints a Plot's marginal strips (`marginals`): the x axis's distribution
    above the plot and the y axis's right of it, drawn along the plot's own
    axes from the points it plots, one series per legend entry.

    Each mark is drawn on behalf of the points it summarizes: it carries them
    as `interactionPoints` instead of a datum of its own, so hovering a point
    (or a legend entry) lights the bins, boxes and curves holding it, and its
    `marginal` record feeds the tooltip and linked hover in `marginalHover`.

    @module
*/
import type {DataPoint} from "@d3plus/data";
import type {Paint, SceneNode} from "@d3plus/render";

import type {PlotAxisFn, PlotDatum} from "../features/plotPaint.js";
import {swatchOutline} from "../features/swatchPaint.js";
import type {SwatchOutline} from "../features/swatchPaint.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {marginalBands, type MarginalBand} from "./marginalLayout.js";
import type {MarginalConfig} from "../../utils/D3plusConfig.js";
import {
  marginalPaintLayers,
  resolveMarginalPaint,
  type MarginalBoxPart,
  type MarginalRole,
} from "./marginalPaint.js";
import {marginalSeries, type MarginalSeries} from "./marginalSeries.js";
import {
  binMarginal,
  boxMarginal,
  densityMarginal,
  type MarginalBin,
  type MarginalBox,
  type MarginalCurve,
  type MarginalKind,
  type MarginalObservation,
  type MarginalScale,
} from "./marginalStats.js";
import type {ThresholdGenerator} from "../Histogram/binData.js";

/** The interaction group marginal marks are stamped with. */
export const MARGINAL_GROUP = "marginal";

/** The gap between neighboring histogram bins, in pixels. */
export const MARGINAL_BIN_GAP = 1;

/** What a marginal mark stands for. */
export interface MarginalMark {
  axis: "x" | "y";
  kind: MarginalKind;
  series: MarginalSeries;
  /** The source rows of the points it summarizes. */
  rows: DataPoint[];
  bin?: MarginalBin;
  box?: MarginalBox;
  /** A box's outlier: the one point it draws. */
  outlier?: MarginalObservation;
  curve?: MarginalCurve;
  /** The color its tooltip's swatch shows: its fill, or a line's stroke. */
  swatch?: string;
  /** Its tooltip swatch's outline: a filled mark's stroke. */
  swatchOutline?: SwatchOutline;
}

/** A marginal mark's scene node. */
export type MarginalNode = SceneNode & {marginal?: MarginalMark};

/** One strip's drawing context. */
interface Strip {
  axis: "x" | "y";
  band: MarginalBand;
  size: number;
  /** A marginal-space value's pixel position along the strip. */
  along: (value: number) => number;
  series: Map<string, MarginalSeries>;
  config: MarginalConfig;
}

/**
    A mark's paint (and an outlier dot's radius) from `marginalConfig` (see
    `resolveMarginalPaint`), its accessors given the mark and its series'
    index in the strip.
*/
function paintOf(
  strip: Strip,
  mark: MarginalMark,
  role: MarginalRole,
  part?: MarginalBoxPart,
): {paint: Paint; r?: number} {
  const i = [...strip.series.keys()].indexOf(mark.series.key);
  const layers = marginalPaintLayers(strip.config, mark.kind, part);
  return resolveMarginalPaint(layers, role, mark, i);
}

/** Notes the color a mark's tooltip swatch shows. */
function swatch(mark: MarginalMark, paint: Paint): Paint {
  const fill = paint.fill && paint.fill !== "none" ? paint.fill : undefined;
  mark.swatch = fill ?? paint.stroke ?? mark.series.color;
  mark.swatchOutline = fill ? swatchOutline(paint) : undefined;
  return paint;
}

/** The pixel position `share` (0–1) of the way out from the strip's inner edge. */
const across = (strip: Strip, share: number): number => {
  const [inner, outer] = strip.band.across;
  return inner + (outer - inner) * share;
};

/** A point `[along, across]` as `[x, y]` for the strip's axis. */
const xy = (strip: Strip, a: number, c: number): [number, number] =>
  strip.axis === "x" ? [a, c] : [c, a];

/** A rect spanning `[a0, a1]` along the strip and `[c0, c1]` across it. */
function rectNode(
  strip: Strip,
  key: string,
  [a0, a1]: [number, number],
  [c0, c1]: [number, number],
  paint: Paint,
): SceneNode {
  const [x0, y0] = xy(strip, Math.min(a0, a1), Math.min(c0, c1));
  const [w, h] = xy(strip, Math.abs(a1 - a0), Math.abs(c1 - c0));
  return {type: "rect", key, x: x0, y: y0, width: w, height: h, paint};
}

/** Stamps a node as a marginal mark drawn on behalf of `mark.rows`. */
function stamp(node: SceneNode, mark: MarginalMark): MarginalNode {
  const n = node as MarginalNode;
  n.interactionGroup = MARGINAL_GROUP;
  n.marginal = mark;
  // A summary of marks a screen reader reaches on their own (and in the table view).
  n.aria = {hidden: true};
  const box = n.type === "rect" ? n : null;
  const cx = box ? box.x + box.width / 2 : 0,
    cy = box ? box.y + box.height / 2 : 0;
  n.interactionPoints = mark.rows.map((datum, index) => ({
    x: cx,
    y: cy,
    datum,
    index,
  }));
  return n;
}

/** A histogram strip: each series' bins stacked out from the plot. */
function histogramNodes(
  strip: Strip,
  observations: MarginalObservation[],
  domain: [number, number],
  thresholds: unknown,
): SceneNode[] {
  const {bins, max} = binMarginal(
    observations,
    domain,
    [...strip.series.keys()],
    thresholds as number | number[] | ThresholdGenerator | undefined,
  );
  if (!max) return [];
  return bins.map(bin => {
    const series = strip.series.get(bin.group)!;
    const a0 = strip.along(bin.x0),
      a1 = strip.along(bin.x1);
    const lo = Math.min(a0, a1) + MARGINAL_BIN_GAP / 2,
      hi = Math.max(a0, a1) - MARGINAL_BIN_GAP / 2;
    const mark: MarginalMark = {
      axis: strip.axis,
      kind: "histogram",
      series,
      rows: bin.rows,
      bin,
    };
    const node = rectNode(
      strip,
      `marginal-${strip.axis}-bin-${series.key}-${bin.x0}`,
      [lo, Math.max(lo, hi)],
      [across(strip, bin.y0 / max), across(strip, (bin.y0 + bin.count) / max)],
      swatch(mark, paintOf(strip, mark, "shape").paint),
    );
    return stamp(node, mark);
  });
}

/** A box strip: one box per series, side by side across the strip. */
function boxNodes(
  strip: Strip,
  observations: MarginalObservation[],
  domain: [number, number],
): SceneNode[] {
  const boxes = boxMarginal(observations, domain, [...strip.series.keys()]);
  const lane = 1 / Math.max(1, boxes.length);
  const thickness = Math.min(lane * strip.size * 0.7, 20);
  return boxes.flatMap((box, k) => {
    const series = strip.series.get(box.group)!;
    const mark: MarginalMark = {
      axis: strip.axis,
      kind: "box",
      series,
      rows: box.rows,
      box,
    };
    const center = across(strip, lane * (k + 0.5));
    const half = thickness / 2;
    const key = `marginal-${strip.axis}-box-${series.key}`;
    const whisker = paintOf(strip, mark, "line", "whisker").paint;
    const line = (
      id: string,
      a0: number,
      a1: number,
      c0: number,
      c1: number,
      paint = whisker,
    ) =>
      stamp(
        {
          type: "line",
          key: `${key}-${id}`,
          points: [xy(strip, a0, c0), xy(strip, a1, c1)],
          paint,
        } as SceneNode,
        mark,
      );
    const at = strip.along;
    const nodes: SceneNode[] = [
      line("whisker-low", at(box.lowerLimit), at(box.first), center, center),
      line("whisker-high", at(box.third), at(box.upperLimit), center, center),
      line(
        "cap-low",
        at(box.lowerLimit),
        at(box.lowerLimit),
        center - half / 2,
        center + half / 2,
      ),
      line(
        "cap-high",
        at(box.upperLimit),
        at(box.upperLimit),
        center - half / 2,
        center + half / 2,
      ),
      stamp(
        rectNode(
          strip,
          `${key}-rect`,
          [at(box.first), at(box.third)],
          [center - half, center + half],
          swatch(mark, paintOf(strip, mark, "shape").paint),
        ),
        mark,
      ),
      line(
        "median",
        at(box.median),
        at(box.median),
        center - half,
        center + half,
        paintOf(strip, mark, "line", "median").paint,
      ),
    ];
    box.outliers.forEach((o, j) => {
      const [cx, cy] = xy(strip, at(o.value), center);
      const dot: MarginalMark = {...mark, rows: [o.row], outlier: o};
      const {paint, r = 2} = paintOf(strip, dot, "shape", "outlier");
      const node = stamp(
        {
          type: "circle",
          key: `${key}-outlier-${j}`,
          cx,
          cy,
          r,
          paint: swatch(dot, paint),
        } as SceneNode,
        dot,
      );
      node.interactionPoints!.forEach(p => ((p.x = cx), (p.y = cy)));
      nodes.push(node);
    });
    return nodes;
  });
}

/**
    The closed outline from `topline` back along `baseline`, as path data.
    (An area node fills between y values only, so a vertical strip's
    curve draws as a path.)
*/
export function polygon(
  topline: [number, number][],
  baseline: [number, number][],
): string {
  const points = [...topline, ...baseline.slice().reverse()];
  return `M${points.map(([x, y]) => `${x},${y}`).join("L")}Z`;
}

/** A density strip: each series' curve, filled out from the plot. */
function densityNodes(
  strip: Strip,
  observations: MarginalObservation[],
  domain: [number, number],
): SceneNode[] {
  const {curves, max} = densityMarginal(observations, domain, [
    ...strip.series.keys(),
  ]);
  if (!max) return [];
  return curves.flatMap(curve => {
    const series = strip.series.get(curve.group)!;
    const mark: MarginalMark = {
      axis: strip.axis,
      kind: "density",
      series,
      rows: curve.rows,
      curve,
    };
    const key = `marginal-${strip.axis}-density-${series.key}`;
    const topline = curve.curve.map(([v, d]) =>
      xy(strip, strip.along(v), across(strip, d / max)),
    );
    const baseline = curve.curve.map(([v]) =>
      xy(strip, strip.along(v), across(strip, 0)),
    );
    // The fill, then its outline along the curve only.
    return [
      stamp(
        {
          type: "path",
          key,
          d: polygon(topline, baseline),
          // It grows out of the strip's inner edge.
          enterD: polygon(baseline, baseline),
          paint: swatch(mark, paintOf(strip, mark, "fill").paint),
        } as SceneNode,
        mark,
      ),
      stamp(
        {
          type: "line",
          key: `${key}-line`,
          points: topline,
          paint: paintOf(strip, mark, "line").paint,
        } as SceneNode,
        mark,
      ),
    ];
  });
}

/** The pixel position accessors and final ranges a strip lays out along. */
export interface MarginalFrame {
  x: PlotAxisFn;
  y: PlotAxisFn;
  xRange: number[];
  yRange: number[];
  x2Height: number;
  y2Width?: number;
}

/**
    The scene nodes of a Plot's marginal strips, in one group, or none when
    the chart draws no strips this render (see `resolveMarginalLayout`).
    @param viz The chart.
    @param data The plotted rows.
    @param frame The plot's position accessors and final ranges.
*/
export function emitMarginals(
  viz: VizInstance,
  data: PlotDatum[],
  frame: MarginalFrame,
): SceneNode[] {
  const layout = viz._plotMarginals;
  const domains = viz._plotAxisDomains;
  if (!layout || !domains) return [];
  const rows = data.filter(d => d.x !== undefined && d.y !== undefined);
  const points = rows.map(d => ({row: d.data, i: d.i}));
  const {series, groupOf} = marginalSeries(viz, points);
  const byKey = new Map(series.map(s => [s.key, s]));
  const bands = marginalBands(layout, frame);
  const config = (viz.schema.marginalConfig ?? {}) as MarginalConfig;
  const children: SceneNode[] = [];
  for (const axis of ["x", "y"] as const) {
    const kind = layout.axes[axis];
    const scale = layout.scales[axis] as MarginalScale;
    if (!kind) continue;
    const position = frame[axis];
    const strip: Strip = {
      axis,
      band: bands[axis],
      size: layout.size,
      along: v => position(scale.from(v)),
      series: byKey,
      config,
    };
    const domain = domains[axis].map(scale.to) as [number, number];
    const observations = rows.map((d, k) => ({
      value: scale.to(d[axis]),
      group: groupOf(points[k]),
      row: d.data,
    }));
    children.push(
      ...(kind === "histogram"
        ? histogramNodes(strip, observations, domain, config.binThresholds)
        : kind === "box"
          ? boxNodes(strip, observations, domain)
          : densityNodes(strip, observations, domain)),
    );
  }
  return children.length
    ? [{type: "group", key: "plot-marginals", children} as SceneNode]
    : [];
}
