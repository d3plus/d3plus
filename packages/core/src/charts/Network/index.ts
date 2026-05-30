/**
    Network — node-link diagram with optional d3-force layout.

    Implementation files in this folder:
      - `applyLayout.ts` — resolves nodes+links, runs force sim, normalizes
        link stroke sizes.
      - `emit.ts` — link Paths + per-shape-type node groups.
*/
import {mean, min} from "d3-array";
import {zoomTransform} from "d3-zoom";

import {addToQueue} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";

import accessor from "../../utils/accessor.js";
import constant from "../../utils/constant.js";
import {backFeature, subtitleFeature, titleFeature, totalFeature} from "../features.js";
import {chartBounds} from "../chartGeometry.js";
import type {ChartDefinition} from "../ChartDefinition.js";
import {ensureZoomDom} from "../ensureZoomDom.js";
import {makeChart} from "../makeChart.js";
import type {VizInstance} from "../vizTypes.js";

import {applyNetworkLayout} from "./applyLayout.js";
import {networkEmit} from "./emit.js";

function getNodeId(viz: VizInstance, d: Record<string, unknown>, i: number) {
  return `${viz._id(d as DataPoint, i) || viz.schema.nodeGroupBy[min([viz._drawDepth, viz.schema.nodeGroupBy.length - 1]) as number](d, i)}`;
}

type NodeRecord = {id: string; x: number; y: number; r: number};
type LinkDatum = {source?: DataPoint; target?: DataPoint};
type Predicate = boolean | ((d: DataPoint, i: number) => boolean);
type NetworkFluent = {
  active: (predicate?: Predicate) => unknown;
  hover: (predicate?: Predicate) => unknown;
  links: (data?: DataPoint[], formatter?: unknown) => unknown;
  nodes: (data?: DataPoint[], formatter?: unknown) => unknown;
  nodeGroupBy: (keys?: unknown) => unknown;
  size: (value?: unknown) => unknown;
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
  viz.schema.on["click.shape"] = (d: DataPoint, i: number, x: unknown, event: MouseEvent) => {
    viz._tooltipClass.data([]).render();

    if (viz._hover && viz._drawDepth >= viz.schema.groupBy.length - 1) {
      const id = getNodeId(viz, d, i);

      if (viz._focus && viz._focus === id) {
        v.active(false);
        viz.schema.on.mouseenter.bind(viz)(d, i, x, event);
        viz._focus = undefined;
        viz._zoomToBounds!(null);
      } else {
        v.hover(false);
        const links = (viz.ctx.linkLookup as Record<string, NodeRecord[]>)[id] ?? [];
        const node = (viz.ctx.nodeLookup as Record<string, NodeRecord>)[id];
        const filterIds: string[] = [id];
        let xDomain = [node.x - node.r, node.x + node.r];
        let yDomain = [node.y - node.r, node.y + node.r];

        links.forEach(l => {
          filterIds.push(l.id);
          if (l.x - l.r < xDomain[0]) xDomain[0] = l.x - l.r;
          if (l.x + l.r > xDomain[1]) xDomain[1] = l.x + l.r;
          if (l.y - l.r < yDomain[0]) yDomain[0] = l.y - l.r;
          if (l.y + l.r > yDomain[1]) yDomain[1] = l.y + l.r;
        });

        v.active((h: DataPoint & LinkDatum, hi: number) => {
          if (h.source && h.target)
            return (h.source as DataPoint).id === id || (h.target as DataPoint).id === id;
          return filterIds.includes(getNodeId(viz, h, hi));
        });

        viz._focus = id;
        const t = zoomTransform(viz._container!.node());
        xDomain = xDomain.map(d => d * t.k + t.x);
        yDomain = yDomain.map(d => d * t.k + t.y);
        viz._zoomToBounds!([
          [xDomain[0], yDomain[0]],
          [xDomain[1], yDomain[1]],
        ]);
      }
    }
  };
}

/** Installs the `click.legend` handler that focuses/zooms a legend group. */
function setupNetworkClickLegend(viz: VizInstance, v: NetworkViz) {
  viz.schema.on["click.legend"] = (d: DataPoint, i: number, x: unknown, event: MouseEvent) => {
    const idList = viz._ids(d, i);
    const id = idList[idList.length - 1];
    const ids = viz._id(d, i) as string | number | (string | number)[];

    if (viz._hover && viz._drawDepth >= viz.schema.groupBy.length - 1) {
      if (viz._focus && viz._focus === ids) {
        v.active(false);
        viz._focus = undefined;
        viz._zoomToBounds!(null);
      } else {
        v.hover(false);
        const idArr = Array.isArray(ids) ? ids : [ids];
        const nodes = idArr.map(nid => (viz.ctx.nodeLookup as Record<string, NodeRecord>)[String(nid)]);
        const filterIds = [`${id}`];
        let xDomain = [nodes[0].x - nodes[0].r, nodes[0].x + nodes[0].r];
        let yDomain = [nodes[0].y - nodes[0].r, nodes[0].y + nodes[0].r];

        nodes.forEach(l => {
          filterIds.push(l.id);
          if (l.x - l.r < xDomain[0]) xDomain[0] = l.x - l.r;
          if (l.x + l.r > xDomain[1]) xDomain[1] = l.x + l.r;
          if (l.y - l.r < yDomain[0]) yDomain[0] = l.y - l.r;
          if (l.y + l.r > yDomain[1]) yDomain[1] = l.y + l.r;
        });

        v.active((h: DataPoint & LinkDatum, hi: number) => {
          if (h.source && h.target)
            return filterIds.includes((h.source as DataPoint).id as string)
              && filterIds.includes((h.target as DataPoint).id as string);
          const myIds = viz._ids(h, hi);
          return filterIds.includes(`${myIds[myIds.length - 1]}`);
        });

        viz._focus = ids as unknown as string;
        const t = zoomTransform(viz._container!.node());
        xDomain = xDomain.map(d => d * t.k + t.x);
        yDomain = yDomain.map(d => d * t.k + t.y);
        viz._zoomToBounds!([
          [xDomain[0], yDomain[0]],
          [xDomain[1], yDomain[1]],
        ]);
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
  viz.schema.on["mousemove.shape"] = (d: DataPoint, i: number, x: unknown, event: MouseEvent) => {
    defaultMouseMove(d, i, x, event);
    const id = getNodeId(viz, d, i);
    const links = (viz.ctx.linkLookup as Record<string, NodeRecord[]>)[id] ?? [];
    const node = (viz.ctx.nodeLookup as Record<string, NodeRecord>)[id];
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
      if (h.source && h.target) return (h.source as DataPoint).id === id || (h.target as DataPoint).id === id;
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

/** Installs the per-instance fluent methods (links/nodes/nodeGroupBy/size/x/y/hover). */
function setupNetworkFluent(v: NetworkViz) {
  v.links = function(this: VizInstance, _: unknown, f?: unknown) {
    if (arguments.length) {
      (addToQueue as unknown as (...a: unknown[]) => void).bind(this)(_, f, "links");
      return this;
    }
    return this.schema.links;
  };
  v.nodes = function(this: VizInstance, _: unknown, f?: unknown) {
    if (arguments.length) {
      (addToQueue as unknown as (...a: unknown[]) => void).bind(this)(_, f, "nodes");
      return this;
    }
    return this.schema.nodes;
  };
  v.nodeGroupBy = function(this: VizInstance, _?: unknown) {
    if (!arguments.length) return this.schema.nodeGroupBy;
    const keys = (_ instanceof Array ? _ : [_]) as unknown[];
    // `_nodeGroupBy` is typed as `(d: DataPoint, i: number) => string | number | Date` —
    // we historically install (d) => d[k] returning broader types; cast.
    this.schema.nodeGroupBy = keys.map(k => {
      if (typeof k === "function") return k as unknown as (d: DataPoint, i: number) => string | number | Date;
      const key = k as string;
      if (!this.schema.aggs[key]) {
        this.schema.aggs[key] = (((a: DataPoint[], c: (d: DataPoint) => unknown) => {
          const vv = Array.from(new Set(a.map(c)));
          return vv.length === 1 ? vv[0] : vv;
        }) as unknown) as Aggregator;
      }
      return accessor(key) as unknown as (d: DataPoint, i: number) => string | number | Date;
    });
    return this;
  };
  v.size = function(this: VizInstance, _?: unknown) {
    if (!arguments.length) return this._size;
    this._size = ((typeof _ === "function" || !_)
      ? _
      : accessor(_ as string)) as ((d: DataPoint, i: number) => number) | undefined;
    return this;
  };
  v.x = function(this: VizInstance, _?: unknown) {
    if (!arguments.length) return this._x;
    if (typeof _ === "function") {
      this._x = _ as unknown as (d: DataPoint, i: number) => string | number | Date;
    } else {
      const key = _ as string;
      this._x = accessor(key) as unknown as (d: DataPoint, i: number) => string | number | Date;
      if (!this.schema.aggs[key]) this.schema.aggs[key] = mean as unknown as Aggregator;
    }
    return this;
  };
  v.y = function(this: VizInstance, _?: unknown) {
    if (!arguments.length) return this._y;
    if (typeof _ === "function") {
      this._y = _ as unknown as (d: DataPoint, i: number) => string | number | Date;
    } else {
      const key = _ as string;
      this._y = accessor(key) as unknown as (d: DataPoint, i: number) => string | number | Date;
      if (!this.schema.aggs[key]) this.schema.aggs[key] = mean as unknown as Aggregator;
    }
    return this;
  };
  v.hover = function(this: VizInstance, _: unknown) {
    this._hover = _ as ((d: DataPoint, i?: number) => boolean) | false;
    if (this.schema.nodes.length < this.schema.dataCutoff) {
      (this._shapes ?? []).forEach((s: {hover: (h: unknown) => void}) => s.hover(_));
      if (this.schema.legend && this._legendClass) this._legendClass.hover(_);
    }
    return this;
  };
}

export const networkDef: ChartDefinition = {
  name: "Network",

  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  layoutStage: applyNetworkLayout,
  emit: networkEmit,

  // Network needs a real DOM element for d3-zoom binding; the hitArea click
  // handler closes over class state. `setup` installs the event surface;
  // `chartTransform` (default margin-origin) is fine for the scene.
  setup: (viz: VizInstance) => {
    const v = viz as NetworkViz;
    viz.schema.zoom = true;
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
    v._draw = function(callback?: () => void) {
      const result = supDraw(callback);
      const {width, height} = chartBounds(viz);
      ensureZoomDom(viz, {kind: "network", width, height, duration: viz.schema.duration});
      return result;
    };
  },

  ctx: {},

  fields: [
    {key: "links", default: []},
    {
      key: "linkSize",
      default: constant(1),
      coerce: v => (typeof v === "function" ? v : constant(v as number)),
    },
    {key: "linkSizeMin", default: 1},
    {key: "linkSizeScale", default: "sqrt"},
    {key: "noDataMessage", default: false},
    {key: "nodeGroupBy", default: [accessor("id")]},
    {key: "nodes", default: []},
    {key: "sizeMax"},
    {key: "sizeMin", default: 5},
    {key: "sizeScale", default: "sqrt"},
    {key: "shape", default: constant("Circle")},
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        ariaLabel: (d: DataPoint, i: number) => {
          const sizeFn = viz._size as ((d: DataPoint, i: number) => unknown) | undefined;
          const validSize = sizeFn ? `, ${sizeFn(d, i)}` : "";
          return `${viz._drawLabel(d, i)}${validSize}.`;
        },
        labelConfig: {
          duration: 0,
          fontMin: 1,
          fontResize: true,
          labelPadding: 0,
          textAnchor: "middle",
          verticalAlign: "middle",
        },
        Path: {fill: "none", label: false, stroke: "#eee"},
      }),
    },
  ],
};

export default makeChart(networkDef);
