/**
    Sankey — d3-sankey flow diagram.

    Implementation files in this folder:
      - `applyLayout.ts` — node + link resolution + d3-sankey layout.
      - `emit.ts` — link Paths + per-shape-type node Rects.
*/
import {
  sankey,
  sankeyCenter,
  sankeyJustify,
  sankeyLeft,
  sankeyLinkHorizontal,
  sankeyRight,
} from "d3-sankey";

import {addToQueue} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";

import accessor from "../../utils/accessor.js";
import constant from "../../utils/constant.js";
import {backFeature, subtitleFeature, titleFeature, totalFeature} from "../features.js";
import type {ChartDefinition} from "../ChartDefinition.js";
import {makeChart} from "../makeChart.js";
import {vizPreDrawStages} from "../stages.js";
import type {VizInstance} from "../vizTypes.js";

import {applySankeyLayout} from "./applyLayout.js";
import {sankeyEmit} from "./emit.js";

const sankeyAligns = {
  center: sankeyCenter,
  justify: sankeyJustify,
  left: sankeyLeft,
  right: sankeyRight,
};

export const sankeyDef: ChartDefinition = {
  name: "Sankey",

  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: [...vizPreDrawStages, applySankeyLayout],
  layoutStage: applySankeyLayout,
  emit: sankeyEmit,

  setup: (viz: VizInstance) => {
    type SankeyFluent = {
      links: (data?: DataPoint[], formatter?: unknown) => unknown;
      nodes: (data?: DataPoint[], formatter?: unknown) => unknown;
      nodeAlign: (align?: unknown) => unknown;
      nodeId: (id?: unknown) => unknown;
      value: (value?: unknown) => unknown;
      hover: (predicate?: boolean | ((d: DataPoint, i: number) => boolean)) => unknown;
    };
    const v = viz as VizInstance & SankeyFluent;
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
      const id = viz.schema.nodeId(d, i) as string | number;
      const node = (viz.ctx.nodeLookup as Record<string, number>)[String(id)];
      const lookup = viz.ctx.nodeLookup as Record<string, number>;
      const nodeLookup = Object.keys(lookup).reduce(
        (all: Record<number, string | number>, item: string) => {
          all[lookup[item]] = !isNaN(Number(item)) ? parseInt(item, 10) : item;
          return all;
        },
        {},
      );
      const links = (viz.ctx.linkLookup as Record<number, number[]>)[node] ?? [];
      const filterIds: (string | number)[] = [id];
      links.forEach(l => filterIds.push(nodeLookup[l]));
      v.hover((h: DataPoint & {source?: DataPoint; target?: DataPoint}, hi: number) => {
        if (h.source && h.target) return h.source.id === id || h.target.id === id;
        return filterIds.includes(viz.schema.nodeId(h, hi) as string | number);
      });
    };

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
    v.nodeAlign = function(this: VizInstance, _: unknown) {
      return arguments.length
        ? ((this.schema.nodeAlign = typeof _ === "function"
            ? (_ as (...a: unknown[]) => unknown)
            : (sankeyAligns as unknown as Record<string, unknown>)[_ as string]), this)
        : this.schema.nodeAlign;
    };
    v.nodeId = function(this: VizInstance, _: unknown) {
      return arguments.length
        ? ((this.schema.nodeId = typeof _ === "function"
            ? (_ as (...a: unknown[]) => unknown)
            : accessor(_ as string)), this)
        : this.schema.nodeId;
    };
    v.value = function(this: VizInstance, _: unknown) {
      if (!arguments.length) return this.schema.value;
      this.schema.value = (typeof _ === "function"
        ? (_ as (...a: unknown[]) => unknown)
        : accessor(_ as string)) as (d: DataPoint, i: number) => number;
      return this;
    };
    v.hover = function(this: VizInstance, _: unknown) {
      this._hover = _ as ((d: DataPoint, i?: number) => boolean) | false;
      (this._shapes ?? []).forEach((s: {hover: (h: unknown) => void}) => s.hover(_));
      if (this.schema.legend && this._legendClass) this._legendClass.hover(_);
      return this;
    };
  },

  ctx: {
    sankey: sankey(),
    path: sankeyLinkHorizontal(),
  },

  fields: [
    {key: "iterations", default: 6},
    {key: "links", default: accessor("links")},
    {key: "linkSort"},
    {key: "linksSource", default: "source"},
    {key: "linksTarget", default: "target"},
    {key: "noDataMessage", default: false},
    {key: "nodes", default: accessor("nodes")},
    {key: "nodeAlign", default: sankeyJustify},
    {key: "nodeId", default: accessor("id")},
    {key: "nodePadding", default: 8},
    {key: "nodeSort"},
    {key: "nodeWidth", default: 30},
    {key: "value", default: constant(1)},
    {key: "shape", default: constant("Rect")},
    {
      key: "shapeConfig",
      merge: true,
      factory: () => {
        type SankeyLinkDatum = {
          source: {y0: number; y1: number; value: number};
          target: {y0: number; y1: number};
          value: number;
        };
        const linkStrokeWidth = (d: SankeyLinkDatum) =>
          Math.max(
            1,
            Math.abs(d.source.y1 - d.source.y0) * (d.value / d.source.value) - 2,
          );
        return {
          Path: {
            fill: "none",
            hoverStyle: {"stroke-width": linkStrokeWidth},
            label: false,
            stroke: "#DBDBDB",
            strokeOpacity: 0.5,
            strokeWidth: linkStrokeWidth,
          },
          Rect: {},
        };
      },
    },
  ],
};

export default makeChart(sankeyDef);
