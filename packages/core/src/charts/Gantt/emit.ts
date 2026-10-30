/**
    `ganttEmit` — the Gantt's scene: the group brackets and dependency
    arrows behind the tasks, each task's bar (split by its progress) or
    milestone diamond, the label column, and the "today" line.
*/

import {interpolateRgb} from "d3-interpolate";

import type {PathNode, RectNode, SceneNode} from "@d3plus/render";

import type {ChartEmit} from "../definition/ChartDefinition.js";
import {backgroundImageNode} from "../features/backgroundImageEmit.js";
import {
  resolveAccessor,
  shapeConfigFor,
  textureFill,
} from "../features/emitHelpers.js";
import {chartBackground} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {GanttLayout, GanttMark} from "./applyLayout.js";
import {
  dependencyNodes,
  groupNodes,
  labelNodes,
  todayNodes,
} from "./ganttDecor.js";
import {diamondPath, progressSplit} from "./ganttGeometry.js";
import {ganttAriaLabel} from "./ganttTooltip.js";

/** How far the remaining part of a bar mixes toward the background. */
export const REMAINING_MIX = 0.6;

/**
    The paler shade a bar's remaining (not yet done) part takes: its color
    mixed toward the chart's background, so it reads lighter on a light page
    and dimmer on a dark one.
*/
export function remainingShade(fill: string, background: string): string {
  return interpolateRgb(fill, background)(REMAINING_MIX);
}

/** A milestone diamond's half-height for a bar thickness. */
export const milestoneRadius = (band: number): number =>
  Math.max(3, band * 0.6);

type Paint = Record<string, unknown>;

/** A task's paint from `shapeConfig[shape]`, and its plain color when it has one. */
function taskPaint(
  viz: VizInstance,
  sc: Record<string, unknown>,
  m: GanttMark,
): {paint: Paint; color: string | undefined} {
  const fill = resolveAccessor<unknown>(sc.fill, m.data, m.i);
  const paint: Paint = {
    fill: textureFill(sc, m.data, m.i, fill),
    stroke: resolveAccessor<string>(sc.stroke, m.data, m.i),
    strokeWidth: resolveAccessor<number>(sc.strokeWidth, m.data, m.i),
  };
  const opacity = resolveAccessor<number>(sc.opacity, m.data, m.i);
  if (typeof opacity === "number") paint.opacity = opacity;
  const color =
    typeof paint.fill === "string" && !paint.fill.startsWith("pattern:")
      ? paint.fill
      : undefined;
  return {paint, color};
}

/**
    A task's bar, its left edge at `x0` and centered on its row, as a
    horizontal Bar (so it grows in from its start). With a progress and a
    plain color, the bar takes the paler remaining shade and a second,
    inert rect fills the done part in the task's color.
*/
function barNodes(
  viz: VizInstance,
  layout: GanttLayout,
  m: GanttMark,
  sc: Record<string, unknown>,
): SceneNode[] {
  const {paint, color} = taskPaint(viz, sc, m);
  const width = Math.max(1, m.x1 - m.x0);
  const split = m.progress !== undefined && color !== undefined;
  const key = `gantt-task-${m.id}`;
  const base = {
    type: "rect" as const,
    transform: {x: m.x0, y: m.cy},
    y: -layout.band / 2,
    height: layout.band,
    datum: m.data,
    index: m.i,
  };
  const bar: RectNode = {
    ...base,
    shapeType: "Bar",
    key,
    x: 0,
    width,
    paint: split
      ? {...paint, fill: remainingShade(color!, chartBackground(viz))}
      : paint,
    aria: {label: ganttAriaLabel(viz, m.data, m.i)},
  };
  const out: SceneNode[] = [bar];
  const image = backgroundImageNode(sc, bar, m.data, m.i);
  if (image) out.push(image);
  if (split) {
    const {done} = progressSplit(0, width, m.progress!);
    if (done.width > 0)
      out.push({
        ...base,
        key: `${key}-progress`,
        interactive: false,
        x: done.x,
        width: done.width,
        paint: {
          fill: color,
          ...(typeof paint.opacity === "number"
            ? {opacity: paint.opacity}
            : {}),
        },
      } as RectNode);
  }
  return out;
}

/**
    A milestone's diamond at its end. With a progress, a milestone not yet
    reached (below 100%) draws in the paler remaining shade, outlined in its
    color; a reached one fills in its color.
*/
function milestoneNode(
  viz: VizInstance,
  layout: GanttLayout,
  m: GanttMark,
  sc: Record<string, unknown>,
): PathNode {
  const {paint, color} = taskPaint(viz, sc, m);
  const r = milestoneRadius(layout.band);
  const pending = m.progress !== undefined && m.progress < 1 && !!color;
  return {
    type: "path",
    shapeType: "Path",
    key: `gantt-milestone-${m.id}`,
    d: diamondPath(0, 0, r),
    transform: {x: m.x1, y: m.cy},
    datum: m.data,
    index: m.i,
    paint: pending
      ? {
          ...paint,
          fill: remainingShade(color!, chartBackground(viz)),
          stroke: color,
          strokeWidth: 1.5,
        }
      : paint,
    aria: {label: ganttAriaLabel(viz, m.data, m.i)},
  } as PathNode;
}

export const ganttEmit: ChartEmit = ({viz, shapeData}) => {
  const v = viz as VizInstance;
  const layout = v.ctx.gantt as GanttLayout | undefined;
  const marks = (shapeData ?? []) as unknown as GanttMark[];
  if (!layout || !marks.length) return [];
  const rectConfig = shapeConfigFor(v, "Rect");
  const pathConfig = shapeConfigFor(v, "Path");
  const r = milestoneRadius(layout.band);
  const tasks = marks.flatMap(m =>
    m.milestone
      ? [milestoneNode(v, layout, m, pathConfig)]
      : barNodes(v, layout, m, rectConfig),
  );
  return [
    ...groupNodes(v, layout),
    ...dependencyNodes(v, layout, marks, r),
    ...tasks,
    ...labelNodes(layout, marks),
    ...todayNodes(v, layout),
  ];
};
