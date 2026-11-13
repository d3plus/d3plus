/**
    HorizonChart's hover: a crosshair snapped to the nearest x value, and one
    tooltip listing every row's value there (only the hovered row's with
    `tooltipShared(false)`). The rows' points are read off the drawn scene,
    so small-multiples panels and zoom need nothing more.
*/
import type {DataPoint} from "@d3plus/data";
import type {InteractionPoint, SceneEvent, SceneNode} from "@d3plus/render";

import {configPrep} from "../../utils/index.js";
import type {ConfigPrepHost} from "../../utils/configPrep.js";
import {facetPanelAt} from "../facet/facetPanel.js";
import {tooltipSwatch, withSwatch} from "../features/tooltipSwatch.js";
import {contentPoint, type SharedHover} from "../Plot/sharedHover.js";
import {
  axisValue,
  prepareTooltip,
  restoreTooltip,
  snappedPosition,
} from "../Plot/sharedTooltip.js";
import {tooltipEnabled} from "../viz/tooltipEnabled.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {HORIZON_ROW} from "./emit.js";
import {
  horizonState,
  rowValue,
  userRow,
  valueColor,
  valueFormat,
} from "./state.js";

/** A drawn row: its series, extent, and points. */
export interface HorizonHitRow {
  id: string;
  label: string;
  top: number;
  bottom: number;
  points: InteractionPoint[];
}

/** One row's entry in the hover. */
export interface HorizonHoverRow {
  id: string;
  label: string;
  value: number;
  datum: DataPoint;
  index: number;
}

/** A resolved hover: the snapped x position and value, and its rows. */
export interface HorizonHover {
  px: number;
  value: unknown;
  rows: HorizonHoverRow[];
}

type RowNode = SceneNode & {
  x: number;
  y: number;
  width: number;
  height: number;
  children?: SceneNode[];
};

/** Every row the chart scene draws, top to bottom. */
export function horizonHitRows(scene: SceneNode[]): HorizonHitRow[] {
  const rows: HorizonHitRow[] = [];
  const walk = (node: SceneNode) => {
    const n = node as RowNode;
    if (n.children) n.children.forEach(walk);
    const key = `${n.key}`;
    if (n.type !== "rect" || !key.startsWith(HORIZON_ROW)) return;
    rows.push({
      id: key.slice(HORIZON_ROW.length),
      label: n.aria?.label ?? key.slice(HORIZON_ROW.length),
      top: n.y,
      bottom: n.y + n.height,
      points: n.interactionPoints ?? [],
    });
  };
  scene.forEach(walk);
  return rows.sort((a, b) => a.top - b.top);
}

/** A point's x value, as a comparable key. */
const xKey = (p: InteractionPoint): string => {
  const v = (p.datum as DataPoint).x;
  return v instanceof Date ? `${v.getTime()}` : `${v}`;
};

/**
    The hover at a content-space position: the x value nearest the pointer
    among every row's points, and each row's value there (only the row under
    the pointer, or the nearest, when `shared` is false). Rows without a
    value at that x, or whose tooltip is off, are left out. Null when no row
    has a point.
    @param viz The chart.
    @param rows The drawn rows (see `horizonHitRows`).
    @param cursor The pointer, in chart content space.
    @param shared Whether every row joins the hover.
*/
export function resolveHorizonHover(
  viz: VizInstance,
  rows: HorizonHitRow[],
  cursor: [number, number],
  shared: boolean,
): HorizonHover | null {
  const [cx, cy] = cursor;
  const distance = (r: HorizonHitRow) =>
    cy < r.top ? r.top - cy : cy > r.bottom ? cy - r.bottom : 0;
  const pool = shared
    ? rows
    : rows
        .filter(r => r.points.length)
        .sort((a, b) => distance(a) - distance(b))
        .slice(0, 1);
  let best: InteractionPoint | undefined;
  for (const row of pool)
    for (const p of row.points)
      if (!best || Math.abs(p.x - cx) < Math.abs(best.x - cx)) best = p;
  if (!best) return null;
  const key = xKey(best);
  const out: HorizonHoverRow[] = [];
  for (const row of pool) {
    const p = row.points.find(q => xKey(q) === key);
    if (!p) continue;
    const datum = userRow(p.datum as DataPoint);
    const value = rowValue(viz, datum, p.index);
    if (!Number.isFinite(value) || !tooltipEnabled(viz, datum, p.index))
      continue;
    out.push({id: row.id, label: row.label, value, datum, index: p.index});
  }
  if (!out.length) return null;
  return {px: best.x, value: (best.datum as DataPoint).x, rows: out};
}

/**
    The hover's tooltip: titled with the x value, one row per series with a
    swatch in the band color its value reaches. User `tooltipConfig` styles
    apply first; the title and rows win.
*/
function renderHorizonTooltip(
  viz: VizInstance,
  hover: HorizonHover,
  event: SceneEvent,
): void {
  const state = horizonState(viz);
  const format = valueFormat(viz);
  const snapped = {axis: "x", px: hover.px} as SharedHover;
  prepareTooltip(viz)
    .data([hover.rows[0].datum])
    .config(
      configPrep.bind(viz as unknown as ConfigPrepHost)(
        viz.schema.tooltipConfig,
      ),
    )
    .title(() => axisValue(viz, "x", hover.value))
    .thead([])
    .tbody(
      hover.rows.map(r => [
        withSwatch(tooltipSwatch(valueColor(state, r.value)), r.label),
        format(r.value),
      ]),
    )
    .footer(false)
    .arrow(false)
    .position(snappedPosition(viz, snapped, event))
    .render();
}

/**
    HorizonChart's `_sharedHover`: inside the plot area, snaps a crosshair to
    the nearest x value and shows its tooltip (see `resolveHorizonHover`),
    in place of the default shape tooltip. Clears on leaving the plot area or
    the chart.
*/
export function handleHorizonHover(viz: VizInstance, event: SceneEvent): void {
  let hover: HorizonHover | null = null;
  const area = viz._plotArea;
  if (event.type === "mousemove" || event.type === "mouseenter") {
    if (viz._transitionEndsAt && Date.now() < viz._transitionEndsAt) return;
    const pick = event.pick?.node as {interactionGroup?: string} | undefined;
    if (
      area &&
      Array.isArray(event.point) &&
      !(pick && pick.interactionGroup === "legend")
    ) {
      const [cx, cy] = contentPoint(viz, event.point);
      const inside =
        cx >= area.x &&
        cx <= area.x + area.width &&
        cy >= area.y &&
        cy <= area.y + area.height;
      if (inside)
        hover = resolveHorizonHover(
          viz,
          horizonHitRows(viz._chartScene || []),
          [cx, cy],
          viz.schema.tooltipShared !== false,
        );
    }
  }
  // Only leaving the whole surface clears; a node-to-node hand-off also
  // dispatches "mouseleave" and is followed by a move.
  else if (
    event.type !== "mouseleave" ||
    (event.nativeEvent && event.nativeEvent.type !== "mouseleave")
  )
    return;
  const prev = viz._sharedHoverState;
  if (hover) {
    viz._sharedHoverActive = true;
    const panel = facetPanelAt(viz, event.point)?.key;
    viz._sharedHoverState = {
      mode: "shared",
      axis: "x",
      px: hover.px,
      value: hover.value,
      markers: [],
      layer: "front",
      panel,
    };
    renderHorizonTooltip(viz, hover, event);
    if (!prev || prev.px !== hover.px || prev.panel !== panel)
      viz._scheduleSceneRepaint();
  } else if (viz._sharedHoverActive) {
    viz._sharedHoverActive = false;
    viz._sharedHoverState = null;
    viz._tooltipClass!.data([]).render();
    restoreTooltip(viz);
    viz._scheduleSceneRepaint();
  }
}
