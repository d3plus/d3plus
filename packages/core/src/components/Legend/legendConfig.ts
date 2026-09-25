import {max} from "d3-array";

import {colorContrast} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import {backgroundColor} from "@d3plus/dom";

import {accessor, constant} from "../../utils/index.js";

import type Legend from "./Legend.js";

const padding = 5;

type Row = Record<string, unknown>;

interface LegendPositions {
  deps: unknown[];
  x: number[];
  y: number[];
}

const positionCache = new WeakMap<Legend, LegendPositions>();

/**
    Every swatch's x/y position, computed in one pass and cached until the
    legend's layout changes. Scene repaints (hover, zoom) re-walk the swatch
    accessors, and resolving each item against its whole row made that
    quadratic in the number of legend items.
*/
function legendPositions(legend: Legend): LegendPositions {
  const lineData = legend._lineData as Row[];
  const {align, direction, padding: pad} = legend.schema;
  const bounds = legend._outerBounds;
  const deps = [
    lineData, legend._data, bounds.x, bounds.y, bounds.width,
    legend._titleHeight, legend._rtl, align, direction, pad,
  ];
  const cached = positionCache.get(legend);
  if (cached && cached.deps.every((v, i) => v === deps[i])) return cached;

  // Each row's items (in legend order), total width, and tallest label.
  const rows = new Map<unknown, Row[]>();
  lineData.forEach(l => {
    const row = rows.get(l.y);
    if (row) row.push(l);
    else rows.set(l.y, [l]);
  });
  const rowWidths = new Map<unknown, number>();
  const rowHeights = new Map<unknown, number>();
  rows.forEach((row, y) => {
    rowWidths.set(y, legend._rowWidth(row));
    rowHeights.set(y, max(row.map(l => l.height as number))!);
  });
  const dataHeight = max(
    legend._data.map((l: DataPoint, x: number) => legend._fetchConfig("height", l, x) as number),
  );

  // Running `_rowWidth` of the items before each one in its row: the sum of
  // their shape + label widths, plus the padding after every one but the last.
  const running = new Map<unknown, {widths: number; pads: number; last: number; count: number}>();
  const x: number[] = [];
  const y: number[] = [];
  lineData.forEach(datum => {
    const rowY = datum.y;
    const rowWidth = rowWidths.get(rowY)!;
    const offset =
      align === "left" || (align === "right" && direction === "column")
        ? 0
        : align === "center"
          ? (bounds.width - rowWidth) / 2
          : bounds.width - rowWidth;
    const r = running.get(rowY) || {widths: 0, pads: 0, last: 0, count: 0};
    const prevWidth = r.count ? r.widths + pad * (r.pads - r.last) : 0;
    const rtlMod = legend._rtl ? (datum.width as number) + pad : 0;
    x.push(
      prevWidth +
        pad * (r.count ? (datum.sentence ? 2 : 1) : 0) +
        bounds.x +
        (datum.shapeWidth as number) / 2 +
        offset +
        rtlMod,
    );
    y.push(
      (rowY as number) +
        legend._titleHeight +
        bounds.y +
        max([rowHeights.get(rowY)!, dataHeight!])! / 2,
    );
    const factor = datum.width ? 2 : 1;
    running.set(rowY, {
      widths: r.widths + (datum.shapeWidth as number) + (datum.width as number),
      pads: r.pads + factor,
      last: factor,
      count: r.count + 1,
    });
  });

  const positions = {deps, x, y};
  positionCache.set(legend, positions);
  return positions;
}

/**
    Builds the Legend's default `shapeConfig` object. The accessors close over
    the `legend` instance so they read live `_lineData` / `_outerBounds` /
    `_rtl` / `_titleHeight` state during render.
*/
export function buildLegendShapeConfig(legend: Legend): Record<string, unknown> {
  return {
    fill: accessor("color"),
    height: constant(12),
    hitArea: (dd: DataPoint, i: number) => {
      const d = legend._lineData[i],
        h = max([d.height as number, d.shapeHeight as number]);
      return {
        width: (d.width as number) + (d.shapeWidth as number),
        height: h,
        x: -(d.shapeWidth as number) / 2,
        y: -h! / 2,
      };
    },
    labelBounds: (dd: DataPoint, i: number) => {
      const d = legend._lineData[i];
      let x = (d.shapeWidth as number) / 2;
      if (d.shape === "Circle") x -= (d.shapeR as number) / 2;
      const height = max([d.shapeHeight as number, d.height as number]);
      const rtlMod = legend._rtl
        ? (d.shapeWidth as number) + (d.width as number) + legend.schema.padding * 2
        : 0;
      return {
        width: d.width as number,
        height,
        x: x + padding - rtlMod,
        y: -height! / 2,
      };
    },
    labelConfig: {
      fontColor: () => {
        const bg = legend._select ? backgroundColor(legend._select.node()) : "rgb(255, 255, 255)";
        return colorContrast(bg);
      },
      fontFamily: legend._titleClass.fontFamily(),
      fontResize: false,
      fontSize: constant(10),
      // The swatch's `hitArea` already spans the label, so let it own pointer
      // events for the whole item. A bare label would carry a different scene
      // key than its swatch, so hovering across the swatch→label padding would
      // otherwise read as leaving one item and entering another.
      pointerEvents: constant("none"),
      verticalAlign: "middle",
    },
    opacity: 1,
    r: constant(6),
    width: constant(12),
    x: (d: DataPoint, i: number) => legendPositions(legend).x[i],
    y: (d: DataPoint, i: number) => legendPositions(legend).y[i],
  };
}
