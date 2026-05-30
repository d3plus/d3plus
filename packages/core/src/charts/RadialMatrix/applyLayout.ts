/**
    `applyRadialMatrixLayout` — RadialMatrix's chart-specific layout stage.

    Runs `matrixData.prepData`, computes polar geometry (label positions,
    arc generator), runs `viz.ctx.columnLabels` (a TextBox) in compute
    mode and absorbs it into `_chartScene`. Stashes `arcData` on
    `viz.ctx`, plus `radialMatrixWidth`/`radialMatrixHeight` so the chart
    transform can center the layout.
*/

import {min} from "d3-array";
import * as d3Shape from "d3-shape";

import type {DataPoint} from "@d3plus/data";

import type {TransformStage} from "../stages.js";
import {chartBounds} from "../chartGeometry.js";
import matrixPrepData from "../helpers/matrixData.js";

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

/** Renders the column-label TextBox in compute mode and absorbs it into `_chartScene`. */
const renderColumnLabels = (
  viz: Parameters<TransformStage>[0]["viz"],
  displayLabels: LabelDatum[],
  labelWidth: number,
  labelHeight: number,
  labelConfig: unknown,
): void => {
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
  const labelsScene = columnLabels.toScene();
  if (labelsScene) {
    (viz._chartScene ||= []).push({
      type: "group",
      key: "radialmatrix-columns",
      children: (labelsScene.children ?? []) as never[],
    });
  }
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

  const labelHeight = 50;
  const labelWidth = 100;
  const radius = (min([height - labelHeight * 2, width - labelWidth * 2]) ?? 0) / 2;

  const flippedColumns = columnValues.slice().reverse();
  flippedColumns.unshift(flippedColumns.pop());
  const total = flippedColumns.length;

  const labelData: LabelDatum[] = flippedColumns.map((key, i) => {
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

  const columnConfig = viz.schema.columnConfig as {
    labels?: unknown[];
    shapeConfig?: {labelConfig?: unknown};
  };
  const displayLabels =
    columnConfig.labels instanceof Array
      ? labelData.filter(d => columnConfig.labels!.includes(d.key))
      : labelData;

  renderColumnLabels(
    viz,
    displayLabels,
    labelWidth,
    labelHeight,
    columnConfig.shapeConfig?.labelConfig,
  );

  const innerRadiusFn = viz.schema.innerRadius as (r: number) => number;
  const innerRadius = innerRadiusFn(radius);
  const rowHeight = (radius - innerRadius) / rowValues.length;
  const columnWidth =
    labelData.length > 1
      ? labelData[1].radians - labelData[0].radians
      : TAU;
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
    .innerRadius(d => innerRadius + (rowIndex.get(d.row) ?? 0) * rowHeight + cellPadding / 2)
    .outerRadius(d => innerRadius + ((rowIndex.get(d.row) ?? 0) + 1) * rowHeight - cellPadding / 2)
    .startAngle(d => labelData[colIndex.get(d.column) ?? 0].radians - columnWidth / 2)
    .endAngle(d => labelData[colIndex.get(d.column) ?? 0].radians + columnWidth / 2);

  viz.ctx.arcData = arc;
  return {shapeData};
};
