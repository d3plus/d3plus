/**
    Sankey — d3-sankey flow diagram.

    Implementation files in this folder:
      - `applyLayout.ts` — node + link resolution + d3-sankey layout.
      - `emit.ts` — link Paths + per-shape-type node Rects.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */

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
    viz._on.mouseenter = () => undefined;
    viz._on["mouseleave.shape"] = () => {
      (viz as any).hover(false);
    };
    const defaultMouseMove = viz._on["mousemove.shape"];
    viz._on["mousemove.shape"] = (d: DataPoint, i: number, x: unknown, event: MouseEvent) => {
      defaultMouseMove(d, i, x, event);
      if (viz._focus && viz._focus === d.id) {
        (viz as any).hover(false);
        viz._on.mouseenter.bind(viz)(d, i, x, event);
        viz._focus = undefined;
        return;
      }
      const id = viz._nodeId(d, i);
      const node = viz.ctx.nodeLookup[id];
      const nodeLookup = Object.keys(viz.ctx.nodeLookup).reduce((all: any, item: any) => {
        all[viz.ctx.nodeLookup[item]] = !isNaN(item) ? parseInt(item, 10) : item;
        return all;
      }, {});
      const links = viz.ctx.linkLookup[node];
      const filterIds = [id];
      links.forEach((l: any) => filterIds.push(nodeLookup[l]));
      (viz as any).hover((h: any, x: any) => {
        if (h.source && h.target) return h.source.id === id || h.target.id === id;
        return filterIds.includes(viz._nodeId(h, x));
      });
    };

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
    (viz as any).nodeAlign = function(this: VizInstance, _: any) {
      return arguments.length
        ? ((this._nodeAlign = typeof _ === "function" ? _ : (sankeyAligns as any)[_]), this)
        : this._nodeAlign;
    };
    (viz as any).nodeId = function(this: VizInstance, _: any) {
      return arguments.length
        ? ((this._nodeId = typeof _ === "function" ? _ : accessor(_)), this)
        : this._nodeId;
    };
    (viz as any).value = function(this: VizInstance, _: any) {
      return arguments.length
        ? ((this._value = typeof _ === "function" ? _ : accessor(_)), this)
        : this._value;
    };
    (viz as any).hover = function(this: VizInstance, _: any) {
      this._hover = _;
      this._shapes.forEach((s: any) => s.hover(_));
      if (this._legend) this._legendClass.hover(_);
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
      factory: () => ({
        Path: {
          fill: "none",
          hoverStyle: {
            "stroke-width": (d: any) =>
              Math.max(
                1,
                Math.abs(d.source.y1 - d.source.y0) * (d.value / d.source.value) - 2,
              ),
          },
          label: false,
          stroke: "#DBDBDB",
          strokeOpacity: 0.5,
          strokeWidth: (d: any) =>
            Math.max(
              1,
              Math.abs(d.source.y1 - d.source.y0) * (d.value / d.source.value) - 2,
            ),
        },
        Rect: {},
      }),
    },
  ],
};

export default makeChart(sankeyDef);
