/**
    The paint of a swatch that stands for a mark (a tooltip's, or a legend
    entry's): the mark's color, outlined by the mark's own stroke when the
    mark draws one.
*/
import {color} from "d3-color";

/** A swatch's outline: the stroke of the mark it stands for. */
export interface SwatchOutline {
  stroke: string;
  strokeWidth: number;
}

/** What a swatch draws: its color, and its outline when the mark has one. */
export interface SwatchPaint {
  color?: string;
  outline?: SwatchOutline;
}

/** A swatch's outline is at most its size over this. */
const MAX_OUTLINE = 5;

/** A paint color that actually shows: not unset, "none", or transparent. */
export const visibleColor = (s: unknown): string | undefined =>
  typeof s === "string" && s !== "none" && s !== "transparent" ? s : undefined;

/**
    The color a fill shows as a flat swatch: a texture (a `pattern:<json>`
    token) shows its background, any other fill itself.
    @param fill The mark's fill.
*/
export function swatchColor(fill: unknown): string | undefined {
  const c = visibleColor(fill);
  if (!c || !c.startsWith("pattern:")) return c;
  try {
    return visibleColor(
      (JSON.parse(c.slice("pattern:".length)) as {background?: unknown})
        .background,
    );
  } catch {
    return undefined;
  }
}

/** The paint fields a swatch reads from a mark. */
export interface MarkPaint {
  fill?: unknown;
  stroke?: unknown;
  strokeWidth?: unknown;
  strokeOpacity?: unknown;
}

/** How a swatch reads a mark's stroke. */
export interface SwatchOptions {
  /** The swatch's size, in pixels: its outline is at most a fifth of it. */
  size?: number;
  /**
      The chart's background: a stroke in it is a gap cut between marks (a
      Pie's wedges, a BubbleChart's bubbles), not an outline.
  */
  background?: string;
}

/** Whether two colors are the same color, however each is written. */
function sameColor(a: string, b: string | undefined): boolean {
  if (!b) return false;
  const ca = color(a),
    cb = color(b);
  return ca && cb ? ca.formatRgb() === cb.formatRgb() : a === b;
}

/**
    The outline a swatch draws for a mark's stroke: the mark's stroke color,
    at the mark's stroke width up to a fifth of the swatch's `size`. None when
    the stroke doesn't show: no visible color, no width or opacity, or the
    chart's `background` color.
    @param paint The mark's stroke, strokeWidth (in pixels), and strokeOpacity.
    @param options The swatch's size and the chart's background.
*/
export function swatchOutline(
  paint: MarkPaint,
  {size = Infinity, background}: SwatchOptions = {},
): SwatchOutline | undefined {
  const stroke = visibleColor(paint.stroke);
  const width = Number(paint.strokeWidth);
  if (!stroke || !(width > 0) || paint.strokeOpacity === 0) return undefined;
  if (sameColor(stroke, background)) return undefined;
  return {stroke, strokeWidth: Math.min(width, size / MAX_OUTLINE)};
}

/**
    A mark's swatch paint: a Line's stroke color, with no outline (its stroke
    is the line itself); otherwise its fill outlined by its stroke (see
    `swatchOutline`), or, for an unfilled mark, its stroke color alone.
    @param paint The mark's paint.
    @param shape The mark's shape type (e.g. "Line", "Circle", "Path").
    @param options The swatch's size and the chart's background.
*/
export function markSwatch(
  paint: MarkPaint | undefined,
  shape: string | undefined,
  options: SwatchOptions = {},
): SwatchPaint {
  if (!paint) return {};
  const fill = swatchColor(paint.fill);
  if (shape === "Line") return {color: visibleColor(paint.stroke) ?? fill};
  if (!fill) return {color: visibleColor(paint.stroke)};
  const outline = swatchOutline(paint, options);
  return outline ? {color: fill, outline} : {color: fill};
}
