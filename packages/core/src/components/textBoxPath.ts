/**
    TextBox options that change where its text sits: a path the text follows
    (`textPath`, `startOffset`, `side`), and the transparent `hitbox` behind it.
*/
import type {DataPoint} from "@d3plus/data";
import {parseSides} from "@d3plus/dom";
import {samplePath} from "@d3plus/render";

import type TextBox from "./TextBox.js";

/** Sides of a box, in pixels. */
export interface Sides {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** The path a box's text follows, resolved for one datum. */
export interface BoxPath {
  /** The path's `d`, relative to the box's x/y. */
  d: string;
  side: "left" | "right";
  /** Where along the path the text's room begins, in pixels. */
  offset: number;
  /** The path's length. */
  length: number;
}

/**
    Reads a `startOffset`: a distance in pixels, or a percentage of the path's
    length, clamped to the path.
    @param value The configured offset.
    @param length The path's length.
*/
export function resolveOffset(value: unknown, length: number): number {
  let px = 0;
  if (typeof value === "number") px = value;
  else if (typeof value === "string") {
    const n = parseFloat(value);
    if (Number.isFinite(n))
      px = value.trim().endsWith("%") ? (n / 100) * length : n;
  }
  return Math.max(0, Math.min(length, Number.isFinite(px) ? px : 0));
}

/**
    The path a datum's text follows, or null when `textPath` gives none.
    @param box The TextBox.
    @param d The datum.
    @param i Its index.
*/
export function textBoxPath(
  box: TextBox,
  d: DataPoint,
  i: number,
): BoxPath | null {
  const path = box.schema.textPath(d, i);
  if (typeof path !== "string" || !path.trim()) return null;
  const length = samplePath(path).total;
  if (!length) return null;
  return {
    d: path,
    side: box.schema.side(d, i) === "right" ? "right" : "left",
    offset: resolveOffset(box.schema.startOffset(d, i), length),
    length,
  };
}

/**
    The room a datum's text wraps into: the box less its padding, or along a
    path, the path from its start offset to its end (one line, which the
    height always fits).
    @param box The TextBox.
    @param d The datum.
    @param i Its index.
    @param padding The box's padding.
    @param path The path the text follows, if any.
    @param lineHeight The line height the wrap starts at.
*/
export function textBoxRoom(
  box: TextBox,
  d: DataPoint,
  i: number,
  padding: Sides,
  path: BoxPath | null,
  lineHeight: number,
): {w: number; h: number} {
  const h = box.schema.height(d, i) - (padding.top + padding.bottom);
  if (path)
    return {w: path.length - path.offset, h: Math.max(h, lineHeight + 1)};
  return {w: box.schema.width(d, i) - (padding.left + padding.right), h};
}

/**
    The extra room a `hitbox` config adds around the box, or null when the
    box has no hitbox: `true` adds none, and `{padding}` takes a number or CSS
    shorthand string.
    @param value The configured hitbox.
*/
export function hitboxPadding(value: unknown): Sides | null {
  if (!value) return null;
  if (value === true) return {top: 0, right: 0, bottom: 0, left: 0};
  const padding = (value as {padding?: number | string}).padding;
  return parseSides(padding ?? 0);
}
