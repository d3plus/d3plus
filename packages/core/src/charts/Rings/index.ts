/**
    Rings — node-link diagram laid out around a central focal node in
    two concentric rings.

    Implementation files in this folder:
      - `applyLayout.ts` — focus + ring placement + link bezier paths.
      - `emit.ts` — link Paths + per-shape-type node groups.
*/

import {addToQueue} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";

import accessor from "../../utils/accessor.js";
import constant from "../../utils/constant.js";
import type Shape from "../../shapes/Shape.js";
import {backFeature, subtitleFeature, titleFeature, totalFeature} from "../features/features.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {applyRingsLayout} from "./applyLayout.js";
import {ringsEmit} from "./emit.js";

type RingsAccessor = number | ((d: DataPoint, i: number) => unknown);

/** The extra fluent accessors Rings installs on top of the base Viz surface. */
interface RingsFluent {
  links: (data?: DataPoint[], formatter?: unknown) => unknown;
  nodes: (data?: DataPoint[], formatter?: unknown) => unknown;
  linkSize: (value?: RingsAccessor) => unknown;
  nodeGroupBy: (
    keys?: string | string[] | ((d: DataPoint, i: number) => unknown),
  ) => unknown;
  size: (value?: RingsAccessor) => unknown;
  hover: (predicate?: boolean | ((d: DataPoint, i: number) => boolean)) => unknown;
}

/** Installs Rings' nodes/links/size/hover fluent accessors onto the instance. */
function installRingsAccessors(viz: VizInstance): void {
  const v = viz as VizInstance & RingsFluent;
  const queue = (that: VizInstance, _?: DataPoint[], f?: unknown, key?: string) =>
    addToQueue.bind(that as unknown as ThisParameterType<typeof addToQueue>)(
      _!,
      f as Parameters<typeof addToQueue>[1],
      key!,
    );
  v.links = function(this: VizInstance, _?: DataPoint[], f?: unknown) {
    if (!arguments.length) return this.schema.links;
    queue(this, _, f, "links");
    return this;
  };
  v.nodes = function(this: VizInstance, _?: DataPoint[], f?: unknown) {
    if (!arguments.length) return this.schema.nodes;
    queue(this, _, f, "nodes");
    return this;
  };
  v.linkSize = function(this: VizInstance, _?: RingsAccessor) {
    return arguments.length
      ? ((this.schema.linkSize = typeof _ === "function" ? _ : constant(_ as never)), this)
      : this.schema.linkSize;
  };
  v.nodeGroupBy = function(
    this: VizInstance,
    _?: string | string[] | ((d: DataPoint, i: number) => unknown),
  ) {
    if (!arguments.length) return this.schema.nodeGroupBy;
    const keys = (_ instanceof Array ? _ : [_]) as (
      string | ((d: DataPoint, i: number) => unknown)
    )[];
    this.schema.nodeGroupBy = keys.map(k => {
      if (typeof k === "function") return k;
      if (!this.schema.aggs[k])
        this.schema.aggs[k] = (a: DataPoint[], c: (d: DataPoint) => unknown) => {
          const vv = Array.from(new Set(a.map(c)));
          return vv.length === 1 ? vv[0] : vv;
        };
      return accessor(k);
    });
    return this;
  };
  v.size = function(this: VizInstance, _?: RingsAccessor) {
    return arguments.length
      ? ((this._size = (typeof _ === "function" || !_
          ? _
          : accessor(_ as unknown as string)) as VizInstance["_size"]),
        this)
      : this._size;
  };
  v.hover = function(
    this: VizInstance,
    _?: boolean | ((d: DataPoint, i: number) => boolean),
  ) {
    const pred = _ as unknown as ((d: DataPoint, i: number) => boolean) | null;
    this._hover = _ as VizInstance["_hover"];
    this._shapes!.forEach((s: Shape) => s.hover(pred));
    if (this.schema.legend) this._legendClass!.hover(pred);
    // Scene-emit charts dim via applyInteractionOpacity during toScene(); a
    // hover change only takes effect once a repaint is scheduled.
    if (this._sceneRenderer) this._scheduleSceneRepaint();
    return this;
  };
}

export const ringsDef: ChartDefinition = {
  name: "Rings",

  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  layoutStage: applyRingsLayout,
  emit: ringsEmit,

  setup: (viz: VizInstance) => {
    installRingsAccessors(viz);
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
      links.forEach((l: NodeRecord) => {
        filterIds.push(l.id);
        if (l.x - l.r < xDomain[0]) xDomain[0] = l.x - l.r;
        if (l.x + l.r > xDomain[1]) xDomain[1] = l.x + l.r;
        if (l.y - l.r < yDomain[0]) yDomain[0] = l.y - l.r;
        if (l.y + l.r > yDomain[1]) yDomain[1] = l.y + l.r;
      });
      v.hover((h: DataPoint, x: number) => {
        const edge = h as {source?: {id: string}; target?: {id: string}};
        if (edge.source && edge.target)
          return edge.source.id === node.id || edge.target.id === node.id;
        return filterIds.includes(viz._ids(h, x)[viz._drawDepth] as string);
      });
    };
    viz.schema.on["click.shape"] = (d: DataPoint) => {
      // Clear the hover/tooltip before re-centering: the clicked node's shapes
      // move out from under the pointer, so a lingering tooltip would hang over
      // unrelated content (the shared click.shape drill handler does the same).
      viz.hover?.(false);
      viz._tooltipClass?.data([]).render();
      viz.schema.center = d.id;
      viz._margin = {bottom: 0, left: 0, right: 0, top: 0};
      viz._padding = {bottom: 0, left: 0, right: 0, top: 0};
      viz._draw();
      // _draw() only recomputes layout/scene; paint it with the chart duration
      // so the re-centering animates (a bare _draw leaves the only repaint to
      // the coalesced duration-0 one, which snaps).
      if (viz._sceneRenderer) viz._drawSceneToTarget(viz.schema.duration);
    };
  },

  ctx: {},

  fields: [
    {key: "center"},
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        title: (d: DataPoint) => {
          const edge = d as {source?: {id: string}; target?: {id: string}};
          return d && edge.source && edge.target
            ? `${edge.source.id} → ${edge.target.id}`
            : viz._drawLabel(d, typeof d.i === "number" ? d.i : 0);
        },
      }),
    },
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
        ariaLabel: (d: DataPoint, i: number) => {
          const sizeFn = viz._size;
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

/**
    Creates a ring visualization based on a defined set of nodes and edges.
*/
export default makeChart(ringsDef);
