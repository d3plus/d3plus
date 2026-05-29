import {colorContrast} from "@d3plus/color";
import {assign, backgroundColor} from "@d3plus/dom";
import {constant} from "../utils/index.js";
import {applyRadarLayout, radarDef} from "./ChartDefinition.js";
import {chartBounds, centerChartTransform} from "./chartGeometry.js";
import {runChartDraw} from "./runChartDraw.js";
import Viz from "./Viz.js";

/**
    Creates a radar visualization based on an array of data.
*/
export default class Radar extends Viz {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;

  /**
      Invoked when creating a new class instance, and overrides any default parameters inherited from Viz.
      @private
*/
  constructor() {
    super();

    this._axisConfig = {
      shapeConfig: {
        fill: constant("none"),
        labelConfig: {
          fontColor: () => {
            const bg = this._select ? backgroundColor(this._select.node()) : "rgb(255, 255, 255)";
            return colorContrast(bg);
          },
          padding: 0,
          textAnchor: (d: any, i: any, x: any) => x.textAnchor,
          verticalAlign: "middle",
        },
        stroke: () => {
          const bg = this._select ? backgroundColor(this._select.node()) : "rgb(255, 255, 255)";
          return colorContrast(bg);
        },
        strokeWidth: constant(1),
      },
    };
    // E3: scalar defaults sourced from radarDef.
    this._discrete = radarDef.defaults.discrete as string;
    this._levels = radarDef.defaults.levels as number;
    this._metric = radarDef.defaults.metric;
    this._outerPadding = radarDef.defaults.outerPadding as number;
    this._shape = radarDef.defaults.shape;
    this._value = radarDef.defaults.value;
  }

  /**
      Extends the draw behavior of the abstract Viz class.
      @private
*/
  _draw(callback?: () => void) {
    (super._draw as (...args: unknown[]) => unknown)(callback);
    runChartDraw(this, radarDef, applyRadarLayout, v => {
      const {width, height} = chartBounds(v);
      return centerChartTransform(v, width, height);
    });
    return this;
  }

  /**
      Configuration object for the radial spokes, circles, and labels.
*/
  axisConfig(_: any) {
    return arguments.length
      ? ((this._axisConfig = assign(this._axisConfig, _)), this)
      : this._axisConfig;
  }

  /**
      Accessor function for the metric value used as each axis.
*/
  metric(_: any) {
    return arguments.length
      ? ((this._metric = typeof _ === "function" ? _ : accessor(_)), this)
      : this._metric;
  }

  /**
      Determines how much pixel spaces to give the outer labels.
*/
  outerPadding(_: any) {
    return arguments.length
      ? ((this._outerPadding = _), this)
      : this._outerPadding;
  }

  /**
      The value accessor used to determine each data point's position along each axis.

@example
function value(d) {
  return d.value;
}
*/
  value(_: any) {
    return arguments.length
      ? ((this._value = typeof _ === "function" ? _ : accessor(_)), this)
      : this._value;
  }
}
