/**
    The Line shape's label config for a Plot's `lineLabels`: the text and
    bounds of each line's labels past its right end, its left end, or both,
    after their collisions have been bumped apart (see
    `features/lineLabels.ts`).

    @module
*/

import {max} from "d3-array";

import {formatAbbreviate} from "@d3plus/format";

import type {LabelWidth, PlotDatum} from "../features/plotPaint.js";
import type {VizInstance as Viz} from "../viz/vizTypes.js";
import {
  lineLabelKey,
  lineLabelText,
  rowLineLabelSides,
  type LineLabelSide,
} from "./lineLabelSides.js";

/** What a Line label config reads from the Plot paint. */
export interface LineLabelEmitInputs {
  viz: Viz;
  labelWidths: LabelWidth[];
  /** The widest right-end label (padding included). */
  largestLabel: number;
  labelPositions: Record<string, number>;
  /** The series name a label shows, in place of the chart's own label. */
  name?: unknown;
}

/** One label a line shows: its end and its text. */
interface LineLabelEntry {
  side: LineLabelSide;
  text: string;
  measure: LabelWidth;
}

/** A label's bounds relative to its line's first point. */
interface LabelBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
    The text one measured label shows: the series name (and its value), or,
    where the plot had no room for every label, `"+N more"` on the last that
    fit and nothing on the rest.
*/
function entryText(
  inputs: LineLabelEmitInputs,
  measure: LabelWidth,
  d: PlotDatum,
  i: number,
): string | false {
  const {viz} = inputs;
  if (measure.hidden) return false;
  if (measure.collapsed)
    return `+${formatAbbreviate(measure.collapsed, viz.schema.locale)} ${viz.schema.translate("more")}`;
  // A label shortened to fit its room keeps its shortened name.
  const name =
    measure.name !== undefined
      ? measure.name
      : inputs.name === undefined || inputs.name === null
        ? viz._drawLabel(d as unknown as Parameters<Viz["_drawLabel"]>[0], i)
        : typeof inputs.name === "function"
          ? inputs.name(d, i)
          : inputs.name;
  return measure.valueText === undefined
    ? name
    : lineLabelText(name, measure.valueText);
}

/** The labels a line shows, left end first. */
function lineEntries(
  inputs: LineLabelEmitInputs,
  d: PlotDatum,
  i: number,
): LineLabelEntry[] {
  const {viz, labelWidths} = inputs;
  if (!rowLineLabelSides(viz.schema.lineLabels, d.data, d.i).length) return [];
  const entries: LineLabelEntry[] = [];
  for (const side of ["start", "end"] as const) {
    const measure = labelWidths.find(
      l => l.id === d.id && (l.side ?? "end") === side,
    );
    if (!measure) continue;
    const text = entryText(inputs, measure, d, i);
    if (text !== false) entries.push({side, text, measure});
  }
  return entries;
}

/**
    The bounds of a line's label past its `side` end: right of its rightmost
    point (`largest` wide, text starting there) or left of its leftmost point
    (text ending there), as tall as a quarter of the chart and centered on
    the label's bumped y.
*/
export function lineLabelBox(
  points: number[][],
  side: LineLabelSide,
  largest: number,
  chartHeight: number,
  bumpedY?: number,
): LabelBox {
  const [firstX, firstY] = points[0];
  const [edgeX, edgeY] = points.reduce((a, b) =>
    side === "end" ? (b[0] >= a[0] ? b : a) : b[0] < a[0] ? b : a,
  );
  const height = chartHeight / 4;
  const mod = bumpedY ? edgeY - bumpedY : 0;
  return {
    x: edgeX - firstX - (side === "start" ? largest : 0),
    y: edgeY - firstY - height / 2 - mod,
    width: largest,
    height,
  };
}

/**
    The Line shape's `label` and `labelBounds` for its line labels, and the
    `textAnchor` that right-aligns the labels left of a line. A line with
    one label keeps a single label; one labeled at both ends takes two.
*/
export function lineLabelConfig(inputs: LineLabelEmitInputs): {
  label: (d: PlotDatum, i: number) => string | string[] | false;
  labelBounds: (
    d: PlotDatum,
    i: number,
    s: {points: number[][]},
  ) => LabelBox | LabelBox[];
  textAnchor: (
    base: unknown,
  ) => (d: Record<string, unknown>, i: number) => unknown;
} {
  const {viz, labelWidths, largestLabel, labelPositions} = inputs;
  const largestStart =
    max(
      labelWidths.filter(l => l.side === "start"),
      l => l.labelWidth,
    ) ?? 0;
  const sidesById = new Map<unknown, LineLabelSide[]>();
  const pick = <T>(list: T[]): T | T[] => (list.length === 1 ? list[0] : list);
  return {
    label: (d, i) => {
      const entries = lineEntries(inputs, d, i);
      sidesById.set(
        d.id,
        entries.map(e => e.side),
      );
      return entries.length ? pick(entries.map(e => e.text)) : false;
    },
    labelBounds: (d, i, s) =>
      pick(
        lineEntries(inputs, d, i).map(({side}) =>
          lineLabelBox(
            s.points,
            side,
            side === "start" ? largestStart : largestLabel,
            viz.schema.height,
            labelPositions[lineLabelKey(side, d.id)],
          ),
        ),
      ),
    textAnchor: base => (d, i) => {
      const rec = (d.l === undefined ? d.data : d) as Record<string, unknown>;
      const id = (rec?.data as {id?: unknown} | undefined)?.id;
      if (sidesById.get(id)?.[rec?.l as number] === "start") return "end";
      return typeof base === "function" ? base(d, i) : base;
    },
  };
}
