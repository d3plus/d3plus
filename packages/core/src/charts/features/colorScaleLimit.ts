/**
    The share of a chart a colorScale along one of its sides takes at most:
    a third of the chart across the scale, its bar, padding, ticks, labels
    and title together.
*/
import type ColorScale from "../../components/ColorScale/ColorScale.js";
import {isBucketScale} from "../../components/ColorScale/colorScaleType.js";

/** The most of a chart, across the scale, that a colorScale along one of its sides takes. */
export const MAX_SHARE = 1 / 3;

/** The part of a colorScale's frame that `limitFrame` reads. */
interface LimitedFrame {
  x: number;
  y: number;
  width: number;
  height: number;
  /** The side of the chart the scale sits on. */
  orient: string | false;
  /** `"end"` for a scale that sits against the far edge of its frame. */
  align: string;
}

/** Whether a colorScale on the `orient` side of a chart runs along its width. */
export function isWide(orient: string | false): boolean {
  return orient === "top" || orient === "bottom";
}

/**
    The room left for a scale's axis (its ticks, labels and title) when the
    whole scale takes at most `limit`: what its bar, `size` thick, and the
    `padding` on either side of the scale leave, in whole pixels.
*/
export function axisRoom(limit: number, size: number, padding: number): number {
  return Math.max(0, Math.floor(limit - size - padding * 2));
}

/**
    Whether the ColorScale last drew a swatch per bucket, the form a Legend
    lays out, rather than a bar along an axis or a bivariate key.
*/
export function drawsSwatches(cs: ColorScale): boolean {
  return (
    !cs.schema.bivariate &&
    !cs.schema.bucketAxis &&
    isBucketScale(cs._scaleType)
  );
}

/**
    `frame` cut down to `limit` across the scale, still against the edge of
    the chart its scale is aligned to.
*/
export function limitFrame<T extends LimitedFrame>(frame: T, limit: number): T {
  const far = frame.align === "end";
  return isWide(frame.orient)
    ? {
        ...frame,
        y: far ? frame.y + frame.height - limit : frame.y,
        height: limit,
      }
    : {
        ...frame,
        x: far ? frame.x + frame.width - limit : frame.x,
        width: limit,
      };
}

/**
    `frame` with the `limit` a colorScale along a side of the chart keeps to:
    `set`, the size across the scale its `colorScaleConfig` gives it (its
    `width` at the left or right, its `height` at the top or bottom), up to
    the frame's own, with the frame cut down to it against its edge; else a
    third of the frame across the scale.
*/
export function sideFrame<T extends LimitedFrame>(
  frame: T,
  set: number | undefined,
): T & {limit: number} {
  const across = frame[isWide(frame.orient) ? "height" : "width"];
  if (set === undefined) return {...frame, limit: across * MAX_SHARE};
  const limit = Math.max(0, Math.min(set, across));
  return {...limitFrame(frame, limit), limit};
}

/** The number `config` sets for `key`, or undefined when it sets none. */
export function configSize(
  config: Record<string, unknown>,
  key: "width" | "height",
): number | undefined {
  const value = config[key];
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

/**
    The frame a scale drawn as swatches is laid out in again, or undefined
    when it keeps `frame`: one as far across the scale as its Legend may
    reach, the size the scale's `legendConfig` gives it there or else the
    frame's `limit`, once its swatches claim more than that limit (a frame
    already cut down to the limit keeps it).
*/
export function swatchFrame<T extends LimitedFrame & {limit?: number}>(
  cs: ColorScale,
  frame: T,
): T | undefined {
  if (frame.limit === undefined || !drawsSwatches(cs)) return undefined;
  const across = isWide(frame.orient) ? "height" : "width";
  const set = cs.legendConfig()[across];
  if (typeof set === "number")
    return set === frame[across] ? undefined : limitFrame(frame, set);
  const claim = cs.outerBounds()[across] + cs.padding() * 2;
  return claim > frame.limit && frame[across] !== frame.limit
    ? limitFrame(frame, frame.limit)
    : undefined;
}
