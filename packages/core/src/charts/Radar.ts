import {groups, min, max, sum} from "d3-array";
import {pointer} from "d3-selection";

import {colorContrast} from "@d3plus/color";
import {merge} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";
import {assign, backgroundColor, elem} from "@d3plus/dom";
import {configPrep, constant} from "../utils/index.js";
import {Circle, Path, Rect} from "../shapes/index.js";
import {radarDef} from "./ChartDefinition.js";
import Viz from "./Viz.js";

const tau = Math.PI * 2;

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
    const height = this._height - this._margin.top - this._margin.bottom,
      width = this._width - this._margin.left - this._margin.right;

    const radius = min([height, width])! / 2 - this._outerPadding,
      transform = `translate(${width / 2}, ${height / 2})`;

    const nestedAxisData = groups(this._filteredData, this._metric),
      nestedGroupData = groups(this._filteredData, this._id, this._metric);

    const maxValue = max(
      nestedGroupData
        .map(([, innerEntries]) =>
          innerEntries.map(([, vals]) =>
            sum(vals, (x, i) => this._value(x, i)),
          ),
        )
        .flat(),
    );

    const circularAxis = Array.from(Array(this._levels).keys()).map(d => ({
      id: d,
      r: radius * ((d + 1) / this._levels),
    }));

    const circleConfig = (configPrep as any).bind(this as any)(
      this._axisConfig.shapeConfig,
      "shape",
      "Circle",
    );
    delete circleConfig.label;

    new Circle()
      .data(circularAxis)
      .select(
        elem("g.d3plus-Radar-radial-circles", {
          parent: this._select,
          enter: {transform},
          update: {transform},
        }).node(),
      )
      .config(circleConfig)
      .render();

    const totalAxis = nestedAxisData.length;
    const polarAxis = nestedAxisData
      .map(([key, values], i) => {
        const d = {key, values};
        const width = this._outerPadding;
        const fontSize =
          (this._shapeConfig.labelConfig.fontSize &&
            this._shapeConfig.labelConfig.fontSize(d, i)) ||
          11;

        const lineHeight = fontSize * 1.4;
        const height = lineHeight * 2;
        const padding = 10,
          quadrant =
            (parseInt(String(360 - ((360 / totalAxis) * i) / 90), 10) % 4) + 1,
          radians = (tau / totalAxis) * i;

        let angle = (360 / totalAxis) * i;

        let textAnchor = "start";
        let x = padding;

        if (quadrant === 2 || quadrant === 3) {
          x = -width - padding;
          textAnchor = "end";
          angle += 180;
        }

        const labelBounds = {
          x,
          y: -height / 2,
          width,
          height,
        };

        return {
          __d3plus__: true,
          data: merge(d.values as DataPoint[], this._aggs),
          i,
          id: d.key,
          key: d.key,
          angle,
          textAnchor,
          labelBounds,
          rotateAnchor: [-x, height / 2],
          x: radius * Math.cos(radians),
          y: radius * Math.sin(radians),
        };
      })
      .sort((a, b) => (a.key as number) - (b.key as number));

    new Rect()
      .data(polarAxis as unknown as DataPoint[])
      .rotate(d => d.angle || 0)
      .width(0)
      .height(0)
      .x(d => d.x)
      .y(d => d.y)
      .label(d => d.id)
      .labelBounds(d => d.labelBounds as unknown as Record<string, unknown>)
      .labelConfig(this._axisConfig.shapeConfig.labelConfig)
      .select(
        elem("g.d3plus-Radar-text", {
          parent: this._select,
          enter: {transform},
          update: {transform},
        }).node(),
      )
      .render();

    new Path()
      .data(polarAxis as unknown as DataPoint[])
      .d(d => `M${0},${0} ${-d.x},${-d.y}`)
      .select(
        elem("g.d3plus-Radar-axis", {
          parent: this._select,
          enter: {transform},
          update: {transform},
        }).node(),
      )
      .config(
        (configPrep as any).bind(this as any)(this._axisConfig.shapeConfig, "shape", "Path"),
      )
      .render();

    const groupData = nestedGroupData.map(([hKey, innerEntries]) => {
      const q = innerEntries.map(([, vals], i) => {
        const value = sum(vals, (x, i) => this._value(x, i));
        const r = (value / maxValue!) * radius,
          radians = (tau / totalAxis) * i;
        return {
          x: r * Math.cos(radians),
          y: r * Math.sin(radians),
        };
      });

      const pathD = `M ${q[0].x} ${q[0].y} ${q
        .map(l => `L ${l.x} ${l.y}`)
        .join(" ")} L ${q[0].x} ${q[0].y}`;

      return {
        arr: innerEntries.map(([, vals]) =>
          merge(vals as DataPoint[], this._aggs),
        ),
        id: hKey,
        points: q,
        d: pathD,
        __d3plus__: true,
        data: merge(
          innerEntries.map(([, vals]) =>
            merge(vals as DataPoint[], this._aggs),
          ) as DataPoint[],
          this._aggs,
        ),
      };
    });

    const pathConfig = (configPrep as any).bind(this as any)(
      this._shapeConfig,
      "shape",
      "Path",
    );
    const events = Object.keys(pathConfig.on as Record<string, unknown> ?? {});
    pathConfig.on = {};
    for (let e = 0; e < events.length; e++) {
      const event = events[e];
      pathConfig.on[event] = (d: any, i: any, s: any, e: any) => {
        const x = d.points.map((p: any) => p.x + width / 2);
        const y = d.points.map((p: any) => p.y + height / 2);
        const cursor = pointer(e, this._select.node());
        const xDist = x.map((p: any) => Math.abs(p - cursor[0]));
        const yDist = y.map((p: any) => Math.abs(p - cursor[1]));
        const dists = xDist.map((d: any, i: any) => d + yDist[i]);
        this._on[event].bind(this)(d.arr[dists.indexOf(min(dists))], i, s, e);
      };
    }

    // Radar polygons emitted by radarDef.emit. The Radar's axis-decoration
    // shapes (circle/rect/path above) still render imperatively to
    // `this._select` — that path will fold into the scene graph when the
    // axis-grid emit lands.
    this._radarCtx = {groupData, pathConfig};
    this._chartScene = radarDef.emit({viz: this} as any);
    // Center transform: same `translate(width/2, height/2)` the legacy
    // .select wrapper used. (width/height already in scope from above.)
    this._chartTransform = {
      x: this._margin.left + width / 2,
      y: this._margin.top + height / 2,
    };

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
