/**
    `gaugeEmit` — one group for the dial, centered in the chart area: its
    static parts (never hit targets), then each row's indicator — a needle,
    or a progress arc on the row's own track — painted from `shapeConfig`,
    with a transparent hit area that makes the indicator easy to hover.
*/

import {interpolateRgb} from "d3-interpolate";
import {colorContrast} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import {backgroundColor} from "@d3plus/dom";
import type {SceneNode} from "@d3plus/render";
import {fontFamilyStringify} from "@d3plus/text";

import type {ChartEmit} from "../definition/ChartDefinition.js";
import {
  paintFromShapeConfig,
  resolveAccessor,
  shapeConfigFor,
} from "../features/emitHelpers.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {hasName} from "./applyLayout.js";
import type {GaugeDatum, GaugeShared} from "./applyLayout.js";
import {dialLayout} from "./dialLayout.js";
import type {DialLayout} from "./dialLayout.js";
import {arcPath, emitDialLabels, emitDialParts} from "./emitDial.js";
import type {DialStyle} from "./emitDial.js";
import {needlePath, toDegrees} from "./gaugeGeometry.js";

interface AxisShapeConfig {
  fill?: unknown;
  stroke?: unknown;
  strokeWidth?: unknown;
  labelConfig?: {fontColor?: unknown; fontFamily?: unknown};
}

/** The width of the background-colored outline that separates each needle from the dial. */
export const NEEDLE_OUTLINE = 1.5;

/** The chart's background color, as detected behind its container. */
export function chartBackground(viz: VizInstance): string {
  return viz._select
    ? backgroundColor(viz._select.node())
    : "rgb(255, 255, 255)";
}

/**
    The colors a dial is drawn in when `axisConfig` doesn't set them, read
    against the chart's background so they hold up on light and dark themes:
    the track is a faint tint of the contrasting text color, ticks a stronger
    one, and labels the text color itself.
*/
export function dialDefaults(viz: VizInstance): {
  track: string;
  tick: string;
  text: string;
} {
  const bg = chartBackground(viz);
  const text = colorContrast(bg, viz.schema.colorDefaults);
  const mix = interpolateRgb(bg, text);
  return {track: mix(0.12), tick: mix(0.6), text};
}

/** Resolves the dial's `axisConfig` styling, calling accessors with the first row. */
function dialStyle(viz: VizInstance, d: DataPoint, i: number): DialStyle {
  const sc =
    ((viz.schema.axisConfig ?? {}) as {shapeConfig?: AxisShapeConfig})
      .shapeConfig ?? {};
  const label = sc.labelConfig ?? {};
  const defaults = dialDefaults(viz);
  const family =
    resolveAccessor<string | string[]>(label.fontFamily, d, i) ??
    viz.schema.fontFamily;
  const tickFormat = viz.schema.tickFormat as (v: number) => string;
  return {
    trackFill: resolveAccessor<string>(sc.fill, d, i) ?? defaults.track,
    tickStroke: resolveAccessor<string>(sc.stroke, d, i) ?? defaults.tick,
    tickStrokeWidth: resolveAccessor<number>(sc.strokeWidth, d, i) ?? 1,
    fontColor: resolveAccessor<string>(label.fontColor, d, i) ?? defaults.text,
    fontFamily: fontFamilyStringify(family),
    tickFormat: v => `${tickFormat(v)}`,
  };
}

/** The context every row's indicator is drawn in. */
interface IndicatorCtx {
  viz: VizInstance;
  layout: DialLayout;
  shared: GaugeShared;
  /** Whether the dial shows a single row. */
  single: boolean;
}

/**
    One row's indicator and its hit area. A single row's hit area covers the
    whole dial; with several rows each needle gets a wider invisible copy of
    itself, and each progress row its whole track.
*/
function indicatorNodes(g: GaugeDatum, ctx: IndicatorCtx): SceneNode[] {
  const {viz, layout, shared, single} = ctx;
  const key = `gauge-${viz._ids(g.data, g.i).join("-")}`;
  const paint = paintFromShapeConfig(shapeConfigFor(viz, "Path"), g.data, g.i);
  const valueFormat = viz.schema.valueFormat as (
    v: number,
    d: DataPoint,
  ) => string;
  const name = hasName(viz, g.data, g.i) ? viz._drawLabel(g.data, g.i) : "";
  const label = `${[name, valueFormat(g.value, g.data)].filter(Boolean).join(", ")}.`;
  const common = {datum: g.data, index: g.i, shapeType: "Path", aria: {label}};
  const progress = shared.dial.indicator === "progress";
  const ring = layout.rings[progress ? g.i : 0];
  const sweep = {startAngle: shared.start, endAngle: shared.end};
  const rotate = {rotate: toDegrees(g.angle)};
  const hit: SceneNode = {
    type: "path",
    key: `${key}-indicator::hit`,
    d: single
      ? arcPath({innerRadius: 0, outerRadius: layout.outer, ...sweep})
      : progress
        ? arcPath({innerRadius: ring.inner, outerRadius: ring.outer, ...sweep})
        : needlePath(
            layout.needleLength,
            layout.needleHalfWidth * 3,
            layout.needleTail,
          ),
    transform: single || progress ? undefined : rotate,
    datum: g.data,
    index: g.i,
    paint: {fill: "transparent"},
  };
  if (!Number.isFinite(g.value)) return [hit];
  if (progress) {
    const arc = {
      innerRadius: ring.inner,
      outerRadius: ring.outer,
      startAngle: shared.start,
      endAngle: g.angle,
    };
    return [
      hit,
      {
        type: "path",
        key: `${key}-indicator`,
        d: arcPath(arc),
        arc,
        paint,
        ...common,
      },
    ];
  }
  const needle: SceneNode = {
    type: "path",
    key: `${key}-indicator`,
    d: needlePath(
      layout.needleLength,
      layout.needleHalfWidth,
      layout.needleTail,
    ),
    transform: rotate,
    paint,
    ...common,
  };
  if (!single) return [hit, needle];
  const hub: SceneNode = {
    type: "circle",
    key: `${key}-hub`,
    cx: 0,
    cy: 0,
    r: layout.hubRadius,
    paint,
    ...common,
  };
  return [hit, needle, hub];
}

export const gaugeEmit: ChartEmit = ({viz, shapeData}) => {
  const rows = (shapeData ?? []) as unknown as GaugeDatum[];
  const shared = viz.ctx.gauge as GaugeShared | undefined;
  if (!rows.length || !shared || !(shared.radius > 0)) return [];
  const single = rows.length === 1;
  const first = rows[0];
  const layout = dialLayout(shared.radius, shared.dial);
  const style = dialStyle(viz, first.data, first.i);
  const valueFormat = viz.schema.valueFormat as (
    v: number,
    d: DataPoint,
  ) => string;
  const value =
    single && Number.isFinite(first.value)
      ? `${valueFormat(first.value, first.data)}`
      : "";
  const name = shared.dial.hasName
    ? viz._drawLabel(first.data, first.i)
    : undefined;

  const dial: SceneNode = {
    type: "group",
    key: "gauge-dial",
    interactive: false,
    aria: {hidden: true},
    children: [
      ...emitDialParts("gauge", layout, shared, style),
      ...emitDialLabels("gauge", layout, style, value, name),
    ],
  };
  const ctx: IndicatorCtx = {viz, layout, shared, single};
  const children: SceneNode[] = [
    dial,
    ...rows.flatMap(g => indicatorNodes(g, ctx)),
  ];
  // Several needles share one neutral hub, drawn over their bases.
  if (!single && shared.dial.indicator !== "progress")
    children.push({
      type: "circle",
      key: "gauge-hub",
      interactive: false,
      cx: 0,
      cy: 0,
      r: layout.hubRadius,
      paint: {
        fill: style.fontColor,
        stroke: chartBackground(viz),
        strokeWidth: NEEDLE_OUTLINE,
      },
    });
  return [
    {
      type: "group",
      key: "gauge",
      transform: {x: shared.cx, y: shared.cy},
      children,
    },
  ];
};
