/**
    Scene nodes for Plot's axis hover (#782): a dashed guide from the hovered
    point to each axis, and a badge on each axis holding the point's value
    there.
*/
import {colorContrast, colorGray} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import {textWidth} from "@d3plus/dom";
import type {SceneNode} from "@d3plus/render";

import {parseDash} from "../../shapes/Shape.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {AxisHoverBadge, AxisHoverState} from "./axisHover.js";
import type {AxisName} from "./axisHoverAnchors.js";

/** The plot area's edges in chart content space, where each axis line sits. */
export interface PlotEdges {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** A badge's box, in chart content space. */
export interface BadgeBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A style value: a constant, or an accessor of the hovered row. */
type Style<T> = T | ((d: DataPoint, i: number) => T);

/** The `axisHoverConfig` options. */
export interface AxisHoverConfig {
  /** Paint for the guide lines; `stroke` defaults to the hovered mark's color. */
  guideConfig?: {
    stroke?: Style<string>;
    strokeDasharray?: Style<string | number[]>;
    strokeOpacity?: Style<number>;
    strokeWidth?: Style<number>;
  };
  /** The value badges; `fill` defaults to the hovered mark's color, `fontColor` to a contrasting ink. */
  badgeConfig?: {
    fill?: Style<string>;
    fontColor?: Style<string>;
    fontFamily?: Style<string>;
    fontSize?: Style<number>;
    fontWeight?: Style<number | string>;
    padding?: Style<number>;
    rx?: Style<number>;
  };
}

/** `axisHoverConfig`'s defaults. */
export function axisHoverDefaults(): AxisHoverConfig {
  return {
    guideConfig: {strokeDasharray: "4 3", strokeWidth: 1},
    badgeConfig: {fontSize: 12, fontWeight: 400, padding: 4, rx: 2},
  };
}

/**
    The plot area's edges: the x axis along the bottom, x2 along the top, y
    on the left, and y2 on the right.
    @param area The plot area.
*/
export function plotEdges(area: {
  x: number;
  y: number;
  width: number;
  height: number;
}): PlotEdges {
  return {
    left: area.x,
    right: area.x + area.width,
    top: area.y,
    bottom: area.y + area.height,
  };
}

/**
    The guide from a point straight across to an axis line.
    @param axis The axis the guide runs to.
    @param point The hovered point.
    @param edges The plot area's edges.
*/
export function guidePoints(
  axis: AxisName,
  point: {x: number; y: number},
  edges: PlotEdges,
): [number, number][] {
  const to: [number, number] =
    axis === "x"
      ? [point.x, edges.bottom]
      : axis === "x2"
        ? [point.x, edges.top]
        : axis === "y"
          ? [edges.left, point.y]
          : [edges.right, point.y];
  return [[point.x, point.y], to];
}

/**
    A badge's box: centered on `at` along its axis, and set just outside the
    axis line, over the tick labels.
    @param axis The axis the badge labels.
    @param at The badge's center along the axis.
    @param size The badge's width and height.
    @param edges The plot area's edges.
*/
export function badgeBox(
  axis: AxisName,
  at: number,
  size: {width: number; height: number},
  edges: PlotEdges,
): BadgeBox {
  const {width, height} = size;
  if (axis === "x") return {x: at - width / 2, y: edges.bottom, width, height};
  if (axis === "x2")
    return {x: at - width / 2, y: edges.top - height, width, height};
  if (axis === "y")
    return {x: edges.left - width, y: at - height / 2, width, height};
  return {x: edges.right, y: at - height / 2, width, height};
}

/** Resolves a style value against the hovered row. */
function style<T>(
  value: Style<T> | undefined,
  state: AxisHoverState,
): T | undefined {
  return typeof value === "function"
    ? (value as (d: DataPoint, i: number) => T)(state.datum, state.index)
    : value;
}

/** Stamps a node inert chrome: no hit-testing, never dimmed by hover. */
function inert<T extends SceneNode>(node: T): T {
  const n = node as T & {interactive?: boolean; interactionGroup?: string};
  n.interactive = false;
  n.interactionGroup = "axis";
  return node;
}

/** The guide lines from the hovered point to each badged axis. */
function guideNodes(
  viz: VizInstance,
  state: AxisHoverState,
  edges: PlotEdges,
  color: string,
): SceneNode[] {
  const config = (viz.schema.axisHoverConfig as AxisHoverConfig).guideConfig;
  const c = config || {};
  const dash = style(c.strokeDasharray, state);
  return state.badges
    .filter(b => b.guide)
    .map(b =>
      inert({
        type: "line",
        key: `plot-axis-hover-guide-${b.axis}`,
        points: guidePoints(b.axis, state.point, edges),
        paint: {
          fill: "none",
          stroke: style(c.stroke, state) ?? color,
          strokeWidth: style(c.strokeWidth, state) ?? 1,
          strokeOpacity: style(c.strokeOpacity, state) ?? 1,
          strokeDasharray: Array.isArray(dash) ? dash : parseDash(dash),
        },
      } as SceneNode),
    );
}

/** One axis's badge: a filled box with the value centered in it. */
function badgeNode(
  viz: VizInstance,
  state: AxisHoverState,
  badge: AxisHoverBadge,
  edges: PlotEdges,
  color: string,
): SceneNode {
  const config = (viz.schema.axisHoverConfig as AxisHoverConfig).badgeConfig;
  const c = config || {};
  const size = style(c.fontSize, state) ?? 12;
  const family = style(c.fontFamily, state) || `${viz.schema.fontFamily}`;
  const weight = style(c.fontWeight, state) ?? 400;
  const pad = style(c.padding, state) ?? 4;
  const fill = style(c.fill, state) ?? color;
  const ink =
    style(c.fontColor, state) ?? colorContrast(fill, viz.schema.colorDefaults);
  const width = textWidth(badge.text, {
    "font-family": family,
    "font-size": size,
    "font-weight": weight,
  });
  const box = badgeBox(
    badge.axis,
    badge.at,
    {width: width + pad * 2, height: size + pad * 2},
    edges,
  );
  const key = `plot-axis-hover-badge-${badge.axis}`;
  return inert({
    type: "group",
    key,
    children: [
      inert({
        type: "rect",
        key: `${key}-box`,
        ...box,
        rx: style(c.rx, state) ?? 0,
        paint: {fill},
      } as SceneNode),
      inert({
        type: "text",
        key: `${key}-text`,
        x: 0,
        y: 0,
        transform: {x: box.x + box.width / 2, y: box.y + box.height / 2},
        lines: [{text: badge.text, x: 0, y: 0, width}],
        font: {family, size, weight, anchor: "middle", baseline: "middle"},
        paint: {fill: ink},
      } as SceneNode),
    ],
  } as SceneNode);
}

/**
    The axis hover's scene nodes, in chart content space: `guides` to draw
    with the plot's marks (inside its zoom clip), and `badges` to draw over
    the axes.
    @param viz The Plot, with the hovered panel's state in place.
    @param state The active axis hover.
*/
export function axisHoverNodes(
  viz: VizInstance,
  state: AxisHoverState,
): {guides: SceneNode[]; badges: SceneNode[]} {
  const area = viz._plotArea;
  if (!area) return {guides: [], badges: []};
  const edges = plotEdges(area);
  const color = state.color || colorGray[500];
  return {
    guides: guideNodes(viz, state, edges, color),
    badges: state.badges.map(b => badgeNode(viz, state, b, edges, color)),
  };
}
