/**
    ArcDiagram's node labels: one line each, on the side of the line away
    from the arcs. Labels that are too wide for their slot turn to -45°, then
    to -90° when even that crowds, and when neighbors are closer than a line
    of text only every few labels draw. Rotating keeps every label directly
    under its node, in node order, which reads better along a dense line than
    scattering labels into free space around each circle.
*/

import type {DataPoint} from "@d3plus/data";
import {rtl} from "@d3plus/dom";
import type {SceneNode} from "@d3plus/render";

import {emitLabels} from "../../shapes/emitLabels.js";
import constant from "../../utils/constant.js";
import {backgroundInk} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {pointLabelSettings} from "../features/circleLabels.js";
import type {ArcOrient} from "./arcGeometry.js";

const SIN45 = Math.SQRT1_2;

/** A label's rotation (degrees) and how many nodes apart drawn labels are. */
export interface LabelFit {
  angle: 0 | -45 | -90;
  step: number;
}

/**
    Fits labels to node spacing: flat when the widest fits its slot, -45°
    when neighbors sit far enough apart for slanted lines, else -90°. When
    even upright lines crowd (vertical lines take flat labels only), every
    `step`-th label draws.
    @param maxWidth The widest label, in pixels.
    @param spacing The distance between neighboring nodes.
    @param lineHeight A label's line height.
*/
export function fitLabels(
  maxWidth: number,
  spacing: number,
  lineHeight: number,
  orient: ArcOrient,
): LabelFit {
  const step = (need: number) =>
    spacing >= need ? 1 : Math.ceil(need / Math.max(spacing, 1e-6));
  if (orient === "vertical") return {angle: 0, step: step(lineHeight)};
  if (maxWidth <= spacing) return {angle: 0, step: 1};
  if (spacing * SIN45 >= lineHeight) return {angle: -45, step: 1};
  return {angle: -90, step: step(lineHeight)};
}

/**
    How far a label reaches out from the line (`depth`) and along it past its
    node (`spread`), at `width` pixels wide and `angle` degrees.
*/
export function labelReach(
  angle: LabelFit["angle"],
  width: number,
  lineHeight: number,
  orient: ArcOrient,
): {depth: number; spread: number} {
  if (orient === "vertical") return {depth: width, spread: lineHeight / 2};
  if (angle === 0) return {depth: lineHeight, spread: width / 2};
  if (angle === -90) return {depth: width, spread: lineHeight / 2};
  return {
    depth: (width + lineHeight / 2) * SIN45,
    spread: (width + lineHeight / 2) * SIN45,
  };
}

/**
    The widest a label may be so it reaches no more than `maxDepth` out from
    the line (rotated or vertical-line labels only; flat labels on a
    horizontal line are one line tall at any width).
*/
export function labelWidthLimit(
  angle: LabelFit["angle"],
  maxDepth: number,
  lineHeight: number,
  orient: ArcOrient,
): number {
  if (orient === "horizontal" && angle === 0) return Infinity;
  if (orient === "horizontal" && angle === -45)
    return Math.max(0, maxDepth / SIN45 - lineHeight / 2);
  return Math.max(0, maxDepth);
}

/** One placed label. */
export interface ArcLabel {
  id: string;
  /** The node's row, which the label carries for hover. */
  datum: DataPoint;
  text: string;
  /** The point the label hangs from, just past its node. */
  x: number;
  y: number;
  angle: number;
  /** The label's box around `x`/`y`, before rotation. */
  box: {x: number; y: number; width: number; height: number};
  anchor: "start" | "middle" | "end";
  verticalAlign: "top" | "middle" | "bottom";
}

/**
    Places a label at one node. `side` is the side of the line the labels
    take ("below" is under a horizontal line or left of a vertical one);
    `gap` is the distance from the line to the label's near edge.
*/
export function placeArcLabel(opts: {
  id: string;
  datum: DataPoint;
  text: string;
  /** The node's position along the line, and the line's cross position. */
  at: number;
  base: number;
  gap: number;
  width: number;
  spacing: number;
  lineHeight: number;
  angle: LabelFit["angle"];
  side: "above" | "below";
  orient: ArcOrient;
}): ArcLabel {
  const {at, base, gap, width, spacing, lineHeight, angle, side} = opts;
  const out = side === "below" ? 1 : -1;
  const common = {id: opts.id, datum: opts.datum, text: opts.text, angle};
  if (opts.orient === "vertical") {
    // "below" sits left of the line, where text ends at the node.
    return {
      ...common,
      x: base - out * gap,
      y: at,
      box: {
        x: side === "below" ? -width : 0,
        y: -lineHeight / 2,
        width,
        height: lineHeight,
      },
      anchor: side === "below" ? "end" : "start",
      verticalAlign: "middle",
    };
  }
  const y = base + out * gap;
  if (angle === 0)
    return {
      ...common,
      x: at,
      y,
      box: {
        x: -spacing / 2,
        y: side === "below" ? 0 : -lineHeight,
        width: spacing,
        height: lineHeight,
      },
      anchor: "middle",
      verticalAlign: side === "below" ? "top" : "bottom",
    };
  // Rotated: labels under the line end at their node and run down-left;
  // labels over it start at their node and run up-right.
  return {
    ...common,
    x: at,
    y,
    box: {
      x: side === "below" ? -width : 0,
      y: -lineHeight / 2,
      width,
      height: lineHeight,
    },
    anchor: side === "below" ? "end" : "start",
    verticalAlign: "middle",
  };
}

/** The anchor TextBox draws an anchor with, flipped right to left. */
const textAnchor = (anchor: ArcLabel["anchor"]): ArcLabel["anchor"] =>
  anchor !== "middle" && rtl()
    ? anchor === "start"
      ? "end"
      : "start"
    : anchor;

/**
    Text nodes for placed labels: one line each in the chart's ink at
    `pointLabelConfig.fontSize`, inert to the pointer.
*/
export function emitArcLabels(
  viz: VizInstance,
  labels: readonly ArcLabel[],
): SceneNode[] {
  if (!labels.length) return [];
  const settings = pointLabelSettings(viz);
  const byId = new Map(labels.map(l => [`${l.id}_0`, l]));
  const of = (rec: DataPoint): ArcLabel | undefined => byId.get(String(rec.id));
  return emitLabels({
    data: labels as unknown as DataPoint[],
    label: d => (d as unknown as ArcLabel).text,
    labelBounds: d => ({...(d as unknown as ArcLabel).box}),
    x: d => (d as unknown as ArcLabel).x,
    y: d => (d as unknown as ArcLabel).y,
    aes: constant({}),
    rotate: d => (d as unknown as ArcLabel).angle,
    id: d => (d as unknown as ArcLabel).id,
    datum: d => (d as unknown as ArcLabel).datum,
    labelConfig: {
      fontColor: () => backgroundInk(viz),
      fontResize: false,
      fontSize: settings.fontSize,
      lineHeight: settings.fontSize * 1.2,
      padding: 0,
      pointerEvents: "none",
      textAnchor: (rec: DataPoint) => textAnchor(of(rec)?.anchor ?? "middle"),
      verticalAlign: (rec: DataPoint) => of(rec)?.verticalAlign ?? "middle",
      ...settings.text,
    },
  });
}
