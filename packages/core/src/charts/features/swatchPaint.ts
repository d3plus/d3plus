/**
    The paint of a swatch that stands for a mark (a tooltip's, or a legend
    entry's): the mark's color (or texture), outlined in the mark's own stroke
    when the mark draws one.
*/
import {color} from "d3-color";

/** The width of every swatch outline, in pixels, whatever its mark's stroke width. */
export const SWATCH_OUTLINE = 1;

/** A swatch's outline: the stroke of the mark it stands for. */
export interface SwatchOutline {
  stroke: string;
  strokeWidth: number;
}

/** What a swatch draws: its color, its texture, and its outline when the mark has them. */
export interface SwatchPaint {
  color?: string;
  /** The mark's texture, a `pattern:<json>` token drawn over `color`. */
  texture?: string;
  outline?: SwatchOutline;
}

/** A paint color that actually shows: not unset, "none", or transparent. */
export const visibleColor = (s: unknown): string | undefined =>
  typeof s === "string" && s !== "none" && s !== "transparent" ? s : undefined;

/** Whether a fill is a texture: a `pattern:<json>` token. */
export const isTexture = (fill: unknown): fill is string =>
  typeof fill === "string" && fill.startsWith("pattern:");

/**
    The color a fill shows as a flat swatch: a texture (a `pattern:<json>`
    token) shows its background, any other fill itself.
    @param fill The mark's fill.
*/
export function swatchColor(fill: unknown): string | undefined {
  const c = visibleColor(fill);
  if (!c || !isTexture(c)) return c;
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
    The outline a swatch draws for a mark's stroke: 1px in the mark's stroke
    color, whatever the mark's stroke width. None when the stroke doesn't
    show: no visible color, no width or opacity, or the chart's `background`
    color.
    @param paint The mark's stroke, strokeWidth, and strokeOpacity.
    @param options The chart's background.
*/
export function swatchOutline(
  paint: MarkPaint,
  {background}: SwatchOptions = {},
): SwatchOutline | undefined {
  const stroke = visibleColor(paint.stroke);
  const width = Number(paint.strokeWidth);
  if (!stroke || !(width > 0) || paint.strokeOpacity === 0) return undefined;
  if (sameColor(stroke, background)) return undefined;
  return {stroke, strokeWidth: SWATCH_OUTLINE};
}

/**
    A mark's swatch paint: a Line's stroke color, with no outline (its stroke
    is the line itself); otherwise its fill (and texture) outlined by its
    stroke (see `swatchOutline`), or, for an unfilled mark, its stroke color
    alone.
    @param paint The mark's paint.
    @param shape The mark's shape type (e.g. "Line", "Circle", "Path").
    @param options The chart's background.
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
  const out: SwatchPaint = {color: fill};
  if (isTexture(paint.fill)) out.texture = paint.fill;
  const outline = swatchOutline(paint, options);
  if (outline) out.outline = outline;
  return out;
}
