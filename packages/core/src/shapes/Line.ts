import {extent, groups} from "d3-array";
import * as paths from "d3-shape";
import type {CurveFactory} from "d3-shape";

import type {DataPoint} from "@d3plus/data";
import {merge} from "@d3plus/data";
import {constant} from "../utils/index.js";
import {installFluent} from "../fluent.js";
import type {ConfigField} from "../fluent.js";

import type {LineConfig} from "./shapeConfig.js";
import Shape, {type ShapeAes} from "./Shape.js";

/** Line's own fluent accessor schema, layered on top of Shape's. */
const lineSchema: ConfigField[] = [
  {key: "curve", coerce: "const", default: constant("linear")},
  {
    key: "defined",
    coerce: "identity",
    default: (d: DataPoint) => d as unknown as DataPoint[keyof DataPoint],
  },
];

/**
    Creates SVG lines based on an array of data.
*/
export default class Line extends Shape {
  /**
      Invoked when creating a new class instance, and overrides any default parameters inherited from Shape.
      @private
*/
  constructor() {
    super();

    installFluent(this, lineSchema);

    this._name = "Line";
    this._path = (
      paths as unknown as Record<string, unknown> & {
        line: () => Record<string, unknown>;
      }
    ).line() as unknown as Record<string, unknown>;

    // Line-specific overrides of inherited Shape defaults.
    this.schema.fill = constant("none");
    this.schema.stroke = constant("black");
    this.schema.strokeWidth = constant(1);
    this.schema.hitArea = constant({
      d: (d: DataPoint) =>
        (this._path as unknown as (v: unknown) => string)(
          (d as Record<string, unknown>).values,
        ),
      fill: "none",
      "stroke-width": 10,
      transform: null,
    });
  }

  /**
      Filters/manipulates the data array before binding each point to an SVG group.
      @param data @private
*/
  _dataFilter(data: DataPoint[]): DataPoint[] {
    const lines: DataPoint[] & {
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
          d.values as unknown as DataPoint[],
          this.schema.x as unknown as (d: DataPoint) => number,
        );
        (d as Record<string, unknown>).xR = x;
        (d as Record<string, unknown>).width =
          (x[1] as number) - (x[0] as number);
        (d as Record<string, unknown>).x =
          (x[0] as number) + (d.width as number) / 2;

        const y = extent(
          d.values as unknown as DataPoint[],
          this.schema.y as unknown as (d: DataPoint) => number,
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
      Returns the line geometry as a "d" string built by the same line generator
      render() uses, with the center offset baked into the accessors so it pairs
      with the center-origin transform — yielding identical geometry to the DOM.
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
    ] as CurveFactory;
    const gen = paths
      .line<DataPoint>()
      .curve(curve)
      .defined(this.schema.defined)
      .x((v: DataPoint, z: number) => (this.schema.x(v, z) as number) - cx)
      .y((v: DataPoint, z: number) => (this.schema.y(v, z) as number) - cy);
    return {type: "path", d: gen(d.values as unknown as DataPoint[]) || ""};
  }

  /**
      Given a specific data point and index, returns the aesthetic properties of the shape.
      @param data point*
      @param index @private
*/
  _aes(d: DataPoint, i: number): ShapeAes {
    return {
      points: (d.values as unknown as DataPoint[]).map((p: DataPoint) => [
        this.schema.x(p, i) as number,
        this.schema.y(p, i) as number,
      ]),
    };
  }

  /**
      Narrowed `.config()` for Line. Inherited surface from
      `BaseClass.config()`; the override exists only to surface per-shape
      keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.
  */
  config(): LineConfig;
  config(_: Partial<LineConfig>): this;
  config(_?: Partial<LineConfig>): LineConfig | this {
    if (!arguments.length) return super.config() as LineConfig;
    super.config(_!);
    return this;
  }
}
