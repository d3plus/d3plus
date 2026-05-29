/**
    Pack — d3-hierarchy circle-packing layout.

    Implementation files in this folder:
      - `applyLayout.ts` — chart-specific `TransformStage`.
      - `emit.ts` — Circle + label scene nodes from the laid-out data.
      - `recursionCircles.ts` — descendant-walk helper used by hover handlers.
*/

import {pack} from "d3-hierarchy";
import type {HierarchyCircularNode} from "d3-hierarchy";

import type {DataPoint} from "@d3plus/data";

import accessor from "../../utils/accessor.js";
import constant from "../../utils/constant.js";
import {backFeature, subtitleFeature, titleFeature, totalFeature} from "../features.js";
import type {ChartDefinition} from "../ChartDefinition.js";
import type {D3plusConfig} from "../../utils/D3plusConfig.js";
import {makeChart} from "../makeChart.js";
import {vizPreDrawStages} from "../stages.js";
import type {VizInstance} from "../vizTypes.js";

import {applyPackLayout} from "./applyLayout.js";
import {packEmit} from "./emit.js";
import {recursionCircles} from "./recursionCircles.js";

type SortFn = (a: HierarchyCircularNode<DataPoint>, b: HierarchyCircularNode<DataPoint>) => number;
type HoverFn = (fn: (h: DataPoint) => boolean) => unknown;

export const packDef: ChartDefinition = {
  name: "Pack",

  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: [...vizPreDrawStages, applyPackLayout],
  layoutStage: applyPackLayout,
  emit: packEmit,

  chartTransform: (viz: VizInstance) => ({
    x: viz._margin.left + ((viz.ctx.packOffsetX as number) ?? 0),
    y: viz._margin.top + ((viz.ctx.packOffsetY as number) ?? 0),
  }),

  // `hover` shadows the prototype method per-instance so it also drives
  // the legend's hover state. Method shadowing doesn't fit the field
  // model (it's a method, not a value with a default); setup is the
  // right escape hatch for the genuine method-override case.
  setup: (viz: VizInstance) => {
    const supHover = (viz as VizInstance & {hover: HoverFn}).hover.bind(viz);
    (viz as VizInstance & {hover: HoverFn}).hover = ((fn: (h: DataPoint) => boolean) => {
      supHover(fn);
      if (viz.schema.legend) {
        (viz._legendClass as {hover: (fn: unknown) => unknown}).hover(fn);
      }
      return viz;
    }) as HoverFn;
  },

  ctx: {
    pack: pack(),
  },

  fields: [
    {key: "layoutPadding", default: 1},
    {
      key: "sort",
      default: ((a, b) => (b.value ?? 0) - (a.value ?? 0)) as SortFn,
    },
    {
      key: "sum",
      default: accessor("value"),
      coerce: v => (typeof v === "function" ? v : accessor(v as string)),
    },
    {
      key: "packOpacity",
      default: constant(0.25),
      coerce: v => (typeof v === "function" ? v : constant(v as number)),
    },
    {
      key: "shape",
      default: constant("Circle"),
      coerce: v => (typeof v === "function" ? v : constant(v as string)),
    },
    {
      key: "shapeConfig",
      merge: true,
      factory: () => ({
        Circle: {
          label: (d: DataPoint) => {
            const node = d as DataPoint & {parent?: unknown; children?: unknown};
            return node.parent && !node.children ? (node.id as string | number) : false;
          },
          labelConfig: {fontResize: true},
          opacity: (d: DataPoint) => (d as DataPoint & {__d3plusOpacity__?: number}).__d3plusOpacity__,
        },
      }),
    },
    {
      key: "legend",
      factory: (viz: VizInstance) => {
        const base = viz.schema.legend as (config: D3plusConfig, arr: DataPoint[]) => unknown;
        return (config: D3plusConfig, arr: DataPoint[]) => {
          if (arr.length === viz._filteredData.length) return false;
          return base.call(viz, config, arr);
        };
      },
    },
    {
      // `on` is the event bus — Viz seeded it with the default handlers,
      // Pack layers wrap-and-extend versions for the events that need
      // pack-specific hover behavior. `merge` keeps Viz's other handlers
      // intact.
      key: "on",
      merge: true,
      factory: (viz: VizInstance) => {
        const baseLegend = viz.schema.on["mousemove.legend"] as (
          d: DataPoint, i: number, x: unknown, event: unknown,
        ) => void;
        const baseShape = viz.schema.on["mousemove.shape"] as (
          d: DataPoint, i: number, x: unknown, event: unknown,
        ) => void;
        const callHover = (fn: (h: DataPoint) => boolean) =>
          (viz as VizInstance & {hover: HoverFn}).hover(fn);

        return {
          mouseenter: () => undefined,
          "mousemove.legend": (
            d: DataPoint, i: number, x: unknown, event: unknown,
          ) => {
            baseLegend(d, i, x, event);
            const ids = viz._ids(d, i);
            const hoverData = recursionCircles(d);
            callHover(h => {
              const matches = Object.keys(h)
                .filter(key => key !== "value")
                .every(key => {
                  const v = d[key];
                  return v != null && (v as unknown[]).includes(h[key]);
                });
              if (matches) hoverData.push(h);
              else if (ids.includes(h.key as string)) {
                hoverData.push(...recursionCircles(h, [h]));
              }
              return hoverData.includes(h);
            });
          },
          "mousemove.shape": (
            d: DataPoint, i: number, x: unknown, event: unknown,
          ) => {
            if (d.__d3plusTooltip__) baseShape(d, i, x, event);
            const hoverData = recursionCircles(d, [d]);
            callHover(h => hoverData.includes(h));
          },
        };
      },
    },
  ],
};

export default makeChart(packDef);
