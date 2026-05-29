/**
    Plot's default `shapeConfig` object, extracted from the constructor.

    Invoked via `plotShapeDefaults.call(this)` so the function's `this` is
    the Plot instance: arrow-function config accessors capture it lexically,
    while the method-shorthand accessors (`labelBounds`, `fontColor`, …) keep
    their dynamic call-time `this` binding — identical to when this object
    lived inline in the constructor.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */

import {max, min, range} from "d3-array";

import {colorContrast, colorLegible} from "@d3plus/color";
import {backgroundColor, rtl} from "@d3plus/dom";
import {largestRect} from "@d3plus/math";

import {constant} from "../../utils/index.js";
import {defaultSize, outside} from "./labelPlacement.js";

export function plotShapeDefaults(this: any) {
  return {
    Area: {
      label: (d: any, i: any) => (this.schema.stacked ? this._drawLabel(d, i) : false),
      labelBounds: (d: any, i: any, aes: any) => {
        let r = largestRect(aes.points, {angle: range(-20, 20, 5)});
        if (!r || r.height < 20 || r.width < 50)
          r = largestRect(aes.points, {angle: range(-80, 80, 5)});
        if (!r) return null;
        const x = min(aes.points, (d: any) => d[0]) as unknown as number;
        const y = max(
          aes.points.filter((d: any) => d[0] === x),
          (d: any) => d[1],
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
    },
    ariaLabel: (d: any, i: any) => {
      let ariaLabelStr = "";
      if (d.nested) ariaLabelStr = `${this._drawLabel(d.data, d.i)}`;
      else {
        ariaLabelStr = `${this._drawLabel(d, i)}`;
        if (this._x(d, i) !== undefined)
          ariaLabelStr += `, x: ${this._x(d, i)}`;
        if (this._y(d, i) !== undefined)
          ariaLabelStr += `, y: ${this._y(d, i)}`;
        if (this._x2(d, i) !== undefined)
          ariaLabelStr += `, x2: ${this._x2(d, i)}`;
        if (this._y2(d, i) !== undefined)
          ariaLabelStr += `, y2: ${this._y2(d, i)}`;
      }
      return `${ariaLabelStr}.`;
    },
    Bar: {
      labelBounds(this: any, d: any, i: any, s: any) {
        const padding = 1;

        const width = this.schema.discrete === "y" ? "width" : "height";
        const height = this.schema.discrete === "y" ? "height" : "width";

        const other = this.schema.discrete.charAt(0) === "x" ? "y" : "x";
        const invert = other === "y";
        const nonDiscrete = this.schema.discrete.replace(
          this.schema.discrete.charAt(0),
          other,
        );
        const range = (this as any)[`_${nonDiscrete}Axis`]._d3Scale.range();
        const space = Math.abs(range[1] - range[0]);
        const negative = (this as any)[`_${nonDiscrete}`](d, i) < 0;

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
      labelConfig: {
        fontMax: 16,
        fontMin: 6,
        fontResize: true,
        fontColor(this: any, d: any, i: any) {
          if (outside.bind(this)(d, i)) {
            const bg: string = this._backgroundConfig.fill === "transparent"
              ? backgroundColor(this._select.node())
              : this._backgroundConfig.fill;
            return colorContrast(bg);
          }
          return colorContrast(
            typeof this.schema.shapeConfig.fill === "function"
              ? this.schema.shapeConfig.fill(d, i)
              : this.schema.shapeConfig.fill,
          );
        },
        fontStroke(this: any, d: any, i: any) {
          if (outside.bind(this)(d, i)) {
            const bg: string = this._backgroundConfig.fill === "transparent"
              ? backgroundColor(this._select.node())
              : this._backgroundConfig.fill;
            return colorContrast(bg);
          }
          return "transparent";
        },
        fontStrokeWidth(this: any, d: any, i: any) {
          return outside.bind(this)(d, i) ? 0.1 : 0;
        },
        padding: 3,
        textAnchor(this: any, d: any, i: any): string {
          const other = this.schema.discrete.charAt(0) === "x" ? "y" : "x";
          const invert = other === "y";
          const nonDiscrete: string = this.schema.discrete.replace(
            this.schema.discrete.charAt(0),
            other,
          );
          const negative = (this as any)[`_${nonDiscrete}`](d, i) < 0;
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
        verticalAlign(this: any, d: any, i: any): string {
          const other = this.schema.discrete.charAt(0) === "x" ? "y" : "x";
          const invert = other === "y";
          const nonDiscrete: string = this.schema.discrete.replace(
            this.schema.discrete.charAt(0),
            other,
          );
          const negative = (this as any)[`_${nonDiscrete}`](d, i) < 0;
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
      },
    },
    Circle: {
      r: defaultSize.bind(this),
    },
    Line: {
      curve: () =>
        this.schema.discrete
          ? `monotone${this.schema.discrete.charAt(0).toUpperCase()}`
          : "linear",
      fill: constant("none"),
      labelConfig: {
        fontColor: (d: any, i: any) => {
          const c =
            typeof this.schema.shapeConfig.Line.stroke === "function"
              ? this.schema.shapeConfig.Line.stroke(d, i)
              : this.schema.shapeConfig.Line.stroke;
          return colorLegible(c);
        },
        fontResize: false,
        padding: 5,
        textAnchor: "start",
        verticalAlign: "middle",
      },
      strokeWidth: constant(2),
    },
    Rect: {
      height: (d: any) => defaultSize.bind(this)(d) * 2,
      width: (d: any) => defaultSize.bind(this)(d) * 2,
    },
  };
}
