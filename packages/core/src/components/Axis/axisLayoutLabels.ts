/**
    Label/text layout helpers for `measureAxis` (see `axisLayout.ts`). Pure
    compute — no DOM. `createTextData` measures every label via `textWrap`,
    resolves truncation/offset, and returns the `textData` array the paint
    phase consumes; `computeAxisBounds` derives `_outerBounds` + margins.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
import {max, min} from "d3-array";

import {fontFamily as d3plusFontFamily, textWrap} from "@d3plus/text";

interface LabelLayoutCtx {
  horizontal: boolean;
  hBuff: number;
  p: number;
  tickFormat: (d: any) => any;
}

/** Applies the axis title's wrapped height to the orient-side margin. */
export function applyTitleMargin(
  axis: any,
  ctx: {range: any[]; p: number; height: string; margin: Record<string, number>},
): void {
  if (!axis.schema.title) return;
  const {range, p, height, margin} = ctx;
  const {fontFamily, fontSize, lineHeight} = axis.schema.titleConfig;
  const titleWrap = textWrap()
    .fontFamily(typeof fontFamily === "function" ? fontFamily() : fontFamily)
    .fontSize(typeof fontSize === "function" ? fontSize() : fontSize)
    .lineHeight(typeof lineHeight === "function" ? lineHeight() : lineHeight)
    .width(range[range.length - 1] - range[0] - p * 2)
    .height((axis.schema[height] as number) - axis.schema.tickSize - p * 2);
  const lines = titleWrap(axis.schema.title).lines.length;
  margin[axis.schema.orient] = lines * titleWrap.lineHeight()! + p;
}

/** Resolves the tick height/width buffers from the shape config. */
export function computeBuffers(
  axis: any,
  ticks: any[],
  tickGet: any,
  height: string,
): {hBuff: number; wBuff: number} {
  let hBuff: any =
      axis.schema.shape === "Circle"
        ? typeof axis.schema.shapeConfig.r === "function"
          ? axis.schema.shapeConfig.r({tick: true})
          : axis.schema.shapeConfig.r
        : axis.schema.shape === "Rect"
          ? typeof axis.schema.shapeConfig[height] === "function"
            ? axis.schema.shapeConfig[height]({tick: true})
            : axis.schema.shapeConfig[height]
          : axis.schema.tickSize,
    wBuff: any = tickGet({tick: true});

  if (typeof hBuff === "function") hBuff = max(ticks.map(hBuff));
  if (axis.schema.shape === "Rect") hBuff /= 2;
  if (typeof wBuff === "function") wBuff = max(ticks.map(wBuff));
  if (axis.schema.shape !== "Circle") wBuff /= 2;

  return {hBuff, wBuff};
}

/** Wraps + measures a single label, returning its sized text result. */
function calculateLabelSize(axis: any, datum: any, ctx: LabelLayoutCtx): any {
  const {horizontal, hBuff, p, tickFormat} = ctx;
  const {d, i, fF, fP, fS, rotate, space} = datum;
  const h = rotate ? "width" : "height",
    w = rotate ? "height" : "width";

  const wSize = min([axis.schema.maxSize, axis.schema.width]);
  const hSize = min([axis.schema.maxSize, axis.schema.height]);

  const wrap = textWrap()
    .fontFamily(fF)
    .fontSize(fS)
    .lineHeight(
      axis.schema.shapeConfig.lineHeight
        ? axis.schema.shapeConfig.lineHeight(d, i)
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
}

/** Assigns vertical offsets to alternating labels that would overlap. */
function calculateOffset(arr: any[] = [], horizontal: boolean): void {
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
}

/**
    Measures every label, computes per-label space, sizes via `textWrap`, and
    resolves truncation (and optional offset). Returns the `textData` array.
*/
export function createTextData(
  axis: any,
  ctx: LabelLayoutCtx & {labels: any[]; rangeOuter: number[]; offset?: number},
): any[] {
  const {labels, rangeOuter, horizontal, hBuff, p, tickFormat, offset = 1} = ctx;
  const labelCtx: LabelLayoutCtx = {horizontal, hBuff, p, tickFormat};
  const {fontSize} = axis.schema.shapeConfig.labelConfig;
  const fontFamilyConfig =
    axis.schema.shapeConfig.labelConfig.fontFamily || d3plusFontFamily;
  const fontPadding = axis.schema.shapeConfig.labelConfig.padding;

  let textData = labels.map((d: any, i: number) => {
    const fF =
        typeof fontFamilyConfig === "function" ? fontFamilyConfig(d, i) : fontFamilyConfig,
      fP =
        typeof fontPadding === "function" ? fontPadding(d, i) : fontPadding,
      fS = typeof fontSize === "function" ? fontSize(d, i) : fontSize,
      position = axis._getPosition(d);

    const lineHeight = axis.schema.shapeConfig.lineHeight
      ? axis.schema.shapeConfig.lineHeight(d, i)
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
    axis.schema.scale === "band"
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
          const mod = axis.schema.scale === "point" ? 1 : 2;
          return max([max([prevSpace, nextSpace])! * mod, s])!;
        }, 0);

  textData = textData.map((datum: any) => {
    datum.space = maxSpace - datum.fP * 2;
    const res = calculateLabelSize(axis, datum, labelCtx);
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

  if (offset > 1) calculateOffset(textData, horizontal);
  return textData;
}

/** Derives `_outerBounds` + axis margins from the measured text data. */
export function computeAxisBounds(
  axis: any,
  ctx: {
    textData: any[];
    rangeOuter: number[];
    hBuff: number;
    horizontal: boolean;
    p: number;
    width: string;
    height: string;
    x: string;
    y: string;
    opposite: string;
    margin: Record<string, number>;
  },
): any {
  const {textData, rangeOuter, hBuff, horizontal, p, width, height, x, y, opposite, margin} = ctx;
  const tBuff = axis.schema.shape === "Line" ? 0 : hBuff;
  const bounds: any = (axis._outerBounds = {
    [height]:
      (max(textData, (t: any) =>
        Math.ceil(t[t.rotate || !horizontal ? "width" : "height"] + t.offset),
      ) || 0) + (textData.length ? p : 0),
    [width]: rangeOuter[rangeOuter.length - 1] - rangeOuter[0],
    [x]: rangeOuter[0],
  });

  bounds[height] = max([axis.schema.minSize, bounds[height]]);

  margin[axis.schema.orient] += hBuff;
  margin[opposite] =
    axis.schema.gridSize !== undefined
      ? max([axis.schema.gridSize, tBuff])!
      : (axis.schema[height] as number) - margin[axis.schema.orient] - bounds[height] - p;
  bounds[height] += margin[opposite] + margin[axis.schema.orient];
  bounds[y] =
    axis.schema.align === "start"
      ? axis.schema.padding
      : axis.schema.align === "end"
        ? (axis.schema[height] as number) - bounds[height] - axis.schema.padding
        : (axis.schema[height] as number) / 2 - bounds[height] / 2;

  return bounds;
}
