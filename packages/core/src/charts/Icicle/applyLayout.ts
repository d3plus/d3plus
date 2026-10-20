/**
    `applyIcicleLayout` — the Icicle's chart-specific layout stage. Lays the
    drawn rows out as nested rectangles (see `layout.ts`) filling the chart
    area, and indexes the laid-out nodes by row on `viz.ctx.icicleNodes` for
    the hover, tooltip, and click handlers.
*/

import type {DataPoint} from "@d3plus/data";
import type {EnterWindow} from "@d3plus/render";

import type {TransformStage} from "../pipeline/stages.js";
import {chartBounds} from "../features/chartGeometry.js";
import {stampShare} from "../features/shareKey.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {PartitionKey, PartitionSort} from "../partition/hierarchy.js";
import {
  partitionFocus,
  partitionRemoved,
  partitionRenderBase,
  partitionReturning,
  partitionZoomOutFocus,
} from "../partition/zoom.js";

import {icicleBands, icicleCollapse, icicleExtent} from "./geometry.js";
import type {
  IcicleFrame,
  IcicleOrient,
  IcicleRect,
  IcicleZoomOrigin,
} from "./geometry.js";
import {icicleStagger} from "./enterStagger.js";
import {icicleLayout} from "./layout.js";
import type {IcicleNode} from "./layout.js";

/** A rectangle a zoom removed, folding away from its last drawn geometry (see `icicleCollapse`). */
export interface IcicleGhost {
  id: string;
  datum: DataPoint;
  i: number | undefined;
  level: number;
  rect: IcicleRect;
}

/** The `orient` config as a valid orientation: anything but `"vertical"` is horizontal. */
export function icicleOrient(value: unknown): IcicleOrient {
  return value === "vertical" ? "vertical" : "horizontal";
}

/**
    The rectangles of `previous` that `next` no longer draws, each collapsed
    the way the zoom from `origin` moves its neighbors.
    @param previous The previous draw's nodes.
    @param next This draw's nodes.
    @param origin The clicked node's breadth extent and depth.
    @param bands This draw's bands per depth.
    @param frame This draw's chart area and orientation.
*/
export function icicleGhosts(
  previous: IcicleNode[],
  next: IcicleNode[],
  origin: IcicleZoomOrigin,
  bands: [number, number][],
  frame: IcicleFrame,
): IcicleGhost[] {
  return partitionRemoved(previous, next).map(n => ({
    id: n.id,
    datum: n.datum,
    i: n.i,
    level: n.level,
    rect: icicleCollapse(n, n.depth, origin, bands, frame),
  }));
}

/**
    Gives every rectangle a zoom-out brings back the start it grows from: the
    mirror of `icicleGhosts`, collapsed through the zoom-out's focus into the
    previous (zoomed) layout, so it grows in from the edges as the zoomed
    rectangles shrink back into their slot. Empty for any other change of
    layout.
    @param previous The previous draw's nodes.
    @param next This draw's nodes.
    @param previousBands The previous draw's bands per depth.
    @param previousFrame The previous draw's chart area and orientation.
*/
export function icicleReturning(
  previous: IcicleNode[],
  next: IcicleNode[],
  previousBands: [number, number][],
  previousFrame: IcicleFrame,
): Map<string, IcicleRect> {
  return partitionReturning(previous, next, (n, focus) =>
    icicleCollapse(
      n,
      n.depth,
      {x0: focus.x0, x1: focus.x1, depth: focus.depth},
      previousBands,
      previousFrame,
    ),
  );
}

/** The layout a render animates from: the last one drawn before it, plus a pending zoom-in origin. */
interface IcicleRenderBase {
  laid?: IcicleNode[];
  bands?: [number, number][];
  frame?: IcicleFrame;
  origin?: IcicleZoomOrigin;
}

/** The layout this render animates from, taken once per render (see `partitionRenderBase`). */
export function icicleRenderBase(viz: VizInstance): IcicleRenderBase {
  return partitionRenderBase(viz, "iciclePass", () => {
    const base: IcicleRenderBase = {
      laid: viz.ctx.icicleLaid as IcicleNode[] | undefined,
      bands: viz.ctx.icicleBands as [number, number][] | undefined,
      frame: viz.ctx.icicleFrame as IcicleFrame | undefined,
      origin: viz.ctx.icicleZoomOrigin as IcicleZoomOrigin | undefined,
    };
    viz.ctx.icicleZoomOrigin = undefined;
    return base;
  });
}

export const applyIcicleLayout: TransformStage = ({viz}) => {
  const {width, height} = chartBounds(viz);
  const frame: IcicleFrame = {
    width: Math.max(0, width),
    height: Math.max(0, height),
    orient: icicleOrient(viz.schema.orient),
  };
  viz.ctx.icicleWidth = frame.width;
  viz.ctx.icicleHeight = frame.height;
  viz.ctx.icicleNodes = new Map<DataPoint, IcicleNode>();
  viz.ctx.icicleGhosts = [];

  const base = icicleRenderBase(viz);
  const data = (viz._filteredData ?? []) as DataPoint[];
  if (!data.length) {
    viz.ctx.icicleLaid = [];
    viz.ctx.icicleBands = undefined;
    viz.ctx.icicleFrame = frame;
    viz.ctx.icicleEnterRects = new Map<string, IcicleRect>();
    viz.ctx.icicleEnterWindows = new Map<string, EnterWindow>();
    return {shapeData: []};
  }

  const focus = partitionFocus(viz);
  const groupBy = viz.schema.groupBy as PartitionKey[];
  const keys = groupBy.slice(focus.level + 1, viz._drawDepth + 1);
  const bands = icicleBands(
    icicleExtent(frame).depth,
    keys.length,
    focus.path.length > 0,
  );

  const nodes = icicleLayout({
    data,
    keys,
    firstLevel: focus.level + 1,
    focusPath: focus.path,
    sum: viz.schema.sum as (d: DataPoint) => number,
    sort: viz.schema.sort as PartitionSort | undefined,
    aggs: viz.schema.aggs as Parameters<typeof icicleLayout>[0]["aggs"],
    bands,
    frame,
  });

  const {laid: previous, bands: previousBands, origin} = base;
  viz.ctx.icicleGhosts =
    origin && previous
      ? icicleGhosts(previous, nodes, origin, bands, frame)
      : [];
  const returning =
    previous && previousBands && base.frame
      ? icicleReturning(previous, nodes, previousBands, base.frame)
      : new Map<string, IcicleRect>();
  // A zoom's entering rectangles keep the zoom's own motion; any other draw
  // grows its entering rectangles out from the root edge, level by level.
  const zoomed =
    Boolean(origin) ||
    Boolean(previous && partitionZoomOutFocus(previous, nodes));
  const drawn = new Set((previous ?? []).map(n => n.id));
  const stagger = zoomed
    ? {rects: returning, windows: new Map<string, EnterWindow>()}
    : icicleStagger(
        nodes,
        new Set(nodes.filter(n => !drawn.has(n.id)).map(n => n.id)),
        frame.orient,
      );
  viz.ctx.icicleEnterRects = stagger.rects;
  viz.ctx.icicleEnterWindows = stagger.windows;
  viz.ctx.icicleLaid = nodes;
  viz.ctx.icicleBands = bands;
  viz.ctx.icicleFrame = frame;

  const lookup = viz.ctx.icicleNodes as Map<DataPoint, IcicleNode>;
  for (const node of nodes) {
    // The tooltip and legend read a row's share off the row (see shareKey.ts).
    stampShare(node.datum, node.share);
    lookup.set(node.datum, node);
  }

  return {shapeData: nodes as unknown as DataPoint[]};
};
