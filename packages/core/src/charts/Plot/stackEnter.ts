/**
    How stacked bars grow in: each segment rises from its stack-side edge
    (Bar's enter collapse, anchored at the segment's own local 0), and waits
    for the segment beneath it. The draw's duration is split into one equal
    window per stack level (`NodeBase.enterWindow`), so the bottom segments
    of every stack grow together, then the ones on top of them, and so on. A
    diverging stack counts its levels outward from zero on each side.
*/
import {
  cubicInOut,
  type EnterWindow,
  type Scene,
  type SceneNode,
} from "@d3plus/render";

import type {PlotDatum} from "../features/plotPaint.js";
import type {ShapeEmitContext} from "../features/shapeEmit.js";

/**
    Each stacked bar's level in its stack (0 nearest the baseline), and the
    number of levels in the deepest stack. A stack is the bars of one group
    at one discrete position; each side of it counts only its nonzero
    segments, in stack order, and negative segments form their own side.
    Bars outside the stack are left out.
    @param rows The stacked bars' rows.
    @param ctx The Plot shape-emit context they were drawn with.
*/
export function stackLevels(
  rows: PlotDatum[],
  ctx: Pick<
    ShapeEmitContext,
    "opp" | "stackData" | "stackKeyIndex" | "discreteKeyIndex"
  >,
): {levels: Map<PlotDatum, number>; depth: number} {
  const {opp, stackData, stackKeyIndex, discreteKeyIndex} = ctx;
  const sides = new Map<string, {row: PlotDatum; order: number}[]>();
  for (const row of rows) {
    const value = Number(row[opp ?? "y"]);
    const series = stackData[stackKeyIndex.get(row.id) ?? -1];
    const discrete = discreteKeyIndex.get(row.discrete);
    if (!value || !Number.isFinite(value) || !series || discrete === undefined)
      continue;
    // d3-stack numbers each series by its place in the stack order.
    const order =
      (series as unknown as {index?: number}).index ??
      stackKeyIndex.get(row.id)!;
    // Bars in different groups at one position stand side by side, as stacks of their own.
    const side = `${discrete}|${row.group}|${value < 0 ? "-" : "+"}`;
    if (!sides.has(side)) sides.set(side, []);
    sides.get(side)!.push({row, order});
  }
  const levels = new Map<PlotDatum, number>();
  let depth = 0;
  for (const stack of sides.values()) {
    stack.sort((a, b) => a.order - b.order);
    stack.forEach(({row}, level) => levels.set(row, level));
    depth = Math.max(depth, stack.length);
  }
  return {levels, depth};
}

/**
    The enter window of stack level `level` out of `depth`: an equal share of
    the duration. A window is a share of the transition's eased progress, so
    the time shares are mapped through the renderers' easing; together the
    levels then trace one eased motion up the stack.
*/
export function levelWindow(level: number, depth: number): EnterWindow {
  return {
    start: cubicInOut(level / depth),
    end: cubicInOut((level + 1) / depth),
  };
}

/** Whether a scene already shows a Plot bar. */
export function showsBars(scene: Scene | undefined): boolean {
  const has = (node: SceneNode): boolean =>
    (node.type === "rect" && node.shapeType === "Bar") ||
    (node.type === "group" && node.children.some(has));
  return scene ? has(scene.root) : false;
}

/**
    Gives each stacked bar's nodes (its rect, hit area, labels, and error
    bar) the enter window of its stack level. Unstacked bars, and every draw
    made while bars are already on screen (a data update, a zoom), are
    returned untouched.
    @param ctx The Plot shape-emit context the bars were drawn with.
    @param nodes The bars' scene nodes.
*/
export function stackEnterWindows(
  ctx: ShapeEmitContext,
  nodes: SceneNode[],
): SceneNode[] {
  const {viz} = ctx;
  if (!viz.schema.stacked || showsBars(viz._paintedScene)) return nodes;
  const {levels, depth} = stackLevels(ctx.values as PlotDatum[], ctx);
  if (depth < 2) return nodes;
  const windows = new Map<unknown, EnterWindow>();
  for (const node of nodes) {
    const level =
      node.shapeType === "Bar"
        ? levels.get(node.datum as unknown as PlotDatum)
        : undefined;
    if (level !== undefined) windows.set(node.datum, levelWindow(level, depth));
  }
  return nodes.map(node => {
    const datum = node.datum as {data?: unknown} | undefined;
    const window = windows.get(datum) ?? windows.get(datum?.data);
    return window ? ({...node, enterWindow: window} as SceneNode) : node;
  });
}
