/**
    Chord group labels (see `labelPosition`): each group's name curves just
    outside its arc, following the ring, or turns along its spoke, reading
    outward. Curved names need only a line of room around the ring, so when
    every name fits along its arc the ring grows into the band the spoke
    labels would need.
*/
import type {ChordGroup} from "d3-chord";

import type {DataPoint} from "@d3plus/data";

import {userLabelConfig} from "../features/emitHelpers.js";
import {ringLabelFont, ringTextWidth} from "../features/ringLabelNodes.js";
import {ringLabelFit, ringLabelPosition} from "../features/ringLabels.js";
import type {RingLabelFit} from "../features/ringLabels.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** The gap between the ring and its labels, in pixels. */
export const CHORD_LABEL_PADDING = 4;

/** The label font size when the Path labelConfig sets none. */
export const CHORD_LABEL_FONT_SIZE = 10;

/** What placing a group's label needs: its id, row, index, and arc. */
export interface ChordLabelNode {
  data: DataPoint;
  i: number;
  group?: ChordGroup;
  labelX?: number;
  labelY?: number;
  labelRotate?: number;
  labelAnchor?: "start" | "end";
  labelBounds?: {x: number; y: number; width: number; height: number};
  /** The curve the label follows, when it curves. */
  labelCurve?: RingLabelFit;
}

/**
    The labels' font size: the Path labelConfig's `fontSize`, else
    `CHORD_LABEL_FONT_SIZE`.
    @param viz The chart.
*/
export function chordLabelFontSize(viz: VizInstance): number {
  const size = userLabelConfig(viz, "Path").fontSize;
  return typeof size === "number" && size > 0 ? size : CHORD_LABEL_FONT_SIZE;
}

/**
    Each group's label along its arc at `outer` (the ring's outer radius),
    or null where it doesn't fit there or its `labelPosition` keeps it on
    its spoke. A label cut short with an ellipsis is allowed only when its
    `labelPosition` is `"along"`.
    @param viz The chart.
    @param nodes The laid-out groups.
    @param outer The ring's outer radius.
*/
export function chordCurves(
  viz: VizInstance,
  nodes: ChordLabelNode[],
  outer: number,
): (RingLabelFit | null)[] {
  const fontSize = chordLabelFontSize(viz);
  const font = ringLabelFont(userLabelConfig(viz, "Path"));
  return nodes.map(node => {
    const g = node.group;
    if (!g) return null;
    const position = ringLabelPosition(viz, node.data, node.i);
    if (position === "inside" || position === "outside") return null;
    const text = `${viz._drawLabel(node.data, node.i) ?? ""}`;
    if (!text) return null;
    return ringLabelFit(
      {
        innerRadius: outer,
        outerRadius: outer + fontSize + CHORD_LABEL_PADDING * 2,
        startAngle: g.startAngle,
        endAngle: g.endAngle,
      },
      ringTextWidth(text, font),
      {
        fontMin: fontSize,
        fontMax: fontSize,
        padding: CHORD_LABEL_PADDING,
        align: "inner",
        minRadius: 0,
        truncate: position === "along",
      },
    );
  });
}

/**
    Whether every group with an arc takes a curved label: each one fits
    along its arc (or is cut short, for `"along"`) or has no text.
    @param viz The chart.
    @param nodes The laid-out groups.
    @param curves Each group's curve (see `chordCurves`).
*/
export function chordAllCurved(
  viz: VizInstance,
  nodes: ChordLabelNode[],
  curves: (RingLabelFit | null)[],
): boolean {
  return nodes.every((node, k) => {
    if (!node.group || curves[k]) return true;
    return !`${viz._drawLabel(node.data, node.i) ?? ""}`;
  });
}

/**
    Each group's label along its spoke: just outside the outer arc, rotated
    to read outward, flipped upright on the left half. Mutates each node.
    @param nodes The laid-out groups.
    @param outer The ring's outer radius.
    @param labelWidth The room outside the ring for a label.
*/
export function applyChordLabelGeometry(
  nodes: ChordLabelNode[],
  outer: number,
  labelWidth: number,
): void {
  const lineHeight = 15;
  const pad = CHORD_LABEL_PADDING;
  nodes.forEach(node => {
    const g = node.group;
    if (!g) return;
    const mid = (g.startAngle + g.endAngle) / 2;
    const a = mid - Math.PI / 2;
    node.labelX = Math.cos(a) * outer;
    node.labelY = Math.sin(a) * outer;
    let deg = (mid * 180) / Math.PI - 90;
    if (mid > Math.PI) {
      // Left half: flip the text upright and extend it inward (−x) in the box's
      // local frame so it still reads outward from the arc.
      deg += 180;
      node.labelBounds = {
        x: -(labelWidth + pad),
        y: -lineHeight / 2,
        width: labelWidth,
        height: lineHeight,
      };
      node.labelAnchor = "end";
    } else {
      node.labelBounds = {
        x: pad,
        y: -lineHeight / 2,
        width: labelWidth,
        height: lineHeight,
      };
      node.labelAnchor = "start";
    }
    node.labelRotate = deg;
  });
}
