/**
    Standalone axis layout function. Given an `Axis`-shaped object (or any
    plain object with the same fields), computes the axis's scale, tick
    layout, label sizing, and `outerBounds` with **zero DOM access**. Used by
    both `Axis.render()` (which then runs a paint phase against the result)
    and `Axis.measure()` (which returns immediately).

    The function mutates the input `axis` to populate `_d3Scale`,
    `_d3ScaleNegative`, `_outerBounds`, `_margin`, `_availableTicks`,
    `_visibleTicks`, `_labelRotation`, `_tickUnit` — matching the side effects
    the original inline `Axis.render` body had. It also returns the local
    layout artifacts the paint phase consumes (`ticks`, `labels`, `range`,
    `textData`, `tickFormat`, `hBuff`, `wBuff`, `tickGet`, `labelHeight`,
    `bounds`) so callers can destructure those without re-reading them off
    the instance.

    This is the canonical v4 chart-as-data shape — Plot's test axes and any
    future "how much room does this axis need?" caller drives layout via
    pure data, no Axis class instance required (any object satisfying the
    duck-typed AxisLike shape works).
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
import {max, range as d3Range, min, sum} from "d3-array";
import * as scales from "d3-scale";
import {timeFormat, timeFormatDefaultLocale} from "d3-time-format";

import {date} from "@d3plus/dom";
import {formatAbbreviate, formatDate} from "@d3plus/format";
import {formatLocale, locale} from "@d3plus/locales";
import {closest} from "@d3plus/math";
import {fontFamily as d3plusFontFamily, textWrap} from "@d3plus/text";

// Local helpers — duplicated from Axis.ts to keep this file standalone.
const isNegative = (d: number): boolean => d < 0 || Object.is(d, -0);
const floorPow = (d: number): number =>
  Math.pow(10, Math.floor(Math.log10(Math.abs(d)))) *
  Math.pow(-1, isNegative(d) ? 1 : 0);
const ceilPow = (d: number): number =>
  Math.pow(10, Math.ceil(Math.log10(Math.abs(d)))) *
  Math.pow(-1, isNegative(d) ? 1 : 0);
const fixFloat = (d: number): number => {
  const str = `${d}`;
  if (str.includes("e-") || str === "0") return 0;
  const nineMatch = str.match(/(-*[0-9]+\.[0]*)([0-8]+)9{3,}[0-9]+$/);
  if (nineMatch) return +`${nineMatch[1]}${+nineMatch[2] + 1}`;
  const zeroMatch = str.match(/(-*[0-9]+\.[0]*)([1-9]+)0*[0-9]*0{3,}[0-9]+$/);
  if (zeroMatch) return +`${zeroMatch[1]}${+zeroMatch[2]}`;
  return d;
};

/**
    Result of `measureAxis()`. Holds layout artifacts the paint phase of
    `Axis.render()` (and any caller that wants to construct a paint loop)
    needs to consume. Most layout state also mutates onto the input `axis`
    (`_d3Scale`, `_outerBounds`, `_margin`, etc.) for legacy interop.
*/
export interface AxisLayoutResult {
  ticks: any[];
  labels: any[];
  range: number[];
  textData: any[];
  tickFormat: (d: any) => string;
  hBuff: number;
  wBuff: number;
  tickGet: (d: any, i?: number) => any;
  labelHeight: number;
  bounds: Record<string, number>;
}

/**
    The standalone axis layout pass. Accepts any object satisfying the
    Axis-instance shape (the production `Axis` class is the canonical input).
    Pure compute — no DOM, no rendering. Mutates the input to set
    `_d3Scale`/`_outerBounds`/`_margin`/etc. for callers that read those off
    the instance afterward.
*/
export function measureAxis(axis: any): AxisLayoutResult {
  const timeLocaleObj =
    axis._timeLocale || locale[axis._locale] || locale["en-US"];
  timeFormatDefaultLocale(
    timeLocaleObj as Parameters<typeof timeFormatDefaultLocale>[0],
  );

  const {width, height, x, y, horizontal, opposite} = axis._position,
    p = axis._padding,
    rangeOuter = [p, (axis[`_${width}`] as number) - p];

  const tickValue =
    axis._shape === "Circle"
      ? axis._shapeConfig.r
      : axis._shape === "Rect"
        ? axis._shapeConfig[width]
        : axis._shapeConfig.strokeWidth;
  const tickGet =
    typeof tickValue !== "function" ? () => tickValue : tickValue;

  const margin: Record<string, number> = (axis._margin = {top: 0, right: 0, bottom: 0, left: 0});

  let labels: any[] = [], range: any[] = [], ticks: any[] = [];

  const tickFormat = axis._tickFormat
    ? axis._tickFormat
    : (d: any) => {
        if (isNaN(d) || ["band", "ordinal", "point"].includes(axis._scale)) {
          return d;
        } else if (axis._scale === "time") {
          const refData = (axis._data.length ? axis._data : axis._domain)
            .map((v: unknown) => date(v as string | number | false))
            .filter((d: Date | false): d is Date => d instanceof Date)
            .sort((a: Date, b: Date) => +a - +b);
          return formatDate(d, refData, timeFormat).replace(
            /^Q/g,
            timeLocaleObj.quarter as string,
          );
        } else if (
          axis._scale === "linear" &&
          axis._tickSuffix === "smallest"
        ) {
          const loc =
            typeof axis._locale === "object"
              ? axis._locale
              : formatLocale[axis._locale];
          const {separator, suffixes} = loc;
          const suff = d >= 1000 ? suffixes[axis._tickUnit + 8] : "";
          const tick = d / Math.pow(10, 3 * axis._tickUnit);
          const number = formatAbbreviate(
            tick,
            loc,
            `,.${tick.toString().length}r`,
          );
          return `${number}${separator}${suff}`;
        } else {
          const inverted = ticks[1] < ticks[0];
          const minTick = inverted ? ticks.length - 1 : 0;
          const maxTick = inverted ? 0 : ticks.length - 1;
          const prefix =
            axis._rounding === "inside"
              ? ticks.indexOf(d) === minTick
                ? axis._roundingInsideMinPrefix
                : ticks.indexOf(d) === maxTick
                  ? axis._roundingInsideMaxPrefix
                  : ""
              : "";
          const suffix =
            axis._rounding === "inside"
              ? ticks.indexOf(d) === minTick
                ? axis._roundingInsideMinSuffix
                : ticks.indexOf(d) === maxTick
                  ? axis._roundingInsideMaxSuffix
                  : ""
              : "";
          return `${prefix}${formatAbbreviate(d, axis._locale)}${suffix}`;
        }
      };

  const setScale = (newRange: any[] = axis._range!) => {
    range = newRange ? newRange.slice() : [undefined, undefined];
    let [minRange, maxRange] = rangeOuter;
    if (axis._range) {
      if (axis._range[0] !== undefined) minRange = axis._range[0];
      if (axis._range[axis._range.length - 1] !== undefined)
        maxRange = axis._range[axis._range.length - 1]!;
    }
    if (range[0] === undefined || range[0] < minRange) range[0] = minRange;
    if (range[1] === undefined || range[1] > maxRange) range[1] = maxRange;

    const sizeInner = maxRange - minRange;
    if (axis._scale === "ordinal" && axis._domain.length > range.length) {
      if (newRange === axis._range) {
        const buckets = axis._domain.length + 1;
        range = d3Range(buckets)
          .map((d: number) => range[0] + sizeInner * (d / (buckets - 1)))
          .slice(1, buckets);
        range = range.map((d: number) => d - range[0] / 2);
      } else {
        const buckets = axis._domain.length;
        const size = range[1] - range[0];
        range = d3Range(buckets).map(
          (d: number) => range[0] + size * (d / (buckets - 1)),
        );
      }
    }

    const scale = `scale${axis._scale
      .charAt(0)
      .toUpperCase()}${axis._scale.slice(1)}`;

    const initialDomain = axis._domain.slice();

    axis._d3Scale = (scales as any)[scale]()
      .domain(
        axis._scale === "time" ? initialDomain.map(date) : initialDomain,
      )
      .range(range);

    if (axis._rounding !== "none") {
      const roundDomain = () => {
        const zeroLength = (d: number) => {
          if (smallScale) {
            if (!d) return 0;
            const m = `${d}`.match(/0\.(0*)/);
            if (m)
              return +`0.${Array(m[1].length + 1).fill(0).join("")}1`;
          }
          return `${Math.round(Math.abs(d))}`.length;
        };
        const smallScale = initialDomain.every(
          (d: number) => Math.abs(d) < 1,
        );
        const zeroArray = [
          zeroLength(initialDomain[0]),
          zeroLength(initialDomain[1]),
        ]
          .filter(Boolean)
          .sort();
        if (!zeroArray.length) return;
        const diverging =
          initialDomain.some((d: number) => isNegative(d)) &&
          initialDomain.some((d: number) => d > 0);
        const zeros =
          zeroArray.length === 1
            ? zeroArray[0]
            : zeroArray[0] > 1 && zeroArray[0] === zeroArray[1]
              ? zeroArray[0] - 1
              : axis._rounding === "outside" || !diverging
                ? zeroArray[0] + (zeroArray[1] - zeroArray[0]) / 2
                : max(zeroArray)!;
        let factor: number =
          zeros < 1
            ? fixFloat(zeros)
            : +`1${Array(Math.floor(fixFloat(zeros)) - 1).fill(0).join("")}`;
        if (factor >= Math.abs(initialDomain[1] - initialDomain[0]))
          factor /= 2;
        const inverted = initialDomain[1] < initialDomain[0];
        const newDomain = [
          Math[
            axis._rounding === "outside"
              ? inverted
                ? "ceil"
                : "floor"
              : inverted
                ? "floor"
                : "ceil"
          ](initialDomain[0] / factor) * factor,
          Math[
            axis._rounding === "outside"
              ? inverted
                ? "floor"
                : "ceil"
              : inverted
                ? "ceil"
                : "floor"
          ](initialDomain[1] / factor) * factor,
        ];
        if (axis._scale === "log") {
          if (newDomain[0] === 0) newDomain[0] = initialDomain[0];
          if (newDomain[1] === 0) newDomain[1] = initialDomain[1];
        }
        axis._d3Scale.domain(newDomain.map(fixFloat));
      };

      if (axis._scale === "linear") {
        roundDomain();
      } else if (axis._scale === "log") {
        const powDomain: number[] = [];
        const inverted = initialDomain[1] < initialDomain[0];
        powDomain[0] = (
          axis._rounding === "outside"
            ? isNegative(initialDomain[0])
              ? inverted
                ? floorPow
                : ceilPow
              : inverted
                ? ceilPow
                : floorPow
            : isNegative(initialDomain[0])
              ? inverted
                ? ceilPow
                : floorPow
              : inverted
                ? floorPow
                : ceilPow
        )(initialDomain[0]);
        powDomain[1] = (
          axis._rounding === "inside"
            ? isNegative(initialDomain[1])
              ? inverted
                ? floorPow
                : ceilPow
              : inverted
                ? ceilPow
                : floorPow
            : isNegative(initialDomain[1])
              ? inverted
                ? floorPow
                : ceilPow
              : inverted
                ? floorPow
                : ceilPow
        )(initialDomain[1]);
        const powInverted = powDomain[1] < powDomain[0];
        if (
          powDomain[0] !== powDomain[1] &&
          powDomain.some((d: number) => Math.abs(d) > 10) &&
          powInverted === inverted
        ) {
          axis._d3Scale.domain(powDomain);
        } else {
          roundDomain();
        }
      }
    }

    if (axis._d3Scale.padding) axis._d3Scale.padding(axis._scalePadding);
    if (axis._d3Scale.paddingInner)
      axis._d3Scale.paddingInner(axis._paddingInner);
    if (axis._d3Scale.paddingOuter)
      axis._d3Scale.paddingOuter(axis._paddingOuter);

    axis._d3ScaleNegative = null;
    if (axis._scale === "log") {
      const domain = axis._d3Scale.domain();
      if (domain[0] === 0) {
        const smallestNumber = min([min(axis._data), Math.abs(domain[1])]);
        domain[0] =
          smallestNumber === 0 || smallestNumber === 1
            ? 1e-6
            : smallestNumber! <= 1
              ? floorPow(smallestNumber!)
              : 1;
        if (isNegative(domain[1])) domain[0] *= -1;
      } else if (domain[domain.length - 1] === 0) {
        const smallestNumber = min([min(axis._data), Math.abs(domain[0])]);
        domain[domain.length - 1] =
          smallestNumber === 0 || smallestNumber === 1
            ? 1e-6
            : smallestNumber! <= 1
              ? floorPow(smallestNumber!)
              : 1;
        if (isNegative(domain[0])) domain[domain.length - 1] *= -1;
      }
      const scaleRange = axis._d3Scale.range();

      if (isNegative(domain[0]) && isNegative(domain[domain.length - 1])) {
        axis._d3ScaleNegative = axis._d3Scale
          .copy()
          .domain(domain)
          .range(scaleRange);
        axis._d3Scale = null;
      } else if (domain[0] > 0 && domain[domain.length - 1] > 0) {
        axis._d3Scale.domain(domain).range(scaleRange);
      } else {
        const powers = domain
          .map((d: number) => Math.log10(Math.abs(d)))
          .map((d: number) => d || -1e-6);
        const leftPercentage = powers[0] / sum(powers);
        const zero = leftPercentage * (scaleRange[1] - scaleRange[0]);

        let minPositive = min([
          min(axis._data.filter((d: unknown) => (d as number) >= 0)),
          Math.abs(domain[1]),
        ]);
        if (minPositive === 1) minPositive = 1e-6;
        let minNegative = min([
          min(axis._data.filter(isNegative)),
          Math.abs(domain[0]),
        ]);
        if (minNegative === 1) minNegative = 1e-6;
        const minPosPow =
          minPositive === 0
            ? 1e-6
            : minPositive! <= 1
              ? floorPow(minPositive!)
              : 1;
        const minNegPow =
          minNegative === 0
            ? -1e-6
            : minNegative! <= 1
              ? floorPow(minNegative!)
              : 1;
        const minValue = min([Math.abs(minPosPow), Math.abs(minNegPow)]);
        axis._d3ScaleNegative = axis._d3Scale.copy();
        (isNegative(domain[0]) ? axis._d3Scale : axis._d3ScaleNegative)
          .domain([isNegative(domain[0]) ? minValue : -minValue!, domain[1]])
          .range([scaleRange[0] + zero, scaleRange[1]]);
        (isNegative(domain[0]) ? axis._d3ScaleNegative : axis._d3Scale)
          .domain([domain[0], isNegative(domain[0]) ? -minValue! : minValue])
          .range([scaleRange[0], scaleRange[0] + zero]);
      }
    }

    ticks = (
      axis._ticks
        ? axis._scale === "time"
          ? (axis._ticks as (string | number | false | undefined)[]).map(date)
          : axis._ticks
        : (axis._d3Scale ? axis._d3Scale.ticks : axis._d3ScaleNegative.ticks)
          ? axis._getTicks()
          : axis._domain
    ).slice();
    labels = (
      axis._labels
        ? axis._scale === "time"
          ? (axis._labels as (string | number | false | undefined)[]).map(date)
          : axis._labels
        : (axis._d3Scale ? axis._d3Scale.ticks : axis._d3ScaleNegative.ticks)
          ? axis._getLabels()
          : ticks
    ).slice();

    if (axis._scale === "time") {
      ticks = ticks.map(Number);
      labels = labels.map(Number);
    }
    ticks = ticks.sort(
      (a: unknown, b: unknown) => axis._getPosition(a) - axis._getPosition(b),
    );
    labels = labels.sort(
      (a: unknown, b: unknown) => axis._getPosition(a) - axis._getPosition(b),
    );

    if (axis._scale === "linear" && axis._tickSuffix === "smallest") {
      const suffixes = labels.filter((d: unknown) => (d as number) >= 1000);
      if (suffixes.length > 0) {
        const minVal = Math.min(...suffixes);
        let i = 1;
        while (i && i < 7) {
          const n = Math.pow(10, 3 * i);
          if (minVal / n >= 1) {
            axis._tickUnit = i;
            i += 1;
          } else {
            break;
          }
        }
      }
    }

    const pixels: (number | false)[] = [];
    axis._availableTicks = ticks;
    ticks.forEach((d: unknown, i: number) => {
      let s = tickGet({id: d, tick: true}, i);
      if (axis._shape === "Circle") s *= 2;
      const t = axis._getPosition(d);
      if (!pixels.length || Math.abs(closest(t, pixels.filter((pix): pix is number => pix !== false))! - t) > s * 2)
        pixels.push(t);
      else pixels.push(false);
    });
    ticks = ticks.filter((_d: unknown, i: number) => pixels[i] !== false);
    axis._visibleTicks = ticks;
  };
  setScale();

  if (axis._title) {
    const {fontFamily, fontSize, lineHeight} = axis._titleConfig;
    const titleWrap = textWrap()
      .fontFamily(
        typeof fontFamily === "function" ? fontFamily() : fontFamily,
      )
      .fontSize(typeof fontSize === "function" ? fontSize() : fontSize)
      .lineHeight(
        typeof lineHeight === "function" ? lineHeight() : lineHeight,
      )
      .width(range[range.length - 1] - range[0] - p * 2)
      .height((axis[`_${height}`] as number) - axis._tickSize - p * 2);
    const lines = titleWrap(axis._title).lines.length;
    margin[axis._orient] = lines * titleWrap.lineHeight()! + p;
  }

  let hBuff: any =
      axis._shape === "Circle"
        ? typeof axis._shapeConfig.r === "function"
          ? axis._shapeConfig.r({tick: true})
          : axis._shapeConfig.r
        : axis._shape === "Rect"
          ? typeof axis._shapeConfig[height] === "function"
            ? axis._shapeConfig[height]({tick: true})
            : axis._shapeConfig[height]
          : axis._tickSize,
    wBuff: any = tickGet({tick: true});

  if (typeof hBuff === "function") hBuff = max(ticks.map(hBuff));
  if (axis._shape === "Rect") hBuff /= 2;
  if (typeof wBuff === "function") wBuff = max(ticks.map(wBuff));
  if (axis._shape !== "Circle") wBuff /= 2;

  const calculateLabelSize = (datum: any): any => {
    const {d, i, fF, fP, fS, rotate, space} = datum;
    const h = rotate ? "width" : "height",
      w = rotate ? "height" : "width";

    const wSize = min([axis._maxSize, axis._width]);
    const hSize = min([axis._maxSize, axis._height]);

    const wrap = textWrap()
      .fontFamily(fF)
      .fontSize(fS)
      .lineHeight(
        axis._shapeConfig.lineHeight
          ? axis._shapeConfig.lineHeight(d, i)
          : undefined,
      );

    wrap[w](
      horizontal
        ? space
        : wSize! - hBuff - p - axis._margin.left - axis._margin.right,
    );
    wrap[h](
      horizontal
        ? hSize! - hBuff - p - axis._margin.top - axis._margin.bottom
        : space,
    );

    const res = wrap(tickFormat(d)) as ReturnType<typeof wrap> & {
      width: number;
      height: number;
    };
    res.lines = res.lines.filter((d: string) => d !== "");
    res.width = res.lines.length ? Math.ceil(max(res.widths)!) : 0;
    res.height = res.lines.length
      ? Math.ceil(res.lines.length * (wrap.lineHeight() as number)) + fP
      : 0;
    return res;
  };

  const calculateOffset = (arr: any[] = []): void => {
    let offset = 0;
    arr.forEach((datum: any) => {
      const prev = arr[datum.i - 1];
      const h =
          (datum.rotate && horizontal) || (!datum.rotate && !horizontal)
            ? "width"
            : "height",
        w =
          (datum.rotate && horizontal) || (!datum.rotate && !horizontal)
            ? "height"
            : "width";

      if (!prev) {
        offset = 1;
      } else if (
        prev.position + prev[w] / 2 >
        datum.position - datum[w] / 2
      ) {
        if (offset) {
          datum.offset = prev[h];
          offset = 0;
        } else offset = 1;
      }
    });
  };

  let textData: any[] = [];
  const createTextData = (offset: number = 1): void => {
    const {fontSize} = axis._shapeConfig.labelConfig;
    const fontFamilyConfig =
      axis._shapeConfig.labelConfig.fontFamily || d3plusFontFamily;
    const fontPadding = axis._shapeConfig.labelConfig.padding;

    textData = labels.map((d: any, i: number) => {
      const fF =
          typeof fontFamilyConfig === "function" ? fontFamilyConfig(d, i) : fontFamilyConfig,
        fP =
          typeof fontPadding === "function" ? fontPadding(d, i) : fontPadding,
        fS = typeof fontSize === "function" ? fontSize(d, i) : fontSize,
        position = axis._getPosition(d);

      const lineHeight = axis._shapeConfig.lineHeight
        ? axis._shapeConfig.lineHeight(d, i)
        : fS * 1.4;
      const datum: any = {
        d,
        i,
        fF,
        fP,
        fS,
        lineHeight,
        position,
        rotate: axis._labelRotation,
      };
      return datum;
    });

    const maxSpace =
      axis._scale === "band"
        ? axis._d3Scale.bandwidth()
        : textData.reduce((s: number, d: any, i: number) => {
            const {position} = d;
            const prevPosition = !i
              ? textData.length === 1
                ? rangeOuter[0]
                : position - (textData[i + 1].position - position)
              : position - (position - textData[i - 1].position);
            const prevSpace = Math.abs(position - prevPosition);

            const nextPosition =
              i == textData.length - 1
                ? textData.length === 1
                  ? rangeOuter[1]
                  : position + (position - textData[i - 1].position)
                : position - (position - textData[i + 1].position);
            const nextSpace = Math.abs(position - nextPosition);
            const mod = axis._scale === "point" ? 1 : 2;
            return max([max([prevSpace, nextSpace])! * mod, s])!;
          }, 0);

    textData = textData.map((datum: any) => {
      datum.space = maxSpace - datum.fP * 2;
      const res = calculateLabelSize(datum);
      return Object.assign(res, datum);
    });

    const reverseTextData = textData.slice().reverse();
    textData.forEach((datum: any) => {
      const {fP, i, position} = datum;
      const sizeName =
        (datum.rotate && horizontal) || (!datum.rotate && !horizontal)
          ? "height"
          : "width";
      let prev: any = i
        ? reverseTextData.find((t: any) => t.i < i && !t.truncated)
        : false;
      if (i === textData.length - 1) {
        while (
          prev &&
          position - datum[sizeName] / 2 - fP <
            prev.position + prev[sizeName] / 2
        ) {
          prev.truncated = true;
          prev = reverseTextData.find((t: any) => t.i < i && !t.truncated);
        }
      }
      datum.truncated = prev
        ? position - datum[sizeName] / 2 - fP <
          prev.position + prev[sizeName] / 2
        : false;
    });

    if (offset > 1) calculateOffset(textData);
  };

  createTextData();
  const offsetEnabled =
    axis._labelOffset && textData.some((d: any) => d.truncated);
  if (offsetEnabled) createTextData(2);

  const spillovers = [0, 1].map((index: number) => {
    const datum = textData[index ? textData.length - 1 : 0];
    if (!datum) return 0;
    const {height: dHeight, position, rotate, width: dWidth} = datum;
    const compPosition = index ? rangeOuter[1] : rangeOuter[0];
    const halfSpace = (rotate || !horizontal ? dHeight : dWidth) / 2;
    if (Math.abs(position - compPosition) >= halfSpace) return 0;
    const spill = halfSpace - (position - compPosition);
    return Math.abs(spill);
  });

  const [first, last] = range;
  const newRange = [first + spillovers[0], last - spillovers[1]];
  if (axis._range) {
    if (axis._range[0] !== undefined) newRange[0] = axis._range[0];
    if (axis._range[axis._range.length - 1] !== undefined)
      newRange[1] = axis._range[axis._range.length - 1];
  }

  if (newRange[0] !== first || newRange[1] !== last) {
    setScale(newRange);
    createTextData(offsetEnabled ? 2 : 1);
  }

  const labelHeight = max(textData, (t: any) => t.height) || 0;
  axis._labelRotation =
    horizontal && axis._labelRotation === undefined
      ? textData.some((datum: any) => {
          const {i, height: dH, position, truncated} = datum;
          const prev = textData[i - 1];
          return (
            truncated ||
            (i && prev.position + prev.height / 2 > position - dH / 2)
          );
        })
      : axis._labelRotation;

  const globalOffset = axis._labelOffset
    ? max(textData, (d: any) => d.offset || 0)
    : 0;
  textData.forEach(
    (datum: any) => (datum.offset = datum.offset ? globalOffset : 0),
  );

  const tBuff = axis._shape === "Line" ? 0 : hBuff;
  const bounds: any = (axis._outerBounds = {
    [height]:
      (max(textData, (t: any) =>
        Math.ceil(t[t.rotate || !horizontal ? "width" : "height"] + t.offset),
      ) || 0) + (textData.length ? p : 0),
    [width]: rangeOuter[rangeOuter.length - 1] - rangeOuter[0],
    [x]: rangeOuter[0],
  });

  bounds[height] = max([axis._minSize, bounds[height]]);

  margin[axis._orient] += hBuff;
  margin[opposite] =
    axis._gridSize !== undefined
      ? max([axis._gridSize, tBuff])!
      : (axis[`_${height}`] as number) - margin[axis._orient] - bounds[height] - p;
  bounds[height] += margin[opposite] + margin[axis._orient];
  bounds[y] =
    axis._align === "start"
      ? axis._padding
      : axis._align === "end"
        ? (axis[`_${height}`] as number) - bounds[height] - axis._padding
        : (axis[`_${height}`] as number) / 2 - bounds[height] / 2;

  return {
    ticks,
    labels,
    range,
    textData,
    tickFormat,
    hBuff,
    wBuff,
    tickGet,
    labelHeight,
    bounds,
  };
}
