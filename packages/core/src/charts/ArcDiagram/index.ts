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
import {linkStyleFields} from "../features/linkFields.js";
import {loaderFormatFields} from "../viz/loaderFormat.js";
import {sceneInsetRegion} from "../pipeline/insetPlacement.js";
import {isPointShape} from "../viz/nearestHover.js";
import {effectiveDuration} from "../viz/reducedMotion.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {linkMeta, linkTooltipConfig} from "../features/linkInteraction.js";
import {nodeStatsFields} from "../features/nodeStats.js";
import {isSelfLoopMark} from "../features/selfLoops.js";
import {installGraphFluent} from "../Network/graphFluent.js";
import {clusterFields, installClusters} from "../Network/clusters.js";
import type {GraphFluent} from "../Network/graphFluent.js";
import {applyArcDiagramLayout, arcSizeLegendScale} from "./applyLayout.js";
import type {ArcCtx} from "./applyLayout.js";
import {arcDiagramEmit} from "./emit.js";
import {setupArcEvents} from "./events.js";

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
      const {raw, endKeys} = linkMeta(l.datum)!;
      const rest = Object.fromEntries(
        Object.entries(raw).filter(([k]) => !endKeys.includes(k)),
      );
      return {
        [t("From")]: l.source.label,
        [t("To")]: l.target.label,
        ...rest,
      } as DataPoint;
    });
  return [...nodes, ...links];
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
    installClusters(viz);
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

  // Nodes (and loops, which sit within reach of their node) are points for
  // `hoverDistance`; arcs keep exact hit-testing.
  pointMark: (_viz, node) => isPointShape(node) || isSelfLoopMark(node),

  ctx: {},

  fields: [
    /**
        Which side of the line the arcs take: `"above"` (the default),
        `"below"`, or `"both"`, where links running forward along the line
        arc above and links running backward arc below. Node labels take the
        side without arcs (above the line for `"below"`); with `"both"` they
        sit below it, each over a halo in the chart's background.
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
        per link. Defaults to three times the arc's stroke width, at least 6
        and at most 12 pixels, but never under 1.5 times the stroke width so
        the head stays wider than its line. The line stops inside the head.
    */
    {key: "arrowSize"},
    ...clusterFields(),
    ...linkStyleFields(),
    ...loaderFormatFields("links", "nodes"),
    {key: "links", default: []},
    /**
        The thickness of each arc: a pixel number used for every link, or an
        accessor function whose values are scaled between `linkSizeMin` and
        the smallest node's radius (see `linkSizeScale`). The function
        receives each link, with `source` and `target` set to the data of the
        nodes at its ends, and its index in `links`.
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
        How many links a node's tooltip lists under its number of
        connections, strongest first: a number, or `false` for none. Defaults
        to 3 when the links differ in `linkSize`, and none otherwise.
    */
    {key: "nodeTooltipLinks"},
    ...nodeStatsFields(),
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
      factory: (viz: VizInstance) => linkTooltipConfig(viz),
    },
  ],
};

/**
    Places a network's nodes in a row along one line and draws each link as
    an arc between its two nodes, which shows the network's structure
    without a force layout's tangle, in an order you choose.
*/
export default makeChart(arcDiagramDef);
