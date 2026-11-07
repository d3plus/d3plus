/**
    Every label a Pie or Donut draws for its slices: the labels inside the
    ring (straight or curved, see `curvedLabels.ts`), and which slices take
    a label outside the ring instead (see `labelPosition`). The plan is
    worked out once per layout and kept on the chart's context, so the
    layout stage, which sizes the ring to leave room for the outside labels,
    and the emit step share it.
*/
import type {Arc, PieArcDatum} from "d3-shape";
import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";
import type {SceneNode} from "@d3plus/render";

import {
  resolveAccessor,
  shapeConfigFor,
  userLabelConfig,
} from "../features/emitHelpers.js";
import {ringLabelFont, ringTextWidth} from "../features/ringLabelNodes.js";
import {ringLabelPosition} from "../features/ringLabels.js";
import type {RingArc} from "../features/ringLabels.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {pieSliceLabels} from "./curvedLabels.js";
import {OUTSIDE_LABEL_FONT_SIZE} from "./outsideLabels.js";
import {pieStraightLabels} from "./straightLabels.js";

/** A laid-out slice. */
export type PieSlice = PieArcDatum<DataPoint> & {
  __d3plus__?: true;
  i?: number;
  share?: number;
};

/** A slice whose label goes outside the ring. */
export interface OutsideCandidate {
  slice: PieSlice;
  /** The slice's index. */
  index: number;
  /** The slice's middle angle. */
  angle: number;
  /** The label: the slice's name and share. */
  text: string;
  /** The label's one-line width. */
  width: number;
  /** The narrowest it gets wrapped onto two lines between words. */
  wrapWidth: number;
  /** The slice's value: smaller slices give up their labels first. */
  weight: number;
}

/** A Pie's labels for one layout. */
export interface PieLabelPlan {
  /** The straight labels inside the slices. */
  straight: SceneNode[];
  /** The curved labels along the ring. */
  curved: SceneNode[];
  /** The slices whose label goes outside the ring, if there is room for it. */
  outside: OutsideCandidate[];
}

/**
    The narrowest a text gets wrapped onto two lines between its words: the
    wider of the two lines at the best break. A single word can't wrap, so
    its width is its own.
    @param text The text.
    @param width A string's one-line width.
*/
export function twoLineWidth(
  text: string,
  width: (text: string) => number,
): number {
  const words = text.split(/\s+/).filter(Boolean);
  let best = width(words.join(" "));
  for (let k = 1; k < words.length; k++)
    best = Math.min(
      best,
      Math.max(
        width(words.slice(0, k).join(" ")),
        width(words.slice(k).join(" ")),
      ),
    );
  return best;
}

/**
    Formats a slice's share as a percentage in the chart's locale.
    @param viz The chart.
*/
export function pieSharePct(viz: VizInstance): (d: PieSlice) => string {
  const locale = viz.schema.locale;
  return d => `${formatAbbreviate((d.share ?? 0) * 100, locale)}%`;
}

/**
    The outside labels' font size: the Path labelConfig's `fontSize`, else
    `OUTSIDE_LABEL_FONT_SIZE`.
    @param labelConfig The Path labelConfig.
*/
export function outsideFontSize(labelConfig: Record<string, unknown>): number {
  const size = labelConfig.fontSize;
  return typeof size === "number" && size > 0 ? size : OUTSIDE_LABEL_FONT_SIZE;
}

/**
    Whether a slice's `labelPosition` puts its label outside the ring:
    always for `"outside"`, never for `"inside"` or `"along"`, and for
    `"auto"` only when its label inside doesn't show its whole name.
    @param position The slice's `labelPosition`.
    @param shownWhole Whether its label inside shows its whole name.
*/
export function labelGoesOutside(
  position: unknown,
  shownWhole: boolean,
): boolean {
  if (position === "outside") return true;
  if (position === "inside" || position === "along") return false;
  return !shownWhole;
}

/**
    Whether any slice's `labelPosition` may put its label outside the ring:
    false when every one is `"inside"` or `"along"`.
    @param viz The chart.
    @param slices The laid-out slices.
*/
export function pieMayLabelOutside(
  viz: VizInstance,
  slices: PieSlice[],
): boolean {
  return slices.some((d, k) => {
    const position = ringLabelPosition(viz, d.data, d.i ?? k);
    return position !== "inside" && position !== "along";
  });
}

/**
    Works out every slice's label for the current layout (`viz.ctx.arcData`):
    the labels inside the ring, and the slices whose label goes outside it.
    Kept on `viz.ctx`, so the same layout is only worked out once.
    @param viz The chart, laid out by `applyPieLayout`.
    @param slices The laid-out slices.
*/
export function pieLabelPlan(
  viz: VizInstance,
  slices: PieSlice[],
): PieLabelPlan {
  const arcGen = viz.ctx.arcData as Arc<unknown, PieSlice>;
  const cached = viz.ctx.pieLabelPlan as
    {arc: unknown; slices: unknown; plan: PieLabelPlan} | undefined;
  if (cached && cached.arc === arcGen && cached.slices === slices)
    return cached.plan;

  const resolveInnerRadius = arcGen.innerRadius();
  const resolveOuterRadius = arcGen.outerRadius();
  const sc = shapeConfigFor(viz, "Path");
  const labelConfig = userLabelConfig(viz, "Path");
  const sharePct = pieSharePct(viz);
  const nameOf = (d: PieSlice) => viz._drawLabel(d.data as DataPoint, d.i ?? 0);

  const arcOf = (d: PieSlice): RingArc => ({
    innerRadius: resolveInnerRadius(d, d.i ?? 0),
    outerRadius: resolveOuterRadius(d, d.i ?? 0),
    startAngle: d.startAngle,
    endAngle: d.endAngle,
    padAngle: d.padAngle,
  });

  const inside = pieSliceLabels({
    viz,
    slices,
    arcOf,
    nameOf,
    shareOf: sharePct,
    fillOf: d =>
      resolveAccessor<unknown>(sc.fill, d.data as DataPoint, d.i ?? 0),
    straight: pieStraightLabels({
      viz,
      slices,
      arcOf,
      sc,
      sharePct,
      labelConfig,
    }),
    labelConfig,
  });

  const outside: OutsideCandidate[] = [];
  if (pieMayLabelOutside(viz, slices)) {
    const font = ringLabelFont(labelConfig);
    const fontSize = outsideFontSize(labelConfig);
    slices.forEach((slice, k) => {
      const index = slice.i ?? k;
      const name = nameOf(slice);
      const position = ringLabelPosition(viz, slice.data, index);
      if (!name || !labelGoesOutside(position, inside.whole.has(slice))) return;
      const text = `${name} ${sharePct(slice)}`;
      const measure = (t: string) => ringTextWidth(t, font)(fontSize);
      outside.push({
        slice,
        index,
        angle: (slice.startAngle + slice.endAngle) / 2,
        text,
        width: measure(text),
        wrapWidth: twoLineWidth(text, measure),
        weight: slice.value,
      });
    });
  }

  const plan = {straight: inside.straight, curved: inside.curved, outside};
  viz.ctx.pieLabelPlan = {arc: arcGen, slices, plan};
  return plan;
}
