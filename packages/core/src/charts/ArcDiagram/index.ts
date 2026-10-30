/**
    ArcDiagram — a network's nodes in a row along one line, each link drawn
    as an arc between its two nodes. It takes Network's data (`nodes`,
    `links`, and the same accessors), so a network drops in as is.

    Implementation files in this folder:
      - `applyLayout.ts` — orders, spaces, and sizes the nodes, and shapes
        each link's arc.
      - `arcGeometry.ts` / `arcLabels.ts` — the pure geometry and label fit.
      - `emit.ts` — arcs, nodes, and labels as scene nodes.
      - `events.ts` — hover, click focus, and legend focus.
*/

import type {DataPoint} from "@d3plus/data";

import accessor from "../../utils/accessor.js";
import constant from "../../utils/constant.js";
import {themed} from "../../utils/theme.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import {chartBounds} from "../features/chartGeometry.js";
import {ensureZoomDom} from "../features/ensureZoomDom.js";
import {sceneInsetRegion} from "../pipeline/insetPlacement.js";
import {isPointShape} from "../viz/nearestHover.js";
import {effectiveDuration} from "../viz/reducedMotion.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {graphNodeId} from "../Network/graph.js";
import {installGraphFluent} from "../Network/graphFluent.js";
import type {GraphFluent} from "../Network/graphFluent.js";
import {applyArcDiagramLayout, arcSizeLegendScale} from "./applyLayout.js";
import type {ArcCtx, ArcNode} from "./applyLayout.js";
import {arcDiagramEmit} from "./emit.js";
import {isArcLink, setupArcEvents} from "./events.js";

/**
    The table view's rows: every node's row with its number of connections,
    then every link with its source ("From") and target ("To") labels and its own fields.
*/
export function arcTableData(viz: VizInstance): DataPoint[] | null {
  const c = viz.ctx.arcCtx as ArcCtx | undefined;
  if (!c) return null;
  const t = (s: string) => viz.schema.translate(s) as string;
  const nodes = c.nodes.map(n => ({...n.data, [t("Connections")]: n.degree}));
  const links = [...c.links]
    .sort((a, b) => a.index - b.index)
    .map(l => {
      const {source, target, size: _s, index: _i, arc: _a, d: _d, ...rest} = l;
      void [_s, _i, _a, _d];
      return {
        [t("From")]: source.label,
        [t("To")]: target.label,
        ...rest,
      } as DataPoint;
    });
  return [...nodes, ...links];
}

/** The tooltip's title: a node's label, or a link's "Source → Target". */
function tooltipTitle(viz: VizInstance) {
  return (d: DataPoint & {i?: number}, i: number) =>
    isArcLink(d)
      ? `${d.source.label} → ${d.target.label}`
      : viz._drawLabel(d, typeof d.i === "number" ? d.i : i);
}

/** The tooltip's body: a node's number of connections. */
function tooltipBody(viz: VizInstance) {
  return (d: DataPoint, i: number) => {
    if (isArcLink(d)) return [];
    const lookup = viz.ctx.nodeLookup as Record<string, ArcNode> | undefined;
    const node = lookup?.[graphNodeId(viz, d as Record<string, unknown>, i)];
    return node
      ? [[viz.schema.translate("Connections"), `${node.degree}`]]
      : [];
  };
}

export const arcDiagramDef: ChartDefinition = {
  name: "ArcDiagram",

  layoutStage: applyArcDiagramLayout,
  sizeLegendScale: (viz, {width, height}) =>
    arcSizeLegendScale(viz, width, height),
  emit: arcDiagramEmit,
  insetRegion: sceneInsetRegion,
  tableData: arcTableData,

  setup: (viz: VizInstance) => {
    setupArcEvents(viz);
    installGraphFluent(viz as VizInstance & GraphFluent);
    // Like Network, ArcDiagram pans and zooms on its own surface, whose
    // background click clears a focus.
    const v = viz as VizInstance & {_draw: (cb?: () => void) => unknown};
    const supDraw = v._draw.bind(viz);
    v._draw = function (callback?: () => void) {
      const result = supDraw(callback);
      const {width, height} = chartBounds(viz);
      ensureZoomDom(viz, {
        kind: "network",
        width,
        height,
        duration: effectiveDuration(viz),
      });
      return result;
    };
  },

  // Nodes are points for `hoverDistance`; arcs keep exact hit-testing.
  pointMark: (_viz, node) => isPointShape(node),

  ctx: {},

  fields: [
    /**
        Which side of the line the arcs take: `"above"` (the default),
        `"below"`, or `"both"`, where links running forward along the line
        arc above and links running backward arc below.
    */
    {key: "arcSide", default: "above"},
    /**
        Draws arrowheads on the arcs: `true` (or `"target"`) at each link's
        target, `"source"` at its source, `"both"`, or `false` for none. Also
        accepts an accessor function returning one of those per link.
    */
    {key: "arrows", default: false},
    /**
        The arrowhead size in pixels, or an accessor function returning one
        per link. Defaults to three times the arc's stroke width (at least 6).
    */
    {key: "arrowSize"},
    /**
        Colors each arc like one of its nodes: `"source"` or `"target"`.
        `false` (the default) draws every arc in the theme's link gray.
    */
    {key: "linkColor", default: false},
    {key: "links", default: []},
    /**
        The thickness of each arc: a pixel number used for every link, or an
        accessor function whose values are scaled between `linkSizeMin` and
        the smallest node's radius (see `linkSizeScale`).
    */
    {
      key: "linkSize",
      default: constant(1),
      coerce: v => (typeof v === "function" ? v : constant(v as number)),
    },
    /** The minimum pixel stroke width used when sizing arcs. */
    {key: "linkSizeMin", default: 1},
    /** The type of continuous d3-scale used to size arcs. */
    {key: "linkSizeScale", default: "sqrt"},
    {key: "noDataMessage", default: false},
    {key: "nodeGroupBy", default: [accessor("id")]},
    {key: "nodes", default: []},
    /**
        The order of the nodes along the line: `"data"` (the default, their
        order in `nodes`), `"label"`, `"group"`, `"degree"` (most connected
        first), or a comparator function receiving two node rows.
    */
    {key: "nodeSort", default: "data"},
    /** The direction the line runs: `"horizontal"` (the default) or `"vertical"`. */
    {key: "orient", default: "horizontal"},
    {key: "shape", default: constant("Circle"), coerce: "const"},
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        Path: {
          fill: "none",
          label: false,
          stroke: () => themed(viz._theme, t => t.link, "#adb5bd"),
        },
      }),
    },
    /**
        The maximum pixel radius used when sizing nodes. Defaults to just
        under half the space between neighboring nodes, up to 20.
    */
    {key: "sizeMax"},
    /** The minimum pixel radius used when sizing nodes, and every node's radius when unsized. */
    {key: "sizeMin", default: 5},
    /** The type of continuous d3-scale used to size nodes. */
    {key: "sizeScale", default: "sqrt"},
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        title: tooltipTitle(viz),
        tbody: tooltipBody(viz),
      }),
    },
  ],
};

/**
    Places a network's nodes in a row along one line and draws each link as
    an arc between its two nodes, which shows the network's structure
    without a force layout's tangle, in an order you choose.
*/
export default makeChart(arcDiagramDef);
