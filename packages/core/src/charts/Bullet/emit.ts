/**
    `bulletEmit` — one group per bullet: its static parts (the track, bands,
    and value axis; never hit targets), its labels, a transparent hit area
    over the whole bullet, then the forecast bar, the measure bar, and the
    target marker, painted from `shapeConfig`, `forecastConfig`, and
    `targetConfig`.
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode, TextNode} from "@d3plus/render";

import type {ChartEmit} from "../definition/ChartDefinition.js";
import {backgroundImageNode} from "../features/backgroundImageEmit.js";
import {
  paintFromShapeConfig,
  resolveAccessor,
  shapeConfigFor,
  textureFill,
} from "../features/emitHelpers.js";
import {fitText} from "../Gauge/emitDial.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {BulletDatum, BulletShared} from "./applyLayout.js";
import {
  baselineValue,
  growFrom,
  markerPoints,
  spanRect,
  trackPosition,
} from "./bulletGeometry.js";
import type {BulletRect} from "./bulletGeometry.js";
import {TICK_GAP, TICK_LENGTH} from "./bulletLayout.js";
import type {BulletStyle} from "./bulletStyle.js";

type Anchor = "start" | "middle" | "end";

/** A single-line label anchored at `(x, y)`. */
export function bulletText(
  key: string,
  text: string,
  x: number,
  y: number,
  opts: {
    size: number;
    family: string;
    color: string;
    anchor: Anchor;
    width: number;
    weight?: number;
  },
): TextNode {
  return {
    type: "text",
    key,
    x: 0,
    y: 0,
    transform: {x, y},
    lines: [{text, x: 0, y: 0, width: opts.width}],
    font: {
      family: opts.family,
      size: opts.size,
      weight: opts.weight ?? 400,
      anchor: opts.anchor,
      baseline: "middle",
    },
    paint: {fill: opts.color},
  };
}

const rectNode = (
  key: string,
  r: BulletRect,
  fill: string,
  enterRect: BulletRect,
): SceneNode => ({
  type: "rect",
  key,
  interactive: false,
  ...r,
  enterRect,
  paint: {fill},
});

/** The track, the bands, and the value axis of one bullet. */
export function bulletStatics(
  b: BulletDatum,
  key: string,
  style: BulletStyle,
): SceneNode[] {
  const {track} = b;
  const [lo, hi] = track.domain;
  const base = baselineValue(track.domain);
  const span = (k: string, v0: number, v1: number, fill: string): SceneNode => {
    const r = spanRect(track, v0, v1, 1);
    return rectNode(k, r, fill, growFrom(track, base, r));
  };
  const nodes: SceneNode[] = [span(`${key}-track`, lo, hi, style.trackFill)];
  b.bands.forEach((band, i) =>
    nodes.push(span(`${key}-band-${i}`, band.min, band.max, band.color)),
  );
  if (!b.ticks.length) return nodes;
  const vertical = track.orient === "vertical";
  const {band: box} = track;
  const edge = vertical ? box.x : box.y + box.height;
  const marks = b.ticks
    .map(t => {
      const p = trackPosition(track, t);
      return vertical
        ? `M${edge - TICK_LENGTH},${p}L${edge},${p}`
        : `M${p},${edge}L${p},${edge + TICK_LENGTH}`;
    })
    .join("");
  nodes.push({
    type: "path",
    key: `${key}-ticks`,
    interactive: false,
    d: marks,
    paint: {
      fill: "none",
      stroke: style.tickStroke,
      strokeWidth: style.tickStrokeWidth,
    },
  });
  const offset = TICK_LENGTH + TICK_GAP;
  b.ticks.forEach((t, i) => {
    const p = trackPosition(track, t);
    const text = style.tickFormat(t);
    const fit = fitText(text, style.fontFamily, style.tickFontSize, Infinity);
    nodes.push({
      ...bulletText(
        `${key}-tick-${i}`,
        fit.text,
        vertical ? edge - offset : p,
        vertical ? p : edge + offset + style.tickFontSize / 2,
        {
          size: style.tickFontSize,
          family: style.fontFamily,
          color: style.fontColor,
          anchor: vertical ? "end" : "middle",
          width: fit.width,
        },
      ),
      interactive: false,
    });
  });
  return nodes;
}

/** The name and sub-label at the start of one bullet. */
function labelNodes(
  b: BulletDatum,
  key: string,
  shared: BulletShared,
): SceneNode[] {
  const {style, nameFontSize, subFontSize} = shared;
  const {label} = b;
  const lines: {
    text: string;
    size: number;
    weight: number;
    color: string;
    kind: string;
  }[] = [];
  if (b.name)
    lines.push({
      text: b.name,
      size: nameFontSize,
      weight: 600,
      color: style.fontColor,
      kind: "name",
    });
  if (b.subLabel)
    lines.push({
      text: b.subLabel,
      size: subFontSize,
      weight: 400,
      color: style.mutedColor,
      kind: "sub",
    });
  if (!lines.length || !(label.maxWidth > 0)) return [];
  const gap = 2;
  const height =
    lines.reduce((s, l) => s + l.size, 0) + gap * (lines.length - 1);
  let y = shared.orient === "vertical" ? label.y : label.y - height / 2;
  return lines.map(l => {
    const fit = fitText(
      l.text,
      style.fontFamily,
      l.size,
      label.maxWidth,
      8,
      l.weight,
    );
    const node = bulletText(
      `${key}-${l.kind}`,
      fit.text,
      label.x,
      y + l.size / 2,
      {
        size: fit.size,
        family: style.fontFamily,
        color: l.color,
        anchor: label.anchor,
        width: fit.width,
        weight: l.weight,
      },
    );
    y += l.size + gap;
    return {...node, datum: b.data, index: b.i};
  });
}

/** The forecast bar, measure bar, and target marker of one bullet. */
function markNodes(
  viz: VizInstance,
  b: BulletDatum,
  key: string,
  shared: BulletShared,
): SceneNode[] {
  const {track, data: d, i} = b;
  const nodes: SceneNode[] = [];
  const base = baselineValue(track.domain);
  const sc = shapeConfigFor(viz, "Rect");
  const paint = paintFromShapeConfig(sc, d, i);
  const valueFormat = viz.schema.valueFormat as (
    v: number,
    d: DataPoint,
  ) => string;
  const parts = [
    b.name,
    Number.isFinite(b.value) ? valueFormat(b.value, d) : "",
  ];
  if (Number.isFinite(b.target))
    parts.push(`${viz.schema.translate("Target")} ${valueFormat(b.target, d)}`);
  const common = {
    datum: d,
    index: i,
    aria: {label: `${parts.filter(Boolean).join(", ")}.`},
  };
  const forecastConfig = (viz.schema.forecastConfig ?? {}) as Record<
    string,
    unknown
  >;
  if (Number.isFinite(b.forecast)) {
    const size = resolveAccessor<number>(forecastConfig.size, d, i) ?? 0.6;
    // The forecast inherits the measure's fill and texture unless
    // `forecastConfig` sets its own.
    const fill =
      resolveAccessor<unknown>(forecastConfig.fill, d, i) ??
      resolveAccessor<unknown>(sc.fill, d, i);
    const r = spanRect(track, base, b.forecast, size);
    const forecast: SceneNode = {
      type: "rect",
      key: `${key}-forecast`,
      ...r,
      enterRect: growFrom(track, base, r),
      shapeType: "Rect",
      paint: {
        fill: textureFill({...sc, ...forecastConfig}, d, i, fill),
        opacity: resolveAccessor<number>(forecastConfig.opacity, d, i) ?? 0.35,
      },
      ...common,
    };
    nodes.push(forecast);
    const image = backgroundImageNode(forecastConfig, forecast, d, i);
    if (image) nodes.push(image);
  }
  if (Number.isFinite(b.value)) {
    const size = Number(viz.schema.measureSize);
    const r = spanRect(
      track,
      base,
      b.value,
      Number.isFinite(size) ? size : 0.35,
    );
    const measure: SceneNode = {
      type: "rect",
      key: `${key}-measure`,
      ...r,
      enterRect: growFrom(track, base, r),
      shapeType: "Rect",
      paint,
      ...common,
    };
    nodes.push(measure);
    const image = backgroundImageNode(sc, measure, d, i);
    if (image) nodes.push(image);
  }
  const targetConfig = (viz.schema.targetConfig ?? {}) as Record<
    string,
    unknown
  >;
  if (Number.isFinite(b.target)) {
    const size = resolveAccessor<number>(targetConfig.size, d, i) ?? 0.75;
    nodes.push({
      type: "line",
      key: `${key}-target`,
      points: markerPoints(track, b.target, size),
      shapeType: "Line",
      paint: {
        fill: "none",
        stroke:
          resolveAccessor<string>(targetConfig.stroke, d, i) ??
          shared.style.fontColor,
        strokeWidth:
          resolveAccessor<number>(targetConfig.strokeWidth, d, i) ?? 3,
      },
      ...common,
    });
  }
  return nodes;
}

export const bulletEmit: ChartEmit = ({viz, shapeData}) => {
  const bullets = (shapeData ?? []) as unknown as BulletDatum[];
  const shared = viz.ctx.bullet as BulletShared | undefined;
  if (!bullets.length || !shared) return [];
  const seen = new Map<string, number>();
  return bullets.map(b => {
    const n = seen.get(b.key) ?? 0;
    seen.set(b.key, n + 1);
    const key = `bullet-${b.key}${n ? `-${n}` : ""}`;
    const hit: SceneNode = {
      type: "rect",
      key: `${key}::hit`,
      ...b.hit,
      datum: b.data,
      index: b.i,
      paint: {fill: "transparent"},
    };
    return {
      type: "group",
      key,
      children: [
        {
          type: "group",
          key: `${key}-static`,
          interactive: false,
          aria: {hidden: true},
          children: bulletStatics(b, key, shared.style),
        },
        hit,
        ...labelNodes(b, key, shared),
        ...markNodes(viz, b, key, shared),
      ],
    };
  });
};
