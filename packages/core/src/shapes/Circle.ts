import type {DataPoint} from "@d3plus/data";
import {assign} from "@d3plus/dom";
import type {D3Selection} from "@d3plus/dom";
import {accessor, constant} from "../utils/index.js";
import type {AccessorFn} from "../utils/index.js";

import Shape, {type ShapeAes} from "./Shape.js";

/**
    Creates SVG circles based on an array of data.
*/
export default class Circle extends Shape {
  declare _labelBounds:
    | ((
        d: DataPoint,
        i: number,
        aes: Record<string, unknown>,
      ) => Record<string, unknown> | null | false)
    | null;
  declare _labelConfig: Record<string, unknown>;
  declare _name: string;
  _r: AccessorFn;

  /**
      Invoked when creating a new class instance, and overrides any default parameters inherited from Shape.
      @private
*/
  constructor() {
    super("circle");
    this._labelBounds = (
      d: DataPoint,
      i: number,
      s: Record<string, unknown>,
    ) => ({
      width: (s.r as number) * 1.5,
      height: (s.r as number) * 1.5,
      x: -(s.r as number) * 0.75,
      y: -(s.r as number) * 0.75,
    });
    this._labelConfig = assign(this._labelConfig, {
      textAnchor: "middle",
      verticalAlign: "middle",
    });
    this._name = "Circle";
    this._r = accessor("r");
  }

  /**
      Provides the default positioning to the <rect> elements.
      @private
*/
  _applyPosition(elem: D3Selection): void {
    (elem as any)
      .attr("r", (d: DataPoint, i: number) => this._r(d, i))
      .attr("x", (d: DataPoint, i: number) => -(this._r(d, i) as number) / 2)
      .attr("y", (d: DataPoint, i: number) => -(this._r(d, i) as number) / 2);
  }

  /**
      Draws the circles.
    @param callback Optional callback invoked after rendering completes.
*/
  render(callback?: () => void): this {
    super.render(callback);

    const enter = this._enter.call(this._applyStyle.bind(this));

    let update: D3Selection = this._update;

    if (this._duration) {
      enter
        .attr("r", 0)
        .attr("x", 0)
        .attr("y", 0)
        .transition(this._transition)
        .call(this._applyPosition.bind(this));
      update = update.transition(this._transition) as unknown as D3Selection;
      this._exit
        .transition(this._transition)
        .attr("r", 0)
        .attr("x", 0)
        .attr("y", 0);
    } else {
      enter.call(this._applyPosition.bind(this));
    }

    update
      .call(this._applyStyle.bind(this))
      .call(this._applyPosition.bind(this));

    return this;
  }

  /**
      Given a specific data point and index, returns the aesthetic properties of the shape.
      @param data point*
      @param index @private
*/
  _aes(d: DataPoint, i: number): ShapeAes {
    return {r: this._r(d, i) as number};
  }

  /**
      The radius accessor for each circle.

@example
function(d) {
  return d.r;
}
*/
  r(): AccessorFn;
  r(_: AccessorFn | number): this;
  r(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._r = typeof _ === "function" ? _ : constant(_)), this)
      : this._r;
  }
}
