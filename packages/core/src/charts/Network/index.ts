/**
    Network — node-link diagram with optional d3-force layout.

    Implementation files in this folder:
      - `applyLayout.ts` — resolves nodes+links, runs force sim, normalizes
        link stroke sizes.
      - `emit.ts` — link Paths + per-shape-type node groups.
*/
import {mean} from "d3-array";

import type {DataPoint} from "@d3plus/data";

import accessor from "../../utils/accessor.js";
import {fieldAccessor} from "../../utils/fieldAccessor.js";
import constant from "../../utils/constant.js";
import {chartBounds} from "../features/chartGeometry.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {ensureZoomDom} from "../features/ensureZoomDom.js";
import {isPointShape} from "../viz/nearestHover.js";
import {makeChart} from "../definition/makeChart.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {applyNetworkLayout, networkSizeLegendScale} from "./applyLayout.js";
import {networkEmit} from "./emit.js";
import {sceneInsetRegion} from "../pipeline/insetPlacement.js";
import {graphNodeId, zoomToNodeBounds} from "./graph.js";
import {installGraphFluent} from "./graphFluent.js";
import type {GraphFluent} from "./graphFluent.js";
import {effectiveDuration} from "../viz/reducedMotion.js";
import {themed} from "../../utils/theme.js";
import {
  focusLink,
  installFocusBackgroundClick,
  linkEndsBox,
} from "../features/linkFocus.js";
import {
  isLinkDatum,
  legendHighlight,
  linkHighlight,
  linkMeta,
  linkTooltipConfig,
} from "../features/linkInteraction.js";
import {nodeStatsFields} from "../features/nodeStats.js";
import {
  linkBundleFields,
  linkSizeMaxField,
  linkStyleFields,
} from "../features/linkFields.js";
import {polylineBox} from "../features/polyline.js";
import {isSelfLoopMark, unionBox} from "../features/selfLoops.js";
import type {FocusBox} from "../features/linkFocus.js";
import type {LinkDatum} from "../features/linkInteraction.js";
import type {GraphLink} from "./graph.js";
import {loaderFormatFields} from "../viz/loaderFormat.js";
import {clusterFields, installClusters} from "./clusters.js";

const getNodeId = graphNodeId;

type NodeRecord = {id: string; x: number; y: number; r: number};
type Predicate = boolean | ((d: DataPoint, i: number) => boolean);
type NetworkFluent = GraphFluent & {
  active: (predicate?: Predicate) => unknown;
  x: (accessor?: unknown) => unknown;
  y: (accessor?: unknown) => unknown;
};
// d3plus's `_aggs` slot is typed as `(leaves: DataPoint[]) => unknown` —
// the chart-internal aggregator helpers we install pass a closed-over
// accessor + the leaves; cast at the install site.
type Aggregator = (leaves: DataPoint[]) => unknown;
type NetworkViz = VizInstance & NetworkFluent;

/** The laid-out links, from the last layout. */
const networkLinks = (viz: VizInstance): GraphLink[] =>
  ((viz.ctx.networkCtx as {links?: GraphLink[]} | undefined)?.links ??
    []) as GraphLink[];

/**
    The box a link's focus zooms to: its two ends, and its loop or bundled
    path when it has one.
*/
function networkLinkBox(viz: VizInstance, d: LinkDatum): FocusBox | null {
  const box = linkEndsBox(viz, d);
  const link = networkLinks(viz).find(l => l.datum === d);
  if (box && link?.loop) return unionBox(box, link.loop.box);
  if (box && link?.points) return unionBox(box, polylineBox(link.points));
  return box;
}

/** Grows a node focus's `[x0, x1]`/`[y0, y1]` domains around the node's loops. */
function includeNodeLoops(
  viz: VizInstance,
  id: string,
  xDomain: number[],
  yDomain: number[],
): void {
  for (const l of networkLinks(viz)) {
    if (!l.loop || l.source?.id !== id) continue;
    const [[x0, y0], [x1, y1]] = l.loop.box;
    xDomain[0] = Math.min(xDomain[0], x0);
    xDomain[1] = Math.max(xDomain[1], x1);
    yDomain[0] = Math.min(yDomain[0], y0);
    yDomain[1] = Math.max(yDomain[1], y1);
  }
}

/** Installs the `click.shape` handler that focuses/zooms a node + its links. */
function setupNetworkClickShape(viz: VizInstance, v: NetworkViz) {
  viz.schema.on["click.shape"] = (
    d: DataPoint,
    i: number,
    x: unknown,
    event: MouseEvent,
  ) => {
    viz._tooltipClass!.data([]).render();
    if (isLinkDatum(d)) {
      focusLink(viz, d, {
        nodeKey: (h, hi) => `${viz._ids(h, hi)[viz._drawDepth]}`,
        box: networkLinkBox(viz, d),
      });
      return;
    }

    if (viz._drawDepth >= viz.schema.groupBy.length - 1) {
      const id = getNodeId(viz, d, i);

      if (viz._focus && viz._focus === id) {
        v.active(false);
        viz.schema.on.mouseenter.bind(viz)(d, i, x, event);
        viz._focus = undefined;
        viz._zoomToBounds!(null);
      } else {
        v.hover(false);
        const links =
          (viz.ctx.linkLookup as Record<string, NodeRecord[]>)[id] ?? [];
        const node = (viz.ctx.nodeLookup as Record<string, NodeRecord>)[id];
        // An edge has no node to focus.
        if (!node) return;
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
        includeNodeLoops(viz, id, xDomain, yDomain);

        v.active((h: DataPoint, hi: number) => {
          const m = linkMeta(h);
          if (m) return m.source.id === id || m.target.id === id;
          return filterIds.includes(getNodeId(viz, h, hi));
        });

        viz._focus = id;
        zoomToNodeBounds(viz, xDomain, yDomain);
      }
    }
  };
}

/** Installs the `click.legend` handler that focuses/zooms a legend group. */
function setupNetworkClickLegend(viz: VizInstance, v: NetworkViz) {
  viz.schema.on["click.legend"] = (
    d: DataPoint,
    i: number,
    x: unknown,
    event: MouseEvent,
  ) => {
    const idList = viz._ids(d, i);
    const id = idList[idList.length - 1];
    const ids = viz._id(d, i) as string | number | (string | number)[];

    if (viz._drawDepth >= viz.schema.groupBy.length - 1) {
      if (viz._focus && viz._focus === ids) {
        v.active(false);
        viz._focus = undefined;
        viz._zoomToBounds!(null);
      } else {
        v.hover(false);
        const idArr = Array.isArray(ids) ? ids : [ids];
        const nodes = idArr.map(
          nid =>
            (viz.ctx.nodeLookup as Record<string, NodeRecord>)[String(nid)],
        );
        const filterIds = [`${id}`];
        const xDomain = [nodes[0].x - nodes[0].r, nodes[0].x + nodes[0].r];
        const yDomain = [nodes[0].y - nodes[0].r, nodes[0].y + nodes[0].r];

        nodes.forEach(l => {
          filterIds.push(l.id);
          if (l.x - l.r < xDomain[0]) xDomain[0] = l.x - l.r;
          if (l.x + l.r > xDomain[1]) xDomain[1] = l.x + l.r;
          if (l.y - l.r < yDomain[0]) yDomain[0] = l.y - l.r;
          if (l.y + l.r > yDomain[1]) yDomain[1] = l.y + l.r;
        });

        v.active((h: DataPoint, hi: number) => {
          const m = linkMeta(h);
          if (m)
            return (
              filterIds.includes(m.source.id) && filterIds.includes(m.target.id)
            );
          const myIds = viz._ids(h, hi);
          return filterIds.includes(`${myIds[myIds.length - 1]}`);
        });

        viz._focus = ids as unknown as string;
        zoomToNodeBounds(viz, xDomain, yDomain);
      }

      viz.schema.on.mouseenter.bind(viz)(d, i, x, event);
      viz.schema.on["mousemove.legend"].bind(viz)(d, i, x, event);
    }
  };
}

/** Installs mouseenter/mouseleave/mousemove handlers that drive hover highlighting. */
function setupNetworkMouse(viz: VizInstance, v: NetworkViz) {
  viz.schema.on.mouseenter = () => undefined;
  viz.schema.on["mouseenter.legend"] = (d: DataPoint, i: number) => {
    v.hover(legendHighlight(viz, d, i));
  };
  viz.schema.on["mouseleave.shape"] = () => {
    v.hover(false);
  };
  const defaultMouseMove = viz.schema.on["mousemove.shape"];
  viz.schema.on["mousemove.shape"] = (
    d: DataPoint,
    i: number,
    x: unknown,
    event: MouseEvent,
  ) => {
    defaultMouseMove(d, i, x, event);
    const nodeKey = (h: DataPoint, hi: number) =>
      `${viz._ids(h, hi)[viz._drawDepth]}`;
    if (isLinkDatum(d)) {
      v.hover(linkHighlight(viz, d, nodeKey));
      return;
    }
    const id = getNodeId(viz, d, i);
    const links =
      (viz.ctx.linkLookup as Record<string, NodeRecord[]>)[id] ?? [];
    const node = (viz.ctx.nodeLookup as Record<string, NodeRecord>)[id];
    // An edge has no node to focus.
    if (!node) return;
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

    v.hover((h: DataPoint, hi: number) => {
      const m = linkMeta(h);
      if (m) return m.source.id === id || m.target.id === id;
      return filterIds.includes(nodeKey(h, hi));
    });
  };
}

/** Installs the shape/legend/mouse event handlers that drive Network focus + hover. */
function setupNetworkEvents(viz: VizInstance, v: NetworkViz) {
  installFocusBackgroundClick(viz);
  setupNetworkClickShape(viz, v);
  setupNetworkClickLegend(viz, v);
  setupNetworkMouse(viz, v);
}

/** Installs the per-instance fluent methods (the shared graph ones, plus x/y). */
function setupNetworkFluent(v: NetworkViz) {
  installGraphFluent(v);
  /**
      The x position of each node: a key in the data or `nodes`, or an
      accessor function. Defaults to `"x"`. When any node has no x/y
      position, every node is placed by a force simulation instead.
      @type {string | function}
  */
  v.x = function (this: VizInstance, _?: unknown) {
    if (!arguments.length) return this._x;
    if (typeof _ === "function") {
      this._x = _ as unknown as (
        d: DataPoint,
        i: number,
      ) => string | number | Date;
    } else {
      const key = _ as string;
      this._x = fieldAccessor(key) as unknown as (
        d: DataPoint,
        i: number,
      ) => string | number | Date;
      if (!this.schema.aggs[key])
        this.schema.aggs[key] = mean as unknown as Aggregator;
    }
    return this;
  };
  /**
      The y position of each node: a key in the data or `nodes`, or an
      accessor function. Defaults to `"y"`. When any node has no x/y
      position, every node is placed by a force simulation instead.
      @type {string | function}
  */
  v.y = function (this: VizInstance, _?: unknown) {
    if (!arguments.length) return this._y;
    if (typeof _ === "function") {
      this._y = _ as unknown as (
        d: DataPoint,
        i: number,
      ) => string | number | Date;
    } else {
      const key = _ as string;
      this._y = fieldAccessor(key) as unknown as (
        d: DataPoint,
        i: number,
      ) => string | number | Date;
      if (!this.schema.aggs[key])
        this.schema.aggs[key] = mean as unknown as Aggregator;
    }
    return this;
  };
}

export const networkDef: ChartDefinition = {
  name: "Network",

  layoutStage: applyNetworkLayout,
  sizeLegendScale: (viz, {width, height}) =>
    networkSizeLegendScale(viz, width, height),
  emit: networkEmit,
  insetRegion: sceneInsetRegion,

  // Network mounts its own zoom surface (with a background hitArea whose
  // click handler closes over class state); `chartTransform` (default
  // margin-origin) is fine for the scene.
  setup: (viz: VizInstance) => {
    const v = viz as NetworkViz;
    setupNetworkEvents(viz, v);

    // `links()` / `nodes()` / `nodeGroupBy()` / `size()` / `x()` / `y()` /
    // `hover()` need imperative method bodies (queue loading, aggs side
    // effects). Install them per-instance.
    setupNetworkFluent(v);
    installClusters(viz);

    // Default x/y accessors for nodes (Network reads node coords directly).
    viz._x = accessor("x") as VizInstance["_x"];
    viz._y = accessor("y") as VizInstance["_y"];

    // Wrap _draw to also call ensureZoomDom (Network needs a DOM zoom group).
    const supDraw = v._draw.bind(viz);
    v._draw = function (callback?: () => void) {
      const result = supDraw(callback);
      const {width, height} = chartBounds(viz);
      ensureZoomDom(viz, {
        kind: "network",
        width,
        height,
        duration: effectiveDuration(viz),
      });
      return result;
    };
  },

  // Small-multiple panels as close to square as the grid allows.
  facet: {aspect: 1},

  // Nodes (and loops, which sit within reach of their node) are points for
  // `hoverDistance`; links keep exact hit-testing.
  pointMark: (_viz, node) => isPointShape(node) || isSelfLoopMark(node),

  ctx: {},

  fields: [
    /**
        Draws arrowheads on the links: `true` (or `"target"`) at each link's
        target end, `"source"` at its source end, `"both"`, or `false` for
        none. Also accepts an accessor function returning one of those per
        link.
        @type {boolean | "target" | "source" | "both" | function}
    */
    {key: "arrows", default: false},
    /**
        The arrowhead size in pixels, or an accessor function returning one
        per link. Defaults to three times the link's stroke width, at least 6
        and at most 12 pixels, but never under 1.5 times the stroke width so
        the head stays wider than its line. The line stops at the head's base.
        @type {number | function}
    */
    {key: "arrowSize"},
    ...clusterFields(),
    ...linkStyleFields(),
    ...linkBundleFields(),
    ...loaderFormatFields("links", "nodes"),
    /**
        How the nodes are placed. `"force"` (the default) places them at
        their `x` and `y`, or by a force simulation when any node has none.
        `"circle"` spaces them evenly around a circle, ordered by cluster
        (or top-level group) and then most connected first (see
        `nodeSort`), with links bowing in toward the center and each label
        turned outward along its node's spoke past the circle. A node's
        loops point outward. With `linkBundle`, the bundled paths replace
        the bowed ones.
        @type {"force" | "circle"}
    */
    {key: "layout", default: "force"},
    /**
        How far links bow in toward the center when `layout` is
        `"circle"`, from `0` (straight lines) to `1` (each link curves
        through the center's pull, as a chord diagram's do). It sets the
        share of the way from the middle of a link's chord to the center
        that its curve's control point sits. Defaults to `0.5`, which keeps
        links between neighbors near the rim and lets long ones cross the
        middle. Bundled links (`linkBundle`) ignore it.
        @type {number}
    */
    {key: "linkBow", default: 0.5},
    {key: "links", default: []},
    /**
        The thickness of each link: a pixel number used for every link, or an
        accessor function whose values are scaled between `linkSizeMin` and
        `linkSizeMax` (see `linkSizeScale`). The function receives each
        link, with `source` and `target` set to the data of the nodes at its
        ends, and its index in `links`.
        @type {number | function}
    */
    {
      key: "linkSize",
      default: constant(1),
      coerce: v => (typeof v === "function" ? v : constant(v as number)),
    },
    /**
        The widest link, in pixels, when `linkSize` values differ. Defaults
        to half the smallest node's radius.
    */
    linkSizeMaxField(),
    /** The thinnest link, in pixels, when `linkSize` values differ. */
    {key: "linkSizeMin", default: 1},
    /**
        The type of [continuous d3-scale](https://github.com/d3/d3-scale#continuous-scales)
        used to size links (e.g. `"linear"`, `"sqrt"`, `"log"`).
    */
    {key: "linkSizeScale", default: "sqrt"},
    {key: "noDataMessage", default: false},
    {key: "nodeGroupBy", default: [accessor("id")]},
    /**
        The order of the nodes around the circle when `layout` is
        `"circle"`: `"data"` (their order in `nodes`), `"label"`
        (alphabetical), `"group"` (by cluster or top-level group, then by
        label), `"degree"` (most connected first), or a comparator function
        receiving two node rows. Defaults to each cluster (or top-level
        group) together, largest first, its most connected nodes first.
        @type {"data" | "label" | "group" | "degree" | function}
    */
    {key: "nodeSort"},
    /**
        How many links a node's tooltip lists under its number of
        connections, strongest first: a number, or `false` for none. Defaults
        to 3 when the links differ in `linkSize`, and none otherwise.
        @type {number | false}
    */
    {key: "nodeTooltipLinks"},
    ...nodeStatsFields(),
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => linkTooltipConfig(viz),
    },
    {key: "nodes", default: []},
    /**
        The maximum pixel radius used when sizing nodes. Defaults to half the
        distance between the two closest nodes.
        @type {number}
    */
    {key: "sizeMax"},
    /** The minimum pixel radius used when sizing nodes. */
    {key: "sizeMin", default: 5},
    /**
        The type of [continuous d3-scale](https://github.com/d3/d3-scale#continuous-scales)
        used to size nodes (e.g. `"linear"`, `"sqrt"`, `"log"`).
    */
    {key: "sizeScale", default: "sqrt"},
    {key: "shape", default: constant("Circle"), coerce: "const"},
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        ariaLabel: (d: DataPoint, i: number) => {
          const sizeFn = viz._size as
            ((d: DataPoint, i: number) => unknown) | undefined;
          const validSize = sizeFn ? `, ${sizeFn(d, i)}` : "";
          return `${viz._drawLabel(d, i)}${validSize}.`;
        },
        labelConfig: {
          duration: 0,
          fontMin: 1,
          fontResize: true,
          textAnchor: "middle",
          verticalAlign: "middle",
        },
        // Thin (1px) lines need more contrast than a wide flow-width stroke
        // (cf. Sankey's #DBDBDB) to read clearly against a white background.
        Path: {
          fill: "none",
          label: false,
          stroke: () => themed(viz._theme, t => t.link, "#adb5bd"),
        },
      }),
    },
  ],
};

/**
    Creates a network visualization based on a defined set of nodes and edges.
*/
export default makeChart(networkDef);
