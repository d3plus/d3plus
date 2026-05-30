import {extent, groups} from "d3-array";
import * as paths from "d3-shape";

import type {DataPoint} from "@d3plus/data";
import {merge} from "@d3plus/data";
import {largestRect} from "@d3plus/math";
import {accessor, constant} from "../utils/index.js";
import type {AccessorFn} from "../utils/index.js";
import {installFluent} from "../fluent.js";
import type {ConfigField} from "../fluent.js";

import type {AreaConfig} from "./shapeConfig.js";
import Shape, {type ShapeAes} from "./Shape.js";

/** Area's own fluent accessor schema, layered on top of Shape's. */
const areaSchema: ConfigField[] = [
  {key: "curve", coerce: "const", default: constant("linear")},
  {key: "defined", coerce: "identity", default: () => true},
];

/**
    Creates SVG areas based on an array of data.
*/
export default class Area extends Shape {
  /**
      Invoked when creating a new class instance, and overrides any default parameters inherited from Shape.
      @private
*/
  constructor() {
    super();

    installFluent(this, areaSchema);

    this._name = "Area";
    this.schema.labelBounds = (d: DataPoint, i: number, aes: ShapeAes) => {
      const r = largestRect(aes.points as unknown as [number, number][]);
      if (!r) return null;
      return {
        angle: r.angle,
        width: r.width,
        height: r.height,
        x: r.cx - r.width / 2 - (this.schema.x(d, i) as number),
        y: r.cy - r.height / 2 - (this.schema.y(d, i) as number),
      };
    };
    this.schema.labelConfig = Object.assign(this.schema.labelConfig, {
      textAnchor: "middle",
      verticalAlign: "middle",
    });
    this.schema.x = accessor("x");
    this.schema.x0 = accessor("x");
    this.schema.x1 = null;
    this.schema.y = constant(0);
    this.schema.y0 = constant(0);
    this.schema.y1 = accessor("y");
  }

  /**
      Returns the area geometry as a "d" string built by the same area generator
      render() uses, with the center offset baked into the x/x0/x1/y/y0/y1 accessors
      so it pairs with the center-origin transform — identical geometry to the DOM.
      @private
*/
  _sceneGeometry(d: DataPoint): Record<string, unknown> {
    const cx = Number(d.x);
    const cy = Number(d.y);
    const userCurve = String(
      this.schema.curve.bind(this)(this.config() as DataPoint),
    );
    const curve = (paths as Record<string, unknown>)[
      `curve${userCurve.charAt(0).toUpperCase()}${userCurve.slice(1)}`
    ];
    const offX = (fn: AccessorFn) => (v: DataPoint, z: number) =>
      (fn(v, z) as number) - cx;
    const offY = (fn: AccessorFn) => (v: DataPoint, z: number) =>
      (fn(v, z) as number) - cy;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gen = (paths as any)
      .area()
      .defined(this.schema.defined)
      .curve(curve)
      .x(offX(this.schema.x))
      .x0(offX(this.schema.x0))
      .x1(this.schema.x1 ? offX(this.schema.x1) : null)
      .y(offY(this.schema.y))
      .y0(offY(this.schema.y0))
      .y1(this.schema.y1 ? offY(this.schema.y1) : null);
    return {type: "path", d: gen(d.values) || ""};
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
        this.schema.y1
          ? (this.schema.x(a) as number) - (this.schema.x(b) as number)
          : (this.schema.y(a) as number) - (this.schema.y(b) as number),
      );
    const points1: [number, number][] = values.map(
      (v: DataPoint, z: number) => [
        this.schema.x0(v, z) as number,
        this.schema.y0(v, z) as number,
      ],
    );
    const points2: [number, number][] = values
      .reverse()
      .map((v: DataPoint, z: number) =>
        this.schema.y1
          ? [this.schema.x(v, z) as number, this.schema.y1(v, z) as number]
          : [this.schema.x1(v, z) as number, this.schema.y(v, z) as number],
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
    } = groups(data, this.schema.id).map(
      ([key, values]: [unknown, DataPoint[]]) => {
        const d: DataPoint = {key, values} as unknown as DataPoint;
        (d as Record<string, unknown>).data = merge(
          d.values as unknown as DataPoint[],
        );
        (d as Record<string, unknown>).i = data.indexOf(
          (d.values as unknown as DataPoint[])[0],
        );

        const x = extent(
          (d.values as unknown as DataPoint[])
            .map(this.schema.x)
            .concat((d.values as unknown as DataPoint[]).map(this.schema.x0))
            .concat(
              this.schema.x1
                ? (d.values as unknown as DataPoint[]).map(this.schema.x1)
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
            .map(this.schema.y)
            .concat((d.values as unknown as DataPoint[]).map(this.schema.y0))
            .concat(
              this.schema.y1
                ? (d.values as unknown as DataPoint[]).map(this.schema.y1)
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
      The x position accessor. Also sets x0 to the same value.
*/
  x(): AccessorFn;
  x(_: AccessorFn | number): this;
  x(_?: AccessorFn | number): AccessorFn | this {
    if (!arguments.length) return this.schema.x;
    this.schema.x = typeof _ === "function" ? _ : constant(_);
    this.schema.x0 = this.schema.x;
    return this;
  }

  /**
      The x0 (left edge) position accessor for the area.
*/
  x0(): AccessorFn;
  x0(_: AccessorFn | number): this;
  x0(_?: AccessorFn | number): AccessorFn | this {
    if (!arguments.length) return this.schema.x0;
    this.schema.x0 = typeof _ === "function" ? _ : constant(_);
    this.schema.x = this.schema.x0;
    return this;
  }

  /**
      The x1 (right edge) position accessor for the area.
*/
  x1(): AccessorFn | null;
  x1(_: AccessorFn | number | null): this;
  x1(_?: AccessorFn | number | null): AccessorFn | null | this {
    return arguments.length
      ? ((this.schema.x1 =
          typeof _ === "function" ? _ : _ === null ? null : constant(_)),
        this)
      : this.schema.x1;
  }

  /**
      The y position accessor. Also sets y0 to the same value.
*/
  y(): AccessorFn;
  y(_: AccessorFn | number): this;
  y(_?: AccessorFn | number): AccessorFn | this {
    if (!arguments.length) return this.schema.y;
    this.schema.y = typeof _ === "function" ? _ : constant(_);
    this.schema.y0 = this.schema.y;
    return this;
  }

  /**
      The y0 (top edge) position accessor for the area.
*/
  y0(): AccessorFn;
  y0(_: AccessorFn | number): this;
  y0(_?: AccessorFn | number): AccessorFn | this {
    if (!arguments.length) return this.schema.y0;
    this.schema.y0 = typeof _ === "function" ? _ : constant(_);
    this.schema.y = this.schema.y0;
    return this;
  }

  /**
      The y1 (bottom edge) position accessor for the area.
*/
  y1(): AccessorFn | null;
  y1(_: AccessorFn | number | null): this;
  y1(_?: AccessorFn | number | null): AccessorFn | null | this {
    return arguments.length
      ? ((this.schema.y1 =
          typeof _ === "function" ? _ : _ === null ? null : constant(_)),
        this)
      : this.schema.y1;
  }

  /**
      Narrowed `.config()` for Area. Inherited surface from
      `BaseClass.config()`; the override exists only to surface per-shape
      keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.
  */
  config(): AreaConfig;
  config(_: Partial<AreaConfig>): this;
  config(_?: Partial<AreaConfig>): AreaConfig | this {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (arguments.length ? super.config(_ as any) : super.config()) as any;
  }
}
