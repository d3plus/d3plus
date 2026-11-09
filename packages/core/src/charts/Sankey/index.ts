/**
    Sankey — flow diagram.

    Implementation files in this folder:
      - `applyLayout.ts` — node + link resolution + Sankey layout.
      - `emit.ts` — link Paths + per-shape-type node Rects.
      - `sankeyLayout.ts` — the layout (a port of d3-sankey).
*/
import {
  sankey,
  sankeyCenter,
  sankeyJustify,
  sankeyLeft,
  sankeyRight,
} from "./sankeyLayout.js";

import {colorGray} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";

import accessor from "../../utils/accessor.js";
import {fieldAccessor} from "../../utils/fieldAccessor.js";
import constant from "../../utils/constant.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {loaderFormatFields, setLoaderValue} from "../viz/loaderFormat.js";

import {focusLink, installFocusBackgroundClick} from "../features/linkFocus.js";
import {
  isLinkDatum,
  linkHighlight,
  linkTooltipConfig,
  nodeHighlight,
} from "../features/linkInteraction.js";
import {nodeStatsFields} from "../features/nodeStats.js";
import {applySankeyLayout} from "./applyLayout.js";
import {sankeyEmit} from "./emit.js";
import {simpleHover} from "../viz/simpleHover.js";
import {themeDark, themed} from "../../utils/theme.js";
import {linkStyleFields} from "../features/linkFields.js";

const sankeyAligns = {
  center: sankeyCenter,
  justify: sankeyJustify,
  left: sankeyLeft,
  right: sankeyRight,
};

/** The fluent methods Sankey's `setup` installs on the chart. */
type SankeyFluent = {
  links: (data?: DataPoint[], formatter?: unknown) => unknown;
  nodes: (data?: DataPoint[], formatter?: unknown) => unknown;
  nodeAlign: (align?: unknown) => unknown;
  nodeId: (id?: unknown) => unknown;
  value: (value?: unknown) => unknown;
  hover: (
    predicate?: boolean | ((d: DataPoint, i: number) => boolean),
  ) => unknown;
};

/**
    Wire Sankey's hover handlers: hovering a link highlights it and its two
    endpoint nodes; hovering a node highlights it and the nodes and links
    connected to it.
*/
function installSankeyHover(viz: VizInstance & SankeyFluent): void {
  viz.schema.on.mouseenter = () => undefined;
  viz.schema.on["mouseleave.shape"] = () => {
    viz.hover(false);
  };
  const defaultMouseMove = viz.schema.on["mousemove.shape"];
  viz.schema.on["mousemove.shape"] = (
    d: DataPoint,
    i: number,
    x: unknown,
    event: MouseEvent,
  ) => {
    defaultMouseMove(d, i, x, event);
    if (viz._focus && viz._focus === d.id) {
      viz.hover(false);
      viz.schema.on.mouseenter.bind(viz)(d, i, x, event);
      viz._focus = undefined;
      return;
    }
    const nodeKey = (h: DataPoint, hi: number) => `${viz.schema.nodeId(h, hi)}`;
    const predicate = isLinkDatum(d)
      ? linkHighlight(viz, d, nodeKey)
      : nodeHighlight(viz, d, nodeKey);
    if (predicate) viz.hover(predicate);
  };
}

/**
    Wire Sankey's link click: it keeps the link and its two ends highlighted
    until the link or the background is clicked again. Sankey doesn't zoom,
    so the focus stays in place. Node clicks keep the default handler.
*/
function installSankeyLinkFocus(viz: VizInstance): void {
  installFocusBackgroundClick(viz);
  const defaultClick = viz.schema.on["click.shape"];
  viz.schema.on["click.shape"] = function (
    this: unknown,
    d: DataPoint,
    i: number,
    x: unknown,
    event: MouseEvent,
  ) {
    if (isLinkDatum(d)) {
      focusLink(viz, d, {
        nodeKey: (h, hi) => `${viz.schema.nodeId(h, hi)}`,
      });
      return;
    }
    if (typeof defaultClick === "function")
      defaultClick.call(this, d, i, x, event);
  };
}

export const sankeyDef: ChartDefinition = {
  name: "Sankey",

  layoutStage: applySankeyLayout,
  emit: sankeyEmit,

  setup: (viz: VizInstance) => {
    const v = viz as VizInstance & SankeyFluent;
    installSankeyHover(v);
    installSankeyLinkFocus(viz);

    /**
        The flows between `nodes`. Each link's `linksSource` and `linksTarget`
        values match a node's `nodeId`, and its width comes from `value`.
        Accepts an array of links, or a URL/filepath string to load them from.
        `linksFormat` transforms them; a function passed as a second argument
        sets it. A link that loops back into a node it left (a link from a
        node to itself, or the lightest link on a loop through several nodes,
        A → B → A) is drawn as a circular band around the outside of the
        nodes, or left out with a warning when `circularLinks` is `false`.
        @type {object[] | string}
    */
    v.links = function (this: VizInstance) {
      if (arguments.length) {
        // eslint-disable-next-line prefer-rest-params
        setLoaderValue(this, "links", arguments);
        return this;
      }
      return this.schema.links;
    };
    /**
        The nodes to draw, including any that no link touches (see
        `value`). When empty, the nodes are the unique source and target
        values in `links`. Accepts an array of node objects, or a
        URL/filepath string to load them from. `nodesFormat` transforms them;
        a function passed as a second argument sets it.
        @type {object[] | string}
    */
    v.nodes = function (this: VizInstance) {
      if (arguments.length) {
        // eslint-disable-next-line prefer-rest-params
        setLoaderValue(this, "nodes", arguments);
        return this;
      }
      return this.schema.nodes;
    };
    /**
        How nodes are aligned horizontally: `"justify"` (default), `"left"`,
        `"right"`, or `"center"`, or a custom d3-sankey
        [alignment function](https://github.com/d3/d3-sankey#sankey_nodeAlign).
        A node no link touches sits in the first column, except with
        `"right"`, which puts it in the last.
        @type {"justify" | "left" | "right" | "center" | function}
    */
    v.nodeAlign = function (this: VizInstance, _: unknown) {
      return arguments.length
        ? ((this.schema.nodeAlign =
            typeof _ === "function"
              ? (_ as (...a: unknown[]) => unknown)
              : (sankeyAligns as unknown as Record<string, unknown>)[
                  _ as string
                ]),
          this)
        : this.schema.nodeAlign;
    };
    /**
        The unique id of each node, as a key or an accessor function. Link
        sources and targets are matched against these ids.
        @type {string | function}
    */
    v.nodeId = function (this: VizInstance, _: unknown) {
      return arguments.length
        ? ((this.schema.nodeId =
            typeof _ === "function"
              ? (_ as (...a: unknown[]) => unknown)
              : fieldAccessor(_ as string)),
          this)
        : this.schema.nodeId;
    };
    /**
        The value of each link, which sets its width: a key or an accessor
        function that receives the link, with `source` and `target` set to the
        data of the nodes at its ends, and its index in `links`. Defaults to
        `1` for every link. A node no link touches is sized by `value` read
        from its own row in `nodes` when that is a positive number, and
        otherwise by the smallest link value. A node's height counts the
        flow its circular links return (see `links`).
        @type {string | function}
    */
    v.value = function (this: VizInstance, _: unknown) {
      if (!arguments.length) return this.schema.value;
      this.schema.value = (
        typeof _ === "function"
          ? (_ as (...a: unknown[]) => unknown)
          : fieldAccessor(_ as string)
      ) as (d: DataPoint, i: number) => number;
      return this;
    };
    v.hover = simpleHover;
  },

  ctx: {
    sankey: sankey(),
  },

  fields: [
    {key: "circularLinks", default: true},
    /**
        The number of relaxation iterations d3-sankey runs to position the
        nodes (see its [iterations](https://github.com/d3/d3-sankey#sankey_iterations)).
    */
    {key: "iterations", default: 6},
    ...linkStyleFields(),
    ...loaderFormatFields("links", "nodes"),
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
    /**
        How many links a node's tooltip lists under its number of
        connections, strongest first: a number, or `false` for none. Defaults
        to 3 when the links differ in `value`, and none otherwise.
        @type {number | false}
    */
    {key: "nodeTooltipLinks"},
    ...nodeStatsFields(),
    /** The width of each node, in pixels. */
    {key: "nodeWidth", default: 30},
    {key: "value", default: constant(1)},
    {key: "shape", default: constant("Rect"), coerce: "const"},
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        Path: {
          // Each band is a filled ribbon (see `sankeyRibbonD`).
          fill: () =>
            // Wide bands recede on dark as #DBDBDB does on white: the dark
            // preset's link gray is for thin Network and Rings edges.
            themed(
              viz._theme,
              t => (t.link === themeDark.link ? colorGray[800] : t.link),
              "#DBDBDB",
            ),
          fillOpacity: 0.5,
          label: false,
        },
        Rect: {},
      }),
    },
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => linkTooltipConfig(viz),
    },
  ],
};

/**
    Creates a Sankey visualization based on a defined set of nodes and links.
*/
export default makeChart(sankeyDef);
