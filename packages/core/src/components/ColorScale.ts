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
import {accessor, BaseClass, constant} from "../utils/index.js";

import Legend from "./Legend.js";

/**
    Creates an SVG color scale based on an array of data.
*/
export default class ColorScale extends BaseClass {
  _select: D3Selection;
  _axisClass: Axis;
   
  _axisConfig: Record<string, unknown>;
  _axisTest: Axis;
  _align: string;
  _buckets: number | number[];
  _bucketAxis: boolean;
  _bucketFormat: (
    tick: number,
    i: number,
    ticks: number[],
    allValues: number[],
  ) => string;
  _bucketJoiner: (a: string, b: string) => string;
  _centered: boolean;
  _color: string | string[];
  _colorMax: string;
  _colorMid: string;
  _colorMin: string;
   
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _colorScale: any;
  _data: DataPoint[];
  _domain: number[] | undefined;
  _duration: number;
  _group: D3Selection;
  _height: number;
  _labelClass: TextBox;
   
  _labelConfig: Record<string, unknown>;
  _labelMin: string | undefined;
  _labelMax: string | undefined;
  _legendClass: Legend;
   
  _legendConfig: Record<string, unknown>;
  _midpoint: number;
  _orient: string;
  _outerBounds: Record<string, number>;
  _padding: number;
  _rectClass: Rect;
   
  _rectConfig: Record<string, unknown>;
  _scale: string;
  _size: number;
   
  _value: (d: DataPoint, i?: number) => unknown;
  _width: number;

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
*/
  constructor() {
    super();

    this._axisClass = new Axis();
    this._axisConfig = {
      gridSize: 0,
    };
    this._axisTest = new Axis();
    this._align = "middle";
    this._buckets = 5;
    this._bucketAxis = false;
    this._bucketFormat = (
      tick: number,
      i: number,
      ticks: number[],
      allValues: number[],
    ): string => {
      const format = (this._axisConfig.tickFormat
        ? this._axisConfig.tickFormat
        : formatAbbreviate) as (v: number | undefined) => string;

      const next = ticks[i + 1];
      const prev = i ? ticks[i - 1] : false;
      const last = i === ticks.length - 1;
      if (tick === next || last) {
        const suffix = last && tick < max(allValues) ? "+" : "";
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
                ]),
              )
            : format(tick);

        const nextValue =
          tick && i === 1
            ? format(next)
            : format(
                max([
                  next - ten,
                  allValues.reverse().find((d: number) => d > tick && d < next),
                ]),
              );

        return this._bucketJoiner(prevValue, nextValue);
      }
    };
    this._bucketJoiner = (a: string, b: string) =>
      a !== b ? `${a} - ${b}` : `${a}`;
    this._centered = true;
    this._color = ["#54478C", "#2C699A", "#0DB39E", "#83E377", "#EFEA5A"];
    this._colorMax = colorDefaults.on;
    this._colorMid = colorDefaults.light;
    this._colorMin = colorDefaults.off;
    this._data = [];
    this._duration = 600;
    this._height = 200;
    this._labelClass = new TextBox();
    this._labelConfig = {
      fontColor: () => {
        const bg = this._select ? backgroundColor(this._select.node()) : "rgb(255, 255, 255)";
        return colorContrast(bg);
      },
      fontSize: 12,
    };
    this._legendClass = new Legend();
    this._legendConfig = {
      shapeConfig: {
        stroke: colorDefaults.dark,
        strokeWidth: 1,
      },
    };
    this._midpoint = 0;
    this._orient = "bottom";
    this._outerBounds = {width: 0, height: 0, x: 0, y: 0};
    this._padding = 5;
    this._rectClass = new Rect().parent(
      this as unknown as Record<string, unknown>,
    );
    this._rectConfig = {
      stroke: "#999",
      strokeWidth: 1,
    };
    this._scale = "linear";
    this._size = 10;
    this._value = accessor("value");
    this._width = 400;
  }

  /**
      Renders the current ColorScale to the page.
    @param callback Optional callback invoked after rendering completes.
*/
  render(callback?: (...args: unknown[]) => unknown): this {
    if (this._select === void 0)
      this.select(
        select("body")
          .append("svg")
          .attr("width", `${this._width}px`)
          .attr("height", `${this._height}px`)
          .node() as unknown as HTMLElement,
      );

    const horizontal = ["bottom", "top"].includes(this._orient);

    const height = horizontal ? "height" : "width",
      width = horizontal ? "width" : "height",
      x = horizontal ? "x" : "y",
      y = horizontal ? "y" : "x";

    // Shape <g> Group
    this._group = elem("g.d3plus-ColorScale", {parent: this._select});

    const allValues = (this._data
      .map(this._value)
      .filter((d: unknown) => d !== null && typeof d === "number") as number[])
      .sort((a: number, b: number) => a - b);

    const domain = this._domain || extent(allValues);
    const negative = (domain as number[])[0] < this._midpoint;
    const positive = (domain as number[])[1] > this._midpoint;
    const diverging = negative && positive;

    const numBuckets = min([
      this._buckets instanceof Array ? this._buckets.length : this._buckets,
      diverging && this._scale !== "jenks"
        ? 2 * Math.floor(unique(allValues).length / 2) - 1
        : unique(allValues).length,
    ])!;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let colors: any =
        diverging &&
        (!this._color ||
          (this._color instanceof Array &&
            !this._color.includes(this._colorMid)))
          ? undefined
          : this._color,
      labels: number[] | undefined,
      ticks: number[] | undefined;

    if (colors && !(colors instanceof Array)) {
      colors = range(0, numBuckets, 1)
        .map((i: number) => colorLighter(colors, (i + 1) / numBuckets))
        .reverse();
    }

    if (this._scale === "jenks") {
      const buckets = min([
        colors ? colors.length : numBuckets,
        numBuckets,
        allValues.length,
      ])!;

      let jenks: number[][] = [];

      if (this._buckets instanceof Array) {
        ticks = this._buckets;
      } else {
        if (diverging && this._centered) {
          const half = Math.floor(buckets / 2);
          const residual = buckets % 2;

          const negatives = allValues.filter((d: number) => d < this._midpoint);
          const negativesDeviation = deviation(negatives);

          const positives = allValues
            .concat(this._midpoint)
            .filter((d: number) => d >= this._midpoint);
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
          colors = [this._colorMin, this._colorMid, this._colorMax];
          const negatives = ticks
            .slice(0, buckets)
            .filter(
              (d: number, i: number) =>
                d < this._midpoint && ticks![i + 1] <= this._midpoint,
            );
          const spanning = ticks
            .slice(0, buckets)
            .filter(
              (d: number, i: number) =>
                d <= this._midpoint && ticks![i + 1] > this._midpoint,
            );
          const positives = ticks
            .slice(0, buckets)
            .filter((d: number) => d > this._midpoint);
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
            .map((i: number) => colorLighter(this._colorMax, i / numBuckets))
            .reverse();
        }
      }

      if (ticks.length <= buckets) colors = colors.slice(-ticks.length);

      colors = [colors[0]].concat(colors);

      this._colorScale = scaleThreshold().domain(ticks).range(colors);
    } else {
      let buckets = this._buckets instanceof Array ? this._buckets : undefined;
      if (diverging && !colors) {
        const half = Math.floor(numBuckets / 2);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const negativeColorScale = (interpolateRgb as any).gamma(2.2)(
          this._colorMin,
          this._colorMid,
        );
        const negativeColors = range(0, half, 1).map((i: number) =>
          negativeColorScale(i / half),
        );
        const spanningColors = (numBuckets % 2 ? [0] : []).map(
          () => this._colorMid,
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const positiveColorScale = (interpolateRgb as any).gamma(2.2)(
          this._colorMax,
          this._colorMid,
        );
        const positiveColors = range(0, half, 1)
          .map((i: number) => positiveColorScale(i / half))
          .reverse();
        colors = negativeColors.concat(spanningColors).concat(positiveColors);
        if (!buckets) {
          const step = (colors.length - 1) / 2;
          buckets = [
            (domain as number[])[0],
            this._midpoint,
            (domain as number[])[1],
          ];
          buckets = range(
            (domain as number[])[0],
            this._midpoint,
            -((domain as number[])[0] - this._midpoint) / step,
          )
            .concat(
              range(
                this._midpoint,
                (domain as number[])[1],
                ((domain as number[])[1] - this._midpoint) / step,
              ),
            )
            .concat([(domain as number[])[1]]);
        }
      } else {
        if (!colors) {
          if (this._scale === "buckets" || this._scale === "quantile") {
            colors = range(0, numBuckets, 1).map((i: number) =>
              colorLighter(
                negative ? this._colorMin : this._colorMax,
                i / numBuckets,
              ),
            );
            if (positive) colors = colors.reverse();
          } else {
            colors = negative
              ? [this._colorMin, colorLighter(this._colorMin, 0.8)]
              : [colorLighter(this._colorMax, 0.8), this._colorMax];
          }
        }
        if (!buckets) {
          if (this._scale === "quantile") {
            const step = 1 / (colors.length - 1);
            buckets = range(0, 1 + step / 2, step).map((d: number) =>
              quantile(allValues, d),
            );
          } else if (diverging && this._color && this._centered) {
            const midIndex = colors.indexOf(this._colorMid);
            const negativeStep =
              (this._midpoint - (domain as number[])[0]) / midIndex;
            const positiveStep =
              ((domain as number[])[1] - this._midpoint) /
              (colors.length - midIndex);
            const negativeBuckets = range(
              (domain as number[])[0],
              this._midpoint,
              negativeStep,
            );
            const positiveBuckets = range(
              this._midpoint,
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

      if (this._scale === "buckets" || this._scale === "quantile") {
        ticks = buckets;
        colors = [colors[0]].concat(colors);
      } else if (this._scale === "log") {
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

      const scaleFn = this._scale === "buckets" || this._scale === "quantile"
        ? scaleThreshold
        : scaleLinear;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this._colorScale = (scaleFn as (...args: unknown[]) => any)()
        .domain(buckets)
        .range(colors);
    }

    if (this._colorScale.clamp) this._colorScale.clamp(true);

    const gradient =
      this._bucketAxis ||
      !["buckets", "jenks", "quantile"].includes(this._scale);
    const t = transition().duration(this._duration);
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
      if (this._bucketAxis) {
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
          duration: this._duration,
          height: this._height,
          labels: labels || ticks,
          orient: this._orient,
          padding: this._padding,
          scale: this._scale === "log" ? "log" : "linear",
          ticks,
          width: this._width,
        },
        this._axisConfig,
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const labelConfig: Record<string, any> = assign(
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          height: (this as any)[`_${height}`] / 2,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          width: (this as any)[`_${width}`] / 2,
        },
        this._labelConfig,
      );

      this._labelClass.config(labelConfig);
      const labelData: string[] = [];

      if (horizontal && this._labelMin) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const labelCSS: Record<string, any> = {
          "font-family": this._labelClass.fontFamily()(this._labelMin),
          "font-size": this._labelClass.fontSize()(this._labelMin),
          "font-weight": this._labelClass.fontWeight()(this._labelMin),
        };

        if (labelCSS["font-family"] instanceof Array)
          labelCSS["font-family"] = labelCSS["font-family"][0];
        let labelMinWidth = textWidth(this._labelMin, labelCSS);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (labelMinWidth && labelMinWidth < (this as any)[`_${width}`] / 2) {
          labelData.push(this._labelMin);
          labelMinWidth += this._padding;
          if (horizontal) offsets.x += labelMinWidth;
          axisConfig[width] -= labelMinWidth;
        }
      }
      if (horizontal && this._labelMax) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const labelCSS: Record<string, any> = {
          "font-family": this._labelClass.fontFamily()(this._labelMax),
          "font-size": this._labelClass.fontSize()(this._labelMax),
          "font-weight": this._labelClass.fontWeight()(this._labelMax),
        };

        if (labelCSS["font-family"] instanceof Array)
          labelCSS["font-family"] = labelCSS["font-family"][0];
        let labelMaxWidth = textWidth(this._labelMax, labelCSS);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (labelMaxWidth && labelMaxWidth < (this as any)[`_${width}`] / 2) {
          labelData.push(this._labelMax);
          labelMaxWidth += this._padding;
          if (!horizontal) offsets.y += labelMaxWidth;
          axisConfig[width] -= labelMaxWidth;
        }
      }

      this._axisTest
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this._outerBounds[width] = (this as any)[`_${width}`] - this._padding * 2;
      this._outerBounds[height] = axisBounds[height] + this._size;

      this._outerBounds[x] = this._padding;
      this._outerBounds[y] = this._padding;
      if (this._align === "middle")
        this._outerBounds[y] =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ((this as any)[`_${height}`] - this._outerBounds[height]) / 2;
      else if (this._align === "end")
        this._outerBounds[y] =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this as any)[`_${height}`] -
          this._padding -
          this._outerBounds[height];

      const axisGroupOffset =
        this._outerBounds[y] +
        (["bottom", "right"].includes(this._orient) ? this._size : 0) -
        (axisConfig.padding || this._axisClass.padding());
      const transform = `translate(${offsets.x + (horizontal ? 0 : axisGroupOffset)}, ${offsets.y + (horizontal ? axisGroupOffset : 0)})`;
      this._axisClass
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

      let defs = this._group.selectAll("defs").data([0]);
      const defsEnter = defs.enter().append("defs");
      defsEnter.append("linearGradient").attr("id", `gradient-${this._uuid}`);
      defs = defsEnter.merge(defs as never);
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
        .domain(scaleRange)
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
          duration: this._duration,
          fill: ticks
            ? (d: number) => this._colorScale(d)
            : `url(#gradient-${this._uuid})`,
          [x]: ticks
            ? (d: number, i: number) =>
                axisScale(d) +
                bucketWidth(d, i) / 2 -
                (["left", "right"].includes(this._orient)
                  ? bucketWidth(d, i)
                  : 0)
            : scaleRange[0] + (scaleRange[1] - scaleRange[0]) / 2 + offsets[x],
          [y]:
            this._outerBounds[y] +
            (["top", "left"].includes(this._orient) ? axisBounds[height] : 0) +
            this._size / 2 +
            offsets[y],
          [width]: ticks ? bucketWidth : scaleRange[1] - scaleRange[0],
          [height]: this._size,
        },
        this._rectConfig,
      );

      this._rectClass
        .data(ticks || [0])
        .id((_d: unknown, i: number) => i)
        .select(rectGroup.node())
        .config(rectConfig)
        .render();

      labelConfig.height = this._outerBounds[height];
      labelConfig.width = this._outerBounds[width];
      this._labelClass
        .config(labelConfig)
        .data(labelData)
        .select(labelGroup.node())
        .x(((d: DataPoint) =>
          (d as unknown as string) === this._labelMax
            ? rectConfig.x + rectConfig.width / 2 + this._padding
            : this._outerBounds.x) as unknown as number)
        .y(
          ((d: DataPoint) =>
            rectConfig.y -
            (this._labelClass.fontSize() as (d: DataPoint) => number)(d) /
              2) as unknown as number,
        )
        .text(((d: DataPoint) => d) as unknown as string)
        .rotate(horizontal ? 0 : this._orient === "right" ? 90 : -90)
        .render();
    } else {
      elem(
        "g.d3plus-ColorScale-axis",
        Object.assign({condition: gradient}, groupParams),
      );

      let legendData = ticks!.reduce((arr: {color: string; id: string}[], tick: number, i: number) => {
        const label = this._bucketFormat.bind(this)(tick, i, ticks!, allValues);
        arr.push({color: colors[i + 1], id: label});

        return arr;
      }, []);
      if (!horizontal) legendData = legendData.reverse();

      const legendConfig = assign(
        {
          align: horizontal
            ? "center"
            : {start: "left", middle: "center", end: "right"}[this._align],
          direction: horizontal ? "row" : "column",
          duration: this._duration,
          height: this._height,
          padding: this._padding,
          shapeConfig: assign(
            {
              duration: this._duration,
            },
            this._axisConfig.shapeConfig || {},
          ),
          title: this._axisConfig.title,
          titleConfig: this._axisConfig.titleConfig || {},
          width: this._width,
          verticalAlign: horizontal
            ? {start: "top", middle: "middle", end: "bottom"}[this._align]
            : "middle",
        },
        this._legendConfig,
      );

      this._legendClass
        .data(legendData)
        .select(legendGroup.node())
        .config(legendConfig)
        .render();

      this._outerBounds = this._legendClass.outerBounds();
    }

    if (callback) setTimeout(callback, this._duration + 100);

    return this;
  }

  /**
      The [ColorScale](http://d3plus.org/docs/#ColorScale) is constructed by combining an [Axis](http://d3plus.org/docs/#Axis) for the ticks/labels and a [Rect](http://d3plus.org/docs/#Rect) for the actual color box (or multiple boxes, as in a jenks scale). Because of this, there are separate configs for the [Axis](http://d3plus.org/docs/#Axis) class used to display the text ([axisConfig](http://d3plus.org/docs/#ColorScale.axisConfig)) and the [Rect](http://d3plus.org/docs/#Rect) class used to draw the color breaks ([rectConfig](http://d3plus.org/docs/#ColorScale.rectConfig)). This method acts as a pass-through to the config method of the [Axis](http://d3plus.org/docs/#Axis). An example usage of this method can be seen [here](http://d3plus.org/examples/d3plus-legend/colorScale-dark/).
*/
  axisConfig(): Record<string, unknown>;
  axisConfig(_: Record<string, unknown>): this;
  axisConfig(_?: Record<string, unknown>): unknown {
    return arguments.length
      ? ((this._axisConfig = assign(this._axisConfig, _)), this)
      : this._axisConfig;
  }

  /**
      The horizontal alignment.
*/
  align(): string;
  align(_: string): this;
  align(_?: string): unknown {
    return arguments.length ? ((this._align = _!), this) : this._align;
  }

  /**
      The number of discrete buckets to create in a bucketed color scale. Will be overridden by any custom Array of colors passed to the `color` method. Optionally, users can supply an Array of values used to separate buckets, such as `[0, 10, 25, 50, 90]` for a percentage scale. This value would create 4 buckets, with each value representing the break point between each bucket (so 5 values makes 4 buckets).
*/
  buckets(): number | number[];
  buckets(_: number | number[]): this;
  buckets(_?: number | number[]): unknown {
    return arguments.length ? ((this._buckets = _!), this) : this._buckets;
  }

  /**
      Determines whether or not to use an Axis to display bucket scales (both "buckets" and "jenks"). When set to `false`, bucketed scales will use the `Legend` class to display squares for each range of data. When set to `true`, bucketed scales will be displayed on an `Axis`, similar to "linear" scales.
*/
  bucketAxis(): boolean;
  bucketAxis(_: boolean): this;
  bucketAxis(_?: boolean): unknown {
    return arguments.length
      ? ((this._bucketAxis = _!), this)
      : this._bucketAxis;
  }

  /**
      A function for formatting the labels associated to each bucket in a bucket-type scale ("jenks", "quantile", etc). The function is passed four arguments: the start value of the current bucket, it's index in the full Array of buckets, the full Array of buckets, and an Array of every value present in the data used to construct the buckets. Keep in mind that the end value for the bucket is not actually the next bucket in the list, but includes every value up until that next bucket value (less than, but not equal to). By default, d3plus will make the end value slightly less than it's current value, so that it does not overlap with the start label for the next bucket.
*/
  bucketFormat(): (
    tick: number,
    i: number,
    ticks: number[],
    allValues: number[],
  ) => string;
  bucketFormat(
    _: (
      tick: number,
      i: number,
      ticks: number[],
      allValues: number[],
    ) => string,
  ): this;
  bucketFormat(
    _?: (
      tick: number,
      i: number,
      ticks: number[],
      allValues: number[],
    ) => string,
  ): unknown {
    return arguments.length
      ? ((this._bucketFormat = _), this)
      : this._bucketFormat;
  }

  /**
      A function that receives the minimum and maximum values of a bucket, and is expected to return the full label.
*/
  bucketJoiner(): (a: string, b: string) => string;
  bucketJoiner(_: (a: string, b: string) => string): this;
  bucketJoiner(_?: (a: string, b: string) => string): unknown {
    return arguments.length
      ? ((this._bucketJoiner = _!), this)
      : this._bucketJoiner;
  }

  /**
      Determines whether or not to display a midpoint centered Axis. Does not apply to quantile scales.
*/
  centered(): boolean;
  centered(_: boolean): this;
  centered(_?: boolean): unknown {
    return arguments.length ? ((this._centered = _!), this) : this._centered;
  }

  /**
      Overrides the default internal logic of `colorMin`, `colorMid`, and `colorMax` to only use just this specified color. If a single color is given as a String, then the scale is interpolated by lightening that color. Otherwise, the function expects an Array of color values to be used in order for the scale.
*/
  color(): string | string[];
  color(_: string | string[]): this;
  color(_?: string | string[]): unknown {
    return arguments.length ? ((this._color = _), this) : this._color;
  }

  /**
      Defines the color to be used for numbers greater than the value of the `midpoint` on the scale (defaults to `0`). Colors in between this value and the value of `colorMid` will be interpolated, unless a custom Array of colors has been specified using the `color` method.
*/
  colorMax(): string;
  colorMax(_: string): this;
  colorMax(_?: string): unknown {
    return arguments.length ? ((this._colorMax = _!), this) : this._colorMax;
  }

  /**
      Defines the color to be used for the midpoint of a diverging scale, based on the current value of the `midpoint` method (defaults to `0`). Colors in between this value and the values of `colorMin` and `colorMax` will be interpolated, unless a custom Array of colors has been specified using the `color` method.
*/
  colorMid(): string;
  colorMid(_: string): this;
  colorMid(_?: string): unknown {
    return arguments.length ? ((this._colorMid = _!), this) : this._colorMid;
  }

  /**
      Defines the color to be used for numbers less than the value of the `midpoint` on the scale (defaults to `0`). Colors in between this value and the value of `colorMid` will be interpolated, unless a custom Array of colors has been specified using the `color` method.
*/
  colorMin(): string;
  colorMin(_: string): this;
  colorMin(_?: string): unknown {
    return arguments.length ? ((this._colorMin = _!), this) : this._colorMin;
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
      In a linear scale, this Array of 2 values defines the min and max values used in the color scale. Any values outside of this range will be mapped to the nearest color value.
*/
  domain(): number[] | undefined;
  domain(_: number[]): this;
  domain(_?: number[]): unknown {
    return arguments.length ? ((this._domain = _), this) : this._domain;
  }

  /**
      Transition duration of the ColorScale.
*/
  duration(): number;
  duration(_: number): this;
  duration(_?: number): unknown {
    return arguments.length ? ((this._duration = _!), this) : this._duration;
  }

  /**
      Overall height of the ColorScale.
*/
  height(): number;
  height(_: number): this;
  height(_?: number): unknown {
    return arguments.length ? ((this._height = _!), this) : this._height;
  }

  /**
      A pass-through for the [TextBox](http://d3plus.org/docs/#TextBox) class used to style the labelMin and labelMax text.
*/
  labelConfig(): Record<string, unknown>;
  labelConfig(_: Record<string, unknown>): this;
  labelConfig(_?: Record<string, unknown>): unknown {
    return arguments.length
      ? ((this._labelConfig = assign(this._labelConfig, _)), this)
      : this._labelConfig;
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
      ? ((this._legendConfig = assign(this._legendConfig, _)), this)
      : this._legendConfig;
  }

  /**
      The number value to be used as the anchor for `colorMid`, and defines the center point of the diverging color scale.
*/
  midpoint(): number;
  midpoint(_: number): this;
  midpoint(_?: number): unknown {
    return arguments.length ? ((this._midpoint = _!), this) : this._midpoint;
  }

  /**
      The flow orientation of the ColorScale items.
*/
  orient(): string;
  orient(_: string): this;
  orient(_?: string): unknown {
    return arguments.length ? ((this._orient = _!), this) : this._orient;
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
      The padding between each key.
*/
  padding(): number;
  padding(_: number): this;
  padding(_?: number): unknown {
    return arguments.length ? ((this._padding = _!), this) : this._padding;
  }

  /**
      The [ColorScale](http://d3plus.org/docs/#ColorScale) is constructed by combining an [Axis](http://d3plus.org/docs/#Axis) for the ticks/labels and a [Rect](http://d3plus.org/docs/#Rect) for the actual color box (or multiple boxes, as in a jenks scale). Because of this, there are separate configs for the [Axis](http://d3plus.org/docs/#Axis) class used to display the text ([axisConfig](http://d3plus.org/docs/#ColorScale.axisConfig)) and the [Rect](http://d3plus.org/docs/#Rect) class used to draw the color breaks ([rectConfig](http://d3plus.org/docs/#ColorScale.rectConfig)). This method acts as a pass-through to the config method of the [Rect](http://d3plus.org/docs/#Rect). An example usage of this method can be seen [here](http://d3plus.org/examples/d3plus-legend/colorScale-dark/).
*/
  rectConfig(): Record<string, unknown>;
  rectConfig(_: Record<string, unknown>): this;
  rectConfig(_?: Record<string, unknown>): unknown {
    return arguments.length
      ? ((this._rectConfig = assign(this._rectConfig, _)), this)
      : this._rectConfig;
  }

  /**
      Scale of the ColorScale.
*/
  scale(): string;
  scale(_: string): this;
  scale(_?: string): unknown {
    return arguments.length ? ((this._scale = _!), this) : this._scale;
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

  /**
      The height of horizontal color scales, and width when positioned vertical.
*/
  size(): number;
  size(_: number): this;
  size(_?: number): unknown {
    return arguments.length ? ((this._size = _!), this) : this._size;
  }

  /**
      The value accessor used to determine each data point's position on the color scale.

@example
function value(d) {
  return d.value;
}
*/
  value(): (d: DataPoint, i?: number) => DataPoint[keyof DataPoint];
  value(
    _: ((d: DataPoint, i?: number) => DataPoint[keyof DataPoint]) | string,
  ): this;
  value(
    _?: ((d: DataPoint, i?: number) => DataPoint[keyof DataPoint]) | string,
  ): unknown {
    return arguments.length
      ? ((this._value = typeof _ === "function" ? _ : constant(_)), this)
      : this._value;
  }

  /**
      Overall width of the ColorScale.
*/
  width(): number;
  width(_: number): this;
  width(_?: number): unknown {
    return arguments.length ? ((this._width = _!), this) : this._width;
  }
}
