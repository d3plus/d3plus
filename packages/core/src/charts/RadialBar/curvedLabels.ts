/**
    RadialBar's curved track labels (see `labelPosition`): each track's name
    runs along the track from its bar's start, inside the bar, or along the
    empty track just past the bar's end when the bar is too short for it.
    They name the tracks when the sweep leaves no room before its start for
    the straight labels, and at any sweep for `"along"`.
*/
import {colorContrast} from "@d3plus/color";
import type {SceneNode} from "@d3plus/render";

import {
  paintFromShapeConfig,
  resolveAccessor,
  shapeConfigFor,
  userLabelConfig,
} from "../features/emitHelpers.js";
import {ringLabelNodes, ringTextWidth} from "../features/ringLabelNodes.js";
import type {RingLabel} from "../features/ringLabelNodes.js";
import {ringLabelEnd, ringLabelFit} from "../features/ringLabels.js";
import type {RingArc, RingLabelFit} from "../features/ringLabels.js";
import type {PolarWedge} from "../polar/wedgeLayout.js";
import {backgroundInk} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {measureTrackLabels, radialBarCurvedRows} from "./trackLayout.js";
import type {RadialBarFrame} from "./trackLayout.js";

/** Where a track's curved label goes, and whether it sits inside the bar. */
export interface RadialBarLabelSpot {
  fit: RingLabelFit;
  inBar: boolean;
}

/**
    Fits a track's label at `fontSize` along its track: inside the bar from
    the bar's start, else on the track from the bar's end, as long as it
    ends before the sweep does. Null when neither holds it whole.
    @param bar The bar's arc.
    @param sweepEnd Where the tracks end.
    @param width The label's one-line width at a font size.
    @param fontSize The label's font size.
*/
export function radialBarLabelSpot(
  bar: RingArc,
  sweepEnd: number,
  width: (fontSize: number) => number,
  fontSize: number,
): RadialBarLabelSpot | null {
  const thickness = bar.outerRadius - bar.innerRadius;
  const padding = Math.min(3, (thickness - fontSize) / 2);
  if (padding < 0) return null;
  const rm = (bar.innerRadius + bar.outerRadius) / 2;
  const inner = rm - fontSize / 2;
  if (!(inner > 0)) return null;
  // The turn the text takes, measured where the track is narrowest.
  const turn =
    (width(fontSize) + ringLabelEnd(padding, fontSize) * 2) / inner + 1e-6;
  const at = (start: number) =>
    ringLabelFit({...bar, startAngle: start, endAngle: start + turn}, width, {
      fontMin: fontSize,
      fontMax: fontSize,
      padding,
      minRadius: 0,
      truncate: false,
    });
  const span = bar.endAngle - bar.startAngle;
  if (span >= turn) {
    const fit = at(bar.startAngle);
    if (fit) return {fit, inBar: true};
  }
  if (bar.endAngle + turn <= sweepEnd + 1e-9) {
    const fit = at(bar.endAngle);
    if (fit) return {fit, inBar: false};
  }
  return null;
}

/**
    The curved labels for the tracks whose rows take one (see
    `radialBarCurvedRows`), each in the color that reads on its bar or, past
    the bar, on its track, unless the Path `labelConfig` sets a `fontColor`.
    Counts the tracks and their labels into `viz._alongStats`, so labels
    that name every track hide the default legend (see `alongLegend.ts`).
    @param viz The chart.
    @param wedges The bars, in track order.
    @param frame The tracks' frame.
*/
export function radialBarCurvedLabels(
  viz: VizInstance,
  wedges: PolarWedge[],
  frame: RadialBarFrame,
): SceneNode[] {
  const rows = wedges.map(w => w.data);
  const curved = radialBarCurvedRows(viz, rows);
  // Every track counts toward whether the labels can stand in for the legend.
  const stats = viz._alongStats;
  if (stats) {
    stats.series += wedges.length;
    stats.requested += curved.filter(Boolean).length;
  }
  if (!curved.some(Boolean)) return [];
  const thickness = wedges.length
    ? wedges[0].arc.outerRadius - wedges[0].arc.innerRadius
    : 0;
  const measured = measureTrackLabels(viz, rows, thickness);
  const sc = shapeConfigFor(viz, "Path");
  const trackConfig = (viz.schema.trackConfig ?? {}) as Record<string, unknown>;
  const userColor = userLabelConfig(viz, "Path").fontColor;
  const labels: RingLabel[] = [];
  wedges.forEach((w, k) => {
    const label = measured[k];
    if (!curved[k] || !label.text) return;
    const font = {
      fontFamily: label.font.fontFamily,
      fontWeight: label.font.fontWeight,
    };
    const spot = radialBarLabelSpot(
      w.arc,
      frame.end,
      ringTextWidth(label.text, font),
      label.size,
    );
    if (!spot) return;
    const under = spot.inBar
      ? paintFromShapeConfig(sc, w.data, w.i).fill
      : viz.schema.track === false
        ? undefined
        : paintFromShapeConfig(trackConfig, w.data, w.i).fill;
    const custom = resolveAccessor<unknown>(userColor, w.data, w.i);
    const color =
      typeof custom === "string"
        ? custom
        : typeof under === "string"
          ? colorContrast(under, viz.schema.colorDefaults)
          : backgroundInk(viz);
    labels.push({
      key: `radialbar-label-curved-${viz._ids(w.data, w.i).join("-")}`,
      text: label.text,
      fit: spot.fit,
      color,
      datum: w.data,
      index: w.i,
    });
  });
  const first = measured[0]?.font;
  const nodes = ringLabelNodes(
    viz,
    labels,
    first ? {fontFamily: first.fontFamily, fontWeight: first.fontWeight} : {},
  );
  if (stats) stats.placed += nodes.length;
  return nodes;
}
