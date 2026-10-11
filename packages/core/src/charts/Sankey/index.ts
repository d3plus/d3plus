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
import {subtitleFeature, titleFeature, totalFeature} from "../features/features.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {applySankeyLayout} from "./applyLayout.js";
import {sankeyEmit} from "./emit.js";
import {broadcastLink} from "../viz/linkGroup.js";

const sankeyAligns = {
  center: sankeyCenter,
  justify: sankeyJustify,
  left: sankeyLeft,
  right: sankeyRight,
};

export const sankeyDef: ChartDefinition = {
  name: "Sankey",

  features: [titleFeature, subtitleFeature, totalFeature],
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
      // An edge datum is a `{source, target}` link, not a node — highlight the
      // hovered link plus its two endpoint nodes.
      const edge = d as DataPoint & {source?: {id: string | number}; target?: {id: string | number}};
      if (edge.source && edge.target) {
        const sourceId = edge.source.id;
        const targetId = edge.target.id;
        v.hover((h: DataPoint & {source?: {id: string | number}; target?: {id: string | number}}, hi: number) => {
          if (h.source && h.target)
            return h.source.id === sourceId && h.target.id === targetId;
          const hid = viz.schema.nodeId(h, hi) as string | number;
          return hid === sourceId || hid === targetId;
        });
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

    /**
        The flows between `nodes`. Each link's `linksSource` and `linksTarget`
        values match a node's `nodeId`, and its width comes from `value`.
        Accepts an array of links, or a URL/filepath string to load them from.
        An optional formatting function can be passed as a second argument; it
        receives the loaded data and returns the final links array.
        @type {object[] | string}
    */
    v.links = function(this: VizInstance, _: unknown, f?: unknown) {
      if (arguments.length) {
        (addToQueue as unknown as (...a: unknown[]) => void).bind(this)(_, f, "links");
        return this;
      }
      return this.schema.links;
    };
    /**
        The nodes to draw. When empty, the nodes are the unique source and
        target values in `links`. Accepts an array of node objects, or a
        URL/filepath string to load them from. An optional formatting function
        can be passed as a second argument; it receives the loaded data and
        returns the final nodes array.
        @type {object[] | string}
    */
    v.nodes = function(this: VizInstance, _: unknown, f?: unknown) {
      if (arguments.length) {
        (addToQueue as unknown as (...a: unknown[]) => void).bind(this)(_, f, "nodes");
        return this;
      }
      return this.schema.nodes;
    };
    /**
        How nodes are aligned horizontally: `"justify"` (default), `"left"`,
        `"right"`, or `"center"`, or a custom d3-sankey
        [alignment function](https://github.com/d3/d3-sankey#sankey_nodeAlign).
        @type {"justify" | "left" | "right" | "center" | function}
    */
    v.nodeAlign = function(this: VizInstance, _: unknown) {
      return arguments.length
        ? ((this.schema.nodeAlign = typeof _ === "function"
            ? (_ as (...a: unknown[]) => unknown)
            : (sankeyAligns as unknown as Record<string, unknown>)[_ as string]), this)
        : this.schema.nodeAlign;
    };
    /**
        The unique id of each node, as a key or an accessor function. Link
        sources and targets are matched against these ids.
        @type {string | function}
    */
    v.nodeId = function(this: VizInstance, _: unknown) {
      return arguments.length
        ? ((this.schema.nodeId = typeof _ === "function"
            ? (_ as (...a: unknown[]) => unknown)
            : accessor(_ as string)), this)
        : this.schema.nodeId;
    };
    /**
        The value of each link, which sets its width: a key or an accessor
        function that receives the link and its index. Defaults to `1` for
        every link.
        @type {string | function}
    */
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
      // Scene-rendered Sankey emits into `_chartScene`, not `_shapes`, so the
      // forEach above can't dim anything. Repaint so the scene's
      // interaction-opacity pass re-reads `_hover` and dims non-matching nodes.
      // Coalesced to one paint per frame (see Viz._scheduleSceneRepaint).
      if (this._sceneRenderer) this._scheduleSceneRepaint();
      broadcastLink(this, "hover", _);
      return this;
    };
  },

  ctx: {
    sankey: sankey(),
    path: sankeyLinkHorizontal(),
  },

  fields: [
    /**
        Draws arrowheads on the links: `true` (or `"target"`) where each link
        enters its target, `"source"` where it leaves its source, `"both"`,
        or `false` for none. Also accepts an accessor function returning one
        of those per link.
        @type {boolean | "target" | "source" | "both" | function}
    */
    {key: "arrows", default: false},
    /**
        The arrowhead size in pixels, or an accessor function returning one
        per link. Defaults to the link's width, kept between 8 and 28.
        @type {number | function}
    */
    {key: "arrowSize"},
    /**
        The number of relaxation iterations d3-sankey runs to position the
        nodes (see its [iterations](https://github.com/d3/d3-sankey#sankey_iterations)).
    */
    {key: "iterations", default: 6},
    {key: "links", default: accessor("links")},
    /**
        A comparator that orders the links at each node, passed to d3-sankey's
        [linkSort](https://github.com/d3/d3-sankey#sankey_linkSort). When
        unset, links are ordered by the position of the node at their other end.
        @type {function}
    */
    {key: "linkSort"},
    /** The key in each link object that holds its source node's id. */
    {key: "linksSource", default: "source"},
    /** The key in each link object that holds its target node's id. */
    {key: "linksTarget", default: "target"},
    {key: "noDataMessage", default: false},
    {key: "nodes", default: accessor("nodes")},
    {key: "nodeAlign", default: sankeyJustify},
    {key: "nodeId", default: accessor("id")},
    /** The vertical gap between nodes in the same column, in pixels. */
    {key: "nodePadding", default: 8},
    /**
        A comparator that orders the nodes in each column, passed to
        d3-sankey's [nodeSort](https://github.com/d3/d3-sankey#sankey_nodeSort).
        When unset, d3-sankey orders them to reduce link crossings.
        @type {function}
    */
    {key: "nodeSort"},
    /** The width of each node, in pixels. */
    {key: "nodeWidth", default: 30},
    {key: "value", default: constant(1)},
    {key: "shape", default: constant("Rect"), coerce: "const"},
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
  ],
};

/**
    Creates a Sankey visualization based on a defined set of nodes and links.
*/
export default makeChart(sankeyDef);
