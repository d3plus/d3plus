import {extent, groups, sum} from "d3-array";
import {interpolatePath} from "d3-interpolate-path";
import {select} from "d3-selection";
import * as paths from "d3-shape";

import type {DataPoint} from "@d3plus/data";
import {merge} from "@d3plus/data";
import type {D3Selection} from "@d3plus/dom";
import {constant} from "../utils/index.js";
import type {AccessorFn} from "../utils/index.js";

import Shape, {type ShapeAes} from "./Shape.js";

/**
    Creates SVG lines based on an array of data.
*/
export default class Line extends Shape {
  declare _curve: AccessorFn;
  declare _defined: AccessorFn;
  declare _fill: AccessorFn;
  declare _hitArea:
    | ((
        d: DataPoint,
        i: number,
        aes: ShapeAes,
      ) => Record<string, unknown>)
    | null;
  declare _name: string;
  declare _path: Record<string, unknown>;
  declare _stroke: AccessorFn;
  declare _strokeWidth: AccessorFn;
  declare _strokeDasharray: AccessorFn;

  /**
      Invoked when creating a new class instance, and overrides any default parameters inherited from Shape.
      @private
*/
  constructor() {
    super();

    this._curve = constant("linear");
    this._defined = (d: DataPoint) =>
      d as unknown as DataPoint[keyof DataPoint];
    this._fill = constant("none");
    this._hitArea = constant({
      d: (d: DataPoint) =>
        (this._path as unknown as (v: unknown) => string)(
          (d as Record<string, unknown>).values,
        ),
      fill: "none",
      "stroke-width": 10,
      transform: null,
    }) as unknown as (
      d: DataPoint,
      i: number,
      aes: ShapeAes,
    ) => Record<string, unknown>;
    this._name = "Line";
    this._path = (
      paths as unknown as Record<string, unknown> & {
        line: () => Record<string, unknown>;
      }
    ).line() as unknown as Record<string, unknown>;
    this._stroke = constant("black");
    this._strokeWidth = constant(1);
  }

  /**
      Filters/manipulates the data array before binding each point to an SVG group.
      @param data @private
*/
  _dataFilter(data: DataPoint[]): DataPoint[] {
    const lines: DataPoint[] & {
      key?: (d: DataPoint) => DataPoint[keyof DataPoint];
    } = groups(data, this._id).map(
      ([key, values]: [DataPoint[keyof DataPoint], DataPoint[]]) => {
        const d: DataPoint = {key, values} as unknown as DataPoint;
        (d as Record<string, unknown>).data = merge(
          d.values as unknown as DataPoint[],
        );
        (d as Record<string, unknown>).i = data.indexOf(
          (d.values as unknown as DataPoint[])[0],
        );

        const x = extent(
          d.values as unknown as DataPoint[],
          this._x as unknown as (d: DataPoint) => number,
        );
        (d as Record<string, unknown>).xR = x;
        (d as Record<string, unknown>).width =
          (x[1] as number) - (x[0] as number);
        (d as Record<string, unknown>).x =
          (x[0] as number) + (d.width as number) / 2;

        const y = extent(
          d.values as unknown as DataPoint[],
          this._y as unknown as (d: DataPoint) => number,
        );
        (d as Record<string, unknown>).yR = y;
        (d as Record<string, unknown>).height =
          (y[1] as number) - (y[0] as number);
        (d as Record<string, unknown>).y =
          (y[0] as number) + (d.height as number) / 2;

        (d as Record<string, unknown>).nested = true;
        (d as Record<string, unknown>).translate = [d.x, d.y];
        (d as Record<string, unknown>).__d3plusShape__ = true;

        return d;
      },
    );

    lines.key = (d: DataPoint) => d.key;
    return lines;
  }

  /**
      Draws the lines.
    @param callback Optional callback invoked after rendering completes.
*/
  render(callback?: () => void): this {
    super.render(callback);

    const that = this;

    /**
        Calculates the stroke-dasharray used for animations
        @param d data point
        @private
*/
    function calculateStrokeDashArray(
      this: SVGPathElement,
      d: DataPoint,
    ): void {
      (d as Record<string, unknown>).initialLength = this.getTotalLength();

      let strokeArray: number[] = (
        that._strokeDasharray(
          (d.values as unknown as DataPoint[])[0],
          that._data.indexOf((d.values as unknown as DataPoint[])[0]),
        ) as string
      )
        .split(" ")
        .map(Number);

      if (strokeArray.length === 1 && strokeArray[0] === 0)
        strokeArray = [d.initialLength as number];
      else if (strokeArray.length === 1) strokeArray.push(strokeArray[0]);
      else if (strokeArray.length % 2)
        strokeArray = strokeArray.concat(strokeArray);

      const newStrokeArray: number[] = [];
      let strokeLength = 0;
      while (strokeLength < (d.initialLength as number)) {
        for (let i = 0; i < strokeArray.length; i++) {
          const num = strokeArray[i];
          strokeLength += num;
          newStrokeArray.push(num);
          if (strokeLength >= (d.initialLength as number)) break;
        }
      }

      if (newStrokeArray.length > 1 && newStrokeArray.length % 2)
        newStrokeArray.pop();
      newStrokeArray[newStrokeArray.length - 1] +=
        (d.initialLength as number) - sum(newStrokeArray);
      if (newStrokeArray.length % 2 === 0) newStrokeArray.push(0);
      (d as Record<string, unknown>).initialStrokeArray =
        newStrokeArray.join(" ");
    }

    const userCurve = this._curve.bind(this)(
      this.config() as DataPoint,
    ) as string;
    const curve = (paths as Record<string, unknown>)[
      `curve${userCurve.charAt(0).toUpperCase()}${userCurve.slice(1)}`
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this._path as any)
      .curve(curve)
      .defined(this._defined)
      .x(this._x)
      .y(this._y);

    const enter = this._enter
      .append("path")
      .attr(
        "transform",
        (d: DataPoint) =>
          `translate(${-(d.xR as unknown as number[])[0] - (d.width as number) / 2}, ${-(d.yR as unknown as number[])[0] - (d.height as number) / 2})`,
      )
      .attr("d", (d: DataPoint) =>
        (this._path as unknown as (v: unknown) => string)(
          (d as Record<string, unknown>).values,
        ),
      )
      .call(this._applyStyle.bind(this));

    let update: D3Selection = this._update
      .select("path")
      .attr(
        "stroke-dasharray",
        (d: DataPoint) =>
          that._strokeDasharray(
            (d.values as unknown as DataPoint[])[0],
            that._data.indexOf((d.values as unknown as DataPoint[])[0]),
          ) as string,
      );

    if (this._duration) {
      enter
        .each(calculateStrokeDashArray)
        .attr(
          "stroke-dasharray",
          (d: DataPoint) => `${d.initialStrokeArray} ${d.initialLength}`,
        )
        .attr("stroke-dashoffset", (d: DataPoint) => d.initialLength as never)
        .transition(this._transition)
        .attr("stroke-dashoffset", 0);
      update = update
        .transition(this._transition)
        .attrTween("d", function (this: Element, d: DataPoint) {
          return interpolatePath(
            select(this).attr("d"),
            (that._path as unknown as (v: unknown) => string)(
              (d as Record<string, unknown>).values,
            ),
          );
        }) as unknown as D3Selection;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this._exit.selectAll("path") as any)
        .each(calculateStrokeDashArray)
        .attr(
          "stroke-dasharray",
          (d: DataPoint) => `${d.initialStrokeArray} ${d.initialLength}`,
        )
        .transition(this._transition)
        .attr(
          "stroke-dashoffset",
          (d: DataPoint) => -(d.initialLength as number),
        );
    } else {
      update = update.attr("d", (d: DataPoint) =>
        (that._path as unknown as (v: unknown) => string)(
          (d as Record<string, unknown>).values,
        ),
      );
    }

    update
      .attr(
        "transform",
        (d: DataPoint) =>
          `translate(${-(d.xR as unknown as number[])[0] - (d.width as number) / 2}, ${-(d.yR as unknown as number[])[0] - (d.height as number) / 2})`,
      )
      .call(this._applyStyle.bind(this));

    return this;
  }

  /**
      Given a specific data point and index, returns the aesthetic properties of the shape.
      @param data point*
      @param index @private
*/
  _aes(d: DataPoint, i: number): ShapeAes {
    return {
      points: (d.values as unknown as DataPoint[]).map((p: DataPoint) => [
        this._x(p, i) as number,
        this._y(p, i) as number,
      ]),
    };
  }

  /**
      The d3 curve function used to interpolate the line.
*/
  curve(): AccessorFn;
  curve(_: AccessorFn | string): this;
  curve(_?: AccessorFn | string): AccessorFn | this {
    return arguments.length
      ? ((this._curve = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn), this)
      : this._curve;
  }

  /**
      An accessor function that determines whether a data point is defined (not a gap in the line).
*/
  defined(): AccessorFn;
  defined(_: AccessorFn): this;
  defined(_?: AccessorFn): AccessorFn | this {
    return arguments.length ? ((this._defined = _!), this) : this._defined;
  }
}
