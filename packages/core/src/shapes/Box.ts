import {groups, max, min, quantile} from "d3-array";
import {select} from "d3-selection";

import type {DataPoint} from "@d3plus/data";
import {merge} from "@d3plus/data";
import {assign, elem} from "@d3plus/dom";
import type {D3Selection} from "@d3plus/dom";
import type {GroupNode, SceneNode} from "@d3plus/render";

import {accessor, BaseClass, configPrep, constant} from "../utils/index.js";
import {installFluent} from "../fluent.js";
import type {ConfigField} from "../fluent.js";

import Circle from "./Circle.js";
import Rect from "./Rect.js";
import type {BoxConfig} from "./shapeConfig.js";
import Whisker from "./Whisker.js";

const shapes: Record<string, typeof Circle | typeof Rect> = {Circle, Rect};

// Box's x/y setters wrap every non-function (including numbers) in
// `accessor(...)`, unlike the "accessor" coerce which would `constant(...)`
// a non-string — so a custom coerce preserves the exact behavior.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toAccessor = (value: unknown): any =>
  typeof value === "function" ? value : accessor(value as string);

/** Box's fluent accessor schema. Config storage lives on `this.schema.<key>`. */
const boxSchema: ConfigField[] = [
  {key: "orient", coerce: "const", default: accessor("orient", "vertical")},
  {key: "outlier", coerce: "const", default: accessor("outlier", "Circle")},
  {key: "rectWidth", coerce: "const", default: constant(50)},
  {key: "renderMode", coerce: "identity", default: "full"},
  {
    key: "whiskerMode",
    coerce: v => (Array.isArray(v) ? v : [v, v]),
    default: ["tukey", "tukey"],
  },
  {key: "x", coerce: toAccessor, default: accessor("x", 250)},
  {key: "y", coerce: toAccessor, default: accessor("y", 250)},
];

/**
    Creates SVG box based on an array of data.
*/
export default class Box extends BaseClass {
  // installFluent generates the config accessors (orient, x, rectWidth, …) at
  // runtime; the index signature lets callers reach them through the type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  _data!: DataPoint[];
  _select!: D3Selection;
  _box!: Rect;
  _median!: Rect;
  _whisker!: Whisker;
  _whiskerEndpoint: (Circle | Rect)[];

  /**
      Invoked when creating a new class instance, and overrides any default parameters inherited from BaseClass.
      @private
*/
  constructor() {
    super();
    installFluent(this, boxSchema);
    this.schema.medianConfig = {fill: constant("black")};
    this.schema.outlierConfig = {
      Circle: {
        r: accessor("r", 5),
      },
      Rect: {
        height: (d: DataPoint, i: number) =>
          this.schema.orient(d, i) === "vertical" ? 5 : 20,
        width: (d: DataPoint, i: number) =>
          this.schema.orient(d, i) === "vertical" ? 20 : 5,
      },
    };
    this.schema.rectConfig = {
      fill: constant("white"),
      stroke: constant("black"),
      strokeWidth: constant(1),
    };
    this.schema.whiskerConfig = {};
    this._whiskerEndpoint = [];
  }

  /**
      Draws the Box.
*/
  render(): this {
    const compute = this.schema.renderMode === "compute";
    if (this._select === void 0 && !compute) {
      this.select(
        select("body")
          .append("svg")
          .style("width", `${window.innerWidth}px`)
          .style("height", `${window.innerHeight}px`)
          .style("display", "block")
          .node(),
      );
    }
    // Compute-mode helper: mount inner shapes scene-only (no parent
    // group needed). `select(null)` is the formal "no mount" signal —
    // Shape.render() honors it as long as renderMode is "compute".
    const mountInner = (parent: string): D3Selection["node"] | null => {
      if (compute) return null as unknown as D3Selection["node"];
      return elem(parent, {parent: this._select}).node();
    };

    const outlierData: DataPoint[] = [];

    const filteredData = groups(this._data, (d: DataPoint, i: number) =>
      this.schema.orient(d, i) === "vertical"
        ? this.schema.x(d, i)
        : this.schema.y(d, i),
    ).map(([key, groupData]: [DataPoint[keyof DataPoint], DataPoint[]]) => {
      const d: DataPoint = {key, values: groupData} as unknown as DataPoint;
      (d as Record<string, unknown>).data = merge(
        d.values as unknown as DataPoint[],
      );
      (d as Record<string, unknown>).i = this._data.indexOf(
        (d.values as unknown as DataPoint[])[0],
      );
      (d as Record<string, unknown>).orient = this.schema.orient(
        d.data as DataPoint,
        d.i as number,
      );
      const values: number[] = (d.values as unknown as DataPoint[]).map(
        (d as Record<string, unknown>).orient === "vertical"
          ? this.schema.y
          : this.schema.x,
      ) as unknown as number[];
      values.sort((a: number, b: number) => a - b);

      (d as Record<string, unknown>).first = quantile(values, 0.25);
      (d as Record<string, unknown>).median = quantile(values, 0.5);
      (d as Record<string, unknown>).third = quantile(values, 0.75);

      const mode = this.schema.whiskerMode;

      if (mode[0] === "tukey") {
        (d as Record<string, unknown>).lowerLimit =
          (d.first as number) -
          ((d.third as number) - (d.first as number)) * 1.5;
        if ((d.lowerLimit as number) < min(values)!)
          (d as Record<string, unknown>).lowerLimit = min(values);
      } else if (mode[0] === "extent")
        (d as Record<string, unknown>).lowerLimit = min(values);
      else if (typeof mode[0] === "number")
        (d as Record<string, unknown>).lowerLimit = quantile(values, mode[0]);

      if (mode[1] === "tukey") {
        (d as Record<string, unknown>).upperLimit =
          (d.third as number) +
          ((d.third as number) - (d.first as number)) * 1.5;
        if ((d.upperLimit as number) > max(values)!)
          (d as Record<string, unknown>).upperLimit = max(values);
      } else if (mode[1] === "extent")
        (d as Record<string, unknown>).upperLimit = max(values);
      else if (typeof mode[1] === "number")
        (d as Record<string, unknown>).upperLimit = quantile(values, mode[1]);

      const rectLength = (d.third as number) - (d.first as number);

      // Compute values for vertical orientation.
      if (d.orient === "vertical") {
        (d as Record<string, unknown>).height = rectLength;
        (d as Record<string, unknown>).width = this.schema.rectWidth(
          d.data as DataPoint,
          d.i as number,
        );
        (d as Record<string, unknown>).x = this.schema.x(
          d.data as DataPoint,
          d.i as number,
        );
        (d as Record<string, unknown>).y = (d.first as number) + rectLength / 2;
      } else if (d.orient === "horizontal") {
        // Compute values for horizontal orientation.
        (d as Record<string, unknown>).height = this.schema.rectWidth(
          d.data as DataPoint,
          d.i as number,
        );
        (d as Record<string, unknown>).width = rectLength;
        (d as Record<string, unknown>).x = (d.first as number) + rectLength / 2;
        (d as Record<string, unknown>).y = this.schema.y(
          d.data as DataPoint,
          d.i as number,
        );
      }

      // Compute data for outliers.
      (d.values as unknown as DataPoint[]).forEach(
        (eachValue: DataPoint, index: number) => {
          const value =
            d.orient === "vertical"
              ? (this.schema.y(eachValue, index) as number)
              : (this.schema.x(eachValue, index) as number);

          if (
            value < (d.lowerLimit as number) ||
            value > (d.upperLimit as number)
          ) {
            const dataObj: DataPoint = {} as DataPoint;
            (dataObj as Record<string, unknown>).__d3plus__ = true;
            (dataObj as Record<string, unknown>).data = eachValue;
            (dataObj as Record<string, unknown>).i = index;
            (dataObj as Record<string, unknown>).outlier = this.schema.outlier(
              eachValue,
              index,
            );

            if (d.orient === "vertical") {
              (dataObj as Record<string, unknown>).x = d.x;
              (dataObj as Record<string, unknown>).y = value;
              outlierData.push(dataObj);
            } else if (d.orient === "horizontal") {
              (dataObj as Record<string, unknown>).y = d.y;
              (dataObj as Record<string, unknown>).x = value;
              outlierData.push(dataObj);
            }
          }
        },
      );

      (d as Record<string, unknown>).__d3plus__ = true;

      return d;
    });

    // Draw box.
    this._box = new Rect()
      .data(filteredData)
      .x((d: DataPoint) => d.x)
      .y((d: DataPoint) => d.y)
      .renderMode(compute ? "compute" : "full")
      .select(mountInner("g.d3plus-Box") as never)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .config(configPrep.bind(this as any)(this.schema.rectConfig, "shape")!)
      .render();

    // Draw median.
    this._median = new Rect()
      .data(filteredData)
      .x((d: DataPoint) => (d.orient === "vertical" ? d.x : d.median))
      .y((d: DataPoint) => (d.orient === "vertical" ? d.median : d.y))
      .height((d: DataPoint) => (d.orient === "vertical" ? 1 : d.height))
      .width((d: DataPoint) => (d.orient === "vertical" ? d.width : 1))
      .renderMode(compute ? "compute" : "full")
      .select(mountInner("g.d3plus-Box-Median") as never)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .config(configPrep.bind(this as any)(this.schema.medianConfig, "shape")!)
      .render();

    // Draw 2 lines using Whisker class.
    // Construct coordinates for whisker startpoints and push it to the whiskerData.
    const whiskerData: DataPoint[] = [];
    filteredData.forEach((d: DataPoint, i: number) => {
      const x = d.x;
      const y = d.y;
      const topLength = (d.first as number) - (d.lowerLimit as number);
      const bottomLength = (d.upperLimit as number) - (d.third as number);

      if (d.orient === "vertical") {
        const topY = (y as number) - (d.height as number) / 2;
        const bottomY = (y as number) + (d.height as number) / 2;
        whiskerData.push(
          {
            __d3plus__: true,
            data: d,
            i,
            x,
            y: topY,
            length: topLength,
            orient: "top",
          } as unknown as DataPoint,
          {
            __d3plus__: true,
            data: d,
            i,
            x,
            y: bottomY,
            length: bottomLength,
            orient: "bottom",
          } as unknown as DataPoint,
        );
      } else if (d.orient === "horizontal") {
        const topX = (x as number) + (d.width as number) / 2;
        const bottomX = (x as number) - (d.width as number) / 2;
        whiskerData.push(
          {
            __d3plus__: true,
            data: d,
            i,
            x: topX,
            y,
            length: bottomLength,
            orient: "right",
          } as unknown as DataPoint,
          {
            __d3plus__: true,
            data: d,
            i,
            x: bottomX,
            y,
            length: topLength,
            orient: "left",
          } as unknown as DataPoint,
        );
      }
    });

    // Draw whiskers.
    this._whisker = new Whisker()
      .data(whiskerData)
      .renderMode(compute ? "compute" : "full")
      .select(mountInner("g.d3plus-Box-Whisker") as never)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .config(configPrep.bind(this as any)(this.schema.whiskerConfig, "shape")!)
      .render();

    // Draw outliers.
    this._whiskerEndpoint = [];
    groups(outlierData, (d: DataPoint) => d.outlier).forEach(
      ([shapeName, values]: [DataPoint[keyof DataPoint], DataPoint[]]) => {
        this._whiskerEndpoint.push(
          new shapes[shapeName as string]()
            .data(values)
            .renderMode(compute ? "compute" : "full")
            .select(mountInner(`g.d3plus-Box-Outlier-${shapeName}`) as never)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .config(configPrep.bind(this as any)(this.schema.outlierConfig, "shape", shapeName as string)!)
            .render(),
        );
      },
    );

    return this;
  }

  /**
      Compute-mode scene aggregation. When Box is rendered with
      `renderMode("compute")`, the inner Rect/Whisker/Circle/etc.
      shapes are mounted scene-only (no parent <g>); their `toScene()`
      methods produce GroupNodes that we wrap into a single Box-level
      group so collectComputed(boxInstance) yields the union.
  */
  toScene(): GroupNode {
    const children: SceneNode[] = [];
    const push = (shape: {toScene?: () => GroupNode | null | undefined} | undefined): void => {
      const g = shape && typeof shape.toScene === "function" ? shape.toScene() : null;
      if (g && Array.isArray(g.children)) children.push(...g.children);
    };
    push(this._box);
    push(this._median);
    push(this._whisker);
    if (Array.isArray(this._whiskerEndpoint))
      for (const ep of this._whiskerEndpoint) push(ep);
    return {
      type: "group",
      key: "d3plus-Box-scene",
      children,
    };
  }

  /**
      The active highlight state for all sub-shapes in this Box.
*/
  active(_: ((d: DataPoint, i: number) => boolean) | null): void {
    if (this._box) this._box.active(_);
    if (this._median) this._median.active(_);
    if (this._whisker) this._whisker.active(_);
    if (this._whiskerEndpoint)
      this._whiskerEndpoint.forEach((endPoint: Circle | Rect) =>
        endPoint.active(_),
      );
  }

  /**
      The data array used to create shapes.
*/
  data(): DataPoint[];
  data(_: DataPoint[]): this;
  data(_?: DataPoint[]): DataPoint[] | this {
    return arguments.length ? ((this._data = _!), this) : this._data;
  }

  /**
      The hover highlight state for all sub-shapes in this Box.
*/
  hover(_: ((d: DataPoint, i: number) => boolean) | null): void {
    if (this._box) this._box.hover(_);
    if (this._median) this._median.hover(_);
    if (this._whisker) this._whisker.hover(_);
    if (this._whiskerEndpoint)
      this._whiskerEndpoint.forEach((endPoint: Circle | Rect) =>
        endPoint.hover(_),
      );
  }

  /**
      Configuration object for the median line.
*/
  medianConfig(): Record<string, unknown>;
  medianConfig(_: Record<string, unknown>): this;
  medianConfig(_?: Record<string, unknown>): Record<string, unknown> | this {
    return arguments.length
      ? ((this.schema.medianConfig = assign(this.schema.medianConfig, _!)), this)
      : this.schema.medianConfig;
  }

  /**
      Configuration object for each outlier point.
*/
  outlierConfig(): Record<string, unknown>;
  outlierConfig(_: Record<string, unknown>): this;
  outlierConfig(_?: Record<string, unknown>): Record<string, unknown> | this {
    return arguments.length
      ? ((this.schema.outlierConfig = assign(this.schema.outlierConfig, _!)), this)
      : this.schema.outlierConfig;
  }

  /**
      Configuration object for the rect shape.
*/
  rectConfig(): Record<string, unknown>;
  rectConfig(_: Record<string, unknown>): this;
  rectConfig(_?: Record<string, unknown>): Record<string, unknown> | this {
    return arguments.length
      ? ((this.schema.rectConfig = assign(this.schema.rectConfig, _!)), this)
      : this.schema.rectConfig;
  }

  /**
      The SVG container element for this visualization. 3 selector or DOM element.
*/
  select(): D3Selection;
  select(_: string | HTMLElement | SVGElement | null): this;
  select(_?: string | HTMLElement | SVGElement | null): D3Selection | this {
    return arguments.length
      ? ((this._select = select(_ as string) as unknown as D3Selection), this)
      : this._select;
  }

  /**
      Configuration object for the whisker.
*/
  whiskerConfig(): Record<string, unknown>;
  whiskerConfig(_: Record<string, unknown>): this;
  whiskerConfig(_?: Record<string, unknown>): Record<string, unknown> | this {
    return arguments.length
      ? ((this.schema.whiskerConfig = assign(this.schema.whiskerConfig, _!)), this)
      : this.schema.whiskerConfig;
  }

  /**
      Narrowed `.config()` for Box. Inherited surface from
      `BaseClass.config()`; the override exists only to surface per-shape
      keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.
  */
  config(): BoxConfig;
  config(_: Partial<BoxConfig>): this;
  config(_?: Partial<BoxConfig>): BoxConfig | this {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (arguments.length ? super.config(_ as any) : super.config()) as any;
  }
}
