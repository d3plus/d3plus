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
import {subtitleFeature, titleFeature, totalFeature} from "../features/features.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {applyChordLayout} from "./applyLayout.js";
import {chordEmit} from "./emit.js";
import {broadcastLink} from "../viz/linkGroup.js";

type ChordEdge = DataPoint & {source?: {id: string | number}; target?: {id: string | number}};

export const chordDef: ChartDefinition = {
  name: "Chord",

  features: [titleFeature, subtitleFeature, totalFeature],
  layoutStage: applyChordLayout,
  emit: chordEmit,

  chartTransform: (viz: VizInstance) =>
    centerChartTransform(
      viz,
      viz.ctx.chordWidth as number,
      viz.ctx.chordHeight as number,
    ),

  // Chord's chartTransform centers the origin — arcs/ribbons are drawn in
  // [-chordWidth/2, chordWidth/2] × [-chordHeight/2, chordHeight/2], not the
  // top-left-origin box the default chartBodyRect assumes (see Pie/index.ts,
  // which documents/fixes the identical issue for its own centered layout).
  chartBodyRect: (viz: VizInstance) => {
    const w = (viz.ctx.chordWidth as number) ?? 0;
    const h = (viz.ctx.chordHeight as number) ?? 0;
    return {x: -w / 2, y: -h / 2, width: w, height: h};
  },

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
      broadcastLink(this, "hover", _);
      return this;
    };
  },

  // Small-multiple panels as close to square as the grid allows.
  facet: {aspect: 1},

  ctx: {},

  fields: [
    /** The pixel thickness of the group arcs around the circle. */
    {key: "arcThickness", default: 20},
    /**
        Toggles directional arrowheads on the ribbons: `false`, `true`,
        `"target"`, `"both"`, or an accessor function. Any of these but `false`
        draws each ribbon with a `d3.ribbonArrow` head on its target end, the
        only end d3's ribbonArrow can draw; `"source"` alone draws no arrows.
        @type {boolean | "target" | "source" | "both" | function}
    */
    {key: "arrows", default: false},
    /**
        The pixel size of the ribbon arrowheads. When unset, the size is derived
        from the arc thickness.
        @type {number}
    */
    {key: "arrowSize"},
    /** The fill opacity of each ribbon (chord). */
    {key: "chordOpacity", default: 0.6},
    /**
        When `true` (default), uses `d3.chordDirected`, so each `source` →
        `target` flow is a distinct ribbon colored by its source group. Set to
        `false` to use the undirected `d3.chord` layout, which merges both
        directions of a pair into a single ribbon (useful for symmetric or
        co-occurrence data).
    */
    {key: "directed", default: true},
    /**
        The edges that connect the nodes. The `source` and `target` keys in
        each link (see `linksSource`/`linksTarget`) map to node ids. Accepts an
        *Array* of data or a *String* filepath or URL to load; an optional
        formatting function can be passed as a second argument.
        @type {DataPoint[] | string}
    */
    {key: "links", default: accessor("links")},
    /** The key used in each link *Object* to reference the source node's id. */
    {key: "linksSource", default: "source"},
    /** The key used in each link *Object* to reference the target node's id. */
    {key: "linksTarget", default: "target"},
    {key: "noDataMessage", default: false},
    /**
        The nodes (groups) drawn as arcs around the circle. When omitted, the
        nodes are inferred from the unique `source`/`target` ids in `links`.
        Accepts an *Array* of data or a *String* filepath or URL to load; an
        optional formatting function can be passed as a second argument.
        @type {DataPoint[] | string}
    */
    {key: "nodes", default: accessor("nodes")},
    /**
        The accessor function or key that gives each node's unique id. Link
        `source`/`target` values are matched against these ids.
        @type {string | function}
    */
    {key: "nodeId", default: accessor("id")},
    /**
        The angular padding, in radians, between adjacent group arcs. When
        unset, the padding is derived from `padPixel`.
        @type {number}
    */
    {key: "padAngle"},
    /**
        The approximate pixel gap between adjacent group arcs, converted to an
        angle from the chart radius. Ignored when `padAngle` is set.
    */
    {key: "padPixel", default: 2},
    /**
        The accessor function or key for each link's numeric flow value, which
        sizes the ribbons and arcs. Defaults to a constant `1`, so every link
        counts equally.
        @type {string | function}
    */
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
