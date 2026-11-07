/**
    The scene nodes for a Pie or Donut's labels outside its ring (see
    `labelPosition`): each label horizontal, in a column beside the ring on
    the side its slice faces, joined to its slice by a thin leader. Both are
    inert and hidden from screen readers (the slice's own aria-label names
    it), and carry the slice's row, so they dim with it on hover.
*/
import type {DataPoint} from "@d3plus/data";
import type {LineNode, SceneNode, TextNode} from "@d3plus/render";

import type {Arc} from "d3-shape";

import TextBox from "../../components/TextBox.js";
import {chartBounds} from "../features/chartGeometry.js";
import {resolveAccessor, userLabelConfig} from "../features/emitHelpers.js";
import {ringLabelFont} from "../features/ringLabelNodes.js";
import {backgroundInk} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {
  leaderRoutes,
  outsideColumn,
  outsideIdealY,
  outsideMetrics,
  outsideSide,
  polylinesCross,
  stackOutsideLabels,
} from "./outsideLabels.js";
import type {Leader, OutsideMetrics} from "./outsideLabels.js";
import {outsideFontSize, pieLabelPlan} from "./pieLabels.js";
import type {OutsideCandidate, PieLabelPlan, PieSlice} from "./pieLabels.js";

/** The leader's opacity over the theme's ink. */
export const LEADER_OPACITY = 0.5;

/**
    When an outside label and its leader fade in: over the second half of a
    redraw, once the slices have mostly settled, so they don't fade in
    where a label that is leaving still shows.
*/
export const OUTSIDE_ENTER = {start: 0.5, end: 1};

/** Where the ring sits: its radius, its center in the chart area, and the chart area's size. */
export interface OutsideFrame {
  radius: number;
  cx: number;
  cy: number;
  width: number;
  height: number;
}

/** A label to stack beside the ring: its slice's middle angle, its weight, and how many lines it takes. */
export interface OutsideStackLabel {
  angle: number;
  weight: number;
  lines: number;
}

/** Where a stacked label goes: the height of its middle, and its leader. */
export interface OutsidePlacement {
  y: number;
  leader: Leader;
}

/**
    The room beside the ring on each side, from where the labels' text
    starts to the chart area's edge.
    @param frame The ring and the chart area.
    @param metrics The label metrics.
*/
export function outsideSpace(
  frame: OutsideFrame,
  metrics: OutsideMetrics,
): {left: number; right: number} {
  const start = outsideColumn(frame.radius, metrics) + metrics.gap;
  return {left: frame.cx - start, right: frame.width - frame.cx - start};
}

/**
    Stacks the outside labels: each side's labels in a column beside the
    ring, within the chart area's height, the smallest slices' labels
    dropped when they don't all fit or a leader can't reach one (see
    `stackOutsideLabels`). Each leader takes the best of its routes (see
    `leaderRoutes`) that crosses no leader above it; when every route
    crosses one, the side's smallest slice gives up its label and the side
    is stacked again. Returns each label's placement, or null for a
    dropped one.
    @param labels The labels.
    @param frame The ring and the chart area.
    @param metrics The label metrics.
*/
export function placeOutsideLabels(
  labels: OutsideStackLabel[],
  frame: OutsideFrame,
  metrics: OutsideMetrics,
): (OutsidePlacement | null)[] {
  const {radius, cy, height} = frame;
  const out: (OutsidePlacement | null)[] = labels.map(() => null);
  const reach = (k: number, y: number) =>
    leaderRoutes(labels[k].angle, radius, y, metrics);
  for (const side of [1, -1] as const) {
    let index = labels
      .map((l, k) => (outsideSide(l.angle) === side ? k : -1))
      .filter(k => k >= 0);
    while (index.length) {
      const ys = stackOutsideLabels(
        index.map(k => ({
          y: outsideIdealY(labels[k].angle, radius, metrics),
          size: labels[k].lines * metrics.lineHeight,
          weight: labels[k].weight,
        })),
        [-cy, height - cy],
        (j, y) => reach(index[j], y).length > 0,
      );
      const order = index
        .map((k, j) => ({k, y: ys[j]}))
        .filter((d): d is {k: number; y: number} => d.y !== null)
        .sort((p, q) => p.y - q.y);
      const chosen: {k: number; y: number; leader: Leader}[] = [];
      let clash = false;
      for (const {k, y} of order) {
        const leader = reach(k, y).find(r =>
          chosen.every(c => !polylinesCross(r, c.leader)),
        );
        if (!leader) {
          clash = true;
          break;
        }
        chosen.push({k, y, leader});
      }
      if (!clash) {
        for (const {k, y, leader} of chosen) out[k] = {y, leader};
        break;
      }
      const drop = index.reduce((m, k) =>
        labels[k].weight < labels[m].weight ? k : m,
      );
      index = index.filter(k => k !== drop);
    }
  }
  return out;
}

/** A label that fit its side's room but found no place in its column. */
export interface CrowdedLabel {
  /** Its slice's middle angle. */
  angle: number;
  /** Its height. */
  size: number;
}

/** The outside labels' scene nodes, the slices they name, and the labels that found no place. */
export interface PieOutsideScene {
  nodes: SceneNode[];
  named: Set<PieSlice>;
  crowded: CrowdedLabel[];
}

/** Splits text into words at its spaces, so a label wraps between words and never mid-word. */
const splitWords = (text: string): string[] => text.match(/\S+\s*/g) ?? [];

/** Letters only, to compare a label's laid-out lines with its name. */
const letters = (text: string) => text.replace(/[\s\u00ad\u2010-]/g, "");

/** The line height of the outside labels' text, as a multiple of its font size. */
const TEXT_LINE_HEIGHT = 1.2;

/** A label laid out in its side's room. */
interface LaidOutsideLabel {
  c: OutsideCandidate;
  node: TextNode;
}

/**
    Lays each outside label's text out in its side's room, wrapping between
    words onto a second line when one is too narrow and dropping the share
    when even two lines are. A label kept is one that shows its slice's
    whole name within its room; it sits with its top at height 0.
*/
function layoutOutsideText(
  viz: VizInstance,
  candidates: OutsideCandidate[],
  frame: OutsideFrame,
  metrics: OutsideMetrics,
): LaidOutsideLabel[] {
  const labelConfig = userLabelConfig(viz, "Path");
  const space = outsideSpace(frame, metrics);
  const start = outsideColumn(frame.radius, metrics) + metrics.gap;
  const right = (c: OutsideCandidate) => outsideSide(c.angle) === 1;
  const roomOf = (c: OutsideCandidate) => (right(c) ? space.right : space.left);
  const fitting = candidates.filter(c => roomOf(c) >= metrics.fontSize * 3);
  if (!fitting.length) return [];
  const ink = backgroundInk(viz);
  const box = new TextBox()
    .renderMode("compute")
    .locale(viz.schema.locale)
    .data(fitting.map((c, k) => ({id: `${k}`, c}) as unknown as DataPoint))
    .config({
      fontWeight: 400,
      ...ringLabelFont(labelConfig),
      fontSize: metrics.fontSize,
      lineHeight: metrics.fontSize * TEXT_LINE_HEIGHT,
      fontColor: ({c}: {c: OutsideCandidate}) => {
        const color = resolveAccessor<unknown>(
          labelConfig.fontColor,
          c.slice.data,
          c.index,
        );
        return typeof color === "string" ? color : ink;
      },
      text: ({c}: {c: OutsideCandidate}) => c.text,
      split: splitWords,
      textAnchor: ({c}: {c: OutsideCandidate}) => (right(c) ? "start" : "end"),
      maxLines: 2,
      // A label whose share doesn't fit drops it whole, without an ellipsis.
      ellipsis: (text: string) => text,
      padding: 0,
      x: ({c}: {c: OutsideCandidate}) =>
        right(c) ? start : -start - space.left,
      y: 0,
      width: ({c}: {c: OutsideCandidate}) => roomOf(c),
      height: metrics.lineHeight * 2,
    });
  return (box.toScene().children as TextNode[]).flatMap(node => {
    const c = (node.datum as unknown as {c?: OutsideCandidate} | undefined)?.c;
    if (!c || node.type !== "text" || !node.lines.length) return [];
    const name = letters(viz._drawLabel(c.slice.data, c.index));
    const room = roomOf(c) + 0.5;
    const whole =
      letters(node.lines.map(l => l.text).join("")).startsWith(name) &&
      node.lines.every(l => l.width <= room);
    return whole ? [{c, node}] : [];
  });
}

/**
    The outside labels' scene nodes, the slices they name, and the labels
    their columns had no place for (see `CrowdedLabel`): a leader and
    a label per slice placed beside the ring (see `placeOutsideLabels`), in
    the theme's ink unless the Path labelConfig's `fontColor` sets a color.
    A label wider than its side's room wraps onto a second line, between
    words, and drops its share when even that is too narrow; a label that
    can't show its slice's whole name within its room is left out, so the
    slice keeps its label inside the ring.
    @param viz The chart.
    @param candidates The slices whose labels go outside.
    @param frame The ring and the chart area.
*/
export function pieOutsideNodes(
  viz: VizInstance,
  candidates: OutsideCandidate[],
  frame: OutsideFrame,
): PieOutsideScene {
  const named = new Set<PieSlice>();
  const crowded: CrowdedLabel[] = [];
  const metrics = outsideMetrics(outsideFontSize(userLabelConfig(viz, "Path")));
  const laid = layoutOutsideText(viz, candidates, frame, metrics);
  if (!laid.length) return {nodes: [], named, crowded};
  const placements = placeOutsideLabels(
    laid.map(({c, node}) => ({
      angle: c.angle,
      weight: c.weight,
      lines: node.lines.length,
    })),
    frame,
    metrics,
  );

  const ink = backgroundInk(viz);
  const lineHeight = metrics.fontSize * TEXT_LINE_HEIGHT;
  const labels: SceneNode[] = [];
  const leaders: SceneNode[] = [];
  laid.forEach(({c, node}, k) => {
    const placement = placements[k];
    if (!placement) {
      crowded.push({
        angle: c.angle,
        size: node.lines.length * metrics.lineHeight,
      });
      return;
    }
    named.add(c.slice);
    const key = `pie-outside-${viz._ids(c.slice.data, c.index).join("-")}`;
    const own = {
      interactive: false,
      datum: c.slice.data,
      index: c.index,
      aria: {hidden: true},
      enterWindow: OUTSIDE_ENTER,
    };
    const tr = node.transform ?? {};
    labels.push({
      ...node,
      ...own,
      key,
      transform: {
        ...tr,
        y: (tr.y ?? 0) + placement.y - (node.lines.length * lineHeight) / 2,
      },
      paint: {...node.paint, opacity: 1},
    } as TextNode);
    leaders.push({
      type: "line",
      key: `${key}-leader`,
      ...own,
      points: placement.leader,
      curve: "linear",
      paint: {
        fill: "none",
        stroke: ink,
        strokeWidth: 1,
        strokeOpacity: LEADER_OPACITY,
        opacity: 1,
      },
    } as LineNode);
  });
  return {nodes: [...leaders, ...labels], named, crowded};
}

/** The outside labels each plan placed. */
const placedByPlan = new WeakMap<PieLabelPlan, PieOutsideScene>();

/**
    The outside labels for the current layout (see `pieOutsideNodes`), with
    the ring and the chart area read from the layout `applyPieLayout` kept
    on `viz.ctx`. Worked out once per layout.
    @param viz The chart, laid out by `applyPieLayout`.
    @param slices The laid-out slices.
*/
export function pieOutsideLabels(
  viz: VizInstance,
  slices: PieSlice[],
): PieOutsideScene {
  const plan = pieLabelPlan(viz, slices);
  const cached = placedByPlan.get(plan);
  if (cached) return cached;
  const arcGen = viz.ctx.arcData as Arc<unknown, PieSlice>;
  const center = viz.ctx.pieCenter as {x: number; y: number} | undefined;
  const {width, height} = chartBounds(viz);
  const placed = slices.length
    ? pieOutsideNodes(viz, plan.outside, {
        radius: arcGen.outerRadius()(slices[0], slices[0].i ?? 0),
        cx: center?.x ?? width / 2,
        cy: center?.y ?? height / 2,
        width,
        height,
      })
    : {nodes: [], named: new Set<PieSlice>(), crowded: []};
  placedByPlan.set(plan, placed);
  return placed;
}
