import {groups} from "d3-array";
import {select} from "d3-selection";

import type {DataPoint} from "@d3plus/data";
import {assign, elem} from "@d3plus/dom";
import type {D3Selection} from "@d3plus/dom";
import type {GroupNode, SceneNode} from "@d3plus/render";

import {accessor, BaseClass, configPrep, constant} from "../utils/index.js";
import type {AccessorFn} from "../utils/index.js";

import Circle from "./Circle.js";
import Line from "./Line.js";
import Rect from "./Rect.js";
import type {WhiskerConfig} from "./shapeConfig.js";

const shapes: Record<string, typeof Circle | typeof Rect> = {Circle, Rect};

/**
    Creates SVG whisker based on an array of data.
*/
export default class Whisker extends BaseClass {
  _endpoint: AccessorFn;
  _endpointConfig: Record<string, unknown>;
  _length: AccessorFn;
  _lineConfig: Record<string, unknown>;
  _orient: AccessorFn;
  _x: AccessorFn;
  _y: AccessorFn;
  _data!: DataPoint[];
  _select!: D3Selection;
  _line!: Line;
  _whiskerEndpoint: (Circle | Rect)[];

  /**
      Invoked when creating a new class instance, and overrides any default parameters inherited from BaseClass.
      @private
*/
  constructor() {
    super();

    this._endpoint = accessor("endpoint", "Rect");
    this._endpointConfig = {
      Circle: {
        r: accessor("r", 5),
      },
    };
    this._length = accessor("length", 25);
    this._lineConfig = {};
    this._orient = accessor("orient", "top");
    this._x = accessor("x", 0);
    this._y = accessor("y", 0);
    this._whiskerEndpoint = [];
  }

  /**
      Draws the whisker.
    @param callback Optional callback invoked after rendering completes.
*/
  render(callback?: () => void): this {
    const compute = this._renderMode === "compute";
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
    const mountInner = (parent: string): D3Selection["node"] | null => {
      if (compute) return null as unknown as D3Selection["node"];
      return elem(parent, {parent: this._select}).node();
    };

    const lineData: DataPoint[] = [];
    this._data.forEach((d: DataPoint, i: number) => {
      const orient = this._orient(d, i) as string;
      const x = this._x(d, i) as number;
      const y = this._y(d, i) as number;

      let endpointX = x;
      if (orient === "left") endpointX -= this._length(d, i) as number;
      else if (orient === "right") endpointX += this._length(d, i) as number;

      let endpointY = y;
      if (orient === "top") endpointY -= this._length(d, i) as number;
      else if (orient === "bottom") endpointY += this._length(d, i) as number;

      lineData.push({
        __d3plus__: true,
        data: d,
        i,
        id: i,
        x,
        y,
      } as unknown as DataPoint);
      lineData.push({
        __d3plus__: true,
        data: d,
        i,
        id: i,
        x: endpointX,
        y: endpointY,
      } as unknown as DataPoint);
    });

    // Draw whisker line. Don't pass `callback` to the inner Line —
    // doing so would fire the caller's done-callback after the LINE
    // finished but BEFORE endpoint shapes (below) are rendered.
    this._line = new Line()
      .data(lineData)
      .renderMode(compute ? "compute" : "full")
      .select(mountInner("g.d3plus-Whisker") as never)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .config(configPrep.bind(this as any)(this._lineConfig, "shape")!)
      .render();

    const whiskerData = this._data.map((d: DataPoint, i: number) => {
      const dataObj: DataPoint = {} as DataPoint;
      (dataObj as Record<string, unknown>).__d3plus__ = true;
      (dataObj as Record<string, unknown>).data = d;
      (dataObj as Record<string, unknown>).i = i;
      (dataObj as Record<string, unknown>).endpoint = this._endpoint(d, i);
      (dataObj as Record<string, unknown>).length = this._length(d, i);
      (dataObj as Record<string, unknown>).orient = this._orient(d, i);

      let endpointX = this._x(d, i) as number;
      if (dataObj.orient === "left") endpointX -= dataObj.length as number;
      else if (dataObj.orient === "right")
        endpointX += dataObj.length as number;

      let endpointY = this._y(d, i) as number;
      if (dataObj.orient === "top") endpointY -= dataObj.length as number;
      else if (dataObj.orient === "bottom")
        endpointY += dataObj.length as number;

      (dataObj as Record<string, unknown>).x = endpointX;
      (dataObj as Record<string, unknown>).y = endpointY;

      return dataObj;
    });

    // Draw whisker endpoint.
    this._whiskerEndpoint = [];
    groups(whiskerData, (d: DataPoint) => d.endpoint).forEach(
      ([shapeName, values]: [DataPoint[keyof DataPoint], DataPoint[]]) => {
        this._whiskerEndpoint.push(
          new shapes[shapeName as string]()
            .data(values)
            .renderMode(compute ? "compute" : "full")
            .select(mountInner(`g.d3plus-Whisker-Endpoint-${shapeName}`) as never)
            .config({
              height: (d: DataPoint) =>
                d.orient === "top" || d.orient === "bottom" ? 5 : 20,
              width: (d: DataPoint) =>
                d.orient === "top" || d.orient === "bottom" ? 20 : 5,
            })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .config(configPrep.bind(this as any)(this._endpointConfig, "shape", shapeName as string)!)
            .render(),
        );
      },
    );

    // Fire the user's done-callback only AFTER endpoints are rendered.
    // The inner shapes don't have a single shared transition queue we
    // can hook into; the legacy behavior used setTimeout(duration+100)
    // to wait for transitions to complete, so do the same here.
    if (callback) setTimeout(callback, (this as any)._duration ? (this as any)._duration + 100 : 0);

    return this;
  }

  /**
      Compute-mode scene aggregation, mirroring Box.toScene(). Returns a
      GroupNode containing the inner Line's scene children plus each
      endpoint shape's scene children.
  */
  toScene(): GroupNode {
    const children: SceneNode[] = [];
    const push = (shape: {toScene?: () => GroupNode | null | undefined} | undefined): void => {
      const g = shape && typeof shape.toScene === "function" ? shape.toScene() : null;
      if (g && Array.isArray(g.children)) children.push(...g.children);
    };
    push(this._line);
    if (Array.isArray(this._whiskerEndpoint))
      for (const ep of this._whiskerEndpoint) push(ep);
    return {type: "group", key: "d3plus-Whisker-scene", children};
  }

  /**
      The active highlight state for all sub-shapes in this Whisker.
*/
  active(_: ((d: DataPoint, i: number) => boolean) | null): void {
    if (this._line) this._line.active(_);
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
      The endpoint shape type for each whisker.
*/
  endpoint(): AccessorFn;
  endpoint(_: AccessorFn | string): this;
  endpoint(_?: AccessorFn | string): AccessorFn | this {
    return arguments.length
      ? ((this._endpoint = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn), this)
      : this._endpoint;
  }

  /**
      Configuration object for each endpoint.
*/
  endpointConfig(): Record<string, unknown>;
  endpointConfig(_: Record<string, unknown>): this;
  endpointConfig(_?: Record<string, unknown>): Record<string, unknown> | this {
    return arguments.length
      ? ((this._endpointConfig = assign(this._endpointConfig, _!)), this)
      : this._endpointConfig;
  }

  /**
      The hover highlight state for all sub-shapes in this Whisker.
*/
  hover(_: ((d: DataPoint, i: number) => boolean) | null): void {
    if (this._line) this._line.hover(_);
    if (this._whiskerEndpoint)
      this._whiskerEndpoint.forEach((endPoint: Circle | Rect) =>
        endPoint.hover(_),
      );
  }

  /**
      Length accessor for whisker.
*/
  length(): AccessorFn;
  length(_: AccessorFn | number): this;
  length(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._length = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn), this)
      : this._length;
  }

  /**
      Configuration object for the line shape.
*/
  lineConfig(): Record<string, unknown>;
  lineConfig(_: Record<string, unknown>): this;
  lineConfig(_?: Record<string, unknown>): Record<string, unknown> | this {
    return arguments.length
      ? ((this._lineConfig = assign(this._lineConfig, _!)), this)
      : this._lineConfig;
  }

  /**
      The orientation of the whisker shape.
*/
  orient(): AccessorFn;
  orient(_: AccessorFn | string): this;
  orient(_?: AccessorFn | string): AccessorFn | this {
    return arguments.length
      ? ((this._orient = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn), this)
      : this._orient;
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
    The x position accessor for each whisker.

@example
function(d) {
  return d.x;
}
*/
  x(): AccessorFn;
  x(_: AccessorFn | number): this;
  x(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._x = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn), this)
      : this._x;
  }

  /**
      The y position accessor for each whisker.

@example
function(d) {
  return d.y;
}
*/
  y(): AccessorFn;
  y(_: AccessorFn | number): this;
  y(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._y = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn), this)
      : this._y;
  }

  /**
      Narrowed `.config()` for Whisker. Inherited surface from
      `BaseClass.config()`; the override exists only to surface per-shape
      keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.
  */
  config(): WhiskerConfig;
  config(_: Partial<WhiskerConfig>): this;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config(_?: Partial<WhiskerConfig>): WhiskerConfig | this {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (arguments.length ? super.config(_ as any) : super.config()) as any;
  }

  /**
      Render-mode toggle. `"compute"` propagates to the inner Line +
      endpoint shapes (each is mounted scene-only via `select(null)`);
      `Whisker.toScene()` aggregates their scenes into a single group.
      `"full"` (default) preserves the legacy DOM-mounting path.
  */
  _renderMode?: "full" | "compute";
  renderMode(): "full" | "compute";
  renderMode(_: "full" | "compute"): this;
  renderMode(_?: "full" | "compute"): "full" | "compute" | this {
    if (!arguments.length) return this._renderMode || "full";
    this._renderMode = _;
    return this;
  }
}
