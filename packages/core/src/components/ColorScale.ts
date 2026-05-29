import {extent, max, min, quantile, range, deviation} from "d3-array";
import {interpolateRgb} from "d3-interpolate";
import {scaleLinear, scaleThreshold} from "d3-scale";
import {select} from "d3-selection";
import {transition} from "d3-transition";

import {colorContrast, colorDefaults, colorLighter} from "@d3plus/color";
import {unique} from "@d3plus/data";
import {assign, backgroundColor, elem, textWidth} from "@d3plus/dom";
import type {D3Selection} from "@d3plus/dom";
import {formatAbbreviate} from "@d3plus/format";
import {ckmeans} from "@d3plus/math";

import type {DataPoint} from "@d3plus/data";

import {Axis, TextBox} from "../components/index.js";
import {Rect} from "../shapes/index.js";
import {accessor, BaseClass} from "../utils/index.js";
import {installFluent} from "../fluent.js";
import type {ConfigField} from "../fluent.js";

import Legend from "./Legend.js";

/** ColorScale's fluent accessor schema. Config storage lives on `this.schema.<key>`. */
const colorScaleSchema: ConfigField[] = [
  {key: "align", coerce: "identity", default: "middle"},
  {key: "buckets", coerce: "identity", default: 5},
  {key: "bucketAxis", coerce: "identity", default: false},
  {key: "bucketFormat", coerce: "identity"},
  {
    key: "bucketJoiner",
    coerce: "identity",
    default: (a: string, b: string): string => (a !== b ? `${a} - ${b}` : `${a}`),
  },
  {key: "centered", coerce: "identity", default: true},
  {
    key: "color",
    coerce: "identity",
    default: ["#54478C", "#2C699A", "#0DB39E", "#83E377", "#EFEA5A"],
  },
  {key: "colorMax", coerce: "identity", default: colorDefaults.on},
  {key: "colorMid", coerce: "identity", default: colorDefaults.light},
  {key: "colorMin", coerce: "identity", default: colorDefaults.off},
  {key: "domain", coerce: "identity"},
  {key: "duration", coerce: "identity", default: 600},
  {key: "height", coerce: "identity", default: 200},
  {key: "midpoint", coerce: "identity", default: 0},
  {key: "orient", coerce: "identity", default: "bottom"},
  {key: "padding", coerce: "identity", default: 5},
  {key: "scale", coerce: "identity", default: "linear"},
  {key: "size", coerce: "identity", default: 10},
  {key: "value", coerce: "const", default: accessor("value")},
  {key: "width", coerce: "identity", default: 400},
];

/**
    Creates an SVG color scale based on an array of data.
*/
export default class ColorScale extends BaseClass {
  // installFluent generates the config accessors (align, buckets, …) at
  // runtime; the index signature lets callers reach them through the type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  _select!: D3Selection;
  _axisClass: Axis;
  _axisTest: Axis;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _colorScale: any;
  _data: DataPoint[];
  _group!: D3Selection;
  _labelClass: TextBox;
  _labelMin: string | undefined;
  _labelMax: string | undefined;
  _legendClass: Legend;
  _outerBounds: Record<string, number>;
  _rectClass: Rect;

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
*/
  constructor() {
    super();
    installFluent(this, colorScaleSchema);

    this._axisClass = new Axis();
    this.schema.axisConfig = {
      gridSize: 0,
    };
    this._axisTest = new Axis();
    this.schema.bucketFormat = (
      tick: number,
      i: number,
      ticks: number[],
      allValues: number[],
    ): string => {
      const format = (this.schema.axisConfig.tickFormat
        ? this.schema.axisConfig.tickFormat
        : formatAbbreviate) as (v: number | undefined) => string;

      const next = ticks[i + 1];
      const prev = i ? ticks[i - 1] : false;
      const last = i === ticks.length - 1;
      if (tick === next || last) {
        const suffix = last && tick < max(allValues)! ? "+" : "";
        return `${format(tick)}${suffix}`;
      } else {
        const mod = next ? next / 100 : tick / 100;

        const pow =
          mod >= 1 || mod <= -1
            ? Math.round(mod).toString().length - 1
            : mod
                .toString()
                .split(".")[1]
                .replace(/([1-9])[1-9].*$/, "$1").length * -1;
        const ten = Math.pow(10, pow);

        const prevValue =
          prev === tick && i === 1
            ? format(
                min([
                  tick + ten,
                  allValues.find((d: number) => d > tick && d < next),
                ] as number[]),
              )
            : format(tick);

        const nextValue =
          tick && i === 1
            ? format(next)
            : format(
                max([
                  next - ten,
                  allValues.reverse().find((d: number) => d > tick && d < next),
                ] as number[]),
              );

        return this.schema.bucketJoiner(prevValue, nextValue);
      }
    };
    this._data = [];
    this._labelClass = new TextBox();
    this.schema.labelConfig = {
      fontColor: () => {
        const bg = this._select ? backgroundColor(this._select.node()) : "rgb(255, 255, 255)";
        return colorContrast(bg);
      },
      fontSize: 12,
    };
    this._legendClass = new Legend();
    this.schema.legendConfig = {
      shapeConfig: {
        stroke: colorDefaults.dark,
        strokeWidth: 1,
      },
    };
    this._outerBounds = {width: 0, height: 0, x: 0, y: 0};
    this._rectClass = new Rect().parent(
      this as unknown as Record<string, unknown>,
    );
    this.schema.rectConfig = {
      stroke: "#999",
      strokeWidth: 1,
    };
  }

  /**
      Renders the current ColorScale to the page.
    @param callback Optional callback invoked after rendering completes.
*/
  render(callback?: (...args: unknown[]) => unknown): this {
    // Skip the body-svg fallback in compute mode — mirrors Axis +
    // Legend so the caller can do a DOM-free snapshot via toScene().
    if (this._select === void 0 && this._renderMode !== "compute")
      this.select(
        select("body")
          .append("svg")
          .attr("width", `${this.schema.width}px`)
          .attr("height", `${this.schema.height}px`)
          .node() as unknown as HTMLElement,
      );

    const horizontal = ["bottom", "top"].includes(this.schema.orient);

    const height = horizontal ? "height" : "width",
      width = horizontal ? "width" : "height",
      x = horizontal ? "x" : "y",
      y = horizontal ? "y" : "x";

    // Shape <g> Group
    this._group = elem("g.d3plus-ColorScale", {parent: this._select});

    const allValues = (this._data
      .map(this.schema.value)
      .filter((d: unknown) => d !== null && typeof d === "number") as number[])
      .sort((a: number, b: number) => a - b);

    const domain = this.schema.domain || extent(allValues);
    const negative = (domain as number[])[0] < this.schema.midpoint;
    const positive = (domain as number[])[1] > this.schema.midpoint;
    const diverging = negative && positive;

    const numBuckets = min([
      this.schema.buckets instanceof Array ? this.schema.buckets.length : this.schema.buckets,
      diverging && this.schema.scale !== "jenks"
        ? 2 * Math.floor(unique(allValues).length / 2) - 1
        : unique(allValues).length,
    ])!;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let colors: any =
        diverging &&
        (!this.schema.color ||
          (this.schema.color instanceof Array &&
            !this.schema.color.includes(this.schema.colorMid)))
          ? undefined
          : this.schema.color,
      labels: number[] | undefined,
      ticks: number[] | undefined;

    if (colors && !(colors instanceof Array)) {
      colors = range(0, numBuckets, 1)
        .map((i: number) => colorLighter(colors, (i + 1) / numBuckets))
        .reverse();
    }

    if (this.schema.scale === "jenks") {
      const buckets = min([
        colors ? colors.length : numBuckets,
        numBuckets,
        allValues.length,
      ])!;

      let jenks: number[][] = [];

      if (this.schema.buckets instanceof Array) {
        ticks = this.schema.buckets;
      } else {
        if (diverging && this.schema.centered) {
          const half = Math.floor(buckets / 2);
          const residual = buckets % 2;

          const negatives = allValues.filter((d: number) => d < this.schema.midpoint);
          const negativesDeviation = deviation(negatives);

          const positives = allValues
            .concat(this.schema.midpoint)
            .filter((d: number) => d >= this.schema.midpoint);
          const positivesDeviation = deviation(positives);

          const isNegativeMax =
            negativesDeviation! > positivesDeviation! ? 1 : 0;
          const isPositiveMax =
            positivesDeviation! > negativesDeviation! ? 1 : 0;

          const negativeJenks = ckmeans(
            negatives,
            min([half + residual * isNegativeMax, negatives.length])!,
          );
          const positiveJenks = ckmeans(
            positives,
            min([half + residual * isPositiveMax, positives.length])!,
          );

          jenks = negativeJenks.concat(positiveJenks);
        } else {
          jenks = ckmeans(allValues, buckets);
        }

        ticks = jenks.map((c: number[]) => c[0]);
      }

      const tickSet = new Set(ticks);

      if (ticks.length !== tickSet.size) labels = Array.from(tickSet);

      if (!colors) {
        if (diverging) {
          colors = [this.schema.colorMin, this.schema.colorMid, this.schema.colorMax];
          const negatives = ticks
            .slice(0, buckets)
            .filter(
              (d: number, i: number) =>
                d < this.schema.midpoint && ticks![i + 1] <= this.schema.midpoint,
            );
          const spanning = ticks
            .slice(0, buckets)
            .filter(
              (d: number, i: number) =>
                d <= this.schema.midpoint && ticks![i + 1] > this.schema.midpoint,
            );
          const positives = ticks
            .slice(0, buckets)
            .filter((d: number) => d > this.schema.midpoint);
          const negativeColors = negatives.map((_d: number, i: number) =>
            !i ? colors[0] : colorLighter(colors[0], i / negatives.length),
          );
          const spanningColors = spanning.map(() => colors[1]);
          const positiveColors = positives.map((_d: number, i: number) =>
            i === positives.length - 1
              ? colors[2]
              : colorLighter(colors[2], 1 - (i + 1) / positives.length),
          );
          colors = negativeColors.concat(spanningColors).concat(positiveColors);
        } else {
          colors = range(0, numBuckets, 1)
            .map((i: number) => colorLighter(this.schema.colorMax, i / numBuckets))
            .reverse();
        }
      }

      if (ticks.length <= buckets) colors = colors.slice(-ticks.length);

      colors = [colors[0]].concat(colors);

      this._colorScale = scaleThreshold().domain(ticks).range(colors);
    } else {
      let buckets = this.schema.buckets instanceof Array ? this.schema.buckets : undefined;
      if (diverging && !colors) {
        const half = Math.floor(numBuckets / 2);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const negativeColorScale = (interpolateRgb as any).gamma(2.2)(
          this.schema.colorMin,
          this.schema.colorMid,
        );
        const negativeColors = range(0, half, 1).map((i: number) =>
          negativeColorScale(i / half),
        );
        const spanningColors = (numBuckets % 2 ? [0] : []).map(
          () => this.schema.colorMid,
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const positiveColorScale = (interpolateRgb as any).gamma(2.2)(
          this.schema.colorMax,
          this.schema.colorMid,
        );
        const positiveColors = range(0, half, 1)
          .map((i: number) => positiveColorScale(i / half))
          .reverse();
        colors = negativeColors.concat(spanningColors).concat(positiveColors);
        if (!buckets) {
          const step = (colors.length - 1) / 2;
          buckets = [
            (domain as number[])[0],
            this.schema.midpoint,
            (domain as number[])[1],
          ];
          buckets = range(
            (domain as number[])[0],
            this.schema.midpoint,
            -((domain as number[])[0] - this.schema.midpoint) / step,
          )
            .concat(
              range(
                this.schema.midpoint,
                (domain as number[])[1],
                ((domain as number[])[1] - this.schema.midpoint) / step,
              ),
            )
            .concat([(domain as number[])[1]]);
        }
      } else {
        if (!colors) {
          if (this.schema.scale === "buckets" || this.schema.scale === "quantile") {
            colors = range(0, numBuckets, 1).map((i: number) =>
              colorLighter(
                negative ? this.schema.colorMin : this.schema.colorMax,
                i / numBuckets,
              ),
            );
            if (positive) colors = colors.reverse();
          } else {
            colors = negative
              ? [this.schema.colorMin, colorLighter(this.schema.colorMin, 0.8)]
              : [colorLighter(this.schema.colorMax, 0.8), this.schema.colorMax];
          }
        }
        if (!buckets) {
          if (this.schema.scale === "quantile") {
            const step = 1 / (colors.length - 1);
            buckets = range(0, 1 + step / 2, step).map((d: number) =>
              quantile(allValues, d),
            ) as number[];
          } else if (diverging && this.schema.color && this.schema.centered) {
            const midIndex = colors.indexOf(this.schema.colorMid);
            const negativeStep =
              (this.schema.midpoint - (domain as number[])[0]) / midIndex;
            const positiveStep =
              ((domain as number[])[1] - this.schema.midpoint) /
              (colors.length - midIndex);
            const negativeBuckets = range(
              (domain as number[])[0],
              this.schema.midpoint,
              negativeStep,
            );
            const positiveBuckets = range(
              this.schema.midpoint,
              (domain as number[])[1] + positiveStep / 2,
              positiveStep,
            );

            buckets = negativeBuckets.concat(positiveBuckets);
          } else {
            const step =
              ((domain as number[])[1] - (domain as number[])[0]) /
              (colors.length - 1);
            buckets = range(
              (domain as number[])[0],
              (domain as number[])[1] + step / 2,
              step,
            );
          }
        }
      }

      if (this.schema.scale === "buckets" || this.schema.scale === "quantile") {
        ticks = buckets;
        colors = [colors[0]].concat(colors);
      } else if (this.schema.scale === "log") {
        const negativeBuckets = (buckets as number[]).filter((d: number) => d < 0);
        if (negativeBuckets.length) {
          const minVal = negativeBuckets[0];
          const newNegativeBuckets = negativeBuckets.map(
            (d: number) => -Math.pow(Math.abs(minVal), d / minVal),
          );
          negativeBuckets.forEach((bucket: number, i: number) => {
            (buckets as number[])[(buckets as number[]).indexOf(bucket)] =
              newNegativeBuckets[i];
          });
        }
        const positiveBuckets = (buckets as number[]).filter((d: number) => d > 0);
        if (positiveBuckets.length) {
          const maxVal = positiveBuckets[positiveBuckets.length - 1];
          const newPositiveBuckets = positiveBuckets.map((d: number) =>
            Math.pow(maxVal, d / maxVal),
          );
          positiveBuckets.forEach((bucket: number, i: number) => {
            (buckets as number[])[(buckets as number[]).indexOf(bucket)] =
              newPositiveBuckets[i];
          });
        }
        if ((buckets as number[]).includes(0))
          (buckets as number[])[(buckets as number[]).indexOf(0)] = 1;
      }

      const scaleFn = this.schema.scale === "buckets" || this.schema.scale === "quantile"
        ? scaleThreshold
        : scaleLinear;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this._colorScale = (scaleFn as (...args: unknown[]) => any)()
        .domain(buckets)
        .range(colors);
    }

    if (this._colorScale.clamp) this._colorScale.clamp(true);

    const gradient =
      this.schema.bucketAxis ||
      !["buckets", "jenks", "quantile"].includes(this.schema.scale);
    const t = transition().duration(this.schema.duration);
    const groupParams: Record<string, unknown> = {
      enter: {opacity: 0},
      exit: {opacity: 0},
      parent: this._group,
      transition: t,
      update: {opacity: 1},
    };
    const labelGroup = elem(
      "g.d3plus-ColorScale-labels",
      Object.assign({condition: gradient}, groupParams),
    );
    const rectGroup = elem(
      "g.d3plus-ColorScale-Rect",
      Object.assign({condition: gradient}, groupParams),
    );
    const legendGroup = elem(
      "g.d3plus-ColorScale-legend",
      Object.assign({condition: !gradient}, groupParams),
    );

    if (gradient) {
      const offsets: Record<string, number> = {x: 0, y: 0};

      const axisDomain = (domain as number[]).slice();
      if (this.schema.bucketAxis) {
        const last = axisDomain[axisDomain.length - 1];
        const prev = axisDomain[axisDomain.length - 2];
        const mod = last ? last / 10 : prev / 10;

        const pow =
          mod >= 1 || mod <= -1
            ? Math.round(mod).toString().length - 1
            : mod
                .toString()
                .split(".")[1]
                .replace(/([1-9])[1-9].*$/, "$1").length * -1;
        const ten = Math.pow(10, pow);
        axisDomain[axisDomain.length - 1] = last + ten;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axisConfig: Record<string, any> = assign(
        {
          domain: horizontal ? axisDomain : axisDomain.slice().reverse(),
          duration: this.schema.duration,
          height: this.schema.height,
          labels: labels || ticks,
          orient: this.schema.orient,
          padding: this.schema.padding,
          scale: this.schema.scale === "log" ? "log" : "linear",
          ticks,
          width: this.schema.width,
        },
        this.schema.axisConfig,
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const labelConfig: Record<string, any> = assign(
        {
           
          height: this.schema[height] / 2,
           
          width: this.schema[width] / 2,
        },
        this.schema.labelConfig,
      );

      this._labelClass.config(labelConfig);
      const labelData: string[] = [];

      if (horizontal && this._labelMin) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const labelCSS: Record<string, any> = {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          "font-family": (this._labelClass.fontFamily() as any)(this._labelMin),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          "font-size": (this._labelClass.fontSize() as any)(this._labelMin),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          "font-weight": (this._labelClass.fontWeight() as any)(this._labelMin),
        };

        if (labelCSS["font-family"] instanceof Array)
          labelCSS["font-family"] = labelCSS["font-family"][0];
        let labelMinWidth = textWidth(this._labelMin, labelCSS);

         
        if (labelMinWidth && labelMinWidth < this.schema[width] / 2) {
          labelData.push(this._labelMin);
          labelMinWidth += this.schema.padding;
          if (horizontal) offsets.x += labelMinWidth;
          axisConfig[width] -= labelMinWidth;
        }
      }
      if (horizontal && this._labelMax) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const labelCSS: Record<string, any> = {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          "font-family": (this._labelClass.fontFamily() as any)(this._labelMax),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          "font-size": (this._labelClass.fontSize() as any)(this._labelMax),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          "font-weight": (this._labelClass.fontWeight() as any)(this._labelMax),
        };

        if (labelCSS["font-family"] instanceof Array)
          labelCSS["font-family"] = labelCSS["font-family"][0];
        let labelMaxWidth = textWidth(this._labelMax, labelCSS);

         
        if (labelMaxWidth && labelMaxWidth < this.schema[width] / 2) {
          labelData.push(this._labelMax);
          labelMaxWidth += this.schema.padding;
          if (!horizontal) offsets.y += labelMaxWidth;
          axisConfig[width] -= labelMaxWidth;
        }
      }

      this._axisTest
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .renderMode("compute" as any)
        .select(
          elem("g.d3plus-ColorScale-axisTest", {
            enter: {opacity: 0},
            parent: this._group,
          }).node(),
        )
        .config(axisConfig)
        .duration(0)
        .render();

      const axisBounds = this._axisTest.outerBounds();

       
      this._outerBounds[width] = this.schema[width] - this.schema.padding * 2;
      this._outerBounds[height] = axisBounds[height] + this.schema.size;

      this._outerBounds[x] = this.schema.padding;
      this._outerBounds[y] = this.schema.padding;
      if (this.schema.align === "middle")
        this._outerBounds[y] =
           
          (this.schema[height] - this._outerBounds[height]) / 2;
      else if (this.schema.align === "end")
        this._outerBounds[y] =
           
          this.schema[height] -
          this.schema.padding -
          this._outerBounds[height];

      const axisGroupOffset =
        this._outerBounds[y] +
        (["bottom", "right"].includes(this.schema.orient) ? this.schema.size : 0) -
        (axisConfig.padding || this._axisClass.padding());
      const transform = `translate(${offsets.x + (horizontal ? 0 : axisGroupOffset)}, ${offsets.y + (horizontal ? axisGroupOffset : 0)})`;
      this._axisClass
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .renderMode("compute" as any)
        .select(
          elem(
            "g.d3plus-ColorScale-axis",
            assign(groupParams, {
              condition: true,
              enter: {transform},
              update: {transform},
            }),
          ).node(),
        )
        .config(axisConfig)
        .align("start")
        .render();

      const axisScale = this._axisTest._getPosition.bind(this._axisTest);
      const scaleRange = this._axisTest._getRange();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let defs: any = this._group.selectAll("defs").data([0]);
      const defsEnter = defs.enter().append("defs");
      defsEnter.append("linearGradient").attr("id", `gradient-${this._uuid}`);
      defs = defsEnter.merge(defs);
      defs
        .select("linearGradient")
        .attr(`${x}1`, horizontal ? "0%" : "100%")
        .attr(`${x}2`, horizontal ? "100%" : "0%")
        .attr(`${y}1`, "0%")
        .attr(`${y}2`, "0%");
      const stops = defs
        .select("linearGradient")
        .selectAll("stop")
        .data(colors);
      const scaleDomain = this._colorScale.domain();
      const offsetScale = scaleLinear()
        .domain(scaleRange as number[])
        .range(horizontal ? [0, 100] : [100, 0]);

      stops
        .enter()
        .append("stop")
        .merge(stops as never)
        .attr(
          "offset",
          (_d: unknown, i: number) =>
            `${i <= scaleDomain.length - 1 ? offsetScale(axisScale(scaleDomain[i])) : 100}%`,
        )
        .attr("stop-color", String);

      /** determines the width of buckets*/
      const bucketWidth = (d: number, i: number): number => {
        const next = ticks![i + 1] || axisDomain[axisDomain.length - 1];
        return Math.abs(axisScale(next) - axisScale(d));
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rectConfig: Record<string, any> = assign(
        {
          duration: this.schema.duration,
          fill: ticks
            ? (d: number) => this._colorScale(d)
            : `url(#gradient-${this._uuid})`,
          [x]: ticks
            ? (d: number, i: number) =>
                axisScale(d) +
                bucketWidth(d, i) / 2 -
                (["left", "right"].includes(this.schema.orient)
                  ? bucketWidth(d, i)
                  : 0)
            : (scaleRange[0] as number) + ((scaleRange[1] as number) - (scaleRange[0] as number)) / 2 + offsets[x],
          [y]:
            this._outerBounds[y] +
            (["top", "left"].includes(this.schema.orient) ? axisBounds[height] : 0) +
            this.schema.size / 2 +
            offsets[y],
          [width]: ticks ? bucketWidth : (scaleRange[1] as number) - (scaleRange[0] as number),
          [height]: this.schema.size,
        },
        this.schema.rectConfig,
      );

      // Phase D parity: force internal shapes into compute mode so they
      // populate label/scene data without spinning up their own SvgRenderer
      // (which would nest a second <svg> into the page — Phase D bug surfaced
      // by the JSDOM ColorScale-test). Legend/Axis do the same.
      this._rectClass
        .renderMode("compute")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .data((ticks || [0]) as any)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .id(((_d: unknown, i: number) => i) as any)
        .select(rectGroup.node())
        .config(rectConfig)
        .render();

      labelConfig.height = this._outerBounds[height];
      labelConfig.width = this._outerBounds[width];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this._labelClass as any).renderMode("compute");
      this._labelClass
        .config(labelConfig)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .data(labelData as any)
        .select(labelGroup.node())
        .x(((d: DataPoint) =>
          (d as unknown as string) === this._labelMax
            ? rectConfig.x + rectConfig.width / 2 + this.schema.padding
            : this._outerBounds.x) as unknown as number)
        .y(
          ((d: DataPoint) =>
            rectConfig.y -
            (this._labelClass.fontSize() as (d: DataPoint) => number)(d) /
              2) as unknown as number,
        )
        .text(((d: DataPoint) => d) as unknown as string)
        .rotate(horizontal ? 0 : this.schema.orient === "right" ? 90 : -90)
        .render();
    } else {
      elem(
        "g.d3plus-ColorScale-axis",
        Object.assign({condition: gradient}, groupParams),
      );

      let legendData = ticks!.reduce((arr: {color: string; id: string}[], tick: number, i: number) => {
        const label = this.schema.bucketFormat.bind(this)(tick, i, ticks!, allValues);
        arr.push({color: colors[i + 1], id: label});

        return arr;
      }, []);
      if (!horizontal) legendData = legendData.reverse();

      const legendConfig = assign(
        {
          align: horizontal
            ? "center"
            : ({start: "left", middle: "center", end: "right"} as Record<string, string>)[this.schema.align],
          direction: horizontal ? "row" : "column",
          duration: this.schema.duration,
          height: this.schema.height,
          padding: this.schema.padding,
          shapeConfig: assign(
            {duration: this.schema.duration} as Record<string, unknown>,
            (this.schema.axisConfig.shapeConfig || {}) as Record<string, unknown>,
          ),
          title: this.schema.axisConfig.title,
          titleConfig: (this.schema.axisConfig.titleConfig || {}) as Record<string, unknown>,
          width: this.schema.width,
          verticalAlign: horizontal
            ? ({start: "top", middle: "middle", end: "bottom"} as Record<string, string>)[this.schema.align]
            : "middle",
        } as Record<string, unknown>,
        this.schema.legendConfig,
      );

      this._legendClass
        .renderMode("compute")
        .data(legendData)
        .select(legendGroup.node())
        .config(legendConfig)
        .render();

      this._outerBounds = this._legendClass.outerBounds();
    }

    if (callback) setTimeout(callback, this.schema.duration + 100);

    return this;
  }

  /**
      The [ColorScale](http://d3plus.org/docs/#ColorScale) is constructed by combining an [Axis](http://d3plus.org/docs/#Axis) for the ticks/labels and a [Rect](http://d3plus.org/docs/#Rect) for the actual color box (or multiple boxes, as in a jenks scale). Because of this, there are separate configs for the [Axis](http://d3plus.org/docs/#Axis) class used to display the text ([axisConfig](http://d3plus.org/docs/#ColorScale.axisConfig)) and the [Rect](http://d3plus.org/docs/#Rect) class used to draw the color breaks ([rectConfig](http://d3plus.org/docs/#ColorScale.rectConfig)). This method acts as a pass-through to the config method of the [Axis](http://d3plus.org/docs/#Axis). An example usage of this method can be seen [here](http://d3plus.org/examples/d3plus-legend/colorScale-dark/).
*/
  axisConfig(): Record<string, unknown>;
  axisConfig(_: Record<string, unknown>): this;
  axisConfig(_?: Record<string, unknown>): unknown {
    return arguments.length
      ? ((this.schema.axisConfig = assign(this.schema.axisConfig, _!)), this)
      : this.schema.axisConfig;
  }

  /**
      The data array used to create shapes. A shape key will be drawn for each object in the array.
*/
  data(): DataPoint[];
  data(_: DataPoint[]): this;
  data(_?: DataPoint[]): unknown {
    return arguments.length ? ((this._data = _!), this) : this._data;
  }

  /**
      A pass-through for the [TextBox](http://d3plus.org/docs/#TextBox) class used to style the labelMin and labelMax text.
*/
  labelConfig(): Record<string, unknown>;
  labelConfig(_: Record<string, unknown>): this;
  labelConfig(_?: Record<string, unknown>): unknown {
    return arguments.length
      ? ((this.schema.labelConfig = assign(this.schema.labelConfig, _!)), this)
      : this.schema.labelConfig;
  }

  /**
      Defines a text label to be displayed off of the end of the minimum point in the scale (currently only available in horizontal orientation).
*/
  labelMin(): string | undefined;
  labelMin(_: string): this;
  labelMin(_?: string): unknown {
    return arguments.length ? ((this._labelMin = _), this) : this._labelMin;
  }

  /**
      Defines a text label to be displayed off of the end of the maximum point in the scale (currently only available in horizontal orientation).
*/
  labelMax(): string | undefined;
  labelMax(_: string): this;
  labelMax(_?: string): unknown {
    return arguments.length ? ((this._labelMax = _), this) : this._labelMax;
  }

  /**
      The [ColorScale](http://d3plus.org/docs/#ColorScale) is constructed by combining an [Axis](http://d3plus.org/docs/#Axis) for the ticks/labels and a [Rect](http://d3plus.org/docs/#Rect) for the actual color box (or multiple boxes, as in a jenks scale). Because of this, there are separate configs for the [Axis](http://d3plus.org/docs/#Axis) class used to display the text ([axisConfig](http://d3plus.org/docs/#ColorScale.axisConfig)) and the [Rect](http://d3plus.org/docs/#Rect) class used to draw the color breaks ([rectConfig](http://d3plus.org/docs/#ColorScale.rectConfig)). This method acts as a pass-through to the config method of the [Axis](http://d3plus.org/docs/#Axis). An example usage of this method can be seen [here](http://d3plus.org/examples/d3plus-legend/colorScale-dark/).
*/
  legendConfig(): Record<string, unknown>;
  legendConfig(_: Record<string, unknown>): this;
  legendConfig(_?: Record<string, unknown>): unknown {
    return arguments.length
      ? ((this.schema.legendConfig = assign(this.schema.legendConfig, _!)), this)
      : this.schema.legendConfig;
  }

  /**
      Returns the outer bounds of the ColorScale content. Must be called after rendering.
      @example
{"width": 180, "height": 24, "x": 10, "y": 20}
*/
  outerBounds(): Record<string, number> {
    return this._outerBounds;
  }

  /**
      The [ColorScale](http://d3plus.org/docs/#ColorScale) is constructed by combining an [Axis](http://d3plus.org/docs/#Axis) for the ticks/labels and a [Rect](http://d3plus.org/docs/#Rect) for the actual color box (or multiple boxes, as in a jenks scale). Because of this, there are separate configs for the [Axis](http://d3plus.org/docs/#Axis) class used to display the text ([axisConfig](http://d3plus.org/docs/#ColorScale.axisConfig)) and the [Rect](http://d3plus.org/docs/#Rect) class used to draw the color breaks ([rectConfig](http://d3plus.org/docs/#ColorScale.rectConfig)). This method acts as a pass-through to the config method of the [Rect](http://d3plus.org/docs/#Rect). An example usage of this method can be seen [here](http://d3plus.org/examples/d3plus-legend/colorScale-dark/).
*/
  rectConfig(): Record<string, unknown>;
  rectConfig(_: Record<string, unknown>): this;
  rectConfig(_?: Record<string, unknown>): unknown {
    return arguments.length
      ? ((this.schema.rectConfig = assign(this.schema.rectConfig, _!)), this)
      : this.schema.rectConfig;
  }

  /**
      The SVG container element for this visualization. 3 selector or DOM element.
*/
  select(): D3Selection;
  select(_: string | HTMLElement): this;
  select(_?: string | HTMLElement): unknown {
    return arguments.length
      ? ((this._select = select(_ as never) as unknown as D3Selection), this)
      : this._select;
  }
}
