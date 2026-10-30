import {hsl} from "d3-color";
import type {BaseType} from "d3-selection";

import {
  colorContrast,
  colorDefaults as defaultColors,
  colorGray,
  colorLegible,
} from "@d3plus/color";
import type {ColorDefaults} from "@d3plus/color";
import {backgroundColor} from "@d3plus/dom";

import BaseClass from "./BaseClass.js";
import type {ResolvedTheme} from "./theme.js";

/** Anything that draws chrome: a chart or a component, themed by its chart. */
export interface Inked {
  _theme?: ResolvedTheme;
  _select?: {node?: () => BaseType | null} | null;
  schema: {colorDefaults?: Partial<ColorDefaults>};
}

const WHITE = "rgb(255, 255, 255)";

/**
    The background behind a chart or component: its theme's, or the first
    opaque one behind its DOM node (white when it has none).
    @private
*/
export function inkBackground(obj: Partial<Inked>): string {
  if (obj._theme) return obj._theme.background;
  const sel = obj._select;
  const node = sel && typeof sel.node === "function" ? sel.node() : null;
  return node ? backgroundColor(node) : WHITE;
}

/**
    The gridline color for a background: a faint step off it, so gridlines
    recede equally on light and dark pages.
    @private
*/
export function gridStroke(
  background: string,
  colorDefaults: Partial<ColorDefaults> = {},
): string {
  return colorContrast(background, colorDefaults) ===
    (colorDefaults.dark || defaultColors.dark)
    ? colorGray[200]
    : colorGray[800];
}

/**
    The text color that reads on a chart or component's background.
    @private
*/
export function inkText(obj: Inked): string {
  return (
    obj._theme?.text ??
    colorContrast(inkBackground(obj), obj.schema.colorDefaults)
  );
}

/**
    The axis color (lines, ticks, tick labels) on a chart or component's background.
    @private
*/
export function inkAxis(obj: Inked): string {
  return obj._theme?.axis ?? inkText(obj);
}

/**
    The gridline color on a chart or component's background.
    @private
*/
export function inkGrid(obj: Inked): string {
  return (
    obj._theme?.gridline ??
    gridStroke(inkBackground(obj), obj.schema.colorDefaults)
  );
}

/**
    A series color adjusted to read as text on the chart's background: darkened
    on a light background (`colorLegible`), lightened on a dark one.
    @param c A CSS color.
    @param dark Whether the background is dark.
    @private
*/
export function legibleOn(c: string, dark: boolean): string {
  if (!dark) return colorLegible(c);
  const out = hsl(c);
  if (!Number.isFinite(out.l)) return c;
  if (out.l < 0.65) out.l = 0.65;
  return out.toString();
}

/** Whether an instance is a chart (which themes itself). */
const isChart = (obj: object): boolean =>
  typeof (obj as {_preDraw?: unknown})._preDraw === "function";

/**
    Hands a chart's resolved theme to every component it owns (own properties
    and `ctx` entries, recursively), the way `colorDefaults` cascades. Other
    charts it references (linked charts) keep their own.
    @private
*/
export function cascadeTheme(
  obj: BaseClass,
  theme: ResolvedTheme | undefined,
  seen: WeakSet<BaseClass> = new WeakSet(),
): void {
  if (seen.has(obj)) return;
  seen.add(obj);
  obj._theme = theme;
  for (const child of [...Object.values(obj), ...Object.values(obj.ctx)])
    if (child instanceof BaseClass && !isChart(child))
      cascadeTheme(child, theme, seen);
}
