/**
    The parts every Dumbbell connector shares: its key, its ends, which rows
    it spans, and how it opts out of hit-testing.

    @module
*/

import type {SceneNode} from "@d3plus/render";
import {finite} from "@d3plus/math";

import type {PlotDatum} from "../features/plotPaint.js";
import type {DumbbellDirection} from "./changes.js";

/** Key suffix of a category's connector node. */
export const CONNECTOR_KEY_SUFFIX = "::connector";

/** One category's connector: the rows holding its smallest and largest value. */
export interface DumbbellSpan {
  category: string;
  lo: PlotDatum;
  hi: PlotDatum;
}

/**
    One end of a connector, fed to the Line shape. It wraps the row so style
    accessors unwrap to the row, and carries its category as a string so the
    Line's merged datum keeps it, and, with `arrows` or a bar connector, the
    category's direction.
*/
export interface ConnectorEnd {
  __d3plus__: true;
  data: PlotDatum;
  i: number;
  category: string;
  direction?: DumbbellDirection;
}

/**
    Each category's span, in first-seen order: the rows holding its smallest
    and largest value along the value axis. Categories whose values don't
    differ (or with fewer than two numeric values) have no span.
    @param rows The plotted rows.
    @param discrete The category axis.
*/
export function dumbbellSpans(
  rows: PlotDatum[],
  discrete: "x" | "y",
): DumbbellSpan[] {
  const opp = discrete === "x" ? "y" : "x";
  const spans = new Map<string, {lo?: PlotDatum; hi?: PlotDatum}>();
  for (const d of rows) {
    const category = `${d[discrete]}`;
    let span = spans.get(category);
    if (!span) spans.set(category, (span = {}));
    const v = d[opp];
    if (!finite(v)) continue;
    if (!span.lo || v < (span.lo[opp] as number)) span.lo = d;
    if (!span.hi || v > (span.hi[opp] as number)) span.hi = d;
  }
  const out: DumbbellSpan[] = [];
  spans.forEach(({lo, hi}, category) => {
    if (lo && hi && lo !== hi && lo[opp] !== hi[opp])
      out.push({category, lo, hi});
  });
  return out;
}

/**
    A connector node, drawn but never hit-tested. It keeps no datum of its
    own, only its ends' points, so it dims and highlights with them.
*/
export function asConnector(node: SceneNode): SceneNode {
  const out = {...node, interactive: false};
  delete out.datum;
  return out;
}
