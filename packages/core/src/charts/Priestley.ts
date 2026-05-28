import {min, max} from "d3-array";

import {Axis} from "../components/index.js";
import {assign} from "@d3plus/dom";
import {accessor} from "../utils/index.js";
import {applyPriestleyLayout, priestleyDef} from "./ChartDefinition.js";
import {runStages} from "./stages.js";
import Viz from "./Viz.js";

/**
    Creates a priestley timeline based on an array of data.
*/
export default class Priestley extends Viz {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
*/
  constructor() {
    super();

    this._axis = new Axis().align("end").orient("bottom");
    this._axisConfig = {scale: "time"};
    this._axisTest = new Axis().align("end").gridSize(0).orient("bottom");
    this.end("end");
    // E3: scalar defaults sourced from priestleyDef.
    this._paddingInner = priestleyDef.defaults.paddingInner as number;
    this._paddingOuter = priestleyDef.defaults.paddingOuter as number;
    this._shapeConfig = assign({}, this._shapeConfig, {
      ariaLabel: (d: any, i: any) =>
        `${this._drawLabel(d, i)}, ${this._start(d, i)} - ${this._end(d, i)}.`,
    });
    this.start("start");
  }

  /**
      Extends the render behavior of the abstract Viz class.
      @private
*/
  _draw(callback?: () => void) {
    (super._draw as (...args: unknown[]) => unknown)(callback);

    // Priestley-specific layout (greedy first-fit lane packer + Axis
    // mount + band scale) runs as `applyPriestleyLayout` on
    // `priestleyDef.stages`. The stage writes `_priestleyCtx` back onto
    // the viz and returns the laid-out per-band data; emit consumes
    // both. `_chartTransform` stays undefined — Priestley positions in
    // absolute scale coordinates.
    const {shapeData} = runStages({viz: this} as any, [applyPriestleyLayout]) as unknown as {
      shapeData: any[];
    };
    this._chartScene = priestleyDef.emit({viz: this, shapeData} as any);
    this._chartTransform = undefined;
    return this;
  }

  /**
      Configuration object for the axis.
*/
  axisConfig(_: any) {
    return arguments.length
      ? ((this._axisConfig = assign(this._axisConfig, _)), this)
      : this._axisConfig;
  }

  /**
      Accessor function or string key for the end date of each data point.
*/
  end(_: any) {
    if (arguments.length) {
      if (typeof _ === "function") this._end = _;
      else {
        this._end = accessor(_);
        if (!this._aggs[_]) this._aggs[_] = max;
      }
      return this;
    } else return this._end;
  }

  /**
      The [paddingInner](https://github.com/d3/d3-scale#band_paddingInner) value of the underlining [Band Scale](https://github.com/d3/d3-scale#band-scales) used to determine the height of each bar. Values should be a ratio between 0 and 1 representing the space in between each rectangle.
*/
  paddingInner(_: any) {
    return arguments.length
      ? ((this._paddingInner = _), this)
      : this._paddingInner;
  }

  /**
      The [paddingOuter](https://github.com/d3/d3-scale#band_paddingOuter) value of the underlining [Band Scale](https://github.com/d3/d3-scale#band-scales) used to determine the height of each bar. Values should be a ratio between 0 and 1 representing the space around the outer rectangles.
*/
  paddingOuter(_: any) {
    return arguments.length
      ? ((this._paddingOuter = _), this)
      : this._paddingOuter;
  }

  /**
      Accessor function or string key for the start date of each data point.
*/
  start(_: any) {
    if (arguments.length) {
      if (typeof _ === "function") this._start = _;
      else {
        this._start = accessor(_);
        if (!this._aggs[_]) this._aggs[_] = min;
      }
      return this;
    } else return this._start;
  }
}
