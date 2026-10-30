/**
    Network — node-link diagram with optional d3-force layout.

    Implementation files in this folder:
      - `applyLayout.ts` — resolves nodes+links, runs force sim, normalizes
        link stroke sizes.
      - `emit.ts` — link Paths + per-shape-type node groups.
*/
import {mean} from "d3-array";

import type {DataPoint} from "@d3plus/data";

import accessor from "../../utils/accessor.js";
import {fieldAccessor} from "../../utils/fieldAccessor.js";
import constant from "../../utils/constant.js";
import {chartBounds} from "../features/chartGeometry.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {ensureZoomDom} from "../features/ensureZoomDom.js";
import {isPointShape} from "../viz/nearestHover.js";
import {makeChart} from "../definition/makeChart.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {applyNetworkLayout, networkSizeLegendScale} from "./applyLayout.js";
import {networkEmit} from "./emit.js";
import {sceneInsetRegion} from "../pipeline/insetPlacement.js";
import {graphNodeId, zoomToNodeBounds} from "./graph.js";
import {installGraphFluent} from "./graphFluent.js";
import type {GraphFluent} from "./graphFluent.js";
import {effectiveDuration} from "../viz/reducedMotion.js";
import {themed} from "../../utils/theme.js";

const getNodeId = graphNodeId;

type NodeRecord = {id: string; x: number; y: number; r: number};
type LinkDatum = {source?: DataPoint; target?: DataPoint};
type Predicate = boolean | ((d: DataPoint, i: number) => boolean);
type NetworkFluent = GraphFluent & {
  active: (predicate?: Predicate) => unknown;
  x: (accessor?: unknown) => unknown;
  y: (accessor?: unknown) => unknown;
};
// d3plus's `_aggs` slot is typed as `(leaves: DataPoint[]) => unknown` —
// the chart-internal aggregator helpers we install pass a closed-over
// accessor + the leaves; cast at the install site.
type Aggregator = (leaves: DataPoint[]) => unknown;
type NetworkViz = VizInstance & NetworkFluent;

/** Installs the `click.shape` handler that focuses/zooms a node + its links. */
function setupNetworkClickShape(viz: VizInstance, v: NetworkViz) {
  viz.schema.on["click.shape"] = (
    d: DataPoint,
    i: number,
    x: unknown,
    event: MouseEvent,
  ) => {
    viz._tooltipClass!.data([]).render();

    if (viz._drawDepth >= viz.schema.groupBy.length - 1) {
      const id = getNodeId(viz, d, i);

      if (viz._focus && viz._focus === id) {
        v.active(false);
        viz.schema.on.mouseenter.bind(viz)(d, i, x, event);
        viz._focus = undefined;
        viz._zoomToBounds!(null);
      } else {
        v.hover(false);
        const links =
          (viz.ctx.linkLookup as Record<string, NodeRecord[]>)[id] ?? [];
        const node = (viz.ctx.nodeLookup as Record<string, NodeRecord>)[id];
        // An edge has no node to focus.
        if (!node) return;
        const filterIds: string[] = [id];
        const xDomain = [node.x - node.r, node.x + node.r];
        const yDomain = [node.y - node.r, node.y + node.r];

        links.forEach(l => {
          filterIds.push(l.id);
          if (l.x - l.r < xDomain[0]) xDomain[0] = l.x - l.r;
          if (l.x + l.r > xDomain[1]) xDomain[1] = l.x + l.r;
          if (l.y - l.r < yDomain[0]) yDomain[0] = l.y - l.r;
          if (l.y + l.r > yDomain[1]) yDomain[1] = l.y + l.r;
        });

        v.active((h: DataPoint & LinkDatum, hi: number) => {
          if (h.source && h.target)
            return (
              (h.source as DataPoint).id === id ||
              (h.target as DataPoint).id === id
            );
          return filterIds.includes(getNodeId(viz, h, hi));
        });

        viz._focus = id;
        zoomToNodeBounds(viz, xDomain, yDomain);
      }
    }
  };
}

/** Installs the `click.legend` handler that focuses/zooms a legend group. */
function setupNetworkClickLegend(viz: VizInstance, v: NetworkViz) {
  viz.schema.on["click.legend"] = (
    d: DataPoint,
    i: number,
    x: unknown,
    event: MouseEvent,
  ) => {
    const idList = viz._ids(d, i);
    const id = idList[idList.length - 1];
    const ids = viz._id(d, i) as string | number | (string | number)[];

    if (viz._drawDepth >= viz.schema.groupBy.length - 1) {
      if (viz._focus && viz._focus === ids) {
        v.active(false);
        viz._focus = undefined;
        viz._zoomToBounds!(null);
      } else {
        v.hover(false);
        const idArr = Array.isArray(ids) ? ids : [ids];
        const nodes = idArr.map(
          nid =>
            (viz.ctx.nodeLookup as Record<string, NodeRecord>)[String(nid)],
        );
        const filterIds = [`${id}`];
        const xDomain = [nodes[0].x - nodes[0].r, nodes[0].x + nodes[0].r];
        const yDomain = [nodes[0].y - nodes[0].r, nodes[0].y + nodes[0].r];

        nodes.forEach(l => {
          filterIds.push(l.id);
          if (l.x - l.r < xDomain[0]) xDomain[0] = l.x - l.r;
          if (l.x + l.r > xDomain[1]) xDomain[1] = l.x + l.r;
          if (l.y - l.r < yDomain[0]) yDomain[0] = l.y - l.r;
          if (l.y + l.r > yDomain[1]) yDomain[1] = l.y + l.r;
        });

        v.active((h: DataPoint & LinkDatum, hi: number) => {
          if (h.source && h.target)
            return (
              filterIds.includes((h.source as DataPoint).id as string) &&
              filterIds.includes((h.target as DataPoint).id as string)
            );
          const myIds = viz._ids(h, hi);
          return filterIds.includes(`${myIds[myIds.length - 1]}`);
        });

        viz._focus = ids as unknown as string;
        zoomToNodeBounds(viz, xDomain, yDomain);
      }

      viz.schema.on.mouseenter.bind(viz)(d, i, x, event);
      viz.schema.on["mousemove.legend"].bind(viz)(d, i, x, event);
    }
  };
}

/** Installs mouseenter/mouseleave/mousemove handlers that drive hover highlighting. */
function setupNetworkMouse(viz: VizInstance, v: NetworkViz) {
  viz.schema.on.mouseenter = () => undefined;
  viz.schema.on["mouseleave.shape"] = () => {
    v.hover(false);
  };
  const defaultMouseMove = viz.schema.on["mousemove.shape"];
  viz.schema.on["mousemove.shape"] = (
    d: DataPoint,
    i: number,
    x: unknown,
    event: MouseEvent,
  ) => {
    defaultMouseMove(d, i, x, event);
    const id = getNodeId(viz, d, i);
    const links =
      (viz.ctx.linkLookup as Record<string, NodeRecord[]>)[id] ?? [];
    const node = (viz.ctx.nodeLookup as Record<string, NodeRecord>)[id];
    // An edge has no node to focus.
    if (!node) return;
    const filterIds: string[] = [id];
    const xDomain = [node.x - node.r, node.x + node.r];
    const yDomain = [node.y - node.r, node.y + node.r];

    links.forEach(l => {
      filterIds.push(l.id);
      if (l.x - l.r < xDomain[0]) xDomain[0] = l.x - l.r;
      if (l.x + l.r > xDomain[1]) xDomain[1] = l.x + l.r;
      if (l.y - l.r < yDomain[0]) yDomain[0] = l.y - l.r;
      if (l.y + l.r > yDomain[1]) yDomain[1] = l.y + l.r;
    });

    v.hover((h: DataPoint & LinkDatum, hi: number) => {
      if (h.source && h.target)
        return (
          (h.source as DataPoint).id === id || (h.target as DataPoint).id === id
        );
      return filterIds.includes(`${viz._ids(h, hi)[viz._drawDepth]}`);
    });
  };
}

/** Installs the shape/legend/mouse event handlers that drive Network focus + hover. */
function setupNetworkEvents(viz: VizInstance, v: NetworkViz) {
  setupNetworkClickShape(viz, v);
  setupNetworkClickLegend(viz, v);
  setupNetworkMouse(viz, v);
}

/** Installs the per-instance fluent methods (the shared graph ones, plus x/y). */
function setupNetworkFluent(v: NetworkViz) {
  installGraphFluent(v);
  /**
      The x position of each node: a key in the data or `nodes`, or an
      accessor function. Defaults to `"x"`. When any node has no x/y
      position, every node is placed by a force simulation instead.
      @type {string | function}
  */
  v.x = function (this: VizInstance, _?: unknown) {
    if (!arguments.length) return this._x;
    if (typeof _ === "function") {
      this._x = _ as unknown as (
        d: DataPoint,
        i: number,
      ) => string | number | Date;
    } else {
      const key = _ as string;
      this._x = fieldAccessor(key) as unknown as (
        d: DataPoint,
        i: number,
      ) => string | number | Date;
      if (!this.schema.aggs[key])
        this.schema.aggs[key] = mean as unknown as Aggregator;
    }
    return this;
  };
  /**
      The y position of each node: a key in the data or `nodes`, or an
      accessor function. Defaults to `"y"`. When any node has no x/y
      position, every node is placed by a force simulation instead.
      @type {string | function}
  */
  v.y = function (this: VizInstance, _?: unknown) {
    if (!arguments.length) return this._y;
    if (typeof _ === "function") {
      this._y = _ as unknown as (
        d: DataPoint,
        i: number,
      ) => string | number | Date;
    } else {
      const key = _ as string;
      this._y = fieldAccessor(key) as unknown as (
        d: DataPoint,
        i: number,
      ) => string | number | Date;
      if (!this.schema.aggs[key])
        this.schema.aggs[key] = mean as unknown as Aggregator;
    }
    return this;
  };
}

export const networkDef: ChartDefinition = {
  name: "Network",

  layoutStage: applyNetworkLayout,
  sizeLegendScale: (viz, {width, height}) =>
    networkSizeLegendScale(viz, width, height),
  emit: networkEmit,
  insetRegion: sceneInsetRegion,

  // Network mounts its own zoom surface (with a background hitArea whose
  // click handler closes over class state); `chartTransform` (default
  // margin-origin) is fine for the scene.
  setup: (viz: VizInstance) => {
    const v = viz as NetworkViz;
    setupNetworkEvents(viz, v);

    // `links()` / `nodes()` / `nodeGroupBy()` / `size()` / `x()` / `y()` /
    // `hover()` need imperative method bodies (queue loading, aggs side
    // effects). Install them per-instance.
    setupNetworkFluent(v);

    // Default x/y accessors for nodes (Network reads node coords directly).
    viz._x = accessor("x") as VizInstance["_x"];
    viz._y = accessor("y") as VizInstance["_y"];

    // Wrap _draw to also call ensureZoomDom (Network needs a DOM zoom group).
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

  // Small-multiple panels as close to square as the grid allows.
  facet: {aspect: 1},

  // Nodes are points for `hoverDistance`; links keep exact hit-testing.
  pointMark: (_viz, node) => isPointShape(node),

  ctx: {},

  fields: [
    /**
        Draws arrowheads on the links: `true` (or `"target"`) at each link's
        target end, `"source"` at its source end, `"both"`, or `false` for
        none. Also accepts an accessor function returning one of those per
        link.
        @type {boolean | "target" | "source" | "both" | function}
    */
    {key: "arrows", default: false},
    /**
        The arrowhead size in pixels, or an accessor function returning one
        per link. Defaults to three times the link's stroke width (at least 6).
        @type {number | function}
    */
    {key: "arrowSize"},
    {key: "links", default: []},
    /**
        The thickness of each link: a pixel number used for every link, or an
        accessor function whose values are scaled between `linkSizeMin` and
        the smallest node radius (see `linkSizeScale`).
        @type {number | function}
    */
    {
      key: "linkSize",
      default: constant(1),
      coerce: v => (typeof v === "function" ? v : constant(v as number)),
    },
    /** The minimum pixel stroke width used when sizing links. */
    {key: "linkSizeMin", default: 1},
    /**
        The type of [continuous d3-scale](https://github.com/d3/d3-scale#continuous-scales)
        used to size links (e.g. `"linear"`, `"sqrt"`, `"log"`).
    */
    {key: "linkSizeScale", default: "sqrt"},
    {key: "noDataMessage", default: false},
    {key: "nodeGroupBy", default: [accessor("id")]},
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        title: (
          d: DataPoint & {
            source?: {id: string | number};
            target?: {id: string | number};
            i?: number;
          },
        ) =>
          d && d.source && d.target
            ? `${d.source.id} → ${d.target.id}`
            : viz._drawLabel(d, typeof d.i === "number" ? d.i : 0),
      }),
    },
    {key: "nodes", default: []},
    /**
        The maximum pixel radius used when sizing nodes. Defaults to half the
        distance between the two closest nodes.
        @type {number}
    */
    {key: "sizeMax"},
    /** The minimum pixel radius used when sizing nodes. */
    {key: "sizeMin", default: 5},
    /**
        The type of [continuous d3-scale](https://github.com/d3/d3-scale#continuous-scales)
        used to size nodes (e.g. `"linear"`, `"sqrt"`, `"log"`).
    */
    {key: "sizeScale", default: "sqrt"},
    {key: "shape", default: constant("Circle"), coerce: "const"},
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        ariaLabel: (d: DataPoint, i: number) => {
          const sizeFn = viz._size as
            ((d: DataPoint, i: number) => unknown) | undefined;
          const validSize = sizeFn ? `, ${sizeFn(d, i)}` : "";
          return `${viz._drawLabel(d, i)}${validSize}.`;
        },
        labelConfig: {
          duration: 0,
          fontMin: 1,
          fontResize: true,
          textAnchor: "middle",
          verticalAlign: "middle",
        },
        // Thin (1px) lines need more contrast than a wide flow-width stroke
        // (cf. Sankey's #DBDBDB) to read clearly against a white background.
        Path: {
          fill: "none",
          label: false,
          stroke: () => themed(viz._theme, t => t.link, "#adb5bd"),
        },
      }),
    },
  ],
};

/**
    Creates a network visualization based on a defined set of nodes and edges.
*/
export default makeChart(networkDef);
