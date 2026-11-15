/**
    Scene nodes for Plot's axis hover (#782): a dashed guide from the hovered
    point to each axis, and a badge on each axis holding the point's value
    there.
*/
import {colorContrast, colorGray} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import {textWidth} from "@d3plus/dom";
import type {SceneNode, Transform} from "@d3plus/render";

import {parseDash} from "../../shapes/Shape.js";
import {mapBox, mapper, ownBoxes} from "../features/sceneBounds.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {AxisHoverBadge, AxisHoverState} from "./axisHover.js";
import type {AxisName} from "./axisHoverAnchors.js";
import {themed} from "../../utils/theme.js";

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

/** Whether a tick's value is `value`: the same number or date, or the same text. */
export function sameTick(tick: unknown, value: unknown): boolean {
  const unset = (v: unknown) => v === undefined || v === null;
  if (unset(tick) || unset(value)) return false;
  if (tick === value) return true;
  const numeric = (v: unknown) =>
    typeof v === "number" || v instanceof Date ? +v : NaN;
  const a = numeric(tick),
    b = numeric(value);
  if (Number.isFinite(a) || Number.isFinite(b)) return a === b;
  return String(tick) === String(value);
}

/** A tick label's record: its tick's value sits on `data.id`. */
interface TickDatum {
  data?: {id?: unknown; tick?: unknown};
}

/**
    The box, in the space of `nodes`, around the tick labels `axis` draws for
    `value` (an axis's labels sit in its `plot-<axis>-axis` group), or null
    when it draws none.
    @param nodes The chart body's scene nodes.
    @param axis The badged axis.
    @param value The badged value.
*/
export function tickLabelBox(
  nodes: SceneNode[],
  axis: AxisName,
  value: unknown,
): BadgeBox | null {
  const group = nodes.find(n => `${n.key}`.endsWith(`plot-${axis}-axis`));
  if (!group || value === undefined) return null;
  const boxes: BadgeBox[] = [];
  const walk = (node: SceneNode, chain: Transform[]) => {
    const next = node.transform ? [...chain, node.transform] : chain;
    const tick = (node.datum as TickDatum | undefined)?.data;
    if (node.type === "text" && tick?.tick && sameTick(tick.id, value)) {
      const map = mapper(next);
      ownBoxes(node).forEach(b => boxes.push(mapBox(b, map)));
    }
    const children = (node as {children?: SceneNode[]}).children;
    if (children) children.forEach(child => walk(child, next));
  };
  walk(group, []);
  if (!boxes.length) return null;
  return boxes.reduce(unionBox);
}

/** The smallest box holding both `a` and `b`. */
function unionBox(a: BadgeBox, b: BadgeBox): BadgeBox {
  const x = Math.min(a.x, b.x),
    y = Math.min(a.y, b.y);
  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  };
}

/**
    A badge's box grown to cover the tick label under it, with `pad` to
    spare around the label, so none of the label shows around the badge.
    @param box The badge's own box.
    @param label The box around the tick label at the badge's value.
    @param pad The badge's padding.
*/
export function coverLabel(
  box: BadgeBox,
  label: BadgeBox | null,
  pad: number,
): BadgeBox {
  if (!label) return box;
  return unionBox(box, {
    x: label.x - pad,
    y: label.y - pad,
    width: label.width + pad * 2,
    height: label.height + pad * 2,
  });
}

/** A drawn badge's box, and the badge's key. */
export type KeyedBox = BadgeBox & {key?: string};

/** A drawn badge's box: its group's rect (see `badgeNode`), with the badge's key. */
export function badgeRect(badge: SceneNode): KeyedBox {
  const rect = (badge as {children?: SceneNode[]}).children?.find(
    n => n.type === "rect",
  );
  const key = `${badge.key}`;
  if (!rect || rect.type !== "rect")
    return {x: 0, y: 0, width: 0, height: 0, key};
  return {x: rect.x, y: rect.y, width: rect.width, height: rect.height, key};
}

/** Whether boxes `a` and `b` overlap by more than half a pixel each way. */
export function boxesOverlap(a: BadgeBox, b: BadgeBox): boolean {
  const e = 0.5;
  return (
    Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > e &&
    Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > e
  );
}

/** Whether a scene node is one of a Plot's axis groups. */
const isAxisGroup = (node: SceneNode): boolean =>
  /(^|\/)plot-(x|x2|y|y2)-axis$/.test(`${node.key}`);

/** A tick label hidden under a badge: `coveredBy` names the badge's key. */
export type CoveredTick = SceneNode & {coveredBy?: string};

/** A node with its paint's opacity at 0, out of hit-testing, naming the badge over it. */
function hidden(node: SceneNode, by: string | undefined): CoveredTick {
  return {
    ...node,
    interactive: false,
    paint: {...node.paint, opacity: 0},
    coveredBy: by,
  } as CoveredTick;
}

/**
    `nodes` with every axis tick label that overlaps one of `boxes` (the
    badges' boxes, in the space of `nodes`) hidden: the label a badge grows
    over, and any neighbor it reaches, so only the badge's value reads there.
    Rotated labels are tested by their bounding box. A hidden label's
    `coveredBy` names the badge over it. Returns copies along the changed
    paths; `nodes` is left as it is.
    @param nodes The chart body's scene nodes.
    @param boxes The drawn badges' boxes.
*/
export function hideOverlappedTicks(
  nodes: SceneNode[],
  boxes: KeyedBox[],
): SceneNode[] {
  if (!boxes.length) return nodes;
  const visit = (node: SceneNode, chain: Transform[]): SceneNode => {
    const next = node.transform ? [...chain, node.transform] : chain;
    const tick = (node.datum as TickDatum | undefined)?.data;
    if (node.type === "text" && tick?.tick) {
      const map = mapper(next);
      const own = ownBoxes(node).map(b => mapBox(b, map));
      const over = boxes.find(box => own.some(b => boxesOverlap(b, box)));
      return over ? hidden(node, over.key) : node;
    }
    const children = (node as {children?: SceneNode[]}).children;
    if (!children) return node;
    const kids = children.map(child => visit(child, next));
    return kids.some((k, i) => k !== children[i])
      ? ({...node, children: kids} as SceneNode)
      : node;
  };
  return nodes.map(n => (isAxisGroup(n) ? visit(n, []) : n));
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

/**
    One axis's badge: a filled box with the value centered in it, covering
    the axis's own label for that value.
*/
function badgeNode(
  viz: VizInstance,
  state: AxisHoverState,
  badge: AxisHoverBadge,
  edges: PlotEdges,
  color: string,
  nodes: SceneNode[],
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
  const box = coverLabel(
    badgeBox(
      badge.axis,
      badge.at,
      {width: width + pad * 2, height: size + pad * 2},
      edges,
    ),
    tickLabelBox(nodes, badge.axis, badge.value),
    pad,
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
    @param nodes The chart body's scene nodes, holding the axes whose labels the badges cover.
*/
export function axisHoverNodes(
  viz: VizInstance,
  state: AxisHoverState,
  nodes: SceneNode[] = [],
): {guides: SceneNode[]; badges: SceneNode[]} {
  const area = viz._plotArea;
  if (!area) return {guides: [], badges: []};
  const edges = plotEdges(area);
  const color =
    state.color || themed(viz._theme, t => t.textMuted, colorGray[500]);
  return {
    guides: guideNodes(viz, state, edges, color),
    badges: state.badges.map(b =>
      badgeNode(viz, state, b, edges, color, nodes),
    ),
  };
}
