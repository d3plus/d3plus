/**
    The per-instance fluent methods every node-link chart (Network,
    ArcDiagram) installs in its `setup`: `links`, `nodes`, `nodeGroupBy`,
    `size`, and `hover`. They need imperative bodies (queue loading, `aggs`
    side effects), so they are installed per instance rather than as fields.
*/
import type {DataPoint} from "@d3plus/data";

import {fieldAccessor} from "../../utils/fieldAccessor.js";
import {simpleHover} from "../viz/simpleHover.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {setLoaderValue} from "../viz/loaderFormat.js";

type Predicate = boolean | ((d: DataPoint, i: number) => boolean);
/** The fluent methods `installGraphFluent` adds. */
export type GraphFluent = {
  hover: (predicate?: Predicate) => unknown;
  links: (data?: DataPoint[], formatter?: unknown) => unknown;
  nodes: (data?: DataPoint[], formatter?: unknown) => unknown;
  nodeGroupBy: (keys?: unknown) => unknown;
  size: (value?: unknown) => unknown;
};
// d3plus's `_aggs` slot is typed as `(leaves: DataPoint[]) => unknown` —
// the chart-internal aggregator helpers we install pass a closed-over
// accessor + the leaves; cast at the install site.
type Aggregator = (leaves: DataPoint[]) => unknown;

/** Installs `links`, `nodes`, `nodeGroupBy`, `size`, and `hover` on a node-link chart. */
export function installGraphFluent(v: VizInstance & GraphFluent): void {
  /**
      The edges that connect the `nodes`. The `source` and `target` of each
      link refer to a node in one of three ways: its index in the `nodes`
      array, the node object itself (matched by its `id`), or a string
      matching the node's `id`. A link whose `source` and `target` are the
      same node draws as a loop beside it.

      Accepts an array of links, or a URL/filepath string to load them from.
      `linksFormat` transforms them; a function passed as a second argument
      sets it.
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
      The nodes to draw. Accepts an array of node objects, or a URL/filepath
      string to load them from. `nodesFormat` transforms them; a function
      passed as a second argument sets it.
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
      The key(s) or accessor(s) that identify each object passed to `nodes`,
      one per `groupBy` depth, used in place of `groupBy` for nodes that the
      data doesn't cover. Defaults to each node's `id`.
      @type {string | function | (string | function)[]}
  */
  v.nodeGroupBy = function (this: VizInstance, _?: unknown) {
    if (!arguments.length) return this.schema.nodeGroupBy;
    const keys = (_ instanceof Array ? _ : [_]) as unknown[];
    // `_nodeGroupBy` is typed as `(d: DataPoint, i: number) => string | number | Date` —
    // the accessors installed here return broader types; cast.
    this.schema.nodeGroupBy = keys.map(k => {
      if (typeof k === "function")
        return k as unknown as (
          d: DataPoint,
          i: number,
        ) => string | number | Date;
      const key = k as string;
      if (!this.schema.aggs[key]) {
        this.schema.aggs[key] = ((
          a: DataPoint[],
          c: (d: DataPoint) => unknown,
        ) => {
          const vv = Array.from(new Set(a.map(c)));
          return vv.length === 1 ? vv[0] : vv;
        }) as unknown as Aggregator;
      }
      return fieldAccessor(key) as unknown as (
        d: DataPoint,
        i: number,
      ) => string | number | Date;
    });
    return this;
  };
  /**
      Sizes each node: a data key or an accessor function whose values are
      scaled between `sizeMin` and `sizeMax` (see `sizeScale`). When unset,
      every node is drawn at the same size.
      @type {string | function}
  */
  v.size = function (this: VizInstance, _?: unknown) {
    if (!arguments.length) return this._size;
    this._size = (
      typeof _ === "function" || !_ ? _ : fieldAccessor(_ as string)
    ) as ((d: DataPoint, i?: number) => number) | undefined;
    this._sizeKey = typeof _ === "string" ? _ : undefined;
    return this;
  };
  v.hover = simpleHover;
}
