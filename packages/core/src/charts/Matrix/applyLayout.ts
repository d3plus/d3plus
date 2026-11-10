/**
    `applyMatrixLayout` — Matrix's chart-specific layout stage.

    Two-pass axis layout: measure-only pass for padding, then compute-mode
    render that absorbs row/column axis scenes into `_chartScene` as chrome
    (see `inertAxis`), their labels following the hover (see
    `tagHoverTicks`). Stashes `columnScale`/`rowScale`/`cellWidth`/
    `cellHeight` on `viz.ctx`.
*/

import type {SceneNode} from "@d3plus/render";

import {inertAxis} from "../../components/Axis/axisTooltipTargets.js";
import {defaultMaxSize} from "../../components/Axis/axisMaxSize.js";
import type {TransformStage} from "../pipeline/stages.js";
import {chartBounds} from "../features/chartGeometry.js";
import {tagHoverTicks} from "../features/hoverTicks.js";
import matrixPrepData from "../helpers/matrixData.js";

type AxisLike = {
  domain: (d: unknown[]) => AxisLike;
  range: (r: (number | undefined)[]) => AxisLike;
  height: (h: number) => AxisLike;
  width: (w: number) => AxisLike;
  maxSize: (n: number) => AxisLike;
  /** Whether `maxSize` is the chart's own default limit (see `defaultMaxSize`). */
  _softMaxSize?: boolean;
  labelRotation: (b: boolean | undefined) => AxisLike;
  config: (c: unknown) => AxisLike;
  measure: () => AxisLike;
  renderMode: (m: string) => AxisLike;
  select: (el: HTMLElement | undefined) => AxisLike;
  render: () => AxisLike;
  outerBounds: () => {width: number; height: number};
  padding: () => number;
  toScene: () => {children?: unknown[]} | undefined;
  _getPosition: (v: unknown) => number;
};

export const applyMatrixLayout: TransformStage = ({viz}) => {
  const prep = matrixPrepData.bind(viz)(viz._filteredData);
  const {rowValues, columnValues, shapeData} = prep as {
    rowValues: unknown[];
    columnValues: unknown[];
    shapeData: unknown[];
  };

  if (!rowValues.length || !columnValues.length) return {shapeData: []};

  const {width, height} = chartBounds(viz);
  // Force rotation when columns are too narrow for horizontal labels; otherwise
  // pass `undefined` so the axis auto-rotates whenever its labels would overlap
  // or truncate (forcing `false` here suppressed that and dropped long labels).
  const columnRotation = width / columnValues.length < 120 || undefined;

  viz._padding = {top: 0, right: 0, bottom: 0, left: 0};

  const rowAxis = viz.ctx.rowAxis as AxisLike;
  const columnAxis = viz.ctx.columnAxis as AxisLike;
  const rowConfig = viz.schema.rowConfig;
  const columnConfig = viz.schema.columnConfig;

  rowAxis
    .domain(rowValues)
    .height(height - viz._padding.bottom - viz._padding.top)
    .maxSize(width / 4)
    .width(width)
    .config(rowConfig);
  defaultMaxSize(rowAxis, rowConfig).measure();
  const rowPadding = rowAxis.outerBounds().width;
  viz._padding.left += rowPadding;

  // `width` from chartBounds already excludes both margins, so the right edge
  // in absolute svg coords is `_margin.left + width` — re-subtracting
  // `_margin.right` here would squeeze the column band scale (and the cells
  // that share it) by the legend's reserved width.
  columnAxis
    .domain(columnValues)
    .range([
      viz._margin.left + viz._padding.left,
      viz._margin.left + width - viz._padding.right,
    ])
    .height(height)
    .maxSize(height / 4)
    .width(width)
    .labelRotation(columnRotation)
    .config(columnConfig);
  defaultMaxSize(columnAxis, columnConfig).measure();
  const columnPadding = columnAxis.outerBounds().height;
  viz._padding.top += columnPadding;

  // Compute-mode render → absorb each axis scene.
  rowAxis
    .renderMode("compute")
    .select(undefined as unknown as HTMLElement)
    .height(height - viz._padding.bottom)
    .maxSize(rowPadding)
    .range([columnPadding + columnAxis.padding(), undefined])
    .render();
  const rowScene = rowAxis.toScene();
  if (rowScene) {
    const group: SceneNode = {
      type: "group",
      key: "matrix-row-axis",
      transform: {x: viz._margin.left, y: 0},
      children: (rowScene.children ?? []) as never[],
    };
    tagHoverTicks(group, "row");
    (viz._chartScene ||= []).push(inertAxis(group));
  }

  columnAxis
    .renderMode("compute")
    .select(undefined as unknown as HTMLElement)
    .range([
      viz._margin.left + viz._padding.left + rowAxis.padding(),
      viz._margin.left + width - viz._padding.right,
    ])
    .maxSize(columnPadding)
    .render();
  const colScene = columnAxis.toScene();
  if (colScene) {
    const group: SceneNode = {
      type: "group",
      key: "matrix-column-axis",
      transform: {x: 0, y: 0},
      children: (colScene.children ?? []) as never[],
    };
    tagHoverTicks(group, "column");
    (viz._chartScene ||= []).push(inertAxis(group));
  }

  const rowScale = rowAxis._getPosition.bind(rowAxis);
  const columnScale = columnAxis._getPosition.bind(columnAxis);
  const cellHeight =
    rowValues.length > 1
      ? rowScale(rowValues[1]) - rowScale(rowValues[0])
      : (rowAxis as unknown as {height: () => number}).height();
  const cellWidth =
    columnValues.length > 1
      ? columnScale(columnValues[1]) - columnScale(columnValues[0])
      : (columnAxis as unknown as {width: () => number}).width();

  viz.ctx.columnScale = columnScale;
  viz.ctx.rowScale = rowScale;
  viz.ctx.cellWidth = cellWidth;
  viz.ctx.cellHeight = cellHeight;

  return {shapeData};
};
