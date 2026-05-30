/**
    Rings — node-link diagram laid out around a central focal node in
    two concentric rings.

    Implementation files in this folder:
      - `applyLayout.ts` — focus + ring placement + link bezier paths.
      - `emit.ts` — link Paths + per-shape-type node groups.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */

import {addToQueue} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";

import accessor from "../../utils/accessor.js";
import constant from "../../utils/constant.js";
import {backFeature, subtitleFeature, titleFeature, totalFeature} from "../features.js";
import type {ChartDefinition} from "../ChartDefinition.js";
import {makeChart} from "../makeChart.js";
import {vizPreDrawStages} from "../stages.js";
import type {VizInstance} from "../vizTypes.js";

import {applyRingsLayout} from "./applyLayout.js";
import {ringsEmit} from "./emit.js";

export const ringsDef: ChartDefinition = {
  name: "Rings",

  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: [...vizPreDrawStages, applyRingsLayout],
  layoutStage: applyRingsLayout,
  emit: ringsEmit,

  setup: (viz: VizInstance) => {
    type Accessor = number | ((d: DataPoint, i: number) => unknown);
    type RingsFluent = {
      links: (data?: DataPoint[], formatter?: unknown) => unknown;
      nodes: (data?: DataPoint[], formatter?: unknown) => unknown;
      linkSize: (value?: Accessor) => unknown;
      nodeGroupBy: (keys?: string | string[] | ((d: DataPoint, i: number) => unknown)) => unknown;
      size: (value?: Accessor) => unknown;
      hover: (predicate?: boolean | ((d: DataPoint, i: number) => boolean)) => unknown;
    };
    const v = viz as VizInstance & RingsFluent;
    viz.schema.on.mouseenter = () => undefined;
    viz.schema.on["mouseleave.shape"] = () => {
      v.hover(false);
    };
    const defaultMouseMove = viz.schema.on["mousemove.shape"];
    viz.schema.on["mousemove.shape"] = (d: DataPoint, i: number, x: unknown, event: MouseEvent) => {
      defaultMouseMove(d, i, x, event);
      if (viz._focus && viz._focus === d.id) {
        v.hover(false);
        viz.schema.on.mouseenter.bind(viz)(d, i, x, event);
        viz._focus = undefined;
        return;
      }
      const id =
          viz.schema.nodeGroupBy && viz.schema.nodeGroupBy[viz._drawDepth](d, i)
            ? viz.schema.nodeGroupBy[viz._drawDepth](d, i)
            : viz._id(d, i);
      type NodeRecord = {id: string; x: number; y: number; r: number};
      const links = (viz.ctx.linkLookup as Record<string, NodeRecord[]>)[id] ?? [];
      const node = (viz.ctx.nodeLookup as Record<string, NodeRecord>)[id];
      const filterIds = [node.id];
      const xDomain = [node.x - node.r, node.x + node.r];
      const yDomain = [node.y - node.r, node.y + node.r];
      links.forEach((l: any) => {
        filterIds.push(l.id);
        if (l.x - l.r < xDomain[0]) xDomain[0] = l.x - l.r;
        if (l.x + l.r > xDomain[1]) xDomain[1] = l.x + l.r;
        if (l.y - l.r < yDomain[0]) yDomain[0] = l.y - l.r;
        if (l.y + l.r > yDomain[1]) yDomain[1] = l.y + l.r;
      });
      v.hover((h: any, x: any) => {
        if (h.source && h.target) return h.source.id === node.id || h.target.id === node.id;
        return filterIds.includes(viz._ids(h, x)[viz._drawDepth]);
      });
    };
    viz.schema.on["click.shape"] = (d: any) => {
      viz.schema.center = d.id;
      viz._margin = {bottom: 0, left: 0, right: 0, top: 0};
      viz._padding = {bottom: 0, left: 0, right: 0, top: 0};
      viz._draw();
    };

    v.links = function(this: VizInstance, _: any, f?: any) {
      if (arguments.length) {
        (addToQueue as any).bind(this)(_, f, "links");
        return this;
      }
      return this.schema.links;
    };
    v.nodes = function(this: VizInstance, _: any, f?: any) {
      if (arguments.length) {
        (addToQueue as any).bind(this)(_, f, "nodes");
        return this;
      }
      return this.schema.nodes;
    };
    v.linkSize = function(this: VizInstance, _: any) {
      return arguments.length
        ? ((this.schema.linkSize = typeof _ === "function" ? _ : constant(_)), this)
        : this.schema.linkSize;
    };
    v.nodeGroupBy = function(this: VizInstance, _: any) {
      if (!arguments.length) return this.schema.nodeGroupBy;
      if (!(_ instanceof Array)) _ = [_];
      this.schema.nodeGroupBy = _.map((k: any) => {
        if (typeof k === "function") return k;
        if (!this.schema.aggs[k]) {
          this.schema.aggs[k] = (a: any, c: any) => {
            const vv = Array.from(new Set(a.map(c)));
            return vv.length === 1 ? vv[0] : vv;
          };
        }
        return accessor(k);
      });
      return this;
    };
    v.size = function(this: VizInstance, _: any) {
      return arguments.length
        ? ((this._size = typeof _ === "function" || !_ ? _ : accessor(_)), this)
        : this._size;
    };
    v.hover = function(this: VizInstance, _: any) {
      this._hover = _;
      this._shapes.forEach((s: any) => s.hover(_));
      if (this.schema.legend) this._legendClass.hover(_);
      return this;
    };
  },

  ctx: {},

  fields: [
    {key: "center"},
    {key: "links", default: []},
    {key: "linkSize", default: constant(1)},
    {key: "linkSizeMin", default: 1},
    {key: "linkSizeScale", default: "sqrt"},
    {key: "noDataMessage", default: false},
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
          const sizeFn = viz._size as ((d: any, i: number) => unknown) | undefined;
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
        Path: {fill: "none", label: false, stroke: "#eee", strokeWidth: 1},
      }),
    },
  ],
};

export default makeChart(ringsDef);
