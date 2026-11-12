import {max} from "d3-array";
import {select} from "d3-selection";
import {transition} from "d3-transition";

import {elem} from "@d3plus/dom";
import type {D3Selection} from "@d3plus/dom";
import {formatAbbreviate} from "@d3plus/format";

import type {DataPoint} from "@d3plus/data";
import type {GroupNode, SceneNode, Transform} from "@d3plus/render";
import type {SvgRenderer} from "@d3plus/render";

import {Axis, TextBox} from "../index.js";
import {Rect} from "../../shapes/index.js";
import {accessor, BaseClass, paintComponentScene} from "../../utils/index.js";
import type {D3Scale} from "../../utils/index.js";
import {installFluent, mergeConfigBag, resolvesReset} from "../../fluent.js";
import type {ConfigField} from "../../fluent.js";
import {inkText} from "../../utils/themeInk.js";

import Legend from "../Legend/Legend.js";
import {inertAxis} from "../Axis/axisTooltipTargets.js";
import {formatYear, isYearLike} from "../Axis/yearValues.js";
import {bucketBounds, labelValue} from "./bucketBounds.js";
import {computeColorScale} from "./colorScaleScale.js";
import {renderGradient, renderLegendVariant} from "./colorScaleRender.js";
import {isBucketScale} from "./colorScaleType.js";
import type {ColorScaleType} from "./colorScaleType.js";
import {addHoverMark, hoverMarkDefaults} from "./colorScaleHoverMark.js";
import {renderBivariate} from "./bivariateRender.js";
import type {ColorScaleBarGeometry} from "./colorScaleHoverMark.js";
import type {ColorScaleGroups} from "./colorScaleRender.js";

/** ColorScale's fluent accessor schema. Config storage lives on `this.schema.<key>`. */
const colorScaleSchema: ConfigField[] = [
  {key: "align", coerce: "identity", default: "middle"},
  // A bivariate scale reads a pair of values from each row and draws its
  // grid of colors as a diamond key (see bivariateRender.ts).
  {key: "bivariate", coerce: "identity", default: false},
  {key: "bivariateBuckets", coerce: "identity", default: 3},
  // No default grid: an unset one paints Stevens' blue–red scheme.
  {key: "bivariateColors", coerce: "identity"},
  {key: "bivariateLabels", coerce: "identity"},
  {key: "buckets", coerce: "identity", default: 5},
  {key: "bucketAxis", coerce: "identity", default: false},
  {key: "bucketFormat", coerce: "identity"},
  {
    key: "bucketJoiner",
    coerce: "identity",
    default: (a: string, b: string): string =>
      a !== b ? `${a} - ${b}` : `${a}`,
  },
  {key: "centered", coerce: "identity", default: true},
  // No default palette: an unset `color` falls through to the single-hue
  // (colorMax / colorMin) ramp or the diverging (min↔mid↔max) construction,
  // so magnitude reads as one hue getting darker rather than a multi-hue ramp.
  {key: "color", coerce: "identity"},
  // Unset poles fall back to `colorDefaults` at draw time: `sequential` (blue)
  // high, `light` midpoint, `off` (red) low — warm/cool poles that stay
  // distinct under color-vision deficiency. A dark or custom theme supplies
  // its `colorScale` tokens instead.
  {key: "colorMax", coerce: "identity"},
  {key: "colorMid", coerce: "identity"},
  {key: "colorMin", coerce: "identity"},
  {key: "domain", coerce: "identity"},
  {key: "duration", coerce: "identity", default: 600},
  {key: "height", coerce: "identity", default: 200},
  {key: "hoverMark", coerce: "identity", default: true},
  {key: "hoverMarkConfig", merge: true, factory: hoverMarkDefaults},
  {key: "midpoint", coerce: "identity", default: 0},
  // Holds a single-hue light-theme ramp's palest step darker (colorRamp's
  // `ordinal` option), so the lowest values still read as thin lines.
  {key: "ordinalRamp", coerce: "identity", default: false},
  {key: "orient", coerce: "identity", default: "bottom"},
  {key: "padding", coerce: "identity", default: 5},
  {key: "renderMode", coerce: "identity", default: "full"},
  {key: "scale", coerce: "identity", default: "linear"},
  {key: "size", coerce: "identity", default: 10},
  {key: "value", coerce: "const", default: accessor("value")},
  {key: "width", coerce: "identity", default: 400},
];

/**
    Creates an SVG color scale based on an array of data.
*/
export default class ColorScale extends BaseClass {
  static readonly _displayName: string = "ColorScale";
  // installFluent generates the config accessors (align, buckets, …) at
  // runtime; the index signature lets callers reach them through the type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  _select!: D3Selection;
  _axisClass: Axis;
  _axisTest: Axis;
  _colorScale?: D3Scale<string>;
  _data: DataPoint[];
  _group!: D3Selection;
  _labelClass: TextBox;
  _labelMin: string | undefined;
  _labelMax: string | undefined;
  _legendClass: Legend;
  _outerBounds: Record<string, number>;
  _rectClass: Rect;
  /** The scale the last render built, with a `scale` function resolved. */
  _scaleType: ColorScaleType = "linear";
  /** Where the color bar sits, set when the bar variant renders (see colorScaleHoverMark). */
  _barGeometry?: ColorScaleBarGeometry;
  /** The value marked on the scale, set with `hover()`: a pair of values on a bivariate scale. */
  _hoverValue?: number | [number, number] | false;
  /** The names a chart gives a bivariate scale's two variables (its field names), under `bivariateLabels`. */
  _bivariateFields?: string[];
  /** The bivariate key's nodes, laid out by the last render. */
  _bivariateNodes?: SceneNode[];
  /** Smooth-gradient fill token (`gradient:<json>`), set by renderGradientStops. */
  _gradientFill?: string;
  // Standalone scene renderer (used when rendered on its own, not inside a
  // Viz). Reused across re-renders by paintComponentScene().
  _sceneRenderer?: SvgRenderer;

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
*/
  constructor() {
    super();
    installFluent(this, colorScaleSchema);

    this._axisClass = new Axis();
    this.schema.axisConfig = {
      gridSize: 0,
    };
    this._axisTest = new Axis();
    this.schema.bucketFormat = (
      tick: number,
      i: number,
      ticks: number[],
      allValues: number[],
    ): string => {
      const format = (
        this.schema.axisConfig.tickFormat
          ? this.schema.axisConfig.tickFormat
          : isYearLike(allValues)
            ? (v: number) => formatYear(v, this.schema.locale)
            : formatAbbreviate
      ) as (v: number | undefined) => string;

      const last = i === ticks.length - 1;
      if (tick === ticks[i + 1] || last) {
        const suffix = last && tick < max(allValues)! ? "+" : "";
        return `${format(labelValue(tick, allValues))}${suffix}`;
      }
      const [lower, upper] = bucketBounds(tick, i, ticks, allValues, format);
      return this.schema.bucketJoiner(format(lower), format(upper));
    };
    this._data = [];
    this._labelClass = new TextBox();
    this.schema.labelConfig = {
      fontColor: () => inkText(this),
      fontSize: 12,
    };
    this._legendClass = new Legend();
    this.schema.legendConfig = {
      shapeConfig: {
        stroke: () => this.schema.colorDefaults.dark,
        strokeWidth: 1,
      },
    };
    this._outerBounds = {width: 0, height: 0, x: 0, y: 0};
    this._rectClass = new Rect().parent(
      this as unknown as Record<string, unknown>,
    );
    this.schema.rectConfig = {
      stroke: "#999",
      strokeWidth: 1,
    };
  }

  /**
      Renders the current ColorScale to the page.
    @param callback Optional callback invoked after rendering completes.
*/
  render(callback?: (...args: unknown[]) => unknown): this {
    // Standalone full-render fallback: mount into a <div> appended to <body> so
    // `paintComponentScene` creates the single <svg> inside it — mounting the
    // renderer into an <svg> container would nest a second one. Skipped in
    // compute mode, where the caller reads `toScene()` and no DOM is created.
    if (this._select === void 0 && this.schema.renderMode !== "compute")
      this.select(
        select("body").append("div").node() as unknown as HTMLElement,
      );

    // Shape <g> Group
    this._group = elem("g.d3plus-ColorScale", {parent: this._select});

    const bivariate = Boolean(this.schema.bivariate);
    this._bivariateNodes = bivariate ? renderBivariate(this).nodes : undefined;
    const compute = bivariate ? undefined : computeColorScale(this);

    const gradient =
      !bivariate && (this.schema.bucketAxis || !isBucketScale(compute!.scale));
    const t = transition().duration(this.schema.duration);
    const groupParams: Record<string, unknown> = {
      enter: {opacity: 0},
      exit: {opacity: 0},
      parent: this._group,
      transition: t,
      update: {opacity: 1},
    };
    const labelGroup = elem(
      "g.d3plus-ColorScale-labels",
      Object.assign({condition: gradient}, groupParams),
    );
    const rectGroup = elem(
      "g.d3plus-ColorScale-Rect",
      Object.assign({condition: gradient}, groupParams),
    );
    const legendGroup = elem(
      "g.d3plus-ColorScale-legend",
      Object.assign({condition: !gradient && !bivariate}, groupParams),
    );

    const groups: ColorScaleGroups = {
      labelGroup,
      rectGroup,
      legendGroup,
      groupParams,
      gradient,
    };

    if (compute) {
      if (gradient) renderGradient(this, compute, groups);
      else renderLegendVariant(this, compute, groups);
    }

    // Standalone render: paint the scene into the user's `_select`. Inside a
    // Viz the color scale runs in compute mode and the Viz composes its
    // toScene().
    if (this.schema.renderMode !== "compute") paintComponentScene(this);

    if (callback) setTimeout(callback, this.schema.duration + 100);

    return this;
  }

  /**
      Produces a backend-agnostic scene graph for this ColorScale with no DOM
      dependency. The discrete variant (jenks/buckets/quantile) delegates to the
      internal Legend's toScene(); the gradient variant composes the Rect, Axis
      (as chrome, see `inertAxis`), and label TextBox scenes. The scaleGroup's
      translate (set by the chart's colorScale feature on
      `g.d3plus-viz-colorScale`) is read off `_select` so the content lands at
      its on-screen position.

      A smooth (non-bucketed) gradient paints its Rect with a `gradient:<json>`
      fill token (see renderGradientStops); the backend materializes it into a
      `<linearGradient>` (SVG) or a CanvasGradient (Canvas). Bucketed gradients
      and the discrete variant use concrete per-bucket fills.
  */
  toScene(): GroupNode {
    const children: SceneNode[] = [];
    const gradient = this.schema.bucketAxis || !isBucketScale(this._scaleType);

    const pushScene = (
      cls: {toScene?: () => GroupNode} | undefined,
      finish: (scene: SceneNode) => SceneNode = scene => scene,
    ): void => {
      if (cls && typeof cls.toScene === "function") {
        const s = cls.toScene();
        if (s) children.push(finish(s));
      }
    };

    if (this._bivariateNodes) {
      children.push(...this._bivariateNodes);
    } else if (gradient) {
      pushScene(this._rectClass as unknown as {toScene?: () => GroupNode});
      pushScene(
        this._axisClass as unknown as {toScene?: () => GroupNode},
        inertAxis,
      );
      pushScene(this._labelClass as unknown as {toScene?: () => GroupNode});
    } else {
      pushScene(this._legendClass as unknown as {toScene?: () => GroupNode});
    }

    // Preserve the placement of the scaleGroup the chart's colorScale feature
    // positioned (translate on `g.d3plus-viz-colorScale`).
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

    const group: GroupNode = {
      type: "group",
      key: `ColorScale-${this._uuid.slice(0, 8)}`,
      ...(transform ? {transform} : {}),
      children,
    };
    if (!this._bivariateNodes) addHoverMark(this, group);
    return group;
  }

  /**
      The ColorScale is constructed by combining an Axis for the ticks/labels and a Rect for the actual color box (or multiple boxes, as in a jenks scale). Because of this, there are separate configs for the Axis class used to display the text (axisConfig) and the Rect class used to draw the color breaks (rectConfig). This method acts as a pass-through to the config method of the Axis.
*/
  axisConfig(): Record<string, unknown>;
  axisConfig(_: Record<string, unknown>): this;
  axisConfig(_?: Record<string, unknown>): unknown {
    return arguments.length
      ? ((this.schema.axisConfig = mergeConfigBag(this, "axisConfig", _)), this)
      : this.schema.axisConfig;
  }

  /**
      The data array used to create shapes. A shape key will be drawn for each object in the array.
*/
  data(): DataPoint[];
  data(_: DataPoint[]): this;
  data(_?: DataPoint[]): unknown {
    return arguments.length ? ((this._data = _!), this) : this._data;
  }

  /**
      Marks a value on the scale: an extra axis tick where the value falls on the color bar and a badge reading it where that tick's label would sit, plus an outline around its bucket on a bucketed bar (`bucketAxis`). A scale drawn as discrete swatches draws no mark, and a bivariate scale takes a pair of values. A chart sets this while one of its shapes is hovered. Pass `false` to clear it. Turned off with `hoverMark(false)`.
*/
  hover(): number | [number, number] | false | undefined;
  hover(_: number | [number, number] | false): this;
  hover(_?: number | [number, number] | false): unknown {
    return arguments.length ? ((this._hoverValue = _), this) : this._hoverValue;
  }

  /**
      A pass-through for the TextBox class used to style the labelMin and labelMax text.
*/
  labelConfig(): Record<string, unknown>;
  labelConfig(_: Record<string, unknown>): this;
  labelConfig(_?: Record<string, unknown>): unknown {
    return arguments.length
      ? ((this.schema.labelConfig = mergeConfigBag(this, "labelConfig", _)),
        this)
      : this.schema.labelConfig;
  }

  /**
      Defines a text label to be displayed off of the end of the minimum point in the scale (currently only available in horizontal orientation).
*/
  labelMin(): string | undefined;
  labelMin(_: string): this;
  labelMin(_?: string): unknown {
    return arguments.length ? ((this._labelMin = _), this) : this._labelMin;
  }

  /**
      Defines a text label to be displayed off of the end of the maximum point in the scale (currently only available in horizontal orientation).
*/
  labelMax(): string | undefined;
  labelMax(_: string): this;
  labelMax(_?: string): unknown {
    return arguments.length ? ((this._labelMax = _), this) : this._labelMax;
  }

  /**
      Configuration passed to the Legend that draws the scale when its values are rendered as discrete swatches instead of a continuous bar (for example a categorical or buckets scale), acting as a pass-through to that Legend's config method.
*/
  legendConfig(): Record<string, unknown>;
  legendConfig(_: Record<string, unknown>): this;
  legendConfig(_?: Record<string, unknown>): unknown {
    return arguments.length
      ? ((this.schema.legendConfig = mergeConfigBag(this, "legendConfig", _)),
        this)
      : this.schema.legendConfig;
  }

  /**
      Returns the outer bounds of the ColorScale content. Must be called after rendering.
      @example
{"width": 180, "height": 24, "x": 10, "y": 20}
*/
  outerBounds(): Record<string, number> {
    return this._outerBounds;
  }

  /**
      The ColorScale is constructed by combining an Axis for the ticks/labels and a Rect for the actual color box (or multiple boxes, as in a jenks scale). Because of this, there are separate configs for the Axis class used to display the text (axisConfig) and the Rect class used to draw the color breaks (rectConfig). This method acts as a pass-through to the config method of the Rect.
*/
  rectConfig(): Record<string, unknown>;
  rectConfig(_: Record<string, unknown>): this;
  rectConfig(_?: Record<string, unknown>): unknown {
    return arguments.length
      ? ((this.schema.rectConfig = mergeConfigBag(this, "rectConfig", _)), this)
      : this.schema.rectConfig;
  }

  /**
      The SVG container element for this visualization. 3 selector or DOM element.
*/
  select(): D3Selection;
  select(_: string | HTMLElement): this;
  select(_?: string | HTMLElement): unknown {
    return arguments.length
      ? ((this._select = select(_ as never) as unknown as D3Selection), this)
      : this._select;
  }
}

resolvesReset(
  ColorScale.prototype,
  "axisConfig",
  "labelConfig",
  "legendConfig",
  "rectConfig",
);
