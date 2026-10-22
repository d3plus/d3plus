/**
    RadialBar's concentric-track layout: one ring per row, the first
    outermost, each bar's arc length (from zero) encoding its value along the
    shared sweep. Pushes the chrome onto `viz._chartScene` beneath the bars:
    the track backgrounds, the value gridlines (spokes at the ticks) with
    their labels outside the circle, and each track's label beside its start
    (a sweep within 30° of a full circle has no room there, so the legend
    names the tracks).
*/

import type {DataPoint} from "@d3plus/data";
import {textWidth} from "@d3plus/dom";
import {arcPath} from "@d3plus/render";
import type {Paint, SceneNode, TextNode} from "@d3plus/render";

import {chartBounds} from "../features/chartGeometry.js";
import {
  paintFromShapeConfig,
  resolveAccessor,
} from "../features/emitHelpers.js";
import {fitText} from "../Gauge/emitDial.js";
import {
  defaultTickCount,
  fitDial,
  gaugeAngle,
  gaugeDomain,
  gaugeTicks,
} from "../Gauge/gaugeGeometry.js";
import type {GaugeDomainInput} from "../Gauge/gaugeGeometry.js";
import type {TransformStage} from "../pipeline/stages.js";
import {
  POLAR_LABEL_PADDING,
  polarBoxesOverlap,
  polarLabelPlacement,
} from "../polar/labels.js";
import {polarInnerRadius} from "../polar/geometry.js";
import {polarSharedExtent} from "../polar/polarFacet.js";
import {POLAR_STROKE_BUFFER} from "../polar/wedgeLayout.js";
import type {PolarWedge} from "../polar/wedgeLayout.js";
import {labelFont} from "../Radar/axisDecorations.js";
import type {RadarAxisConfig} from "../Radar/axisDecorations.js";
import {radarRingPaint, radarRingStyle} from "../Radar/rings.js";
import {backgroundInk} from "../viz/backgroundInk.js";

import {
  radialBarFootprint,
  radialBarLabelRoom,
  radialBarTracks,
} from "./tracks.js";

type Viz = Parameters<TransformStage>[0]["viz"];

/** Gap (px) between a track's start and the end of its label. */
export const RADIAL_BAR_LABEL_GAP = 6;

/** The circle the tracks fill, stored on `viz.ctx.polar`. */
export interface RadialBarFrame {
  inner: number;
  outer: number;
  domain: [number, number];
  start: number;
  end: number;
  ticks: number[];
  /** The circle's center, relative to the chart area's center. */
  cx: number;
  cy: number;
}

/** Resolves a label-config style value against the first row. */
const labelColor = (viz: Viz, d: DataPoint): string => {
  const cfg =
    (viz.schema.axisConfig as RadarAxisConfig).shapeConfig?.labelConfig ?? {};
  return resolveAccessor<string>(cfg.fontColor, d, 0) ?? backgroundInk(viz);
};

/** The sweep (radians) the tracks span: `maxAngle` degrees, 270 by default. */
export function radialBarSweep(viz: Viz): number {
  const maxAngle = Number(viz.schema.maxAngle ?? 270) || 270;
  return (Math.max(1, Math.min(360, maxAngle)) * Math.PI) / 180;
}

/** The smallest gap (radians) before the tracks' start that holds the track labels. */
export const RADIAL_BAR_MIN_LABEL_GAP = Math.PI / 6;

/**
    Whether the tracks leave enough of a gap before their start for the track
    labels. A sweep closer to a full circle leaves too little (none at 360°),
    so the legend names the tracks instead.
*/
export function radialBarTrackLabels(viz: Viz): boolean {
  return Math.PI * 2 - radialBarSweep(viz) >= RADIAL_BAR_MIN_LABEL_GAP - 1e-9;
}

/**
    The value tick labels outside the circle, and the room they need around
    it. Where the sweep's two ends meet or nearly meet, the last label is
    left out if it would cover the first.
*/
function tickLabels(
  viz: Viz,
  ticks: number[],
  angle: (v: number) => number,
): {margin: number; nodes: (r: number) => SceneNode[]} {
  const format = viz.schema.tickFormat as (v: number) => string | number;
  const first = {} as DataPoint;
  const labels = ticks.map((t, i) => {
    const text = `${format(t)}`;
    const font = labelFont(viz, text, first, i);
    const style = {
      "font-family": font.fontFamily,
      "font-size": font.fontSize,
      "font-weight": font.fontWeight,
    };
    return {
      t,
      text,
      font,
      angle: angle(t),
      width: textWidth(text, style) as number,
    };
  });
  const color = labelColor(viz, first);
  return {
    margin: labels.length
      ? Math.max(...labels.map(l => Math.max(l.width, l.font.fontSize))) +
        POLAR_LABEL_PADDING
      : 0,
    nodes: r => {
      const placed = labels.map(l =>
        polarLabelPlacement(l.angle, r, l.width, l.font.fontSize),
      );
      const n = placed.length;
      const shown =
        n > 1 && polarBoxesOverlap(placed[0], placed[n - 1]) ? n - 1 : n;
      return labels.slice(0, shown).map((l, i): TextNode => {
        const p = placed[i];
        return {
          type: "text",
          key: `radialbar-tick-${i}`,
          interactive: false,
          x: 0,
          y: 0,
          transform: {x: p.x + p.width / 2, y: p.y + p.height / 2},
          lines: [{text: l.text, x: 0, y: 0, width: l.width}],
          font: {
            family: l.font.fontFamily,
            size: l.font.fontSize,
            weight: l.font.fontWeight,
            anchor: "middle",
            baseline: "middle",
          },
          paint: {fill: color},
        };
      });
    },
  };
}

/** A track label's font size: the user's `labelConfig.fontSize`, else scaled to the track. */
function trackFontSize(viz: Viz, thickness: number): number {
  const size = (viz.schema.axisConfig as RadarAxisConfig).shapeConfig
    ?.labelConfig?.fontSize;
  if (typeof size === "number") return Math.min(size, thickness * 0.9);
  return Math.max(8, Math.min(14, thickness * 0.6));
}

/** The track labels' text, font, and one-line width at their track's font size. */
function measureTrackLabels(viz: Viz, rows: DataPoint[], thickness: number) {
  const size = trackFontSize(viz, thickness);
  return rows.map((d, i) => {
    const text = viz._drawLabel(d, i);
    const font = labelFont(viz, text, d, i);
    const width = textWidth(text, {
      "font-family": font.fontFamily,
      "font-size": size,
      "font-weight": font.fontWeight,
    }) as number;
    return {d, i, text, font, size, width};
  });
}

/** Each track's label, running back from the track's start. */
function trackLabels(
  viz: Viz,
  rows: DataPoint[],
  frame: RadialBarFrame,
  rings: {inner: number; outer: number}[],
): SceneNode[] {
  const gapAngle = Math.PI * 2 - (frame.end - frame.start);
  const thickness = rings.length ? rings[0].outer - rings[0].inner : 0;
  const children: SceneNode[] = [];
  measureTrackLabels(viz, rows, thickness).forEach(
    ({d, i, text, font, size}) => {
      const ring = rings[i];
      const mid = (ring.inner + ring.outer) / 2;
      const room = radialBarLabelRoom(
        mid,
        frame.outer,
        gapAngle,
        RADIAL_BAR_LABEL_GAP,
      );
      if (size < 6 || room < size * 2) return;
      const fitted = fitText(
        text,
        font.fontFamily,
        size,
        room,
        6,
        font.fontWeight,
      );
      children.push({
        type: "text",
        key: `radialbar-label-${viz._ids(d, i).join("-")}`,
        interactive: false,
        x: 0,
        y: 0,
        transform: {x: -RADIAL_BAR_LABEL_GAP, y: -mid},
        lines: [{text: fitted.text, x: 0, y: 0, width: fitted.width}],
        font: {
          family: font.fontFamily,
          size: fitted.size,
          weight: font.fontWeight,
          anchor: "end",
          baseline: "middle",
        },
        paint: {fill: labelColor(viz, d)},
      });
    },
  );
  if (!children.length) return [];
  const rotate = (frame.start * 180) / Math.PI;
  return [
    {
      type: "group",
      key: "radialbar-labels",
      interactive: false,
      transform: rotate ? {rotate} : undefined,
      children,
    },
  ];
}

/**
    Fits the tracks into a `width` × `height` area: the swept arc plus the
    track labels' strip, inside a margin for the tick labels. Returns the
    outer radius and the circle's center relative to the area's center.
*/
function fitTracks(
  viz: Viz,
  rows: DataPoint[],
  opts: {
    width: number;
    height: number;
    margin: number;
    start: number;
    end: number;
  },
): {outer: number; cx: number; cy: number} {
  const {width, height, margin, start, end} = opts;
  const w = Math.max(0, width - margin * 2);
  const h = Math.max(0, height - margin * 2);
  const padding = Number(viz.schema.trackPadding) || 0;
  const place = (reach: number) =>
    fitDial(w, h, radialBarFootprint(start, end, reach));
  let fit = place(0);
  for (let pass = 0; pass < 2 && rows.length && fit.radius > 0; pass++) {
    const inner = polarInnerRadius(viz.schema.innerRadius, fit.radius);
    const thickness = radialBarTracks(
      rows.length,
      inner,
      fit.radius,
      padding,
    )[0];
    const widest = Math.max(
      0,
      ...measureTrackLabels(viz, rows, thickness.outer - thickness.inner).map(
        l => l.width,
      ),
    );
    fit = place((widest + RADIAL_BAR_LABEL_GAP) / fit.radius);
  }
  return {outer: fit.radius, cx: fit.cx - w / 2, cy: fit.cy - h / 2};
}

/** The value gridlines: one spoke across the tracks at every tick. */
function gridNodes(
  viz: Viz,
  frame: RadialBarFrame,
  angle: (v: number) => number,
): SceneNode[] {
  const axisConfig = viz.schema.axisConfig as RadarAxisConfig;
  const style = radarRingStyle({}, axisConfig.gridConfig);
  const spokes = frame.ticks.map((t, i): SceneNode => {
    const a = angle(t);
    const [s, c] = [Math.sin(a), -Math.cos(a)];
    return {
      type: "path",
      key: `radialbar-grid-${i}`,
      interactive: false,
      d: `M${frame.inner * s},${frame.inner * c}L${frame.outer * s},${frame.outer * c}`,
      paint: radarRingPaint(style, {value: t, r: frame.outer}, i),
    };
  });
  return spokes.length
    ? [
        {
          type: "group",
          key: "radialbar-grid",
          interactive: false,
          children: spokes,
        },
      ]
    : [];
}

/** The background tracks: one full-sweep ring per row, painted from `trackConfig`. */
function trackBackgrounds(
  viz: Viz,
  rows: DataPoint[],
  rings: {inner: number; outer: number}[],
  frame: RadialBarFrame,
): SceneNode {
  const trackConfig = (viz.schema.trackConfig ?? {}) as Record<string, unknown>;
  return {
    type: "group",
    key: "radialbar-tracks",
    interactive: false,
    children: rows.map((d, i): SceneNode => {
      const arc = {
        innerRadius: rings[i].inner,
        outerRadius: rings[i].outer,
        startAngle: frame.start,
        endAngle: frame.end,
      };
      return {
        type: "path",
        key: `radialbar-track-${viz._ids(d, i).join("-")}`,
        interactive: false,
        d: arcPath(arc),
        arc,
        paint: paintFromShapeConfig(trackConfig, d, i) as Paint,
      };
    }),
  };
}

/**
    Lays out the tracks and bars for `rows` (already in track order) and
    pushes the chrome; returns one wedge per row and the frame.
*/
export function radialBarTrackLayout(
  viz: Viz,
  rows: DataPoint[],
): {wedges: PolarWedge[]; frame: RadialBarFrame} {
  const {width, height} = chartBounds(viz);
  const valueFn = viz.schema.value as (d: DataPoint, i: number) => unknown;
  const values = rows.map((d, i) => Number(valueFn(d, i)));
  const start = ((Number(viz.schema.startAngle) || 0) * Math.PI) / 180;
  const end = start + radialBarSweep(viz);
  const labeled = radialBarTrackLabels(viz);
  const tickInput = viz.schema.ticks as number | number[] | false | undefined;
  const tickCount =
    typeof tickInput === "number" ? tickInput : defaultTickCount(start, end);
  // Small multiples sharing one domain also fit it to every panel's values.
  const domain = gaugeDomain(
    values.concat(polarSharedExtent(viz)),
    [],
    viz.schema.domain as GaugeDomainInput,
    tickCount,
  );
  const ticks = gaugeTicks(domain, tickInput, false, tickCount).major;
  const angle = (v: number) => gaugeAngle(v, domain, start, end);

  const tickText = tickLabels(viz, ticks, angle);
  const {outer, cx, cy} = fitTracks(viz, labeled ? rows : [], {
    width: Math.max(0, width - POLAR_STROKE_BUFFER * 2),
    height: Math.max(0, height - POLAR_STROKE_BUFFER * 2),
    margin: tickText.margin,
    start,
    end,
  });
  const inner = polarInnerRadius(viz.schema.innerRadius, outer);
  const frame: RadialBarFrame = {
    inner,
    outer,
    domain,
    start,
    end,
    ticks,
    cx,
    cy,
  };
  const rings = radialBarTracks(
    rows.length,
    inner,
    outer,
    Number(viz.schema.trackPadding) || 0,
  );
  const base = angle(Math.max(domain[0], Math.min(domain[1], 0)));

  const wedges: PolarWedge[] = rows.map((d, i) => {
    const a = angle(values[i]);
    return {
      __d3plus__: true,
      data: d,
      i,
      slot: viz._ids(d, i).join("-"),
      value: values[i],
      y0: 0,
      y1: values[i],
      arc: {
        innerRadius: rings[i].inner,
        outerRadius: rings[i].outer,
        startAngle: Math.min(base, a),
        endAngle: Math.max(base, a),
      },
    };
  });

  const scene = (
    Array.isArray(viz._chartScene) ? viz._chartScene : (viz._chartScene = [])
  ) as SceneNode[];
  if (viz.schema.track !== false)
    scene.push(trackBackgrounds(viz, rows, rings, frame));
  scene.push(...gridNodes(viz, frame, angle));
  if (ticks.length)
    scene.push({
      type: "group",
      key: "radialbar-ticks",
      interactive: false,
      children: tickText.nodes(outer),
    });
  if (labeled) scene.push(...trackLabels(viz, rows, frame, rings));
  viz.ctx.polar = frame;
  return {wedges, frame};
}
