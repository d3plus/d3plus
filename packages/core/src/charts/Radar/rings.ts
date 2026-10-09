/**
    Radar's level rings, styled like a Plot axis: the inner rings are
    gridlines (`axisConfig.gridConfig`, defaulting to the same faint stroke
    Plot's gridlines use) and the outer ring is the axis line
    (`axisConfig.barConfig`, defaulting to the chart's background ink). Rings are chart
    chrome: they carry no datum and ignore the pointer, so they never show a
    tooltip or dim on hover.
*/

import type {Paint, SceneNode} from "@d3plus/render";

export interface RadarRing {
  /** The ring's value. */
  value: number;
  /** The ring's radius, in pixels. */
  r: number;
}

/** A ring style: paint keys, each a value or `(ring, i) => value`. */
export type RadarRingStyle = Record<string, unknown>;

const KEBAB: Record<string, string> = {
  "stroke-width": "strokeWidth",
  "stroke-opacity": "strokeOpacity",
  "stroke-dasharray": "strokeDasharray",
};

/**
    Layers a user ring style over its defaults. Accepts both `strokeWidth`
    and the `"stroke-width"` spelling Plot's `gridConfig` uses.
*/
export function radarRingStyle(
  defaults: RadarRingStyle,
  user: RadarRingStyle | undefined,
): RadarRingStyle {
  const out: RadarRingStyle = {...defaults};
  for (const [key, value] of Object.entries(user ?? {})) out[KEBAB[key] ?? key] = value;
  return out;
}

const resolve = (v: unknown, ring: RadarRing, i: number): unknown =>
  typeof v === "function" ? (v as (d: RadarRing, i: number) => unknown)(ring, i) : v;

/** Resolves a ring style into a concrete paint for one ring. */
export function radarRingPaint(style: RadarRingStyle, ring: RadarRing, i: number): Paint {
  const paint: Paint = {fill: "none"};
  const stroke = resolve(style.stroke, ring, i);
  if (typeof stroke === "string") paint.stroke = stroke;
  const strokeWidth = Number(resolve(style.strokeWidth, ring, i));
  if (Number.isFinite(strokeWidth)) paint.strokeWidth = strokeWidth;
  const strokeOpacity = Number(resolve(style.strokeOpacity, ring, i));
  if (Number.isFinite(strokeOpacity)) paint.strokeOpacity = strokeOpacity;
  const opacity = Number(resolve(style.opacity, ring, i));
  if (Number.isFinite(opacity)) paint.opacity = opacity;
  const dash = resolve(style.strokeDasharray, ring, i);
  const dashes = (Array.isArray(dash) ? dash : typeof dash === "string" ? dash.split(/[\s,]+/) : [])
    .map(Number)
    .filter(Number.isFinite);
  if (dashes.length) paint.strokeDasharray = dashes;
  return paint;
}

/**
    Builds the ring group: every ring inside `radius` in the grid style, and
    the outer ring (always drawn at `radius`) in the axis-line style.
*/
export function emitRadarRings(
  rings: RadarRing[],
  radius: number,
  outerValue: number,
  gridStyle: RadarRingStyle,
  outerStyle: RadarRingStyle,
): SceneNode[] {
  if (!(radius > 0)) return [];
  const inner = rings.filter(ring => ring.r > 0 && ring.r < radius);
  const all = [...inner, {value: outerValue, r: radius}];
  const children: SceneNode[] = all.map((ring, i) => ({
    type: "circle",
    key: i === inner.length ? "radar-ring-outer" : `radar-ring-${ring.value}`,
    interactive: false,
    cx: 0,
    cy: 0,
    r: ring.r,
    paint: radarRingPaint(i === inner.length ? outerStyle : gridStyle, ring, i),
  }));
  return [{type: "group", key: "radar-radial-circles", interactive: false, children}];
}
