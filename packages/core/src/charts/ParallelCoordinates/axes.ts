/**
    ParallelCoordinates axes: one `Axis` per dimension, laid out side by side
    (horizontal orient: vertical axes, titles above) or stacked (vertical
    orient: horizontal axes, titles to the left). Every axis shares one pixel
    range so the lines between them read against a common frame.
*/

import type {SceneNode, Transform} from "@d3plus/render";

import {Axis} from "../../components/index.js";
import {barLinePoints} from "../../components/Axis/axisRender.js";
import {withAxisInk} from "../Plot/axisInk.js";
import {backgroundInk} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {axisPositions} from "./dimensions.js";
import type {DimensionOptions, ParallelDimension} from "./dimensions.js";
import type {ParallelOrient} from "./paths.js";
import {titleHeight, titleNodes, titleWidths} from "./titles.js";
import type {DimensionTitle} from "./titles.js";

/** Gap (px) between the titles and the axes they label. */
export const TITLE_GAP = 8;
/** Narrowest a title may wrap to (px). */
const MIN_TITLE_WIDTH = 40;
/** Room (px) added to a title's measured width, so a short title never wraps away. */
const TITLE_SLACK = 4;
/** Room (px) kept at the chart's edges. */
const EDGE = 4;

/** An axis placed in chart coordinates. */
export interface PlacedAxis {
  dim: ParallelDimension;
  /** The axis line's position across the layout (x when horizontal, y when vertical). */
  offset: number;
  /** The axis's pixel extent along its length. */
  start: number;
  end: number;
  /** A value's position along the axis (chart coordinates), or NaN. */
  position: (v: number | string) => number;
  /** The value at a position along a numeric axis. */
  invert?: (px: number) => number;
}

export interface AxesLayout {
  axes: PlacedAxis[];
  nodes: SceneNode[];
}

/**
    The domain handed to the Axis, in drawing order. A horizontal layout's
    numeric axes put their largest value at the top; `reverse` flips any axis.
*/
export function axisDomain(
  dim: ParallelDimension,
  orient: ParallelOrient,
): (number | string)[] {
  const domain = dim.domain.slice();
  const flip =
    dim.type === "numeric"
      ? (orient === "horizontal") !== dim.reverse
      : dim.reverse;
  return flip ? domain.reverse() : domain;
}

/** A dimension's own Axis config: its `dimensionConfig` entry minus the keys the chart reads itself. */
export function dimensionAxisConfig(
  options: DimensionOptions | undefined,
): Record<string, unknown> {
  if (!options) return {};
  const rest: Record<string, unknown> = {...options};
  delete rest.domain;
  delete rest.reverse;
  delete rest.title;
  return rest;
}

/** The title style: the axes' `titleConfig` over the chart's background ink. */
export function dimensionTitleStyle(
  viz: VizInstance,
  orient: ParallelOrient,
): Record<string, unknown> {
  const axisConfig = (viz.schema.axisConfig ?? {}) as {
    titleConfig?: Record<string, unknown>;
  };
  return {
    fontColor: backgroundInk(viz),
    fontSize: 12,
    textAnchor: orient === "horizontal" ? "middle" : "end",
    verticalAlign: orient === "horizontal" ? "bottom" : "middle",
    ...(axisConfig.titleConfig ?? {}),
  };
}

function makeAxis(
  viz: VizInstance,
  dim: ParallelDimension,
  orient: ParallelOrient,
): Axis {
  const dimensionConfig = (viz.schema.dimensionConfig ?? {}) as Record<
    string,
    DimensionOptions | undefined
  >;
  const axis = new Axis()
    .orient(orient === "horizontal" ? "left" : "bottom")
    .align("start");
  axis.renderMode("compute").select(null);
  axis
    .config(withAxisInk(viz, {}))
    .config((viz.schema.axisConfig ?? {}) as Record<string, unknown>)
    .config(dimensionAxisConfig(dimensionConfig[dim.key]));
  axis.gridSize(0).title(false);
  const scale = axis.scale() as string;
  if (dim.type === "categorical" && scale !== "point" && scale !== "band")
    axis.scale("point");
  if (dim.type === "numeric" && (scale === "point" || scale === "band"))
    axis.scale("linear");
  axis.domain(axisDomain(dim, orient));
  return axis;
}

/** The pixel range every axis can share: inside each axis's own end-label room. */
function commonRange(axes: Axis[], length: number): [number, number] {
  let start = 0,
    end = length;
  for (const axis of axes) {
    const range = (axis._d3Scale?.range() ?? [0, length]) as number[];
    start = Math.max(start, Math.min(...range));
    end = Math.min(end, Math.max(...range));
  }
  return end > start ? [start, end] : [0, length];
}

/** Wraps an axis's scene in a group at `transform`, tagged as chrome. */
function axisNode(axis: Axis, key: string, transform: Transform): SceneNode {
  const tag = (node: SceneNode): SceneNode => {
    const kids = (node as {children?: SceneNode[]}).children;
    const next = {
      ...node,
      interactionGroup: "axis",
      interactive: false,
    } as SceneNode;
    delete next.datum;
    if (kids) (next as {children: SceneNode[]}).children = kids.map(tag);
    return next;
  };
  const scene = axis.toScene();
  return tag({
    type: "group",
    key: `pc-axis-${key}`,
    transform,
    children: scene.children,
  } as SceneNode);
}

function placedAxis(
  axis: Axis,
  dim: ParallelDimension,
  offset: number,
  origin: number,
  range: [number, number],
): PlacedAxis {
  const toAxis = (v: number | string): number | string =>
    dim.type === "categorical" ? String(v) : v;
  const scale = axis._d3Scale as {invert?: (px: number) => unknown} | null;
  const invert =
    dim.type === "numeric" && scale && typeof scale.invert === "function"
      ? (px: number) => Number(scale.invert!(px - origin))
      : undefined;
  return {
    dim,
    offset,
    start: origin + range[0],
    end: origin + range[1],
    position: v => {
      const p = axis._getPosition(toAxis(v));
      return typeof p === "number" && Number.isFinite(p) ? origin + p : NaN;
    },
    invert,
  };
}

/** Lays out axes side by side, each vertical, with titles centered above them. */
function layoutHorizontal(
  viz: VizInstance,
  dims: ParallelDimension[],
  width: number,
  height: number,
): AxesLayout {
  const n = dims.length;
  const style = dimensionTitleStyle(viz, "horizontal");
  const locale = viz.schema.locale as string | undefined;
  const natural = titleWidths(
    dims.map(d => d.title),
    style,
    locale,
  );
  const maxLabel = Math.max(30, (width / n) * 0.6);
  const axes = dims.map(dim =>
    makeAxis(viz, dim, "horizontal")
      .height(height)
      .width(maxLabel)
      .maxSize(maxLabel),
  );
  axes.forEach(a => a.measure());
  const labelSpace = axes.map(a => (a.outerBounds().width as number) || 0);

  let spacing = n > 1 ? width / n : width;
  let widths: number[] = [],
    left = 0,
    right = 0;
  for (let pass = 0; pass < 2; pass++) {
    widths = natural.map(w =>
      Math.min(w + TITLE_SLACK, Math.max(spacing - TITLE_GAP, MIN_TITLE_WIDTH)),
    );
    left = Math.max(labelSpace[0], widths[0] / 2, EDGE);
    right = Math.max(widths[n - 1] / 2, EDGE);
    spacing = n > 1 ? (width - left - right) / (n - 1) : width - left - right;
  }
  const offsets = axisPositions(n, left, width - right);
  const titles: DimensionTitle[] = dims
    .map((dim, i) => ({
      key: dim.key,
      text: dim.title,
      x: offsets[i] - widths[i] / 2,
      y: 0,
      width: widths[i],
      height: 0,
    }))
    .filter(t => t.text);
  const band = titleHeight(titles, style, locale);
  const top = band ? band + TITLE_GAP : 0;
  titles.forEach(t => (t.height = band));

  const length = Math.max(0, height - top);
  axes.forEach(a => a.height(length).measure());
  const range = commonRange(axes, length);
  const nodes: SceneNode[] = [];
  const placed = axes.map((axis, i) => {
    axis.range(range).render();
    const bar = barLinePoints(axis);
    const barX = bar ? bar.points[0][0] : labelSpace[i];
    nodes.push(axisNode(axis, dims[i].key, {x: offsets[i] - barX, y: top}));
    return placedAxis(axis, dims[i], offsets[i], top, range);
  });
  nodes.push(...titleNodes(titles, style, locale));
  return {axes: placed, nodes};
}

/** Lays out axes stacked top to bottom, each horizontal, with titles to their left. */
function layoutVertical(
  viz: VizInstance,
  dims: ParallelDimension[],
  width: number,
  height: number,
): AxesLayout {
  const n = dims.length;
  const style = dimensionTitleStyle(viz, "vertical");
  const locale = viz.schema.locale as string | undefined;
  const natural = titleWidths(
    dims.map(d => d.title),
    style,
    locale,
  );
  const titleWidth = Math.min(
    Math.max(0, ...natural) + TITLE_SLACK,
    width * 0.25,
  );
  const left = titleWidth ? titleWidth + TITLE_GAP : 0;
  const length = Math.max(0, width - left);
  const maxLabel = Math.max(20, (height / n) * 0.5);
  const axes = dims.map(dim =>
    makeAxis(viz, dim, "vertical")
      .width(length)
      .height(maxLabel)
      .maxSize(maxLabel),
  );
  axes.forEach(a => a.measure());
  const labelSpace = axes.map(a => (a.outerBounds().height as number) || 0);
  const lineHeight = titleHeight(
    dims.slice(0, 1).map(d => ({
      key: d.key,
      text: "M",
      x: 0,
      y: 0,
      width: titleWidth || 1,
      height: 0,
    })),
    style,
    locale,
  );
  const offsets = axisPositions(
    n,
    Math.max(EDGE, lineHeight / 2),
    height - Math.max(EDGE, labelSpace[n - 1]),
  );
  const spacing = n > 1 ? offsets[1] - offsets[0] : height;
  const range = commonRange(axes, length);
  const nodes: SceneNode[] = [];
  const placed = axes.map((axis, i) => {
    axis.range(range).render();
    const bar = barLinePoints(axis);
    const barY = bar ? bar.points[0][1] : 0;
    nodes.push(axisNode(axis, dims[i].key, {x: left, y: offsets[i] - barY}));
    return placedAxis(axis, dims[i], offsets[i], left, range);
  });
  const titles: DimensionTitle[] = titleWidth
    ? dims
        .map((dim, i) => ({
          key: dim.key,
          text: dim.title,
          x: 0,
          y: offsets[i] - spacing / 2,
          width: titleWidth,
          height: spacing,
        }))
        .filter(t => t.text)
    : [];
  nodes.push(...titleNodes(titles, style, locale));
  return {axes: placed, nodes};
}

/** Lays out one axis per dimension in a `width` × `height` chart area. */
export function layoutAxes(
  viz: VizInstance,
  dims: ParallelDimension[],
  width: number,
  height: number,
  orient: ParallelOrient,
): AxesLayout {
  if (!dims.length || width <= 0 || height <= 0) return {axes: [], nodes: []};
  return orient === "vertical"
    ? layoutVertical(viz, dims, width, height)
    : layoutHorizontal(viz, dims, width, height);
}
