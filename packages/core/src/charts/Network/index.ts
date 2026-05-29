/**
    Network — node-link diagram with optional d3-force layout.

    Implementation files in this folder:
      - `applyLayout.ts` — resolves nodes+links, runs force sim, normalizes
        link stroke sizes.
      - `emit.ts` — link Paths + per-shape-type node groups.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */

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
import {vizPreDrawStages} from "../stages.js";
import type {VizInstance} from "../vizTypes.js";

import {applyNetworkLayout} from "./applyLayout.js";
import {networkEmit} from "./emit.js";

function getNodeId(viz: VizInstance, d: Record<string, unknown>, i: number) {
  return `${viz._id(d, i) || viz._nodeGroupBy[min([viz._drawDepth, viz._nodeGroupBy.length - 1]) as number](d, i)}`;
}

export const networkDef: ChartDefinition = {
  name: "Network",

  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: [...vizPreDrawStages, applyNetworkLayout],
  layoutStage: applyNetworkLayout,
  emit: networkEmit,

  // Network needs a real DOM element for d3-zoom binding; the hitArea click
  // handler closes over class state. `setup` installs the event surface;
  // `chartTransform` (default margin-origin) is fine for the scene.
  setup: (viz: VizInstance) => {
    viz._zoom = true;
    viz._on["click.shape"] = (d: DataPoint, i: number, x: unknown, event: MouseEvent) => {
      viz._tooltipClass.data([]).render();

      if (viz._hover && viz._drawDepth >= viz._groupBy.length - 1) {
        const id = getNodeId(viz, d, i);

        if (viz._focus && viz._focus === id) {
          (viz as any).active(false);
          viz._on.mouseenter.bind(viz)(d, i, x, event);
          viz._focus = undefined;
          viz._zoomToBounds(null);
        } else {
          (viz as any).hover(false);
          const links = viz.ctx.linkLookup[id];
          const node = viz.ctx.nodeLookup[id];
          const filterIds = [id];
          let xDomain = [node.x - node.r, node.x + node.r];
          let yDomain = [node.y - node.r, node.y + node.r];

          links.forEach((l: any) => {
            filterIds.push(l.id);
            if (l.x - l.r < xDomain[0]) xDomain[0] = l.x - l.r;
            if (l.x + l.r > xDomain[1]) xDomain[1] = l.x + l.r;
            if (l.y - l.r < yDomain[0]) yDomain[0] = l.y - l.r;
            if (l.y + l.r > yDomain[1]) yDomain[1] = l.y + l.r;
          });

          (viz as any).active((h: any, x: any) => {
            if (h.source && h.target)
              return (h.source as DataPoint).id === id || (h.target as DataPoint).id === id;
            else return filterIds.includes(getNodeId(viz, h, x));
          });

          viz._focus = id;
          const t = zoomTransform(viz._container.node());
          xDomain = xDomain.map(d => d * t.k + t.x);
          yDomain = yDomain.map(d => d * t.k + t.y);
          viz._zoomToBounds([
            [xDomain[0], yDomain[0]],
            [xDomain[1], yDomain[1]],
          ]);
        }
      }
    };
    viz._on["click.legend"] = (d: DataPoint, i: number, x: unknown, event: MouseEvent) => {
      let id = viz._ids(d);
      id = id[id.length - 1];
      const ids = viz._id(d);

      if (viz._hover && viz._drawDepth >= viz._groupBy.length - 1) {
        if (viz._focus && viz._focus === ids) {
          (viz as any).active(false);
          viz._focus = undefined;
          viz._zoomToBounds(null);
        } else {
          (viz as any).hover(false);
          const nodes = (ids as any[]).map((id: any) => viz.ctx.nodeLookup[id]);
          const filterIds = [`${id}`];
          let xDomain = [nodes[0].x - nodes[0].r, nodes[0].x + nodes[0].r];
          let yDomain = [nodes[0].y - nodes[0].r, nodes[0].y + nodes[0].r];

          nodes.forEach((l: any) => {
            filterIds.push(l.id);
            if (l.x - l.r < xDomain[0]) xDomain[0] = l.x - l.r;
            if (l.x + l.r > xDomain[1]) xDomain[1] = l.x + l.r;
            if (l.y - l.r < yDomain[0]) yDomain[0] = l.y - l.r;
            if (l.y + l.r > yDomain[1]) yDomain[1] = l.y + l.r;
          });

          (viz as any).active((h: any, x: any) => {
            if (h.source && h.target)
              return filterIds.includes((h.source as DataPoint).id as string)
                && filterIds.includes((h.target as DataPoint).id as string);
            const myIds = viz._ids(h, x);
            return filterIds.includes(`${myIds[myIds.length - 1]}`);
          });

          viz._focus = ids;
          const t = zoomTransform(viz._container.node());
          xDomain = xDomain.map(d => d * t.k + t.x);
          yDomain = yDomain.map(d => d * t.k + t.y);
          viz._zoomToBounds([
            [xDomain[0], yDomain[0]],
            [xDomain[1], yDomain[1]],
          ]);
        }

        viz._on.mouseenter.bind(viz)(d, i, x, event);
        viz._on["mousemove.legend"].bind(viz)(d, i, x, event);
      }
    };
    viz._on.mouseenter = () => undefined;
    viz._on["mouseleave.shape"] = () => {
      (viz as any).hover(false);
    };
    const defaultMouseMove = viz._on["mousemove.shape"];
    viz._on["mousemove.shape"] = (d: DataPoint, i: number, x: unknown, event: MouseEvent) => {
      defaultMouseMove(d, i, x, event);
      const id = getNodeId(viz, d, i);
      const links = viz.ctx.linkLookup[id] || [];
      const node = viz.ctx.nodeLookup[id];
      const filterIds = [id];
      const xDomain = [node.x - node.r, node.x + node.r];
      const yDomain = [node.y - node.r, node.y + node.r];

      links.forEach((l: any) => {
        filterIds.push(l.id);
        if (l.x - l.r < xDomain[0]) xDomain[0] = l.x - l.r;
        if (l.x + l.r > xDomain[1]) xDomain[1] = l.x + l.r;
        if (l.y - l.r < yDomain[0]) yDomain[0] = l.y - l.r;
        if (l.y + l.r > yDomain[1]) yDomain[1] = l.y + l.r;
      });

      (viz as any).hover((h: any, x: any) => {
        if (h.source && h.target) return h.source.id === id || h.target.id === id;
        return filterIds.includes(`${viz._ids(h, x)[viz._drawDepth]}`);
      });
    };

    // `links()` / `nodes()` / `nodeGroupBy()` / `size()` / `x()` / `y()` /
    // `hover()` need imperative method bodies (queue loading, aggs side
    // effects). Install them per-instance.
    (viz as any).links = function(this: VizInstance, _: any, f?: any) {
      if (arguments.length) {
        (addToQueue as any).bind(this)(_, f, "links");
        return this;
      }
      return this._links;
    };
    (viz as any).nodes = function(this: VizInstance, _: any, f?: any) {
      if (arguments.length) {
        (addToQueue as any).bind(this)(_, f, "nodes");
        return this;
      }
      return this._nodes;
    };
    (viz as any).nodeGroupBy = function(this: VizInstance, _?: any) {
      if (!arguments.length) return this._nodeGroupBy;
      if (!(_ instanceof Array)) _ = [_];
      this._nodeGroupBy = _.map((k: any) => {
        if (typeof k === "function") return k;
        if (!this._aggs[k]) {
          this._aggs[k] = (a: any, c: any) => {
            const vv = Array.from(new Set(a.map(c)));
            return vv.length === 1 ? vv[0] : vv;
          };
        }
        return accessor(k);
      });
      return this;
    };
    (viz as any).size = function(this: VizInstance, _?: any) {
      return arguments.length
        ? ((this._size = typeof _ === "function" || !_ ? _ : accessor(_)), this)
        : this._size;
    };
    const supX = (viz as any).x.bind(viz);
    (viz as any).x = function(this: VizInstance, _?: any) {
      if (!arguments.length) return supX();
      if (typeof _ === "function") this._x = _;
      else {
        this._x = accessor(_);
        if (!this._aggs[_]) this._aggs[_] = mean;
      }
      return this;
    };
    const supY = (viz as any).y.bind(viz);
    (viz as any).y = function(this: VizInstance, _?: any) {
      if (!arguments.length) return supY();
      if (typeof _ === "function") this._y = _;
      else {
        this._y = accessor(_);
        if (!this._aggs[_]) this._aggs[_] = mean;
      }
      return this;
    };
    (viz as any).hover = function(this: VizInstance, _: any) {
      this._hover = _;
      if (this._nodes.length < this._dataCutoff) {
        this._shapes.forEach((s: any) => s.hover(_));
        if (this._legend) this._legendClass.hover(_);
      }
      return this;
    };

    // Default x/y accessors for nodes (Network reads node coords directly).
    viz._x = accessor("x");
    viz._y = accessor("y");

    // Wrap _draw to also call ensureZoomDom (Network needs a DOM zoom group).
    const supDraw = (viz as any)._draw.bind(viz);
    (viz as any)._draw = function(callback?: () => void) {
      const result = supDraw(callback);
      const {width, height} = chartBounds(viz);
      ensureZoomDom(viz, {kind: "network", width, height, duration: viz._duration});
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
        ariaLabel: (d: any, i: any) => {
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
