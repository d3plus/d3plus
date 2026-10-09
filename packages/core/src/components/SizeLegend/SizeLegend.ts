import {select} from "d3-selection";

import {colorDefaults} from "@d3plus/color";
import {formatAbbreviate} from "@d3plus/format";
import type {D3Selection} from "@d3plus/dom";
import type {GroupNode, SceneNode, SvgRenderer} from "@d3plus/render";
import {fontFamily as defaultFontFamily, fontFamilyStringify} from "@d3plus/text";

import {BaseClass, paintComponentScene} from "../../utils/index.js";
import {installFluent, mergeConfigBag, resolvesReset} from "../../fluent.js";
import type {ConfigField} from "../../fluent.js";

import {computeSizeLegend, emptySizeLegendLayout} from "./sizeLegendLayout.js";
import type {SizeLegendLayout, SizeLegendScale, SizeLegendValues} from "./sizeLegendLayout.js";

/** Circle paint for the legend's nested circles. */
export interface SizeLegendShapeConfig {
  [key: string]: unknown;
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeOpacity?: number;
  strokeWidth?: number;
}

/** Paint for the leader lines running from each circle to its label. */
export interface SizeLegendLineConfig {
  stroke?: string;
  strokeDasharray?: number[];
  strokeOpacity?: number;
  strokeWidth?: number;
}

/** Font settings for the value labels and the title. */
export interface SizeLegendTextConfig {
  fontColor?: string;
  fontFamily?: string | string[];
  fontSize?: number;
  fontWeight?: number | string;
}

const sizeLegendSchema: ConfigField[] = [
  {key: "labelPadding", coerce: "identity", default: 4},
  {key: "lineLength", coerce: "identity", default: 6},
  {key: "padding", coerce: "identity", default: 4},
  {key: "renderMode", coerce: "identity", default: "full"},
  {key: "scale", coerce: "identity"},
  {key: "tickFormat", coerce: "identity"},
  {key: "title", coerce: "identity"},
  {key: "values", coerce: "identity"},
];

const familyString = (f: string | string[] | undefined): string =>
  fontFamilyStringify(f === undefined ? defaultFontFamily : Array.isArray(f) ? f : [f]);

/**
    A nested-circle legend for a size scale: concentric circles sharing a
    bottom tangent, each labeled with the value its radius encodes.

    Charts that size marks by a `size` accessor (bubble plots, Geomap points,
    Network, Rings) draw one automatically in their bottom-right corner (see
    `sizeLegend` and `sizeLegendConfig` on the chart). On its own, give it
    any d3 continuous scale that maps values to pixel radii.
    @example
new SizeLegend()
  .scale(d3.scaleSqrt().domain([0, 1000]).range([2, 30]))
  .title("Population")
  .select("#container")
  .render();
*/
export default class SizeLegend extends BaseClass {
  // installFluent generates the config accessors at runtime; the index
  // signature lets callers reach them through the type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  _layout: SizeLegendLayout;
  /** Drops values whose circles would outgrow this radius; set by a zoomed chart. */
  _maxRadius?: number;
  _select?: D3Selection;
  _sceneRenderer?: SvgRenderer;

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
  */
  constructor() {
    super();
    installFluent(this, sizeLegendSchema);
    this._layout = emptySizeLegendLayout();
    this.schema.labelConfig = {fontColor: colorDefaults.dark, fontSize: 10};
    this.schema.lineConfig = {stroke: colorDefaults.dark, strokeOpacity: 0.5, strokeWidth: 1};
    this.schema.shapeConfig = {
      fill: colorDefaults.dark,
      fillOpacity: 0.05,
      stroke: colorDefaults.dark,
      strokeOpacity: 0.6,
      strokeWidth: 1,
    };
    this.schema.titleConfig = {fontColor: colorDefaults.dark, fontSize: 11, fontWeight: 600};
  }

  /**
      Font settings for the value labels: `fontColor`, `fontFamily`, `fontSize`. Merged into the current settings.
  */
  labelConfig(): SizeLegendTextConfig;
  labelConfig(_: SizeLegendTextConfig): this;
  labelConfig(_?: SizeLegendTextConfig): SizeLegendTextConfig | this {
    return arguments.length
      ? ((this.schema.labelConfig = mergeConfigBag(this, "labelConfig", _)), this)
      : this.schema.labelConfig;
  }

  /**
      Paint for the leader lines: `stroke`, `strokeWidth`, `strokeOpacity`, `strokeDasharray`. Merged into the current settings.
  */
  lineConfig(): SizeLegendLineConfig;
  lineConfig(_: SizeLegendLineConfig): this;
  lineConfig(_?: SizeLegendLineConfig): SizeLegendLineConfig | this {
    return arguments.length
      ? ((this.schema.lineConfig = mergeConfigBag(this, "lineConfig", _)), this)
      : this.schema.lineConfig;
  }

  /**
      Paint for the circles: `fill`, `fillOpacity`, `stroke`, `strokeWidth`, `strokeOpacity`. Merged into the current settings.
  */
  shapeConfig(): SizeLegendShapeConfig;
  shapeConfig(_: SizeLegendShapeConfig): this;
  shapeConfig(_?: SizeLegendShapeConfig): SizeLegendShapeConfig | this {
    return arguments.length
      ? ((this.schema.shapeConfig = mergeConfigBag(this, "shapeConfig", _)), this)
      : this.schema.shapeConfig;
  }

  /**
      Font settings for the title: `fontColor`, `fontFamily`, `fontSize`, `fontWeight`. Merged into the current settings.
  */
  titleConfig(): SizeLegendTextConfig;
  titleConfig(_: SizeLegendTextConfig): this;
  titleConfig(_?: SizeLegendTextConfig): SizeLegendTextConfig | this {
    return arguments.length
      ? ((this.schema.titleConfig = mergeConfigBag(this, "titleConfig", _)), this)
      : this.schema.titleConfig;
  }

  /**
      The container element for a standalone render, as a d3 selector or DOM element.
  */
  select(): D3Selection | undefined;
  select(_: string | HTMLElement | SVGElement): this;
  select(_?: string | HTMLElement | SVGElement): D3Selection | undefined | this {
    if (arguments.length) {
      this._select = select(_ as string) as unknown as D3Selection;
      return this;
    }
    return this._select;
  }

  /**
      Lays the legend out from the current config and returns the result
      (circles, leader lines, labels, overall width/height). Pure: reads no
      DOM, so a chart can measure the legend before it draws.
  */
  layout(): SizeLegendLayout {
    const scale = this.schema.scale as SizeLegendScale | undefined;
    if (!scale || typeof scale.domain !== "function") return (this._layout = emptySizeLegendLayout());
    const label = this.schema.labelConfig as SizeLegendTextConfig;
    const title = this.schema.titleConfig as SizeLegendTextConfig;
    const locale = this.schema.locale;
    this._layout = computeSizeLegend({
      scale,
      values: this.schema.values as SizeLegendValues | undefined,
      tickFormat: (this.schema.tickFormat as ((v: number) => string) | undefined) ??
        ((v: number) => formatAbbreviate(v, locale)),
      fontFamily: familyString(label.fontFamily),
      fontSize: label.fontSize ?? 10,
      title: this.schema.title as string | undefined,
      titleFontFamily: familyString(title.fontFamily),
      titleFontSize: title.fontSize ?? 11,
      titleFontWeight: title.fontWeight ?? 600,
      lineLength: this.schema.lineLength,
      labelPadding: this.schema.labelPadding,
      padding: this.schema.padding,
      maxRadius: this._maxRadius,
    });
    return this._layout;
  }

  /**
      The width and height of the last layout, in pixels.
  */
  outerBounds(): {width: number; height: number} {
    return {width: this._layout.width, height: this._layout.height};
  }

  /**
      Produces a backend-agnostic scene graph of the last layout, offset by the
      optional transform.
      @param x Horizontal offset of the legend's top-left corner.
      @param y Vertical offset of the legend's top-left corner.
  */
  toScene(x = 0, y = 0): GroupNode {
    const layout = this._layout;
    const shape = this.schema.shapeConfig as SizeLegendShapeConfig;
    const line = this.schema.lineConfig as SizeLegendLineConfig;
    const label = this.schema.labelConfig as SizeLegendTextConfig;
    const title = this.schema.titleConfig as SizeLegendTextConfig;
    const labelFamily = familyString(label.fontFamily);
    const children: SceneNode[] = [];

    layout.circles.forEach(c =>
      children.push({
        type: "circle",
        key: `circle-${c.value}`,
        interactive: false,
        cx: c.cx,
        cy: c.cy,
        r: c.r,
        paint: {...shape},
      }),
    );
    layout.lines.forEach(l =>
      children.push({
        type: "line",
        key: `line-${l.value}`,
        interactive: false,
        points: l.points,
        paint: {fill: "none", ...line},
      }),
    );
    layout.labels.forEach(l =>
      children.push({
        type: "text",
        key: `label-${l.value}`,
        interactive: false,
        x: 0,
        y: 0,
        transform: {x: l.x, y: l.y},
        lines: [{text: l.text, x: 0, y: 0, width: l.width}],
        font: {family: labelFamily, size: label.fontSize ?? 10, anchor: "start", baseline: "middle"},
        paint: {fill: label.fontColor},
      }),
    );
    if (layout.title)
      children.push({
        type: "text",
        key: "title",
        interactive: false,
        x: 0,
        y: 0,
        transform: {x: layout.title.x, y: layout.title.y},
        lines: [{text: layout.title.text, x: 0, y: 0, width: layout.title.width}],
        font: {
          family: familyString(title.fontFamily),
          size: title.fontSize ?? 11,
          weight: title.fontWeight ?? 600,
          anchor: "middle",
          baseline: "alphabetic",
        },
        paint: {fill: title.fontColor},
      });

    return {
      type: "group",
      key: `SizeLegend-${this._uuid.slice(0, 8)}`,
      transform: {x, y},
      children,
    };
  }

  /**
      Renders the legend. Standalone, it paints into the `select` container
      (sized to the legend); inside a chart (`renderMode("compute")`) it only
      lays out, and the chart composes `toScene()`.
      @param callback Optional callback invoked after rendering completes.
  */
  render(callback?: () => void): this {
    this.layout();
    if (this.schema.renderMode !== "compute") {
      if (this._select === undefined) this.select(select("body").append("div").node() as HTMLElement);
      this.schema.width = this._layout.width;
      this.schema.height = this._layout.height;
      paintComponentScene(this);
    }
    if (callback) setTimeout(callback, 0);
    return this;
  }
}

resolvesReset(SizeLegend.prototype, "labelConfig", "lineConfig", "shapeConfig", "titleConfig");
