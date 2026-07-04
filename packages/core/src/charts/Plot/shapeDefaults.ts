/**
    Plot's default `shapeConfig` object, extracted from the constructor.

    Invoked via `plotShapeDefaults.call(this)` so the function's `this` is
    the Plot instance: arrow-function config accessors capture it lexically,
    while the method-shorthand accessors (`labelBounds`, `fontColor`, …) keep
    their dynamic call-time `this` binding — identical to when this object
    lived inline in the constructor.
*/
import {max, min, range} from "d3-array";

import {colorContrast, colorLegible} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import {backgroundColor, rtl} from "@d3plus/dom";
import {largestRect} from "@d3plus/math";

import {constant} from "../../utils/index.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {defaultSize, outside} from "./labelPlacement.js";

/** Builds the `Area` shape config; `self` is the Plot instance. */
function areaConfig(self: VizInstance) {
  return {
    label: (d: DataPoint, i: number) => (self.schema.stacked ? self._drawLabel(d, i) : false),
    labelBounds: (d: DataPoint, i: number, aes: {points: [number, number][]}) => {
      let r = largestRect(aes.points, {angle: range(-20, 20, 5)});
      if (!r || r.height < 20 || r.width < 50)
        r = largestRect(aes.points, {angle: range(-80, 80, 5)});
      if (!r) return null;
      const x = min(aes.points, (p: [number, number]) => p[0]) as unknown as number;
      const y = max(
        aes.points.filter((p: [number, number]) => p[0] === x),
        (p: [number, number]) => p[1],
      ) as unknown as number;
      return {
        angle: r.angle,
        width: r.width,
        height: r.height,
        x: r.cx - r.width / 2 - x,
        y: r.cy - r.height / 2 - y,
      };
    },
    labelConfig: {
      fontMin: 6,
      fontResize: true,
      padding: 10,
    },
  };
}

/** Builds the top-level `ariaLabel` accessor; `self` is the Plot instance. */
function ariaLabelConfig(self: VizInstance) {
  return (d: DataPoint, i: number) => {
    let ariaLabelStr = "";
    if (d.nested) ariaLabelStr = `${self._drawLabel(d.data as DataPoint, d.i as number)}`;
    else {
      ariaLabelStr = `${self._drawLabel(d, i)}`;
      if (self._x!(d, i) !== undefined)
        ariaLabelStr += `, x: ${self._x!(d, i)}`;
      if (self._y!(d, i) !== undefined)
        ariaLabelStr += `, y: ${self._y!(d, i)}`;
      if (self._x2!(d, i) !== undefined)
        ariaLabelStr += `, x2: ${self._x2!(d, i)}`;
      if (self._y2!(d, i) !== undefined)
        ariaLabelStr += `, y2: ${self._y2!(d, i)}`;
    }
    return `${ariaLabelStr}.`;
  };
}

/** Builds the `Bar.labelConfig` block (dynamic-`this` accessors preserved). */
function barLabelConfig() {
  return {
    fontMax: 16,
    fontMin: 6,
    fontResize: true,
    fontColor(this: VizInstance, d: DataPoint, i: number) {
      if (outside.bind(this)(d, i)) {
        const bg = (this._backgroundConfig!.fill === "transparent"
          ? backgroundColor(this._select!.node())
          : this._backgroundConfig!.fill) as string;
        return colorContrast(bg);
      }
      return colorContrast(
        typeof this.schema.shapeConfig.fill === "function"
          ? this.schema.shapeConfig.fill(d, i)
          : this.schema.shapeConfig.fill,
      );
    },
    fontStroke(this: VizInstance, d: DataPoint, i: number) {
      if (outside.bind(this)(d, i)) {
        const bg = (this._backgroundConfig!.fill === "transparent"
          ? backgroundColor(this._select!.node())
          : this._backgroundConfig!.fill) as string;
        return colorContrast(bg);
      }
      return "transparent";
    },
    fontStrokeWidth(this: VizInstance, d: DataPoint, i: number) {
      return outside.bind(this)(d, i) ? 0.1 : 0;
    },
    padding: 3,
    textAnchor(this: VizInstance, d: DataPoint, i: number): string {
      const other = this.schema.discrete.charAt(0) === "x" ? "y" : "x";
      const invert = other === "y";
      const nonDiscrete: string = this.schema.discrete.replace(
        this.schema.discrete.charAt(0),
        other,
      );
      const negative = ((nonDiscrete === "y" ? this._y! : this._x!)(d, i) as number) < 0;
      const anchor = invert
        ? "middle"
        : outside.bind(this)(d, i)
          ? negative
            ? "end"
            : "start"
          : negative
            ? "start"
            : "end";
      return rtl()
        ? anchor === "start"
          ? "end"
          : anchor === "end"
            ? "start"
            : anchor
        : anchor;
    },
    verticalAlign(this: VizInstance, d: DataPoint, i: number): string {
      const other = this.schema.discrete.charAt(0) === "x" ? "y" : "x";
      const invert = other === "y";
      const nonDiscrete: string = this.schema.discrete.replace(
        this.schema.discrete.charAt(0),
        other,
      );
      const negative = ((nonDiscrete === "y" ? this._y! : this._x!)(d, i) as number) < 0;
      return invert
        ? outside.bind(this)(d, i)
          ? negative
            ? "top"
            : "bottom"
          : negative
            ? "bottom"
            : "top"
        : "middle";
    },
  };
}

/** Builds the `Bar` shape config (dynamic-`this` `labelBounds` preserved). */
function barConfig() {
  return {
    labelBounds(this: VizInstance, d: DataPoint, i: number, s: {width: number; height: number}) {
      const padding = 1;

      const width = this.schema.discrete === "y" ? "width" : "height";
      const height = this.schema.discrete === "y" ? "height" : "width";

      const other = this.schema.discrete.charAt(0) === "x" ? "y" : "x";
      const invert = other === "y";
      const nonDiscrete = this.schema.discrete.replace(
        this.schema.discrete.charAt(0),
        other,
      );
      const axis = nonDiscrete === "y" ? this._yAxis! : this._xAxis!;
      const range = axis._d3Scale!.range();
      const space = Math.abs(range[1] - range[0]);
      const negative = ((nonDiscrete === "y" ? this._y! : this._x!)(d, i) as number) < 0;

      if (outside.bind(this)(d, i)) {
        return {
          [width]: space - s[width],
          [height]: s[height],
          x: invert ? -s.width / 2 : negative ? -space : s.width + padding,
          y: invert
            ? negative
              ? s.height + padding
              : -space
            : -s.height / 2 + 1,
        };
      }
      return {
        [width]: s[width],
        [height]: s[height],
        x: invert
          ? -s.width / 2
          : negative
            ? this.schema.stacked
              ? padding - s.width
              : padding - s.width
            : -padding,
        y: invert
          ? negative
            ? this.schema.stacked
              ? padding
              : padding
            : -s.height + padding
          : -s.height / 2 + padding,
      };
    },
    labelConfig: barLabelConfig(),
  };
}

/** Builds the `Line` shape config; `self` is the Plot instance. */
function lineConfig(self: VizInstance) {
  return {
    curve: () =>
      self.schema.discrete
        ? `monotone${self.schema.discrete.charAt(0).toUpperCase()}`
        : "linear",
    fill: constant("none"),
    labelConfig: {
      fontColor: (d: DataPoint, i: number) => {
        const c =
          typeof self.schema.shapeConfig.Line.stroke === "function"
            ? self.schema.shapeConfig.Line.stroke(d, i)
            : self.schema.shapeConfig.Line.stroke;
        return colorLegible(c);
      },
      fontResize: false,
      padding: 5,
      textAnchor: "start",
      verticalAlign: "middle",
    },
    strokeWidth: constant(2),
  };
}

export function plotShapeDefaults(this: VizInstance) {
  return {
    Area: areaConfig(this),
    ariaLabel: ariaLabelConfig(this),
    Bar: barConfig(),
    Circle: {
      r: defaultSize.bind(this),
      // Scatter/bubble points leave a motion trail when they move between
      // frames (Timeline play). Only affects Circle/Rect marks, so Bar/Line/Area
      // plots are unaffected; opt out per chart with shapeConfig.Circle.trail.
      trail: true,
    },
    Line: lineConfig(this),
    Rect: {
      height: (d: DataPoint) => defaultSize.bind(this)(d) * 2,
      width: (d: DataPoint) => defaultSize.bind(this)(d) * 2,
      // Square scatter marks trail like Circle points do; the cone is sized to
      // the square's silhouette perpendicular to travel (corner-to-corner at
      // 45°). Opt out per chart with shapeConfig.Rect.trail: false.
      trail: true,
    },
  };
}
