/* eslint-disable @typescript-eslint/no-explicit-any */
import {max, sum} from "d3-array";

import type {DataPoint} from "@d3plus/data";
import {assign, textWidth} from "@d3plus/dom";
import {textWrap} from "@d3plus/text";

import * as shapes from "../shapes/index.js";
import {configPrep} from "../utils/index.js";

import type Legend from "./Legend.js";

const padding = 5;

interface WrapState {
  lines: number;
  newRows: Record<string, unknown>[][];
  maxLines: number | undefined;
}

/** Wraps + measures the title, setting `_titleHeight` / `_titleWidth`. */
export function measureLegendTitle(legend: Legend): void {
  legend._titleHeight = 0;
  legend._titleWidth = 0;
  if (legend.schema.title) {
    const f = (legend.schema.titleConfig.fontFamily || (legend._titleClass.fontFamily() as any)()) as string,
      s = (legend.schema.titleConfig.fontSize || (legend._titleClass.fontSize() as any)()) as number;
    let lH = (legend.schema.titleConfig.lineHeight || legend._titleClass.lineHeight()) as ((...args: unknown[]) => number) | number | undefined;
    lH = typeof lH === "function" ? lH() : (lH ?? s * 1.4);

    const res = textWrap()
      .fontFamily(f)
      .fontSize(s)
      .lineHeight(lH)
      .width(legend.schema.width)
      .height(legend.schema.height)(legend.schema.title);
    legend._titleHeight = lH + res.lines.length + legend.schema.padding;
    legend._titleWidth = max(res.widths)!;
  }
}

/** Measures each datum's swatch + wrapped label into the `_lineData` array. */
export function computeLegendLineData(
  legend: Legend,
  availableHeight: number,
): Record<string, unknown>[] {
  return legend._data.map((d: DataPoint, i: number) => {
    const label = legend.schema.label(d, i);
    const shape = legend.schema.shape(d, i);
    const r = legend._fetchConfig("r", d, i) as number;

    let res: Record<string, unknown> = {
      data: d,
      i,
      id: legend.schema.id(d, i),
      shape,
      shapeR: r,
      shapeWidth:
        shape === "Circle" ? r * 2 : legend._fetchConfig("width", d, i),
      shapeHeight:
        shape === "Circle" ? r * 2 : legend._fetchConfig("height", d, i),
      y: 0,
    };

    if (!label) {
      res.sentence = false;
      res.words = [];
      res.height = 0;
      res.width = 0;
      return res;
    }

    const f = legend._fetchConfig("fontFamily", d, i) as string,
      lh = legend._fetchConfig("lineHeight", d, i) as number,
      s = legend._fetchConfig("fontSize", d, i) as number;

    const h = availableHeight - (legend._data.length + 1) * legend.schema.padding,
      w = legend.schema.width;

    const newRes = textWrap()
      .fontFamily(f)
      .fontSize(s)
      .lineHeight(lh)
      .width(w)
      .height(h)(label as string);

    res = Object.assign(res, newRes);

    res.width =
      Math.ceil(
        max(
          (res.lines as string[]).map((t: string) =>
            textWidth(t, {"font-family": f, "font-size": s}),
          ),
        ) as unknown as number,
      ) +
      padding * 2;
    res.height = Math.ceil((res.lines as string[]).length * (lh + 1));
    res.og = {height: res.height, width: res.width};
    res.f = f;
    res.s = s;
    res.lh = lh;

    return res;
  });
}

/** Attempts to wrap labels onto an additional line, recursing into rows. */
function tryWrapLines(
  legend: Legend,
  state: WrapState,
  availableWidth: number,
  availableHeight: number,
): void {
  state.lines++;

  if (state.lines > state.maxLines!) return;

  const wrappable =
    state.lines === 1
      ? legend._lineData.slice()
      : legend._lineData
          .filter(
            (d: Record<string, unknown>) =>
              (d.width as number) + (d.shapeWidth as number) + legend.schema.padding * (d.width ? 2 : 1) >
                availableWidth && (d.words as unknown[]).length >= state.lines,
          )
          .sort(
            (a: Record<string, unknown>, b: Record<string, unknown>) =>
              (b.sentence as string).length - (a.sentence as string).length,
          );

  if (wrappable.length && availableHeight > (wrappable[0].height as number) * state.lines) {
    let truncated = false;
    for (let x = 0; x < wrappable.length; x++) {
      const label = wrappable[x];
      const og = label.og as Record<string, number>;
      const h = og.height * state.lines,
        w = og.width * (1.5 * (1 / state.lines));
      const res = textWrap()
        .fontFamily(label.f as string)
        .fontSize(label.s as number)
        .lineHeight(label.lh as number)
        .width(w)
        .height(h)(label.sentence as string);
      if (!res.truncated) {
        label.width =
          Math.ceil(
            max(
              res.lines.map((t: string) =>
                textWidth(t, {
                  "font-family": label.f as string,
                  "font-size": label.s as number,
                }),
              ),
            )!,
          ) + (label.s as number);
        label.height = res.lines.length * ((label.lh as number) + 1);
      } else {
        truncated = true;
        break;
      }
    }
    if (!truncated) legend._wrapRows!();
  } else {
    state.newRows = [];
    return;
  }
}

/** Packs the measured labels into rows that fit the available width/height. */
function buildRows(
  legend: Legend,
  state: WrapState,
  availableWidth: number,
  availableHeight: number,
): void {
  state.newRows = [];
  let row = 1,
    rowWidth = 0;
  for (let i = 0; i < legend._lineData.length; i++) {
    const d = legend._lineData[i],
      w = (d.width as number) + legend.schema.padding * (d.width ? 2 : 1) + (d.shapeWidth as number);
    if (
      sum(
        state.newRows.map((row: Record<string, unknown>[]) =>
          max(row, (d: Record<string, unknown>) =>
            max([d.height as number, d.shapeHeight as number]),
          ),
        ),
      ) > availableHeight
    ) {
      state.newRows = [];
      break;
    }
    if (w > availableWidth) {
      state.newRows = [];
      legend._wrapLines!();
      break;
    } else if (rowWidth + w < availableWidth) {
      rowWidth += w;
    } else if (legend.schema.direction !== "column") {
      rowWidth = w;
      row++;
    }
    if (!state.newRows[row - 1]) state.newRows[row - 1] = [];
    state.newRows[row - 1].push(d);
    if (legend.schema.direction === "column") {
      rowWidth = 0;
      row++;
    }
  }
}

/**
    Runs the row-wrapping pass: builds rows, retries label-free if it overflows,
    then distributes row `y` offsets. Returns the resolved `spaceNeeded`.
*/
export function wrapLegendRows(
  legend: Legend,
  availableWidth: number,
  availableHeight: number,
  spaceNeeded: number,
): number {
  const state: WrapState = {
    lines: 1,
    newRows: [],
    maxLines: max(
      legend._lineData.map((d: Record<string, unknown>) => (d.words as unknown[]).length),
    ),
  };
  legend._wrapLines = () => tryWrapLines(legend, state, availableWidth, availableHeight);
  legend._wrapRows = () => buildRows(legend, state, availableWidth, availableHeight);

  legend._wrapRows();

  if (
    !state.newRows.length ||
    sum(state.newRows, legend._rowHeight.bind(legend)) + legend.schema.padding >
      availableHeight
  ) {
    spaceNeeded =
      sum(
        legend._lineData.map(
          (d: Record<string, unknown>) => (d.shapeWidth as number) + legend.schema.padding,
        ),
      ) - legend.schema.padding;
    for (let i = 0; i < legend._lineData.length; i++) {
      legend._lineData[i].width = 0;
      legend._lineData[i].height = 0;
    }
    legend._wrapRows();
  }

  if (
    state.newRows.length &&
    sum(state.newRows, legend._rowHeight.bind(legend)) + legend.schema.padding <
      availableHeight
  ) {
    state.newRows.forEach((row: Record<string, unknown>[], i: number) => {
      row.forEach((d: Record<string, unknown>) => {
        if (i) {
          d.y = sum(state.newRows.slice(0, i), legend._rowHeight.bind(legend));
        }
      });
    });
    spaceNeeded = max(
      state.newRows,
      legend._rowWidth.bind(legend),
    ) as unknown as number;
  }

  return spaceNeeded;
}

/** Computes `_outerBounds` (size + aligned x/y offset) from the laid-out rows. */
export function computeLegendBounds(legend: Legend, spaceNeeded: number): void {
  const innerHeight =
      max(
        legend._lineData,
        (d: Record<string, unknown>, i: number) =>
          max([d.height as number, legend._fetchConfig("height", d.data as DataPoint, i) as number])! + (d.y as number),
      )! + legend._titleHeight,
    innerWidth = max([spaceNeeded, legend._titleWidth])!;

  legend._outerBounds.width = innerWidth;
  legend._outerBounds.height = innerHeight;

  let xOffset = legend.schema.padding,
    yOffset = legend.schema.padding;
  if (legend.schema.align === "center") xOffset = (legend.schema.width - innerWidth) / 2;
  else if (legend.schema.align === "right")
    xOffset = legend.schema.width - legend.schema.padding - innerWidth;
  if (legend.schema.verticalAlign === "middle")
    yOffset = (legend.schema.height - innerHeight) / 2;
  else if (legend.schema.verticalAlign === "bottom")
    yOffset = legend.schema.height - legend.schema.padding - innerHeight;
  legend._outerBounds.x = xOffset;
  legend._outerBounds.y = yOffset;
}

/** Renders the title TextBox into the legend's title group. */
export function renderLegendTitle(legend: Legend): void {
  legend._titleClass
    .renderMode("compute")
    .data(legend.schema.title ? [{text: legend.schema.title}] : [])
    .duration(legend.schema.duration)
    .select(legend._titleGroup.node())
    .textAnchor(({left: "start", center: "middle", right: "end"} as Record<string, string>)[legend.schema.align])
    .width(legend.schema.width - legend.schema.padding * 2)
    .x(legend.schema.padding)
    .y(legend._outerBounds.y)
    .config(legend.schema.titleConfig)
    .render();
}

/** Builds the per-shape data and renders the Circle/Rect swatch groups. */
export function renderLegendShapes(legend: Legend): void {
  legend._shapes = [];
  const baseConfig = configPrep.bind(legend as any)(legend.schema.shapeConfig, "legend"),
    config = {
      id: (d: Record<string, unknown>) => d.id,
      label: (d: Record<string, unknown>) => d.label,
      lineHeight: (d: Record<string, unknown>) => d.lH,
    };

  const data = legend._data.map((d: DataPoint, i: number) => {
    const obj: Record<string, unknown> = {
      __d3plus__: true,
      data: d,
      i,
      id: legend.schema.id(d, i),
      label: legend._lineData[i].width ? legend.schema.label(d, i) : false,
      lH: legend._fetchConfig("lineHeight", d, i),
      shape: legend.schema.shape(d, i),
    };

    return obj;
  });

  legend._shapes = [];
  (["Circle", "Rect"] as const).forEach((Shape: string) => {
    legend._shapes.push(
      // Child shapes are compute-only — Legend composes the swatches into its
      // own toScene, so sub-shapes never auto-render their own <svg>.
      new (shapes as Record<string, new () => any>)[Shape]()
        .renderMode("compute")
        .parent(legend)
        .data(data.filter((d: Record<string, unknown>) => d.shape === Shape))
        .duration(legend.schema.duration)
        .labelConfig({padding: 0})
        .select(legend._shapeGroup.node())
        .verticalAlign("top")
        .config(assign({}, baseConfig, config))
        .render(),
    );
  });
}
