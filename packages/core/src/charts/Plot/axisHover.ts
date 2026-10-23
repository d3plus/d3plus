/**
    Axis hover for Plot charts (#782): hovering a mark draws a dashed guide
    from its point to each axis and a badge on the axis with the point's
    value there, formatted as the tooltip formats that axis. With a discrete
    axis it follows the snapped hover (see `sharedHover.ts`): the crosshair is
    the discrete axis's guide, and the value axis gets the hovered (or
    nearest) series' point.
*/
import type {DataPoint} from "@d3plus/data";
import type {SceneEvent} from "@d3plus/render";

import {nodeColor, ownerNode} from "../features/tooltipSwatch.js";
import {facetPanelAt} from "../facet/facetPanel.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  anchorAxes,
  closestAnchor,
  collectAnchors,
  isAnchorMark,
  liftAnchor,
  markAnchors,
  nearestAnchor,
  type AnchorDatum,
  type AxisHoverAnchor,
  type AxisName,
} from "./axisHoverAnchors.js";
import {contentPoint, labeledMark, type ShapeNode} from "./sharedHover.js";
import {axisValue} from "./sharedTooltip.js";

/** One axis's badge: where it sits along the axis, and its text. */
export interface AxisHoverBadge {
  axis: AxisName;
  /** The badge's center along the axis, in chart content space. */
  at: number;
  text: string;
  /** Whether a guide runs from the point to this axis (the crosshair is the discrete axis's guide). */
  guide: boolean;
}

/** The active axis hover: the hovered point, its color and row, and its badges. */
export interface AxisHoverState {
  point: {x: number; y: number};
  color?: string;
  datum: DataPoint;
  index: number;
  badges: AxisHoverBadge[];
  /** The small-multiples panel the hover is in, by key. */
  panel?: string;
}

/** Pixels a point may sit outside the plot area and still count as shown. */
const SLACK = 1;

type ScaleLike = ((v: unknown) => number) & {invert?: (px: number) => unknown};
type PositionFn = (d: DataPoint, axis?: string) => number;

/** Where a value lands on a Plot axis (its position functions take raw values). */
const place = (position: PositionFn, value: unknown, axis: AxisName): number =>
  position(value as DataPoint, axis);

/**
    The value an axis reads at `pixel`: the record's own value when it is
    drawn there, else the scale inverted at the pixel (a stacked mark's top
    sits at the stack's running total, not its own value).
    @param value The record's value on the axis.
    @param position Where `value` lands on the axis.
    @param pixel Where the anchor sits on the axis.
    @param invert The axis's pixel → value mapping, when it has one.
*/
export function axisValueAt(
  value: unknown,
  position: number,
  pixel: number,
  invert?: (px: number) => unknown,
): unknown {
  if (Number.isFinite(position) && Math.abs(position - pixel) <= SLACK)
    return value;
  return invert ? invert(pixel) : value;
}

/**
    A badge's text for `value`, as plain text: `value` run through `format`,
    with any markup removed. Empty for a missing value.
    @param format The axis's value formatter.
    @param value The value to label.
*/
export function formatAxisValue(
  format: ((d: unknown) => string) | undefined,
  value: unknown,
): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "number" && !Number.isFinite(value)) return "";
  const text = format ? format(value) : `${value}`;
  return `${text ?? ""}`.replace(/<[^>]*>/g, "").trim();
}

/** The pixel → value mapping of a Plot axis, offset the way its position function is. */
function axisInvert(
  viz: VizInstance,
  name: AxisName,
  position: PositionFn,
  sample: unknown,
): ((px: number) => unknown) | undefined {
  const scale = viz[`_${name}Axis`]?._d3Scale as ScaleLike | undefined;
  if (!scale || typeof scale.invert !== "function") return undefined;
  const offset = place(position, sample, name) - scale(sample);
  if (!Number.isFinite(offset)) return undefined;
  return (px: number) => scale.invert!(px - offset);
}

/**
    An Area's anchor moved from its baseline to its top edge: its value's
    position, or on a stacked chart the stack's running total there.
*/
function areaAnchor(
  viz: VizInstance,
  anchor: AxisHoverAnchor,
  valueAxis: "x" | "y",
): AxisHoverAnchor {
  if (anchor.shape !== "Area") return anchor;
  const name: AxisName =
    anchor.datum[`${valueAxis}2`] !== undefined ? `${valueAxis}2` : valueAxis;
  const position = valueAxis === "x" ? viz._xFunc : viz._yFunc;
  const value = Number(anchor.datum[name]);
  if (!position || !Number.isFinite(value)) return anchor;
  if (!viz.schema.stacked)
    return liftAnchor(anchor, place(position, value, name), valueAxis);
  const invert = axisInvert(viz, name, position, value);
  const low = invert ? Number(invert(anchor[valueAxis])) : NaN;
  if (!Number.isFinite(low)) return anchor;
  return liftAnchor(anchor, place(position, low + value, name), valueAxis);
}

/** The chart's discrete axis, when it has one. */
function discreteAxis(viz: VizInstance): "x" | "y" | undefined {
  const discrete: unknown = viz.schema.discrete;
  return discrete === "x" || discrete === "y" ? discrete : undefined;
}

/** Whether a point sits in the plot area (within a pixel). */
function shown(viz: VizInstance, point: {x: number; y: number}): boolean {
  const a = viz._plotArea;
  if (!a) return false;
  return (
    point.x >= a.x - SLACK &&
    point.x <= a.x + a.width + SLACK &&
    point.y >= a.y - SLACK &&
    point.y <= a.y + a.height + SLACK
  );
}

/**
    The hovered point of a mark plotted against a secondary value axis, which
    the snapped hover doesn't read: the mark's point nearest the cursor along
    the discrete axis.
*/
function secondaryAnchor(
  viz: VizInstance,
  mark: ShapeNode,
  discrete: "x" | "y",
  cursor: [number, number],
): AxisHoverAnchor | null {
  const valueAxis = discrete === "x" ? "y" : "x";
  const anchors = markAnchors(mark, valueAxis, nodeColor(viz, mark));
  if (!anchors.length || anchors[0].datum[`${valueAxis}2`] === undefined)
    return null;
  return nearestAnchor(
    anchors.map(a => areaAnchor(viz, a, valueAxis)),
    discrete,
    cursor[discrete === "x" ? 0 : 1],
  );
}

/**
    The anchor a hover resolves to. With a discrete axis it follows the
    snapped hover: among the marks at its position, the hovered mark's (when
    a single mark is hovered), else the one nearest the cursor; a mark the
    snapped hover skips (see `secondaryAnchor`) reads its own point. Without
    a discrete axis it's the hovered mark's point nearest the cursor.
*/
function hoveredAnchor(
  viz: VizInstance,
  event: SceneEvent,
  cursor: [number, number],
): AxisHoverAnchor | null {
  const discrete = discreteAxis(viz);
  const picked = event.pick ? (event.pick.node as ShapeNode) : undefined;
  const mark = ownerNode(viz, labeledMark(viz, picked) ?? picked);
  const onMark = isAnchorMark(mark);
  if (discrete) {
    const state = viz._sharedHoverState;
    if (!state)
      return onMark ? secondaryAnchor(viz, mark, discrete, cursor) : null;
    const id =
      state.mode === "single" && onMark
        ? String((mark.datum as AnchorDatum).id)
        : undefined;
    const valueAxis = discrete === "x" ? "y" : "x";
    const column = collectAnchors(viz)
      .map(a => areaAnchor(viz, a, valueAxis))
      .filter(
        a =>
          Math.abs(a[discrete] - state.px) <= SLACK &&
          (id === undefined || String(a.datum.id) === id),
      );
    const cross = discrete === "x" ? "y" : "x";
    return nearestAnchor(column, cross, cursor[cross === "x" ? 0 : 1]);
  }
  if (!onMark) return null;
  const anchors = markAnchors(mark, "y", nodeColor(viz, mark));
  return closestAnchor(
    anchors.map(a => areaAnchor(viz, a, "y")),
    cursor,
  );
}

/**
    Resolves the axis hover for a pointer event (see the module notes), or
    null when nothing is hovered, the point is outside the plot area, or no
    axis has a value to show.
    @param viz The Plot.
    @param event The pointer event.
    @param cursor The pointer in chart content space.
*/
export function resolveAxisHover(
  viz: VizInstance,
  event: SceneEvent,
  cursor: [number, number],
): AxisHoverState | null {
  const anchor = hoveredAnchor(viz, event, cursor);
  if (!anchor || !shown(viz, anchor)) return null;
  const discrete = discreteAxis(viz);
  const state = discrete ? viz._sharedHoverState : null;
  const setting: unknown = viz.schema.axisHover;
  const axes = anchorAxes(anchor.datum, {
    discrete,
    bar: anchor.shape === "Bar",
    cross: viz._swarm?.cross,
    only: setting === "x" || setting === "y" ? setting : undefined,
  });
  const badges: AxisHoverBadge[] = [];
  for (const axis of axes) {
    const dim = axis.charAt(0) as "x" | "y";
    const snapped = !!state && dim === discrete;
    const at = snapped ? state!.px : anchor[dim];
    const position = dim === "x" ? viz._xFunc : viz._yFunc;
    const raw = snapped ? state!.value : anchor.datum[axis];
    const value =
      snapped || !position
        ? raw
        : axisValueAt(
            raw,
            place(position, raw, axis),
            at,
            axisInvert(viz, axis, position, raw),
          );
    const text = formatAxisValue(v => axisValue(viz, axis, v), value);
    if (text) badges.push({axis, at, text, guide: !snapped});
  }
  if (!badges.length) return null;
  const row = (anchor.datum.data || anchor.datum) as DataPoint;
  return {
    point: {x: anchor.x, y: anchor.y},
    color: anchor.color,
    datum: row,
    index: typeof anchor.datum.i === "number" ? anchor.datum.i : 0,
    badges,
  };
}

/** A string that changes whenever the drawn hover would. */
const signature = (s: AxisHoverState | null | undefined): string =>
  s ? JSON.stringify([s.point, s.color, s.panel, s.badges]) : "";

/**
    Plot's axis hover handler, run after the snapped hover resolves: tracks
    the hovered point across moves and clears when the pointer leaves it,
    repainting only when what it draws changes. Off with `axisHover(false)`.
    @param viz The Plot.
    @param event The pointer event.
*/
export function handleAxisHover(viz: VizInstance, event: SceneEvent): void {
  let next: AxisHoverState | null = null;
  if (event.type === "mousemove" || event.type === "mouseenter") {
    if (viz._transitionEndsAt && Date.now() < viz._transitionEndsAt) return;
    const pick = event.pick?.node as {interactionGroup?: string} | undefined;
    if (
      viz.schema.axisHover !== false &&
      viz._plotArea &&
      Array.isArray(event.point) &&
      !(pick && pick.interactionGroup === "legend")
    ) {
      next = resolveAxisHover(viz, event, contentPoint(viz, event.point));
      if (next) {
        const panel = facetPanelAt(viz, event.point)?.key;
        if (panel !== undefined) next.panel = panel;
      }
    }
  } else if (event.type !== "mouseleave") return;
  const prev = viz._axisHoverState;
  if (signature(prev) === signature(next)) return;
  viz._axisHoverState = next;
  viz._scheduleSceneRepaint();
}
