import {select} from "d3-selection";

import {addToQueue, unique} from "@d3plus/data";
import {fontFamilyStringify} from "@d3plus/text";
import type {DataPoint} from "@d3plus/data";
import {date} from "@d3plus/dom";

import {accessor, BaseClass, constant} from "../../utils/index.js";
import {coerceFacet} from "../facet/facetConfig.js";
import type {FacetConfig} from "../facet/facetConfig.js";
import {groupDepthOf} from "./groupRow.js";
import {broadcastLink} from "./linkGroup.js";
import {shapeHoverEnabled} from "./shapeHover.js";
import type {VizFieldKey} from "./vizFields.js";
import type {VizInstance} from "./vizTypes.js";
import {isPlainObject, mergeConfigBag, resolvesReset} from "../../fluent.js";
import type {D3plusConfig} from "../../utils/index.js";
import validateShapeConfig from "../../shapes/validateShapeConfig.js";

/** The accessors `vizFields` generates, typed from their `D3plusConfig` properties. */
type VizFieldAccessors = {
  [K in VizFieldKey]-?: {
    (): D3plusConfig[K];
    (value: D3plusConfig[K]): VizBase;
  };
};

// The generated accessors are installed at runtime; this declares them on the
// class (the merge is the point, so the class below needs no implementation).
/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface VizBase extends VizFieldAccessors {}

/**
    The fluent config accessors shared by every Viz chart that need more than
    storing their value (most are generated from `vizFields.ts`); `Viz` adds
    the render lifecycle.
*/
class VizBase extends BaseClass {
  // installFluent generates the config accessors (data, sum, x, …) and the
  // pipeline stamps derived `_`-prefixed state at runtime; the index signature
  // lets the chart code reach both through the type (same rationale as the
  // shape/component classes).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;

  /**
      The active callback function for highlighting shapes.
*/
  active(
    _?: ((d: DataPoint, i: number) => boolean) | false,
  ): this | ((d: DataPoint, i: number) => boolean) | false {
    this._active = _;

    if (this.schema.shapeConfig.activeOpacity !== 1) {
      if (this.schema.legend) this._legendClass.active(_);
      // See hover(): scene-rendered charts dim via the scene's
      // interaction-opacity pass, so repaint to apply/clear active state.
      if (this._sceneRenderer) this._scheduleSceneRepaint();
    }

    broadcastLink(this as unknown as VizInstance, "active", _);
    return this;
  }

  /**
      The primary data array used to draw the visualization. The value passed should be an *Array* of objects or a *String* representing a filepath or URL to be loaded. The following filetypes are supported: `csv`, `tsv`, `txt`, and `json`.

If your data URL needs specific headers to be set, an Object with a "url" and "headers" (or any other `fetch` request option) may also be passed. An Object with any other key is a data row, not a request.

Additionally, a custom formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final array of obejcts to be used as the primary data array. For example, some JSON APIs return the headers split from the data values to save bandwidth. These would need be joined using a custom formatter.

If you would like to specify certain configuration options based on the yet-to-be-loaded data, you can also return a full `config` object from the data formatter (including the new `data` array as a key in the object).

Defaults to an empty array (`[]`).
    @param f The data array or a URL string to load data from.
  */
  data(
    _?: DataPoint[] | string | {url: string; headers: Record<string, string>},
    f?: (data: DataPoint[]) => DataPoint[] | Record<string, unknown>,
  ): this | DataPoint[] {
    if (arguments.length) {
      addToQueue.bind(this as unknown as ThisParameterType<typeof addToQueue>)(
        _!,
        f,
        "data",
      );
      this._hidden = [];
      this._solo = [];
      if (
        this._userData &&
        JSON.stringify(_) !== JSON.stringify(this._userData)
      ) {
        this.schema.timeFilter = false;
        this._timelineSelection = false;
      }
      this._userData = _;
      return this;
    }
    return this._data;
  }

  /**
      Splits the chart into small multiples: a grid of equally sized panels, one per distinct value of this data key or accessor, each drawing the chart for that value's rows. The panels share one legend, color scale, title, and timeline, color each series the same way, and hover, tooltips, and legend clicks apply across all of them. Pass `false` to draw a single chart. See `facetConfig` for the grid's layout and shared scales.
*/
  facet(
    _?: string | ((d: DataPoint, i: number) => unknown) | false,
  ): this | ((d: DataPoint, i: number) => unknown) | undefined {
    if (!arguments.length) return this.schema.facet;
    this.schema.facet = coerceFacet(_);
    return this;
  }

  /**
      Configuration for small multiples (see `facet`), merged into the current config:
      - `columns` / `rows`: the grid's shape. Chosen by default to make the panels as large as the chart's shape allows.
      - `padding`: the space between panels, in pixels (default `20`).
      - `sort`: panel order — `"ascending"` (default), `"descending"`, `"data"` (first appearance), a comparator over facet values, or an Array of values.
      - `scales`: `"shared"` (default) gives every panel of a chart with axes the same x/y domains; `"independent"` fits each panel to its own rows. Funnel defaults to `"independent"` (each panel sized to its own widest stage); `"shared"` sizes every panel against the widest stage across all panels. PolarArea and RadialBar default to `"independent"` (each panel's rings and ticks fit its own values); `"shared"` gives every panel the same value domain.
      - `axes`: with shared scales, `"outer"` (default) labels the axes only along the grid's left and bottom edges; `"all"` labels every panel. An object sets each axis on its own, as in `{x: "all", y: "outer"}`: every panel labels its x axis, only the left column labels its y axis, and the panels' plot areas line up. BumpChart defaults to `"all"`, and Marimekko labels its categories on every panel and its 0–100% share axis only along the outer edge, even with independent scales.
      - `title`: a `(value, data) => string` function for each panel's title, or `false` to hide panel titles.
      - `titleConfig`: TextBox config for the panel titles (`fontSize`, `fontWeight`, `fontColor`, `textAnchor`, `padding`, …).
*/
  facetConfig(): FacetConfig;
  facetConfig(_: FacetConfig): this;
  facetConfig(_?: FacetConfig): this | FacetConfig {
    if (!arguments.length) return this.schema.facetConfig;
    this.schema.facetConfig = mergeConfigBag(this, "facetConfig", _);
    return this;
  }

  /**
      The font family used throughout the visualization.
*/
  fontFamily(_?: string | string[]): this | string | string[] {
    if (arguments.length) {
      const labelConfig = {fontFamily: _};

      const axisConfig = {titleConfig: labelConfig, shapeConfig: {labelConfig}};

      this.shapeConfig({labelConfig});
      this.colorScaleConfig({axisConfig});

      ["axis", "column", "row", "timeline", "x", "y", "x2", "y2"].forEach(
        (axis: string) => {
          const method = `${axis}Config`;
          if (this[method]) this[method](axisConfig);
        },
      );
      ["back", "title", "total", "subtitle"].forEach((label: string) => {
        const method = `${label}Config`;
        if (this[method]) this[method](labelConfig);
      });

      this.tooltipConfig({
        tooltipStyle: {"font-family": fontFamilyStringify(_!)},
      });

      this.schema.fontFamily = _;
      return this;
    }
    return this.schema.fontFamily;
  }

  /**
      Defines the mapping between data and shape. The value can be a String matching a key in each data point (default is "id"), or an accessor Function that returns a unique value for each data point. Additionally, an Array of these values may be provided if the visualization supports nested hierarchies.
*/
  groupBy(
    _?:
      | string
      | ((d: DataPoint, i: number) => DataPoint[keyof DataPoint])
      | (string | ((d: DataPoint, i: number) => DataPoint[keyof DataPoint]))[],
  ): this | ((d: DataPoint, i: number) => DataPoint[keyof DataPoint])[] {
    if (!arguments.length) return this.schema.groupBy;
    this._groupByRaw = _;
    const arr: (
      string | ((d: DataPoint, i: number) => DataPoint[keyof DataPoint])
    )[] = _ instanceof Array ? _ : [_!];
    return (
      (this.schema.groupBy = arr.map(
        (
          k: string | ((d: DataPoint, i: number) => DataPoint[keyof DataPoint]),
        ) => {
          if (typeof k === "function") return k;
          else {
            if (!this.schema.aggs[k]) {
              this.schema.aggs[k] = (
                a: DataPoint[],
                c: (d: DataPoint) => DataPoint[keyof DataPoint],
              ) => {
                const v = unique(a.map(c));
                return v.length === 1 ? v[0] : v;
              };
            }
            return accessor(k);
          }
        },
      )),
      this
    );
  }

  /**
      The hover callback function for highlighting shapes on mouseover.
*/
  hover(_?: ((d: DataPoint, i: number) => boolean) | false): this {
    let hoverFunction = (this._hover = _);

    if (this.schema.shapeConfig.hoverOpacity !== 1 && _ !== undefined) {
      if (typeof _ === "function") {
        const shapeData: DataPoint[] = [
          ...(this._filteredData ?? []),
          ...(this._legendClass.data() ?? []),
        ];
        const activeData = shapeData.filter(_ as (d: DataPoint) => boolean);

        // Every id prefix of each matching row (chart data and legend
        // entries), in a Set for O(1) membership on every repaint.
        const activeIds = new Set<string>();
        (activeData.map(this._ids) as string[][]).forEach((ids: string[]) => {
          for (let x = 1; x <= ids.length; x++) {
            activeIds.add(JSON.stringify(ids.slice(0, x)));
          }
        });

        // A group row (see `groupRow.ts`) matches by its ids down to its
        // own level, so it stays bright while any row in its group does.
        if (activeIds.size)
          hoverFunction = (d: DataPoint, i: number) => {
            const ids = this._ids(d, i);
            const depth = groupDepthOf(d);
            return activeIds.has(
              JSON.stringify(
                depth === undefined ? ids : ids.slice(0, depth + 1),
              ),
            );
          };
      }

      if (this.schema.legend) this._legendClass.hover(hoverFunction);
    }

    // Repaint so the scene's interaction-opacity pass re-reads `_hover` and
    // dims the non-matching nodes (or restores them when `_` is `false`). Also
    // repaint for a colorScale-bucket hover even when per-shape hover is off
    // (`hoverOpacity: 1`, e.g. Geomap): the bucket highlight is applied by that
    // same pass, so without a repaint the map would never re-compose. Coalesced
    // to one paint per frame so a fast pointer sweep doesn't saturate the main
    // thread.
    if (
      this._sceneRenderer &&
      _ !== undefined &&
      (shapeHoverEnabled(this) || this._hoverBucket)
    )
      this._scheduleSceneRepaint();

    broadcastLink(this as unknown as VizInstance, "hover", _);
    return this;
  }

  /**
      Persistently emphasizes the data points matching the given predicate: the
      matching marks keep their color while every other mark is de-emphasized to
      a neutral gray (the "emphasis" form — highlight one series, gray the rest).
      Unlike `hover`/`active` (transient, opacity-based), `highlight` is a
      standing state that survives pointer movement. Pass `false` to clear it.
*/
  highlight(
    _?: ((d: DataPoint, i: number) => boolean) | false,
  ): this | ((d: DataPoint, i: number) => boolean) | false | undefined {
    if (!arguments.length) return this._highlight;
    this._highlight = _;
    // Scene-rendered charts express de-emphasis via the scene's
    // interaction-opacity pass, so repaint to apply/clear the gray treatment.
    if (this._sceneRenderer) this._scheduleSceneRepaint();
    broadcastLink(this as unknown as VizInstance, "highlight", _);
    return this;
  }

  /**
      The SVG container element as a d3 selector or DOM element. Defaults to `undefined`.
*/
  select(_?: string | HTMLElement): this | ReturnType<typeof select> {
    return arguments.length
      ? ((this._select = select(_! as string)), this)
      : this._select;
  }

  /**
      Configuration object with key/value pairs applied as method calls on each shape.
*/
  shapeConfig(): D3plusConfig;
  shapeConfig(_: D3plusConfig): this;
  shapeConfig(_?: D3plusConfig): this | D3plusConfig {
    if (!arguments.length) return this.schema.shapeConfig;
    if (isPlainObject(_)) validateShapeConfig(this.constructor.name, _);
    this.schema.shapeConfig = mergeConfigBag(this, "shapeConfig", _);
    return this;
  }

  /**
      The threshold value for bucketing small data points together, as a
      share of the total. On a stacked Plot, the series whose summed value
      across every position is under that share of the whole chart's total
      merge into one series, stacked on top. Off (`0`) by default on Plot
      charts.
*/
  threshold(
    _?: number | ((data: DataPoint[]) => number),
  ): this | number | ((data: DataPoint[]) => number) {
    if (arguments.length) {
      if (typeof _ === "function") {
        this.schema.threshold = _;
      } else if (isFinite(_!) && !isNaN(_!)) {
        this.schema.threshold = constant(_! * 1);
      }
      return this;
    } else return this.schema.threshold;
  }

  /**
      Accessor for the value used in the threshold algorithm. A stacked Plot
      defaults to its stacked value.
    @param key The data key used to group values for thresholding.
*/
  thresholdKey(
    key?: string | ((d: DataPoint, i: number) => DataPoint[keyof DataPoint]),
  ): this | string | ((d: DataPoint, i: number) => DataPoint[keyof DataPoint]) {
    if (arguments.length) {
      if (typeof key === "function") {
        this.schema.thresholdKey = key;
      } else {
        this.schema.thresholdKey = accessor(key!);
      }
      return this;
    } else return this.schema.thresholdKey;
  }

  /**
      Accessor function or string key for the time dimension of each data point.
*/
  time(
    _?:
      | string
      | ((d: DataPoint, i: number) => DataPoint[keyof DataPoint])
      | false,
  ):
    | this
    | string
    | ((d: DataPoint, i: number) => DataPoint[keyof DataPoint])
    | false {
    if (arguments.length) {
      if (typeof _ === "function") {
        this.schema.time = _;
      } else if (_) {
        this.schema.time = accessor(_);
        if (!this.schema.aggs[_]) {
          this.schema.aggs[_] = (
            a: DataPoint[],
            c: (d: DataPoint) => DataPoint[keyof DataPoint],
          ) => {
            const v = unique(a.map(c));
            return v.length === 1 ? v[0] : v;
          };
        }
        if (
          this._userTime &&
          JSON.stringify(_) !== JSON.stringify(this._userTime)
        ) {
          this.schema.timeFilter = false;
          this._timelineSelection = false;
        }
        this._userTime = _;
      } else {
        this.schema.time = undefined;
        this._userTime = undefined;
        this.schema.timeFilter = false;
        this._timelineSelection = false;
      }
      return this;
    } else return this.schema.time;
  }

  /**
      The starting time or range for the timeline. Can be a single Date/String, or an Array of 2 values representing the min and max.
*/
  timelineDefault(_?: Date | string | (Date | string)[]): this | Date[] {
    if (arguments.length) {
      if (!(_ instanceof Array)) _ = [_!, _!];
      this.schema.timelineDefault = (_ as (Date | string)[])
        .map(d => date(d as string | number | false))
        .filter((d): d is Date => d !== false);
      return this;
    } else return this.schema.timelineDefault;
  }

  /**
      Accessor function or string key for the total value displayed in the visualization.
*/
  total(
    _?: boolean | string | ((d: DataPoint, i: number) => number),
  ): this | boolean | string | ((d: DataPoint, i: number) => number) {
    if (arguments.length) {
      if (typeof _ === "function") this.schema.total = _;
      else if (_) this.schema.total = accessor(_ as string);
      else this.schema.total = false;
      return this;
    } else return this.schema.total;
  }
}

resolvesReset(VizBase.prototype, "facetConfig", "shapeConfig");

export default VizBase;
/* eslint-enable @typescript-eslint/no-unsafe-declaration-merging */
