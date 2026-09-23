/**
    Chord — d3-chord relationship diagram.

    Groups (nodes) are laid out as arcs around a circle; ribbons (chords) connect
    them, sized by the flow (link value) between each pair. Built on the same
    nodes/links data model as Network, Rings, and Sankey.

    Implementation files in this folder:
      - `applyLayout.ts` — node/link resolution → flow matrix → d3-chord layout +
        arc/ribbon generators + label geometry.
      - `emit.ts` — ribbon Paths + arc Paths + rotated group labels.
*/

import {addToQueue} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";

import accessor from "../../utils/accessor.js";
import constant from "../../utils/constant.js";
import {centerChartTransform} from "../features/chartGeometry.js";
import {backFeature, subtitleFeature, titleFeature, totalFeature} from "../features/features.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {applyChordLayout} from "./applyLayout.js";
import {chordEmit} from "./emit.js";

type ChordEdge = DataPoint & {source?: {id: string | number}; target?: {id: string | number}};

export const chordDef: ChartDefinition = {
  name: "Chord",

  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  layoutStage: applyChordLayout,
  emit: chordEmit,

  chartTransform: (viz: VizInstance) =>
    centerChartTransform(
      viz,
      viz.ctx.chordWidth as number,
      viz.ctx.chordHeight as number,
    ),

  setup: (viz: VizInstance) => {
    type ChordFluent = {
      links: (data?: DataPoint[], formatter?: unknown) => unknown;
      nodes: (data?: DataPoint[], formatter?: unknown) => unknown;
      nodeId: (id?: unknown) => unknown;
      value: (value?: unknown) => unknown;
      hover: (predicate?: boolean | ((d: DataPoint, i: number) => boolean)) => unknown;
    };
    const v = viz as VizInstance & ChordFluent;

    // The Viz default colors by `groupBy[0]`, which reads `id`. A custom
    // `nodeId` leaves `id` unset, so every arc and ribbon would hash to the
    // same grey; fall back to the node's own identifier instead.
    viz.schema.color = (d: DataPoint, i: number) =>
      viz.schema.groupBy[0](d, i) ?? viz.schema.nodeId(d, i);

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
      // A ribbon datum is a `{source, target}` link — highlight the hovered
      // ribbon plus its two endpoint arcs.
      const edge = d as ChordEdge;
      if (edge.source && edge.target) {
        const sourceId = edge.source.id;
        const targetId = edge.target.id;
        v.hover((h: ChordEdge, hi: number) => {
          if (h.source && h.target)
            return h.source.id === sourceId && h.target.id === targetId;
          const hid = viz.schema.nodeId(h, hi) as string | number;
          return hid === sourceId || hid === targetId;
        });
        return;
      }
      // An arc datum is a node — highlight it, its neighbor arcs, and every
      // incident ribbon.
      const id = viz.schema.nodeId(d, i) as string | number;
      const neighbors = (viz.ctx.adjacency as Record<string, (string | number)[]>)[String(id)] ?? [];
      const filterIds = [id, ...neighbors];
      v.hover((h: ChordEdge, hi: number) => {
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
      // Scene-emit charts dim via the scene's interaction-opacity pass, not
      // `_shapes`; a hover change only takes effect once a repaint is scheduled.
      if (this._sceneRenderer) this._scheduleSceneRepaint();
      return this;
    };
  },

  ctx: {},

  fields: [
    {key: "arcThickness", default: 20},
    // `"source"` alone is a no-op — d3's ribbonArrow can only draw the
    // arrowhead at a ribbon's target end (see applyLayout.ts). Use `true`,
    // `"target"`, or `"both"`.
    {key: "arrows", default: false},
    {key: "arrowSize"},
    {key: "chordOpacity", default: 0.6},
    {key: "directed", default: true},
    {key: "links", default: accessor("links")},
    {key: "linksSource", default: "source"},
    {key: "linksTarget", default: "target"},
    {key: "noDataMessage", default: false},
    {key: "nodes", default: accessor("nodes")},
    {key: "nodeId", default: accessor("id")},
    {key: "padAngle"},
    {key: "padPixel", default: 2},
    {key: "value", default: constant(1)},
    {key: "shape", default: constant("Path"), coerce: "const"},
    {
      key: "shapeConfig",
      merge: true,
      factory: () => ({
        Path: {label: false},
      }),
    },
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        title: (d: ChordEdge & {i?: number}) =>
          d && d.source && d.target
            ? `${d.source.id} → ${d.target.id}`
            : viz._drawLabel(d, typeof d.i === "number" ? d.i : 0),
      }),
    },
  ],
};

/**
    Creates a Chord diagram based on a defined set of nodes and links.
*/
export default makeChart(chordDef);
