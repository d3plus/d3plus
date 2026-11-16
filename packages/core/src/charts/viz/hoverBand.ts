/**
    Which bar's hover band shows: the row the pointer or keyboard focus rests
    on, while it rests on a chart mark (a bar or its slot), with or without
    hover styling. A change repaints the chart when its scene draws bands.

    @module
*/

import type {SceneNode} from "@d3plus/render";

import {setCursor} from "./setCursor.js";
import type {VizInstance} from "./vizTypes.js";

/** The parts of a chart the hover band reads. */
export type HoverBandHost = Pick<
  VizInstance,
  "_lastScenePick" | "_chartScene" | "_hoverBandRow"
> &
  Partial<Pick<VizInstance, "_scheduleSceneRepaint">>;

/** Whether a scene (or any node inside it) draws a hover band. */
export function drawsBands(nodes: SceneNode[] | undefined): boolean {
  return (nodes ?? []).some(
    n =>
      n.hoverPaint !== undefined ||
      drawsBands((n as {children?: SceneNode[]}).children),
  );
}

/** The scenes known to draw bands, read once each. */
const banded = new WeakMap<SceneNode[], boolean>();

/** The row whose band the pointer or keyboard focus calls for, if any. */
export function hoverBandRow(viz: HoverBandHost): unknown {
  const pick = viz._lastScenePick;
  return pick && !pick.isLegend ? pick.d : undefined;
}

/** Shows the band of `row`, repainting a chart that draws bands when asked. */
function showBand(viz: HoverBandHost, row: unknown, repaint: boolean): void {
  if (row === viz._hoverBandRow) return;
  viz._hoverBandRow = row;
  const scene = viz._chartScene;
  if (!repaint || !scene) return;
  if (!banded.has(scene)) banded.set(scene, drawsBands(scene));
  if (banded.get(scene)) viz._scheduleSceneRepaint?.();
}

/**
    Records the row whose band shows (`_hoverBandRow`) and repaints the
    chart when it changes, if the chart's scene draws bands.
    @param viz The chart.
*/
export function syncHoverBand(viz: HoverBandHost): void {
  showBand(viz, hoverBandRow(viz), true);
}

/**
    The pointer leaves a mark: the default cursor and no band, at once.
    While a transition holds the leave handlers, the band goes without a
    repaint, which would cut the transition short.
    @param viz The chart.
*/
export function leaveMark(viz: VizInstance): void {
  setCursor(viz, "auto");
  const moving = !!viz._transitionEndsAt && Date.now() < viz._transitionEndsAt;
  showBand(viz, undefined, !moving);
}
