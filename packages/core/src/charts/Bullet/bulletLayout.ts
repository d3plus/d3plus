/**
    `bulletStack` — places a stack of bullets in the chart area: one row per
    bullet (horizontal) or one column per bullet (vertical), each with its
    label block at the start and room for its value axis.
*/

import type {Orient} from "../../shapes/shapeConfig.js";
import type {BulletRect} from "./bulletGeometry.js";

/** Which bullets draw a value axis: each one, only one (a shared domain), or none. */
export type BulletAxisMode = "row" | "shared" | false;

/** Measured inputs to `bulletStack`. */
export interface BulletStackOptions {
  orient: Orient;
  width: number;
  height: number;
  /** How many bullets to place. */
  count: number;
  /** The largest band thickness, in pixels. */
  bulletSize: number;
  /** The widest label (name or sub-label), in pixels; 0 when nothing is labeled. */
  labelWidth: number;
  /** The label block's height: the name, plus the sub-label beneath it. */
  labelHeight: number;
  axis: BulletAxisMode;
  /** The tick labels' font size. */
  tickFontSize: number;
  /** The widest tick label. */
  tickLabelWidth: number;
  /** Half the widest label of a domain's minimum and maximum, which hang past the band's ends on a horizontal axis. */
  tickOverhang: [number, number];
}

/** Where one bullet's label block goes. */
export interface BulletLabelBox {
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
  maxWidth: number;
}

/** One placed bullet. */
export interface BulletSlot {
  band: BulletRect;
  label: BulletLabelBox;
  /** Whether this bullet draws its value axis. */
  axis: boolean;
  /** The whole bullet's footprint, its label included, for hit testing. */
  hit: BulletRect;
}

/** The tick mark's length, in pixels. */
export const TICK_LENGTH = 4;
/** The gap between a tick mark and its label, in pixels. */
export const TICK_GAP = 3;
/** Room left at the chart edges for the hovered stroke emphasis. */
const EDGE = 2;
/** The gap between the label block and the band. */
const LABEL_GAP = 12;

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

/** How many pixels a bullet's axis adds across the band. */
export function axisDepth(opts: BulletStackOptions): number {
  if (!opts.axis) return 0;
  return opts.orient === "vertical"
    ? TICK_LENGTH + TICK_GAP + opts.tickLabelWidth
    : TICK_LENGTH + TICK_GAP + opts.tickFontSize;
}

function horizontalStack(opts: BulletStackOptions): BulletSlot[] {
  const {width, height, count, labelHeight} = opts;
  const depth = axisDepth(opts);
  const rowAxis = opts.axis === "row" ? depth : 0;
  const sharedAxis = opts.axis === "shared" ? depth : 0;
  const labelW = Math.min(opts.labelWidth, width * 0.35);
  const [startHang, endHang] = opts.axis ? opts.tickOverhang : [0, 0];
  const x0 = labelW
    ? EDGE + labelW + Math.max(LABEL_GAP, startHang)
    : EDGE + startHang;
  const length = Math.max(0, width - x0 - EDGE - endHang);
  const avail = Math.max(0, height - sharedAxis - EDGE * 2);
  const pitch = avail / count;
  const thickness = Math.min(
    Math.max(0, pitch - rowAxis),
    clamp((pitch - rowAxis) * 0.62, 4, opts.bulletSize),
  );
  const rowHeight = thickness + rowAxis;
  const gap = Math.max(12, thickness * 0.6);
  const step = Math.min(pitch, Math.max(rowHeight, labelHeight) + gap);
  const overhang = Math.max(0, (labelHeight - thickness) / 2);
  const stack = step * (count - 1) + rowHeight;
  const top = EDGE + Math.max(overhang, (avail - stack) / 2);
  return Array.from({length: count}, (_, k) => {
    const y = top + k * step;
    const band = {x: x0, y, width: length, height: thickness};
    const hitTop = Math.min(y, y + thickness / 2 - labelHeight / 2);
    return {
      band,
      label: {
        x: EDGE + labelW,
        y: y + thickness / 2,
        anchor: "end",
        maxWidth: labelW,
      },
      axis: opts.axis === "row" || (opts.axis === "shared" && k === count - 1),
      hit: {
        x: 0,
        y: hitTop,
        width: x0 + length,
        height:
          Math.max(y + rowHeight, y + thickness / 2 + labelHeight / 2) - hitTop,
      },
    };
  });
}

function verticalStack(opts: BulletStackOptions): BulletSlot[] {
  const {width, height, count, labelHeight} = opts;
  const depth = axisDepth(opts);
  const columnAxis = opts.axis === "row" ? depth : 0;
  const sharedAxis = opts.axis === "shared" ? depth : 0;
  const labelBlock = labelHeight ? labelHeight + LABEL_GAP : 0;
  const hang = opts.axis ? opts.tickFontSize / 2 : 0;
  const top = EDGE + labelBlock + hang;
  const length = Math.max(0, height - top - Math.max(EDGE, hang) - EDGE);
  const avail = Math.max(0, width - sharedAxis - EDGE * 2);
  const pitch = avail / count;
  const thickness = Math.min(
    Math.max(0, pitch - columnAxis),
    clamp((pitch - columnAxis) * 0.45, 4, opts.bulletSize),
  );
  const columnWidth = columnAxis + thickness;
  const step = Math.min(
    pitch,
    Math.max(
      columnWidth + Math.max(16, thickness),
      opts.labelWidth + LABEL_GAP,
    ),
  );
  const left = EDGE + sharedAxis + (avail - step * count) / 2;
  return Array.from({length: count}, (_, k) => {
    const cell = left + k * step;
    const x = cell + (step - thickness) / 2 + columnAxis / 2;
    const band = {x, y: top, width: thickness, height: length};
    return {
      band,
      label: {
        x: x + thickness / 2,
        y: EDGE,
        anchor: "middle",
        maxWidth: Math.max(0, step - 8),
      },
      axis: opts.axis === "row" || (opts.axis === "shared" && k === 0),
      hit: {x: cell, y: EDGE, width: step, height: top + length - EDGE},
    };
  });
}

/** Places `count` bullets in a `width` × `height` chart area. */
export function bulletStack(opts: BulletStackOptions): BulletSlot[] {
  if (!(opts.count > 0) || !(opts.width > 0) || !(opts.height > 0)) return [];
  return opts.orient === "vertical"
    ? verticalStack(opts)
    : horizontalStack(opts);
}
