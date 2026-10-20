/**
    The thin lines that carry each waterfall bar's end level across the gap
    to the next bar of its series.
*/
import type {DataPoint} from "@d3plus/data";
import type {LineNode, Paint, SceneNode} from "@d3plus/render";

import {dashArray} from "../Pyramid/scene.js";
import type {WaterfallStep} from "./steps.js";

/** A drawn bar's step and its pixel edges along the discrete axis. */
export interface ConnectorBar {
  step: WaterfallStep;
  /** The source row the bar draws. */
  datum: DataPoint;
  lo: number;
  hi: number;
}

/** One connector, from the end of `from`'s bar to the start of the next. */
export interface ConnectorSegment {
  from: ConnectorBar;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** The parts of a Bar's scene node the connectors read. */
interface BarNode {
  type?: string;
  shapeType?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  transform?: {x?: number; y?: number};
  datum?: {data?: DataPoint};
  children?: BarNode[];
}

/**
    Each Bar rect in `nodes` with a step, with its pixel extent along the
    discrete axis (x for vertical bars, y for horizontal ones).
*/
export function connectorBars(
  nodes: SceneNode[],
  stepOf: (row: DataPoint) => WaterfallStep | undefined,
  vertical: boolean,
): ConnectorBar[] {
  const bars: ConnectorBar[] = [];
  const walk = (node: BarNode): void => {
    if (node.type === "rect" && node.shapeType === "Bar" && node.datum?.data) {
      const datum = node.datum.data;
      const step = stepOf(datum);
      const offset = vertical ? (node.transform?.x ?? 0) + (node.x ?? 0) : (node.transform?.y ?? 0) + (node.y ?? 0);
      const size = (vertical ? node.width : node.height) ?? 0;
      if (step && Number.isFinite(offset) && Number.isFinite(size)) bars.push({step, datum, lo: offset, hi: offset + size});
    }
    node.children?.forEach(walk);
  };
  (nodes as BarNode[]).forEach(walk);
  return bars;
}

/**
    The connectors between consecutive steps of each series: from the near
    edge of one bar to the near edge of the next, at the level the first bar
    ends. A step that doesn't continue from the previous one (a subtotal
    resetting the running total) takes none.
*/
export function connectorSegments(
  bars: ConnectorBar[],
  level: (v: number) => number,
  vertical: boolean,
): ConnectorSegment[] {
  const bySeries = new Map<string, Map<number, ConnectorBar>>();
  for (const bar of bars) {
    let steps = bySeries.get(bar.step.series);
    if (!steps) bySeries.set(bar.step.series, (steps = new Map()));
    if (!steps.has(bar.step.index)) steps.set(bar.step.index, bar);
  }
  const segments: ConnectorSegment[] = [];
  bySeries.forEach(steps => {
    steps.forEach(bar => {
      const prev = steps.get(bar.step.index - 1);
      if (!prev || !bar.step.joins) return;
      const p = level(prev.step.end);
      if (!Number.isFinite(p)) return;
      const forward = bar.lo + bar.hi >= prev.lo + prev.hi;
      const a = forward ? prev.hi : prev.lo;
      const b = forward ? bar.lo : bar.hi;
      segments.push(vertical
        ? {from: prev, x1: a, y1: p, x2: b, y2: p}
        : {from: prev, x1: p, y1: a, x2: p, y2: b});
    });
  });
  return segments;
}

/** A connector style value, optionally a function of the source row the connector leaves. */
function resolve<T>(v: unknown, d: DataPoint, i: number): T {
  return (typeof v === "function" ? v(d, i) : v) as T;
}

/**
    The connectors as inert scene lines, styled by `config` (`stroke`,
    `strokeWidth`, `strokeOpacity`, `strokeDasharray`).
*/
export function connectorNodes(segments: ConnectorSegment[], config: Record<string, unknown>): LineNode[] {
  return segments.map((s, i) => {
    const d = s.from.datum;
    const paint: Paint = {
      fill: "none",
      stroke: resolve<string>(config.stroke, d, i),
      strokeWidth: resolve<number>(config.strokeWidth, d, i),
      strokeOpacity: resolve<number>(config.strokeOpacity, d, i),
    };
    const dash = dashArray(resolve(config.strokeDasharray, d, i));
    if (dash) paint.strokeDasharray = dash;
    return {
      type: "line",
      key: `waterfall-connector-${s.from.step.series}-${s.from.step.index}`,
      points: [[s.x1, s.y1], [s.x2, s.y2]],
      curve: "linear",
      paint,
      interactive: false,
      interactionGroup: "axis",
    } as LineNode;
  });
}
