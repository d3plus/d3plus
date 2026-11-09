/**
    `applyRadialMatrixLayout` — RadialMatrix's chart-specific layout stage.

    Runs `matrixData.prepData`, computes polar geometry (label positions,
    arc generator), and lays the column labels into `_chartScene`: curved
    just outside the circle when they all fit (see `labelPosition`), which
    leaves the circle the most room, else straight in `viz.ctx.columnLabels`
    (a TextBox, in compute mode) wherever they don't curve. Stashes
    `arcData` on `viz.ctx`, plus `radialMatrixWidth`/`radialMatrixHeight`
    so the chart transform can center the layout.
*/

import {min} from "d3-array";
import * as d3Shape from "d3-shape";

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import type {TransformStage} from "../pipeline/stages.js";
import {chartBounds} from "../features/chartGeometry.js";
import {textLineBoxes} from "../features/linkLabels.js";
import {clearRingLabels} from "../features/ringLabelNodes.js";
import {ringLabelPosition} from "../features/ringLabels.js";
import matrixPrepData from "../helpers/matrixData.js";
import {RADAR_EDGE_GAP} from "../Radar/axisLabels.js";
import {labelFont} from "../Radar/axisDecorations.js";
import {
  radarCurveNodes,
  radarCurvedLayout,
  radarCurvesAt,
} from "../Radar/curvedLabels.js";
import type {RadarCurve} from "../Radar/curvedLabels.js";

const TAU = Math.PI * 2;

interface LabelDatum {
  key: unknown;
  angle: number;
  quadrant: number;
  radians: number;
  x: number;
  y: number;
}

type TextBoxLike = {
  renderMode: (m: string) => TextBoxLike;
  select: (el: HTMLElement | undefined) => TextBoxLike;
  data: (d: LabelDatum[]) => TextBoxLike;
  x: (fn: (d: LabelDatum) => number) => TextBoxLike;
  y: (fn: (d: LabelDatum) => number) => TextBoxLike;
  text: (fn: (d: LabelDatum) => unknown) => TextBoxLike;
  width: (n: number) => TextBoxLike;
  height: (n: number) => TextBoxLike;
  config: (c: unknown) => TextBoxLike;
  render: () => TextBoxLike;
  toScene: () => {children?: unknown[]} | undefined;
};

interface MatrixArc {
  padAngle: (n: number) => MatrixArc;
  innerRadius: (fn: (d: {row: unknown}) => number) => MatrixArc;
  outerRadius: (fn: (d: {row: unknown}) => number) => MatrixArc;
  startAngle: (fn: (d: {column: unknown}) => number) => MatrixArc;
  endAngle: (fn: (d: {column: unknown}) => number) => MatrixArc;
}

/**
    The straight column labels: the TextBox, rendered in compute mode, each
    following the hover of its column's cells.
*/
const straightColumnLabels = (
  viz: Parameters<TransformStage>[0]["viz"],
  displayLabels: LabelDatum[],
  labelWidth: number,
  labelHeight: number,
  labelConfig: unknown,
): SceneNode[] => {
  if (!displayLabels.length) return [];
  const columnLabels = viz.ctx.columnLabels as TextBoxLike;
  columnLabels
    .renderMode("compute")
    .select(undefined as unknown as HTMLElement)
    .data(displayLabels)
    .x(d => d.x)
    .y(d => d.y)
    .text(d => d.key)
    .width(labelWidth)
    .height(labelHeight)
    .config(labelConfig)
    .render();
  const nodes = (columnLabels.toScene()?.children ?? []) as SceneNode[];
  // Each label follows the hover of its column's cells.
  for (const n of nodes) {
    const column = (n.datum as LabelDatum | undefined)?.key;
    if (column !== undefined) n.hoverMatch = {field: "column", value: column};
  }
  return nodes;
};

/**
    Each column's label curved just outside the circle, column `k` centered
    on its slice: every one when they all fit, at the radius that leaves
    (`radius` null), else those that fit at `radius`. Columns `shown` leaves
    out take no label.
*/
const columnCurves = (
  viz: Parameters<TransformStage>[0]["viz"],
  columns: {key: unknown; data: DataPoint}[],
  shown: (key: unknown) => boolean,
  labelConfig: Record<string, unknown>,
  room: number,
  radius: number,
): {radius: number; curves: (RadarCurve | null)[]} => {
  const inputs = columns.map(({key, data}, k) => {
    const text = shown(key) ? `${key}` : "";
    return {
      text,
      data,
      angle: (k / columns.length) * TAU - Math.PI / 2,
      font: labelFont(viz, text, data, k, labelConfig),
    };
  });
  return (
    radarCurvedLayout(viz, inputs, room) ?? {
      radius,
      curves: radarCurvesAt(viz, inputs, radius, room),
    }
  );
};

/**
    Where each column's straight label sits for a circle of `radius`: a
    `labelWidth` × `labelHeight` box beyond the circle at its column's angle.
*/
const straightPlacements = (
  columnValues: unknown[],
  radius: number,
  labelWidth: number,
  labelHeight: number,
): LabelDatum[] => {
  const flippedColumns = columnValues.slice().reverse();
  flippedColumns.unshift(flippedColumns.pop());
  const total = flippedColumns.length;

  return flippedColumns.map((key, i) => {
    const radians = (i / total) * TAU;
    const angle = Math.round((radians * 180) / Math.PI);
    const quadrant = Math.floor((((angle + 90) / 90) % 4) + 1);

    const xMod = [0, 180].includes(angle)
      ? -labelWidth / 2
      : [2, 3].includes(quadrant)
        ? -labelWidth
        : 0;
    const yMod = [90, 270].includes(angle)
      ? -labelHeight / 2
      : [2, 1].includes(quadrant)
        ? -labelHeight
        : 0;

    return {
      key,
      angle,
      quadrant,
      radians,
      x: radius * Math.sin(radians + Math.PI) + xMod,
      y: radius * Math.cos(radians + Math.PI) + yMod,
    };
  });
};

/**
    Lays the column labels into `_chartScene` and returns the circle's
    radius they leave, with each column's straight label placement.
*/
const layColumnLabels = (
  viz: Parameters<TransformStage>[0]["viz"],
  columnValues: unknown[],
  shapeData: (DataPoint & {column: unknown})[],
  width: number,
  height: number,
): {radius: number; labelData: LabelDatum[]} => {
  const labelHeight = 50;
  const labelWidth = 100;
  const columnConfig = viz.schema.columnConfig as {
    labels?: unknown[];
    shapeConfig?: {labelConfig?: Record<string, unknown>};
  };
  const labelConfig = columnConfig.shapeConfig?.labelConfig ?? {};
  const shown = (key: unknown) =>
    !(columnConfig.labels instanceof Array) ||
    columnConfig.labels.includes(key);
  const rowOf = new Map<unknown, DataPoint>();
  for (const d of shapeData)
    if (!rowOf.has(d.column)) rowOf.set(d.column, (d.data ?? d) as DataPoint);
  const columns = columnValues.map(key => ({
    key,
    data: rowOf.get(key) ?? ({column: key} as DataPoint),
  }));
  const {radius, curves} = columnCurves(
    viz,
    columns,
    shown,
    labelConfig,
    Math.max(0, Math.min(width, height) / 2 - RADAR_EDGE_GAP),
    Math.max(0, min([height - labelHeight * 2, width - labelWidth * 2]) ?? 0) /
      2,
  );

  const labelData = straightPlacements(
    columnValues,
    radius,
    labelWidth,
    labelHeight,
  );

  const curved = radarCurveNodes(
    viz,
    columns.flatMap(({key, data}, k) => {
      const curve = curves[k];
      return curve
        ? [
            {
              key: `radialmatrix-column-${key}`,
              data,
              i: k,
              curve,
              hoverMatch: {field: "column", value: key},
            },
          ]
        : [];
    }),
    labelConfig,
  );
  const straightKeys = new Set(
    columns
      .filter(
        ({key, data}, k) =>
          shown(key) &&
          !curves[k] &&
          ringLabelPosition(viz, data, k) !== "along",
      )
      .map(c => c.key),
  );
  const straight = straightColumnLabels(
    viz,
    labelData.filter(d => straightKeys.has(d.key)),
    labelWidth,
    labelHeight,
    labelConfig,
  );
  const labels = [
    ...curved,
    ...clearRingLabels(straight, textLineBoxes(curved)),
  ];
  if (labels.length)
    (viz._chartScene ||= []).push({
      type: "group",
      key: "radialmatrix-columns",
      children: labels as never[],
    });

  return {radius, labelData};
};

export const applyRadialMatrixLayout: TransformStage = ({viz}) => {
  const {rowValues, columnValues, shapeData} = matrixPrepData.bind(viz)(
    viz._filteredData,
  ) as {
    rowValues: unknown[];
    columnValues: unknown[];
    shapeData: (DataPoint & {row: unknown; column: unknown})[];
  };

  const {width, height} = chartBounds(viz);

  if (!rowValues.length || !columnValues.length) {
    viz.ctx.radialMatrixWidth = width;
    viz.ctx.radialMatrixHeight = height;
    return {shapeData: []};
  }

  viz.ctx.radialMatrixWidth = width;
  viz.ctx.radialMatrixHeight = height;

  const {radius, labelData} = layColumnLabels(
    viz,
    columnValues,
    shapeData,
    width,
    height,
  );

  const innerRadiusFn = viz.schema.innerRadius as (r: number) => number;
  const innerRadius = innerRadiusFn(radius);
  const rowHeight = (radius - innerRadius) / rowValues.length;
  const columnWidth =
    labelData.length > 1 ? labelData[1].radians - labelData[0].radians : TAU;
  const flippedRows = rowValues.slice().reverse();

  // Precompute row/column index Maps once (would be O(R*C*(R+C)) per draw without).
  const rowIndex = new Map<unknown, number>();
  flippedRows.forEach((r, i) => rowIndex.set(r, i));
  const colIndex = new Map<unknown, number>();
  columnValues.forEach((c, i) => colIndex.set(c, i));

  const cellPadding = viz.schema.cellPadding as number;
  const arcData = (d3Shape.arc as unknown as () => MatrixArc)().padAngle(
    cellPadding / radius,
  );

  const arc = arcData
    .innerRadius(
      d =>
        innerRadius + (rowIndex.get(d.row) ?? 0) * rowHeight + cellPadding / 2,
    )
    .outerRadius(
      d =>
        innerRadius +
        ((rowIndex.get(d.row) ?? 0) + 1) * rowHeight -
        cellPadding / 2,
    )
    .startAngle(
      d => labelData[colIndex.get(d.column) ?? 0].radians - columnWidth / 2,
    )
    .endAngle(
      d => labelData[colIndex.get(d.column) ?? 0].radians + columnWidth / 2,
    );

  viz.ctx.arcData = arc;
  return {shapeData};
};
