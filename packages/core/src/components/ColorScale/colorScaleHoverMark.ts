/**
    The ColorScale's hover mark (#770): while a value is hovered (see
    `ColorScale.hover`), an extra axis tick marks where the value falls on
    the color bar and a badge, where that tick's label would sit, reads it.
    A bucketed bar
    (`bucketAxis`) also outlines the value's bucket. Discrete swatches
    (jenks, buckets, quantile without `bucketAxis`) get no mark: the value's
    swatch stays lit and the rest dim instead (see `hoveredSwatch`).
*/
import {colorContrast} from "@d3plus/color";
import {backgroundColor, textWidth} from "@d3plus/dom";
import type {Bounds} from "@d3plus/math";
import type {GroupNode, SceneNode} from "@d3plus/render";

import type ColorScale from "./ColorScale.js";

/** A style value: a constant, or a function of the hovered value. */
type Style<T> = T | ((value: number) => T);

/** The `hoverMarkConfig` options. */
export interface ColorScaleHoverMarkConfig {
  /** The tick at the value: `stroke` and `strokeWidth` default to the axis ticks' own, and `length` to the axis's `tickSize`. */
  tickConfig?: {
    length?: Style<number>;
    stroke?: Style<string>;
    strokeWidth?: Style<number>;
  };
  /** The value's badge: `fill` defaults to the value's color, `stroke` to the text color that reads on the background, and `fontColor` to a color contrasting the fill. */
  badgeConfig?: {
    fill?: Style<string>;
    fontColor?: Style<string>;
    fontFamily?: Style<string>;
    fontSize?: Style<number>;
    fontWeight?: Style<number | string>;
    padding?: Style<number>;
    rx?: Style<number>;
    stroke?: Style<string>;
    strokeWidth?: Style<number>;
  };
  /** The outline around the value's bucket on a bucketed bar (`bucketAxis`): `stroke` defaults to the text color that reads on the background. */
  outlineConfig?: {
    stroke?: Style<string>;
    strokeWidth?: Style<number>;
  };
}

/** `hoverMarkConfig`'s defaults. */
export function hoverMarkDefaults(): ColorScaleHoverMarkConfig {
  return {
    tickConfig: {},
    badgeConfig: {fontSize: 11, fontWeight: 400, padding: 3, rx: 2},
    outlineConfig: {strokeWidth: 2},
  };
}

/** The side of the bar the axis labels sit on. */
export type ColorScaleOrient = "bottom" | "left" | "right" | "top";

/**
    Where the color bar sits in the ColorScale, recorded when a bar renders:
    its axis maps a value to a pixel along the bar, and the bar spans `cross`
    across it. `ticks` holds a bucketed bar's bucket starts.
*/
export interface ColorScaleBarGeometry {
  orient: ColorScaleOrient;
  position: (value: number) => number;
  /** The bar's start and end along its length. */
  range: [number, number];
  /** The bar's edges across its length. */
  cross: [number, number];
  /** The values at the bar's two ends, low first. */
  domain: [number, number];
  ticks?: number[];
}

/** Whether a bar orient runs along x. */
const horizontal = (orient: ColorScaleOrient): boolean =>
  orient === "bottom" || orient === "top";

/** `value` held within `[min, max]` (in either order). */
export function clampTo(value: number, [a, b]: [number, number]): number {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return Math.min(hi, Math.max(lo, value));
}

/**
    The hovered value's pixel along the bar: a value outside the bar's domain
    clamps to its nearer end. Null for a value that isn't a finite number.
*/
export function barPosition(
  geometry: ColorScaleBarGeometry,
  value: number,
): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const px = geometry.position(clampTo(value, geometry.domain));
  return Number.isFinite(px) ? clampTo(px, geometry.range) : null;
}

/**
    The tick at `at` along a bar whose labels face `orient`: from the bar's
    edge on the labels' side, `length` out toward them.
    @returns The tick's two ends, on the bar first.
*/
export function tickPoints(
  orient: ColorScaleOrient,
  at: number,
  cross: [number, number],
  length: number,
): [number, number][] {
  if (orient === "bottom")
    return [
      [at, cross[1]],
      [at, cross[1] + length],
    ];
  if (orient === "top")
    return [
      [at, cross[0]],
      [at, cross[0] - length],
    ];
  if (orient === "right")
    return [
      [cross[1], at],
      [cross[1] + length, at],
    ];
  return [
    [cross[0], at],
    [cross[0] - length, at],
  ];
}

/**
    The value badge's box: centered on `at` along the bar (held within
    `[0, limit]`), its near edge `offset` past the bar's edge on the labels'
    side, where the tick ends.
*/
export function badgeBox(
  orient: ColorScaleOrient,
  at: number,
  cross: [number, number],
  size: {width: number; height: number},
  limit: number,
  offset: number,
): Bounds {
  const {width, height} = size;
  if (horizontal(orient)) {
    const x = clampTo(at - width / 2, [0, Math.max(0, limit - width)]);
    const y =
      orient === "bottom" ? cross[1] + offset : cross[0] - offset - height;
    return {x, y, width, height};
  }
  const y = clampTo(at - height / 2, [0, Math.max(0, limit - height)]);
  const x = orient === "right" ? cross[1] + offset : cross[0] - offset - width;
  return {x, y, width, height};
}

/**
    The span `[start, end]` of the bucket holding `value` on a bucketed bar
    whose buckets start at `ticks`, the last running to `domainEnd`; null
    when the value is below the first bucket.
*/
export function bucketSpan(
  ticks: number[],
  value: number,
  domainEnd: number,
): [number, number] | null {
  let index = -1;
  ticks.forEach((tick, i) => {
    if (value >= tick) index = i;
  });
  if (index < 0) return ticks.length ? [ticks[0], ticks[1] ?? domainEnd] : null;
  return [ticks[index], ticks[index + 1] ?? domainEnd];
}

/** Resolves a style value against the hovered value. */
function style<T>(value: Style<T> | undefined, hovered: number): T | undefined {
  return typeof value === "function"
    ? (value as (v: number) => T)(hovered)
    : value;
}

/** Stamps a node inert chrome: no hit-testing, never dimmed by hover. */
function inert<T extends SceneNode>(node: T): T {
  const n = node as T & {interactive?: boolean; interactionGroup?: string};
  n.interactive = false;
  n.interactionGroup = "axis";
  return node;
}

/** Everything a hover mark is drawn with, resolved for one value. */
interface MarkContext {
  cs: ColorScale;
  key: string;
  value: number;
  /** The value's color on the scale. */
  color: string;
  /** The text color that reads on the ColorScale's background. */
  ink: string;
  config: ColorScaleHoverMarkConfig;
  /** The axis ticks' paint, which the value's tick takes by default. */
  tickPaint: {stroke?: string; strokeWidth?: number};
}

/** The tick's length: `tickConfig.length`, else the axis's `tickSize`. */
function tickLength(mark: MarkContext): number {
  const length = style(mark.config.tickConfig?.length, mark.value);
  const size = mark.cs._axisClass.schema.tickSize;
  return typeof length === "number"
    ? length
    : typeof size === "number"
      ? size
      : 8;
}

/** The tick at `at`, from the bar to the badge. */
function tickNode(
  mark: MarkContext,
  orient: ColorScaleOrient,
  at: number,
  cross: [number, number],
): SceneNode {
  const c = mark.config.tickConfig || {};
  return inert({
    type: "line",
    key: `${mark.key}-tick`,
    points: tickPoints(orient, at, cross, tickLength(mark)),
    paint: {
      fill: "none",
      stroke: style(c.stroke, mark.value) ?? mark.tickPaint.stroke ?? mark.ink,
      strokeWidth:
        style(c.strokeWidth, mark.value) ?? mark.tickPaint.strokeWidth ?? 1,
    },
  } as SceneNode);
}

/**
    The badge reading the value, over the axis labels: it starts where the
    tick ends, and its text sits as far from the bar as the tick labels' text
    (the axis's `tickSize` plus its `padding`), so the badge is padded across
    the bar by that gap, or by `padding` when the gap is smaller.
*/
function badgeNode(
  mark: MarkContext,
  geometry: ColorScaleBarGeometry,
  at: number,
  text: string,
): SceneNode {
  const {cs, value} = mark;
  const c = mark.config.badgeConfig || {};
  const size = style(c.fontSize, value) ?? 11;
  const family =
    style(c.fontFamily, value) ||
    `${(cs._labelClass.fontFamily() as (d: unknown) => unknown)(text)}`;
  const weight = style(c.fontWeight, value) ?? 400;
  const pad = style(c.padding, value) ?? 3;
  const fill = style(c.fill, value) ?? mark.color;
  const ink =
    style(c.fontColor, value) ?? colorContrast(fill, cs.schema.colorDefaults);
  const width = textWidth(text, {
    "font-family": family,
    "font-size": size,
    "font-weight": weight,
  });
  const limit = horizontal(geometry.orient)
    ? cs.schema.width
    : cs.schema.height;
  const length = tickLength(mark);
  const axis = cs._axisClass.schema;
  const labelGap =
    (typeof axis.tickSize === "number" ? axis.tickSize : 8) +
    (typeof axis.padding === "number" ? axis.padding : 0);
  const across = Math.max(pad, labelGap - length);
  const box = badgeBox(
    geometry.orient,
    at,
    geometry.cross,
    horizontal(geometry.orient)
      ? {width: width + pad * 2, height: size + across * 2}
      : {width: width + across * 2, height: size + pad * 2},
    limit,
    length,
  );
  const key = `${mark.key}-badge`;
  return inert({
    type: "group",
    key,
    children: [
      inert({
        type: "rect",
        key: `${key}-box`,
        ...box,
        rx: style(c.rx, value) ?? 0,
        paint: {
          fill,
          stroke: style(c.stroke, value) ?? mark.ink,
          strokeWidth: style(c.strokeWidth, value) ?? 1,
        },
      } as SceneNode),
      inert({
        type: "text",
        key: `${key}-text`,
        x: 0,
        y: 0,
        transform: {x: box.x + box.width / 2, y: box.y + box.height / 2},
        lines: [{text, x: 0, y: 0, width}],
        font: {family, size, weight, anchor: "middle", baseline: "middle"},
        paint: {fill: ink},
      } as SceneNode),
    ],
  } as SceneNode);
}

/** The outline around the bucket holding the value on a bucketed bar. */
function bucketOutline(
  mark: MarkContext,
  geometry: ColorScaleBarGeometry,
): SceneNode[] {
  if (!geometry.ticks) return [];
  const span = bucketSpan(geometry.ticks, mark.value, geometry.domain[1]);
  if (!span) return [];
  const [a, b] = span.map(v => barPosition(geometry, v));
  if (a === null || b === null) return [];
  const c = mark.config.outlineConfig || {};
  const lo = Math.min(a, b);
  const length = Math.abs(b - a);
  const [c0, c1] = geometry.cross;
  const box = horizontal(geometry.orient)
    ? {x: lo, y: c0, width: length, height: c1 - c0}
    : {x: c0, y: lo, width: c1 - c0, height: length};
  return [
    inert({
      type: "rect",
      key: `${mark.key}-outline`,
      ...box,
      paint: {
        fill: "none",
        stroke: style(c.stroke, mark.value) ?? mark.ink,
        strokeWidth: style(c.strokeWidth, mark.value) ?? 2,
      },
    } as SceneNode),
  ];
}

/** The badge text for a value: the axis's own tick format, without markup. */
function formatValue(cs: ColorScale, value: number): string {
  const format = (cs._axisClass._labelFormat ??
    cs.schema.axisConfig.tickFormat) as ((d: unknown) => string) | undefined;
  const text = format ? format(value) : `${value}`;
  return `${text ?? ""}`.replace(/<[^>]*>/g, "").trim();
}

/** The bar variant's mark: tick, badge, and a bucketed bar's outline. */
function barMark(
  mark: MarkContext,
  geometry: ColorScaleBarGeometry,
): SceneNode[] {
  const at = barPosition(geometry, mark.value);
  if (at === null) return [];
  const text = formatValue(mark.cs, mark.value);
  return [
    ...bucketOutline(mark, geometry),
    tickNode(mark, geometry.orient, at, geometry.cross),
    ...(text ? [badgeNode(mark, geometry, at, text)] : []),
  ];
}

/**
    The stroke and width of the ColorScale axis's ticks, read off its scene
    in `group` (the first visible tick path of the `Axis-` group).
*/
function axisTickPaint(group: GroupNode): {
  stroke?: string;
  strokeWidth?: number;
} {
  let paint: {stroke?: string; strokeWidth?: number} | undefined;
  const walk = (node: SceneNode, inAxis: boolean): void => {
    if (paint) return;
    const axis = inAxis || String(node.key).startsWith("Axis-");
    if (node.type === "group")
      node.children.forEach(child => walk(child, axis));
    else if (
      axis &&
      node.type === "path" &&
      !String(node.key).endsWith("::hit")
    )
      paint = {
        stroke: node.paint?.stroke,
        strokeWidth: node.paint?.strokeWidth,
      };
  };
  group.children.forEach(child => walk(child, false));
  return paint ?? {};
}

/**
    Adds the hover mark for the ColorScale's hovered value to its scene
    `group` (changed in place): nothing when no finite value is hovered,
    `hoverMark` is off, or the scale draws discrete swatches.
*/
export function addHoverMark(cs: ColorScale, group: GroupNode): void {
  const value = cs._hoverValue;
  const geometry = cs._barGeometry;
  if (
    cs.schema.hoverMark === false ||
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    !cs._colorScale ||
    !geometry
  )
    return;
  const node =
    cs._select && typeof cs._select.node === "function"
      ? (cs._select.node() as Element | null)
      : null;
  const ink = colorContrast(
    node ? backgroundColor(node) : "rgb(255, 255, 255)",
    cs.schema.colorDefaults,
  );
  const mark: MarkContext = {
    cs,
    key: `${group.key}-hover`,
    value,
    color: String(cs._colorScale(value)),
    ink,
    config: (cs.schema.hoverMarkConfig || {}) as ColorScaleHoverMarkConfig,
    tickPaint: axisTickPaint(group),
  };
  group.children.push(...barMark(mark, geometry));
}
