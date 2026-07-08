import type {BaseType, Selection} from "d3-selection";

import type {DataPoint} from "@d3plus/data";
import {assign} from "@d3plus/dom";
import type {D3Selection} from "@d3plus/dom";
import {accessor} from "../utils/index.js";
import {installFluent} from "../fluent.js";
import type {ConfigField} from "../fluent.js";

import type {CircleConfig} from "./shapeConfig.js";
import Shape, {type ShapeAes} from "./Shape.js";

/** Circle's own fluent accessor schema, layered on top of Shape's. */
const circleSchema: ConfigField[] = [
  {key: "r", coerce: "accessor", default: accessor("r")},
  // Motion-trail toggle: when true, the animate layer sweeps a tapering cone
  // behind each point as it moves between frames (Timeline play), on both the
  // SVG and Canvas backends.
  {key: "trail", coerce: "identity", default: false},
  // Persistent-trail length: 0 keeps the ephemeral single-move trail; a positive
  // number keeps that many past step-segments (fading older ones out); `true`
  // keeps a long slowly-fading tail. Requires `trail: true`. Setting it also
  // makes the chart use a single-period timeline + fixed axes automatically
  // (see vizPreDraw) — the conditions a persistent trail needs to stay coherent.
  {key: "trailPersist", coerce: "identity", default: 0},
];

/**
    Creates SVG circles based on an array of data.
*/
export default class Circle extends Shape {
  /**
      Invoked when creating a new class instance, and overrides any default parameters inherited from Shape.
      @private
*/
  constructor() {
    super("circle");
    installFluent(this, circleSchema);
    this._name = "Circle";
    // Bound the label to the full circle (diameter box) and tag it
    // `shape: "circle"`, so the label TextBox flows text as circle chords —
    // lines fill the interior, shorter near the top and bottom and full width
    // through the middle — rather than being capped to a square inscribed in
    // the circle. The `shape` hint rides on the bounds (not `labelConfig`) so a
    // chart that repositions the label with its own `labelBounds` (e.g. Tree's
    // external node labels) gets ordinary rectangular wrapping.
    this.schema.labelBounds = (_d: DataPoint, _i: number, s: ShapeAes) => ({
      width: (s.r as number) * 2,
      height: (s.r as number) * 2,
      x: -(s.r as number),
      y: -(s.r as number),
      shape: "circle",
    });
    this.schema.labelConfig = assign(this.schema.labelConfig, {
      textAnchor: "middle",
      verticalAlign: "middle",
    });
  }

  /**
      Provides the default positioning to the <rect> elements.
      @private
*/
  _applyPosition(elem: D3Selection): void {
    (elem as unknown as Selection<BaseType, DataPoint, BaseType, unknown>)
      .attr("r", (d: DataPoint, i: number) => this.schema.r(d, i))
      .attr("x", (d: DataPoint, i: number) => -(this.schema.r(d, i) as number) / 2)
      .attr("y", (d: DataPoint, i: number) => -(this.schema.r(d, i) as number) / 2);
  }

  // v4: render() is inherited from Shape — the scene path handles drawing.

  /**
      Returns the circle geometry for a data point. The circle is centered on the
      transform origin (cx/cy = 0); the group transform positions it.
      @private
*/
  _sceneGeometry(d: DataPoint, i: number): Record<string, unknown> {
    return {
      type: "circle",
      cx: 0,
      cy: 0,
      r: Number(this.schema.r(d, i)),
      ...(this.schema.trail ? {trail: true} : {}),
      ...(this.schema.trailPersist ? {trailPersist: this.schema.trailPersist} : {}),
    };
  }

  /**
      Given a specific data point and index, returns the aesthetic properties of the shape.
      @param data point*
      @param index @private
*/
  _aes(d: DataPoint, i: number): ShapeAes {
    return {r: this.schema.r(d, i) as number};
  }

  /**
      Narrowed `.config()` for Circle. Inherited surface from
      `BaseClass.config()`; the override exists only to surface per-shape
      keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.
  */
  config(): CircleConfig;
  config(_: Partial<CircleConfig>): this;
  config(_?: Partial<CircleConfig>): CircleConfig | this {
    if (!arguments.length) return super.config() as CircleConfig;
    super.config(_!);
    return this;
  }
}
