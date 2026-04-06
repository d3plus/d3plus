import {extent, groups} from "d3-array";
import {interpolatePath} from "d3-interpolate-path";
import {select} from "d3-selection";
import * as paths from "d3-shape";

import type {DataPoint} from "@d3plus/data";
import {merge} from "@d3plus/data";
import {largestRect} from "@d3plus/math";
import {accessor, constant} from "../utils/index.js";
import type {AccessorFn} from "../utils/index.js";

import Shape, {type ShapeAes} from "./Shape.js";

/**
    Creates SVG areas based on an array of data.
*/
export default class Area extends Shape {
  _curve: AccessorFn;
  _defined: (d: DataPoint) => boolean;
  declare _labelBounds:
    | ((
        d: DataPoint,
        i: number,
        aes: Record<string, unknown>,
      ) => Record<string, unknown> | null | false)
    | null;
  declare _labelConfig: Record<string, unknown>;
  declare _name: string;
  declare _x: AccessorFn;
  _x0: AccessorFn;
  _x1: AccessorFn | null;
  declare _y: AccessorFn;
  _y0: AccessorFn;
  _y1: AccessorFn | null;
  declare _path: Record<string, unknown>;

  /**
      Invoked when creating a new class instance, and overrides any default parameters inherited from Shape.
      @private
*/
  constructor() {
    super();

    this._curve = constant("linear");
    this._defined = () => true;
    this._labelBounds = (
      d: DataPoint,
      i: number,
      aes: Record<string, unknown>,
    ) => {
      const r = largestRect(aes.points as unknown as [number, number][]);
      if (!r) return null;
      return {
        angle: r.angle,
        width: r.width,
        height: r.height,
        x: r.cx - r.width / 2 - (this._x(d, i) as number),
        y: r.cy - r.height / 2 - (this._y(d, i) as number),
      };
    };
    this._labelConfig = Object.assign(this._labelConfig, {
      textAnchor: "middle",
      verticalAlign: "middle",
    });
    this._name = "Area";
    this._x = accessor("x");
    this._x0 = accessor("x");
    this._x1 = null;
    this._y = constant(0);
    this._y0 = constant(0);
    this._y1 = accessor("y");
  }

  /**
      Given a specific data point and index, returns the aesthetic properties of the shape.
      @param data point*
      @param index @private
*/
  _aes(d: DataPoint): ShapeAes {
    const values = (d.values as unknown as DataPoint[])
      .slice()
      .sort((a: DataPoint, b: DataPoint) =>
        this._y1
          ? (this._x(a) as number) - (this._x(b) as number)
          : (this._y(a) as number) - (this._y(b) as number),
      );
    const points1: [number, number][] = values.map(
      (v: DataPoint, z: number) => [
        this._x0(v, z) as number,
        this._y0(v, z) as number,
      ],
    );
    const points2: [number, number][] = values
      .reverse()
      .map((v: DataPoint, z: number) =>
        this._y1
          ? [this._x(v, z) as number, this._y1!(v, z) as number]
          : [this._x1!(v, z) as number, this._y(v, z) as number],
      );
    let points = points1.concat(points2);
    if (points1[0][1] > points2[0][1]) points = points.reverse();
    points.push(points[0]);
    return {points};
  }

  /**
      Filters/manipulates the data array before binding each point to an SVG group.
      @param data @private
*/
  _dataFilter(data: DataPoint[]): DataPoint[] {
    const areas: DataPoint[] & {
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
          (d.values as unknown as DataPoint[])
            .map(this._x)
            .concat((d.values as unknown as DataPoint[]).map(this._x0))
            .concat(
              this._x1
                ? (d.values as unknown as DataPoint[]).map(this._x1)
                : [],
            ) as number[],
        );
        (d as Record<string, unknown>).xR = x;
        (d as Record<string, unknown>).width =
          (x[1] as number) - (x[0] as number);
        (d as Record<string, unknown>).x =
          (x[0] as number) + (d.width as number) / 2;

        const y = extent(
          (d.values as unknown as DataPoint[])
            .map(this._y)
            .concat((d.values as unknown as DataPoint[]).map(this._y0))
            .concat(
              this._y1
                ? (d.values as unknown as DataPoint[]).map(this._y1)
                : [],
            ) as number[],
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

    areas.key = (d: DataPoint) => d.key;
    return areas;
  }

  /**
      Draws the area polygons.
    @param callback Optional callback invoked after rendering completes.
*/
  render(callback?: () => void): this {
    super.render(callback);

    const userCurve = this._curve.bind(this)(
      this.config() as DataPoint,
    ) as string;
    const curve = (paths as Record<string, unknown>)[
      `curve${userCurve.charAt(0).toUpperCase()}${userCurve.slice(1)}`
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const path = (this._path = (paths as any)
      .area()
      .defined(this._defined)
      .curve(curve)
      .x(this._x)
      .x0(this._x0)
      .x1(this._x1)
      .y(this._y)
      .y0(this._y0)
      .y1(this._y1) as unknown as Record<string, unknown>);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exitPath = (paths as any)
      .area()
      .defined((d: DataPoint) => d)
      .curve(curve)
      .x(this._x)
      .y(this._y)
      .x0((d: DataPoint, i: number) =>
        this._x1
          ? (this._x0(d, i) as number) +
            ((this._x1!(d, i) as number) - (this._x0(d, i) as number)) / 2
          : this._x0(d, i),
      )
      .x1((d: DataPoint, i: number) =>
        this._x1
          ? (this._x0(d, i) as number) +
            ((this._x1!(d, i) as number) - (this._x0(d, i) as number)) / 2
          : this._x0(d, i),
      )
      .y0((d: DataPoint, i: number) =>
        this._y1
          ? (this._y0(d, i) as number) +
            ((this._y1!(d, i) as number) - (this._y0(d, i) as number)) / 2
          : this._y0(d, i),
      )
      .y1((d: DataPoint, i: number) =>
        this._y1
          ? (this._y0(d, i) as number) +
            ((this._y1!(d, i) as number) - (this._y0(d, i) as number)) / 2
          : this._y0(d, i),
      );

    this._enter
      .append("path")
      .attr(
        "transform",
        (d: DataPoint) =>
          `translate(${-(d.xR as unknown as number[])[0] - (d.width as number) / 2}, ${-(d.yR as unknown as number[])[0] - (d.height as number) / 2})`,
      )
      .attr("d", (d: DataPoint) => exitPath(d.values))
      .call(this._applyStyle.bind(this))
      .transition(this._transition)
      .attrTween("d", function (this: Element, d: DataPoint) {
        return interpolatePath(
          select(this).attr("d"),
          (path as unknown as (v: unknown) => string)(
            (d as Record<string, unknown>).values,
          ),
        );
      });

    this._update
      .select("path")
      .transition(this._transition)
      .attr(
        "transform",
        (d: DataPoint) =>
          `translate(${-(d.xR as unknown as number[])[0] - (d.width as number) / 2}, ${-(d.yR as unknown as number[])[0] - (d.height as number) / 2})`,
      )
      .attrTween("d", function (this: Element, d: DataPoint) {
        return interpolatePath(
          select(this).attr("d"),
          (path as unknown as (v: unknown) => string)(
            (d as Record<string, unknown>).values,
          ),
        );
      })
      .call(this._applyStyle.bind(this));

    this._exit
      .select("path")
      .transition(this._transition)
      .attrTween("d", function (this: Element, d: DataPoint) {
        return interpolatePath(
          select(this).attr("d"),
          exitPath((d as Record<string, unknown>).values),
        );
      });

    return this;
  }

  /**
      The d3 curve function used to interpolate the area.
*/
  curve(): AccessorFn;
  curve(_: AccessorFn | string): this;
  curve(_?: AccessorFn | string): AccessorFn | this {
    return arguments.length
      ? ((this._curve = typeof _ === "function" ? _ : constant(_)), this)
      : this._curve;
  }

  /**
      An accessor function that determines whether a data point is defined (not a gap in the area).
*/
  defined(): (d: DataPoint) => boolean;
  defined(_: (d: DataPoint) => boolean): this;
  defined(_?: (d: DataPoint) => boolean): ((d: DataPoint) => boolean) | this {
    return arguments.length ? ((this._defined = _!), this) : this._defined;
  }

  /**
      The x position accessor. Also sets x0 to the same value.
*/
  x(): AccessorFn;
  x(_: AccessorFn | number): this;
  x(_?: AccessorFn | number): AccessorFn | this {
    if (!arguments.length) return this._x;
    this._x = typeof _ === "function" ? _ : constant(_);
    this._x0 = this._x;
    return this;
  }

  /**
      The x0 (left edge) position accessor for the area.
*/
  x0(): AccessorFn;
  x0(_: AccessorFn | number): this;
  x0(_?: AccessorFn | number): AccessorFn | this {
    if (!arguments.length) return this._x0;
    this._x0 =
      typeof _ === "function" ? _ : (constant(_) as unknown as AccessorFn);
    this._x = this._x0;
    return this;
  }

  /**
      The x1 (right edge) position accessor for the area.
*/
  x1(): AccessorFn | null;
  x1(_: AccessorFn | number | null): this;
  x1(_?: AccessorFn | number | null): AccessorFn | null | this {
    return arguments.length
      ? ((this._x1 =
          typeof _ === "function"
            ? _
            : _ === null
              ? null
              : (constant(_) as unknown as AccessorFn)),
        this)
      : this._x1;
  }

  /**
      The y position accessor. Also sets y0 to the same value.
*/
  y(): AccessorFn;
  y(_: AccessorFn | number): this;
  y(_?: AccessorFn | number): AccessorFn | this {
    if (!arguments.length) return this._y;
    this._y = typeof _ === "function" ? _ : constant(_);
    this._y0 = this._y;
    return this;
  }

  /**
      The y0 (top edge) position accessor for the area.
*/
  y0(): AccessorFn;
  y0(_: AccessorFn | number): this;
  y0(_?: AccessorFn | number): AccessorFn | this {
    if (!arguments.length) return this._y0;
    this._y0 =
      typeof _ === "function" ? _ : (constant(_) as unknown as AccessorFn);
    this._y = this._y0;
    return this;
  }

  /**
      The y1 (bottom edge) position accessor for the area.
*/
  y1(): AccessorFn | null;
  y1(_: AccessorFn | number | null): this;
  y1(_?: AccessorFn | number | null): AccessorFn | null | this {
    return arguments.length
      ? ((this._y1 =
          typeof _ === "function"
            ? _
            : _ === null
              ? null
              : (constant(_) as unknown as AccessorFn)),
        this)
      : this._y1;
  }
}
