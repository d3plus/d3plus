/**
    Geomap's topojson accessors: `topojson`, `topojsonFill`,
    `topojsonFilter`, `topojsonKey`, and `topojsonId`.

    @module
*/

import accessor from "../../utils/accessor.js";
import constant from "../../utils/constant.js";
import {setLoaderValue} from "../viz/loaderFormat.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {geomapTopojson} from "./topojsonLevels.js";

type TopojsonFluent = {
  topojson: (_?: unknown, f?: unknown) => unknown;
  topojsonFill: (_?: unknown) => unknown;
  topojsonFilter: (_?: unknown) => unknown;
  topojsonKey: (_?: unknown) => unknown;
  topojsonId: (_?: unknown) => unknown;
};

/** Installs the topojson fluent accessors. */
export function setupGeomapTopojsonFluent(viz: VizInstance): void {
  const v = viz as VizInstance & TopojsonFluent;
  /**
      The topojson to draw as geographic paths: a topojson object, or a filepath
      or URL to load. `topojsonFormat` transforms it; a function passed as a
      second argument sets it.

      A list of them draws one per `groupBy` level (e.g. states, then
      counties), each at the `depth` it is listed at, and turns the map's
      drill-down geographic: clicking a region zooms the map to it and draws
      its children (the rows of the next level that carry its id in their
      own `groupBy` nesting), above it and its neighbors, faded (see
      `topojsonNeighborOpacity`); clicking a neighbor switches to its
      children, and Back goes up a level. A map that doesn't zoom (`zoom`
      off, or small multiples) fits the regions drilled into instead. The
      projection fits the first level, and a level past the list's end
      draws no regions (only coordinate points). With a list, `topojsonFormat`
      receives the list, and `topojsonKey` may be a list too.
      @type {string | object | false | Array<string | object>}
  */
  v.topojson = function (this: VizInstance) {
    if (arguments.length) {
      // A list stays a list once loaded (see `geomapTopojson`).
      // eslint-disable-next-line prefer-rest-params
      this.ctx.topojsonList = Array.isArray(arguments[0]);
      // eslint-disable-next-line prefer-rest-params
      setLoaderValue(this, "topojson", arguments);
      this._zoomSet = false;
      return this;
    }
    return geomapTopojson(this);
  };
  /**
      The fill for topojson shapes that have no data (or no `colorScale` value):
      a CSS color or a function of the feature. Defaults to the theme's
      `colorScale.missing` when it sets one, else a quiet light gray, or its
      dark counterpart over a dark basemap.
      @type {CssColor | function}
  */
  v.topojsonFill = function (this: VizInstance, _?: unknown) {
    return arguments.length
      ? ((this.schema.topojsonFill =
          typeof _ === "function"
            ? (_ as (...a: unknown[]) => unknown)
            : constant(_)),
        this)
      : this.schema.topojsonFill;
  };
  /**
      Limits which topojson features are drawn: a single feature id or an array
      of ids keeps only those features, and a filter function keeps the
      features it returns true for. To draw only the areas that have data,
      filter on the ids in your data (e.g.
      `const ids = new Set(data.map(d => d.id));` then
      `f => ids.has(f.id)`). Defaults to a filter that hides Antarctica (id
      `"010"`).
      @type {string | string[] | ((feature: object) => boolean)}
  */
  v.topojsonFilter = function (this: VizInstance, _?: unknown) {
    if (arguments.length) {
      this._zoomSet = false;
      if (typeof _ === "function") {
        this.schema.topojsonFilter = _ as (
          d: Record<string, unknown>,
        ) => boolean;
        return this;
      }
      const ids = (_ instanceof Array ? _ : [_]) as string[];
      this.schema.topojsonFilter = (d: Record<string, unknown>) =>
        ids.includes(d.id as string);
      return this;
    }
    return this.schema.topojsonFilter;
  };
  /**
      The key of the object in `topojson` (its `objects` map) to draw, or with
      a list of topojsons, a key for each level (one file holding both states
      and counties can be listed twice, with a key for each). Defaults to the
      first object.
      @type {string | string[]}
  */
  v.topojsonKey = function (this: VizInstance, _?: unknown) {
    if (arguments.length) {
      this.schema.topojsonKey = _ as string | string[] | undefined;
      this._zoomSet = false;
      return this;
    }
    return this.schema.topojsonKey;
  };
  /**
      The accessor, or key, that reads each topojson feature's id, which is
      matched against each data point's id (its `groupBy` value) to join the
      data to the map.
      @type {string | function}
  */
  v.topojsonId = function (this: VizInstance, _?: unknown) {
    return arguments.length
      ? ((this.schema.topojsonId =
          typeof _ === "function"
            ? (_ as (...a: unknown[]) => unknown)
            : accessor(_ as string)),
        this)
      : this.schema.topojsonId;
  };
}
