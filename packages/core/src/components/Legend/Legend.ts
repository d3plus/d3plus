import {max, sum} from "d3-array";
import {select} from "d3-selection";

import type {DataPoint} from "@d3plus/data";
import {assign, elem, rtl as detectRTL} from "@d3plus/dom";
import type {D3Selection} from "@d3plus/dom";
import type {GroupNode, SceneNode, Transform} from "@d3plus/render";

import {TextBox} from "../index.js";
import {accessor, BaseClass, constant, paintComponentScene} from "../../utils/index.js";
import {installFluent} from "../../fluent.js";
import type {ConfigField} from "../../fluent.js";

import {buildLegendShapeConfig} from "./legendConfig.js";
import {
  computeLegendBounds,
  computeLegendLineData,
  measureLegendTitle,
  renderLegendShapes,
  renderLegendTitle,
  wrapLegendRows,
} from "./legendRender.js";

/** Legend's fluent accessor schema. Config storage lives on `this.schema.<key>`. */
const legendSchema: ConfigField[] = [
  {key: "align", coerce: "identity", default: "center"},
  {key: "direction", coerce: "identity", default: "row"},
  {key: "duration", coerce: "identity", default: 600},
  {key: "height", coerce: "identity", default: 200},
  {key: "id", coerce: "identity", default: accessor("id")},
  {key: "label", coerce: "const", default: accessor("id")},
  {key: "padding", coerce: "identity", default: 5},
  {key: "renderMode", coerce: "identity", default: "full"},
  {key: "shape", coerce: "const", default: constant("Rect")},
  {key: "title", coerce: "identity"},
  {key: "verticalAlign", coerce: "identity", default: "middle"},
  {key: "width", coerce: "identity", default: 400},
];

/**
    Creates an SVG legend based on an array of data.
*/
export default class Legend extends BaseClass {
  // installFluent generates the config accessors (align, width, …) at
  // runtime; the index signature lets callers reach them through the type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  _titleClass: TextBox;
  _data: DataPoint[];
  _lineData: Record<string, unknown>[];
  _outerBounds: Record<string, number>;
  _select!: D3Selection;
  _shapes: unknown[];
  _rtl: boolean;
  _group!: D3Selection;
  _titleGroup!: D3Selection;
  _shapeGroup!: D3Selection;
  _titleHeight: number;
  _titleWidth: number;
  _wrapLines: (() => void) | undefined;
  _wrapRows: (() => void) | undefined;
  // Standalone scene renderer (used when rendered on its own, not inside a
  // Viz). Reused across re-renders by paintComponentScene().
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _sceneRenderer?: any;

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
*/
  constructor() {
    super();
    installFluent(this, legendSchema);

    this._titleClass = new TextBox();

    this._data = [];
    this._lineData = [];
    this._outerBounds = {width: 0, height: 0, x: 0, y: 0};
    this._shapes = [];
    this.schema.shapeConfig = buildLegendShapeConfig(this);
    this.schema.titleConfig = {
      fontSize: 12,
    };
    this._rtl = false;
    this._titleHeight = 0;
    this._titleWidth = 0;
  }

  /**
    @param key The configuration key.
    @param d The data point.
    @param i The data index.
    @private
  */
  _fetchConfig(key: string, d: DataPoint, i: number): unknown {
    const labelConfig = this.schema.shapeConfig.labelConfig as Record<string, unknown> | undefined;
    const val =
      this.schema.shapeConfig[key] !== undefined
        ? this.schema.shapeConfig[key]
        : labelConfig?.[key];
    if (!val && key === "lineHeight")
      return (this._fetchConfig("fontSize", d, i) as number) * 1.4;
    return typeof val === "function" ? (val as (d: DataPoint, i: number) => unknown)(d, i) : val;
  }

  /**
    @param row The legend row data.
    @private
  */
  _rowHeight(row: Record<string, unknown>[]): number {
    return (
      max(
        row
          .map((d: Record<string, unknown>) => d.height as number)
          .concat(row.map((d: Record<string, unknown>) => d.shapeHeight as number)),
      )! + this.schema.padding
    );
  }

  /**
    @param row The legend row data.
    @private
  */
  _rowWidth(row: Record<string, unknown>[]): number {
    return sum(
      row.map((d: Record<string, unknown>, i: number) => {
        const p = this.schema.padding * (i === row.length - 1 ? 0 : d.width ? 2 : 1);
        return (d.shapeWidth as number) + (d.width as number) + p;
      }),
    );
  }

  /**
      Produces a backend-agnostic scene graph for this legend with no DOM dependency:
      the title is composed from its TextBox.toScene(), and each swatch group is
      composed from the stored Shape instances' toScene() (positions resolve through
      the x/y accessors against this._lineData / this._outerBounds).
*/
  toScene(): GroupNode {
    const children: SceneNode[] = [];

    if (
      this._titleClass &&
      typeof (this._titleClass as {toScene?: unknown}).toScene === "function" &&
      (this._titleClass as {_data?: unknown[]})._data &&
      ((this._titleClass as {_data?: unknown[]})._data as unknown[]).length
    ) {
      children.push((this._titleClass as {toScene: () => GroupNode}).toScene());
    }

    (this._shapes || []).forEach((shape: unknown) => {
      const s = shape as {
        toScene?: () => GroupNode;
        _data?: unknown[];
        _labelClass?: {toScene?: () => GroupNode; _data?: unknown[]};
      };
      if (s && typeof s.toScene === "function" && s._data && s._data.length) {
        children.push(s.toScene());
        // Shape.toScene no longer includes labels (collectComputed is
        // the canonical aggregator); legend composes labels per shape
        // here so swatch text still appears.
        const lbl = s._labelClass;
        if (lbl && typeof lbl.toScene === "function" && lbl._data && lbl._data.length) {
          const lblScene = lbl.toScene();
          if (lblScene && Array.isArray(lblScene.children))
            children.push(...(lblScene.children as SceneNode[]));
        }
      }
    });

    // Preserve the placement of the legend container the caller positioned.
    let transform: Transform | undefined;
    const node =
      this._select && typeof this._select.node === "function"
        ? (this._select.node() as Element | null)
        : null;
    if (node && typeof node.getAttribute === "function") {
      const attr = node.getAttribute("transform");
      if (attr) {
        const m = /translate\(\s*([-\d.eE]+)[\s,]+([-\d.eE]+)/.exec(attr);
        if (m) transform = {x: Number(m[1]), y: Number(m[2])};
      }
    }

    return {
      type: "group",
      key: `Legend-${this._uuid.slice(0, 8)}`,
      ...(transform ? {transform} : {}),
      children,
    };
  }

  /**
      Renders the current Legend to the page.
    @param callback Optional callback invoked after rendering completes.
*/
  render(callback?: (...args: unknown[]) => unknown): this {
    // Standalone full-render fallback: mount into a <div> appended to <body> so
    // `paintComponentScene` creates the single <svg> inside it — mounting the
    // renderer into an <svg> container would nest a second one. Skipped in
    // compute mode, where the caller reads `toScene()` and no DOM is created.
    if (this._select === void 0 && this.schema.renderMode !== "compute")
      this.select(select("body").append("div").node());

    // Legend Container <g> Groups
    this._group = elem("g.d3plus-Legend", {parent: this._select});
    this._titleGroup = elem("g.d3plus-Legend-title", {parent: this._group});
    this._shapeGroup = elem("g.d3plus-Legend-shape", {parent: this._group});

    measureLegendTitle(this);
    const availableHeight = this.schema.height - this._titleHeight;

    this._lineData = computeLegendLineData(this, availableHeight);

    let spaceNeeded = this._rowWidth(this._lineData);
    const availableWidth = this.schema.width - this.schema.padding * 2;
    if (this.schema.direction === "column" || spaceNeeded > availableWidth)
      spaceNeeded = wrapLegendRows(this, availableWidth, availableHeight, spaceNeeded);

    computeLegendBounds(this, spaceNeeded);
    renderLegendTitle(this);
    renderLegendShapes(this);

    // Standalone render: paint the scene into the user's `_select`. Inside a
    // Viz the legend runs in compute mode and the Viz composes its toScene().
    if (this.schema.renderMode !== "compute") paintComponentScene(this);

    if (callback) setTimeout(callback, this.schema.duration + 100);

    return this;
  }

  /**
      The active method for all shapes.
*/
  active(_: unknown): this {
    this._shapes.forEach((s: unknown) =>
      (s as Record<string, (...args: unknown[]) => unknown>).active(_),
    );
    return this;
  }

  /**
      The data array used to create shapes. A shape key will be drawn for each object in the array.
*/
  data(): DataPoint[];
  data(_: DataPoint[]): this;
  data(_?: DataPoint[]): DataPoint[] | this {
    return arguments.length ? ((this._data = _!), this) : this._data;
  }

  /**
      The hover method for all shapes.
*/
  hover(_: unknown): this {
    this._shapes.forEach((s: unknown) =>
      (s as Record<string, (...args: unknown[]) => unknown>).hover(_),
    );
    return this;
  }

  /**
      Returns the outer bounds of the legend content. Must be called after rendering.
      @example
{"width": 180, "height": 24, "x": 10, "y": 20}
*/
  outerBounds(): Record<string, number> {
    return this._outerBounds;
  }

  /**
      The SVG container element as a d3 selector or DOM element.
*/
  select(): D3Selection;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  select(_: any): this;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  select(_?: any): D3Selection | this {
    if (arguments.length) {
      this._select = select(_);
      this._rtl = detectRTL();
      return this;
    }
    return this._select;
  }

  /**
      Methods that correspond to the key/value pairs for each shape.
*/
  shapeConfig(): Record<string, unknown>;
  shapeConfig(_: Record<string, unknown>): this;
  shapeConfig(_?: Record<string, unknown>): Record<string, unknown> | this {
    return arguments.length
      ? ((this.schema.shapeConfig = assign(this.schema.shapeConfig, _!)), this)
      : this.schema.shapeConfig;
  }

  /**
      Title configuration of the legend.
*/
  titleConfig(): Record<string, unknown>;
  titleConfig(_: Record<string, unknown>): this;
  titleConfig(_?: Record<string, unknown>): Record<string, unknown> | this {
    return arguments.length
      ? ((this.schema.titleConfig = assign(this.schema.titleConfig, _!)), this)
      : this.schema.titleConfig;
  }
}
