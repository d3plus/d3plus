/**
    `measurePlotLineLabels` — measures label widths for Line shapes so the
    chart's x-axis range can leave space for in-line labels (a common Plot
    feature). Reads pre-measured test-axis state (`xTest._d3Scale`, etc.)
    through the context. Pure compute + textWidth — no DOM.

    Returns `{labelWidths, largestLabel, xRangeMax}` for the paint phase.
    The test axes themselves come via `plotTestAxes` ctx field (Plot._draw
    measures them then injects).
*/
import {groups, max, min} from "d3-array";

import {textWidth as d3plusTextWidth} from "@d3plus/dom";

import type {Axis, TextBox} from "../../components/index.js";
import type Shape from "../../shapes/Shape.js";

import {shapeConfigFor} from "../features/emitHelpers.js";
import type {DataPoint} from "@d3plus/data";

import type {TransformStage} from "../pipeline/stages.js";
import {axisValue} from "./sharedTooltip.js";
import {
  lineLabelText,
  lineLabelValue,
  rowLineLabelSides,
  type LineLabelConfig,
  type LineLabelSide,
} from "./lineLabelSides.js";

/** A d3plus config value: a constant or a `(datum, index)` accessor. */
type ConfigAccessor<T> = T | ((d: Record<string, unknown>, i?: number) => T);

interface LineLabelCtx {
  labelFunction: ConfigAccessor<string>;
  fontColorAccessor: ConfigAccessor<string>;
  fontSizeAccessor: ConfigAccessor<number>;
  fontWeightAccessor: ConfigAccessor<number | string>;
  fontFamilyAccessor: ConfigAccessor<string | string[]>;
  paddingAccessor: ConfigAccessor<number>;
  xEstimate: (d: unknown) => number;
  yEstimate: (d: unknown) => number;
  /** The value text for a label's point, or `undefined` without one. */
  valueText: (value: unknown, d: Record<string, unknown>) => string | undefined;
}

/** Unwraps a formatted Plot row to its source datum and that datum's index. */
function sourceRow(row: Record<string, unknown>): {
  d: Record<string, unknown>;
  i: number | undefined;
} {
  let d = row;
  let i: number | undefined;
  while (d.__d3plus__ && d.data) {
    d = d.data as Record<string, unknown>;
    i = d.i as number | undefined;
  }
  return {d, i};
}

/**
    Measures one end of a line's label (width, position, overlap coords): its
    right end (`"end"`, the last point across) or its left end (`"start"`).
*/
export function measureLineLabel(
  [lineKey, lineValues]: [unknown, Record<string, unknown>[]],
  ctx: LineLabelCtx,
  side: LineLabelSide = "end",
) {
  const {
    labelFunction,
    fontColorAccessor,
    fontSizeAccessor,
    fontWeightAccessor,
    fontFamilyAccessor,
    paddingAccessor,
    xEstimate,
    yEstimate,
  } = ctx;

  const end = side === "end";
  const {d, i} = sourceRow(lineValues[end ? lineValues.length - 1 : 0]);
  const label =
    typeof labelFunction === "function" ? labelFunction(d, i) : labelFunction;
  const fontColor =
    typeof fontColorAccessor === "function"
      ? fontColorAccessor(d, i)
      : fontColorAccessor;
  const fontSize =
    typeof fontSizeAccessor === "function"
      ? fontSizeAccessor(d, i)
      : fontSizeAccessor;
  const fontWeight =
    typeof fontWeightAccessor === "function"
      ? fontWeightAccessor(d, i)
      : fontWeightAccessor;
  let fontFamily =
    typeof fontFamilyAccessor === "function"
      ? fontFamilyAccessor(d, i)
      : fontFamilyAccessor;
  if (Array.isArray(fontFamily))
    fontFamily = fontFamily.map((f: string) => `'${f}'`).join(", ");
  const labelPadding =
    typeof paddingAccessor === "function"
      ? paddingAccessor(d, i)
      : paddingAccessor;
  const coords = lineValues.map((d: Record<string, unknown>) => [
    xEstimate(d.x),
    yEstimate(d.y),
  ]);
  // A line always has values, so the extent is defined.
  const xs = lineValues.map((d: Record<string, unknown>) => xEstimate(d.x));
  const edgeX = (end ? max(xs) : min(xs)) as number;
  const edgeRow = lineValues.find(
    (d: Record<string, unknown>) => xEstimate(d.x) === edgeX,
  ) as Record<string, unknown>;
  const labelY = edgeRow.y;
  const valueText = ctx.valueText(labelY, edgeRow);
  const labelWidth = d3plusTextWidth(
    valueText === undefined ? label : lineLabelText(label, valueText),
    {
      "font-size": fontSize,
      "font-family": fontFamily,
      "font-weight": fontWeight,
    },
  );
  return {
    id: lineKey,
    side,
    valueText,
    labelWidth: labelWidth + labelPadding * 2,
    spaceNeeded: labelWidth + labelPadding * 4,
    value: labelY,
    yEstimate: yEstimate(labelY),
    padding: labelPadding,
    fontSize,
    fontColor,
    edgeX,
    // The x value at the labeled end, which the connectors and bumping
    // group by: on a reversed or categorical axis, not the largest x.
    xValue: edgeRow.x,
    coords,
  };
}

/** A measured line label (see `measureLineLabel`). */
type LineLabel = ReturnType<typeof measureLineLabel>;

/**
    Whether another line passes through the space `label` would occupy past
    its line's end: right of its last point, or left of its first point for a
    `"start"` label.
*/
export function labelOverlapsLine(
  label: LineLabel,
  labels: LineLabel[],
): boolean {
  const {fontSize, id, labelWidth, edgeX, side, yEstimate} = label;
  const dir = side === "start" ? -1 : 1;
  const closeLabels = labels.filter(
    l =>
      l.id !== id &&
      l.coords.some(
        (c: number[]) =>
          ((c[0] - edgeX) * dir > 0 || (c[0] === edgeX && l.edgeX !== edgeX)) &&
          (edgeX + labelWidth * dir - c[0]) * dir >= 0 &&
          c[1] <= yEstimate + fontSize * 0.75 &&
          c[1] >= yEstimate - fontSize * 0.75,
      ),
  );
  return closeLabels.length !== 0;
}

/**
    The Line labels' text and style accessors. Each falls back from the Line
    shape's labelConfig to the test TextBox's getter; both yield a d3plus
    config value (constant or accessor).
*/
function lineLabelStyle(
  viz: Parameters<TransformStage>[0]["viz"],
  testLineShape: Shape,
  testTextBox: TextBox,
): Omit<LineLabelCtx, "xEstimate" | "yEstimate" | "valueText"> {
  const userConfig = shapeConfigFor(viz, "Line");
  testLineShape.config(userConfig);
  const lineLabelConfig = testLineShape.labelConfig();
  const fontColorAccessor = (
    lineLabelConfig.fontColor !== undefined
      ? lineLabelConfig.fontColor
      : testTextBox.fontColor()
  ) as ConfigAccessor<string>;
  const fontSizeAccessor = (
    lineLabelConfig.fontSize !== undefined
      ? lineLabelConfig.fontSize
      : testTextBox.fontSize()
  ) as ConfigAccessor<number>;
  const fontWeightAccessor = (
    lineLabelConfig.fontWeight !== undefined
      ? lineLabelConfig.fontWeight
      : testTextBox.fontWeight()
  ) as ConfigAccessor<number | string>;
  const fontFamilyAccessor = (
    lineLabelConfig.fontFamily !== undefined
      ? lineLabelConfig.fontFamily
      : testTextBox.fontFamily()
  ) as ConfigAccessor<string | string[]>;
  const paddingAccessor = (
    lineLabelConfig.padding !== undefined
      ? lineLabelConfig.padding
      : testTextBox.padding()
  ) as ConfigAccessor<number>;
  const labelFunction = (userConfig.label ||
    viz._drawLabel) as ConfigAccessor<string>;
  return {
    labelFunction,
    fontColorAccessor,
    fontSizeAccessor,
    fontWeightAccessor,
    fontFamilyAccessor,
    paddingAccessor,
  };
}

/**
    A test axis's pixel position for a value. On a log axis a `0` value maps
    to the scale's nearest end instead.
*/
function axisEstimate(
  test: Axis,
  configScale: string,
  domain: unknown[],
): (d: unknown) => number {
  return (d: unknown): number => {
    if (configScale === "log" && d === 0)
      d = test._givenDomain()[(domain[0] as number) < 0 ? 1 : 0];
    return test._getPosition.bind(test)(d);
  };
}

/** The y-sorted labels for one end of every line, less those another line runs through. */
function measureSide(
  lineData: [unknown, Record<string, unknown>[]][],
  ctx: LineLabelCtx,
  side: LineLabelSide,
  yDomain: unknown[],
): LineLabel[] {
  return lineData
    .map(entry => measureLineLabel(entry, ctx, side))
    .sort((a, b) =>
      (yDomain[1] as number) > (yDomain[0] as number)
        ? (a.value as number) - (b.value as number)
        : (b.value as number) - (a.value as number),
    )
    .filter((d, _i, arr) => !labelOverlapsLine(d, arr));
}

/**
    The room the labels at one end of the plot claim: the widest label among
    the lines that end at the x range's `edge`, capped at a quarter of the
    chart's `width`; 0 when no line reaches that edge.
*/
export function lineLabelSpace(
  labels: Pick<LineLabel, "edgeX" | "spaceNeeded">[],
  edge: number,
  width: number,
): number {
  const spaceNeeded = max(
    labels.filter(d => d.edgeX === edge),
    d => d.spaceNeeded,
  );
  return spaceNeeded ? min([spaceNeeded, width / 4])! : 0;
}

const noLabels = () => ({
  plotLabelWidths: [],
  plotLargestLabel: undefined,
  plotXRangeMax: undefined,
  plotStartLabelSpace: 0,
});

export const measurePlotLineLabels: TransformStage = ({
  viz,
  plotFormattedData,
  plotScales,
  plotConfigScales,
  plotTestAxes,
  plotLineLabelTest,
  y2Exists,
}) => {
  const data = plotFormattedData || [];
  const setting = viz.schema.lineLabels;
  if (!setting || y2Exists) return noLabels();
  const sidesOf = (d: Record<string, unknown>) =>
    rowLineLabelSides(setting, d.data as DataPoint, d.i as number);
  const labelData = data.filter(
    (d: Record<string, unknown>) => d.shape === "Line" && sidesOf(d).length > 0,
  );
  const lineData = groups(labelData, (d: Record<string, unknown>) => d.id);
  if (!lineData.length) return noLabels();

  const {testLineShape, testTextBox} = plotLineLabelTest as {
    testLineShape: Shape;
    testTextBox: TextBox;
  };
  const {xTest, yTest} = plotTestAxes as {xTest: Axis; yTest: Axis};
  const xDomain = plotScales!.x.domain();
  const yDomain = plotScales!.y.domain();
  const xConfigScale = plotConfigScales!.xConfigScale;
  const yConfigScale = plotConfigScales!.yConfigScale;
  const width = viz.schema.width - viz._margin.left - viz._margin.right;
  const config = viz.schema.lineLabelConfig as LineLabelConfig | undefined;

  const labelCtx: LineLabelCtx = {
    ...lineLabelStyle(viz, testLineShape, testTextBox),
    xEstimate: axisEstimate(xTest, xConfigScale, xDomain),
    yEstimate: axisEstimate(yTest, yConfigScale, yDomain),
    valueText: (value, row) => {
      const {d, i} = sourceRow(row);
      return lineLabelValue(config, value, d as DataPoint, i as number, v =>
        axisValue(viz, "y", v),
      );
    },
  };

  // Each end labels the lines whose row at that end asks for it.
  const sideLines = (side: LineLabelSide) =>
    lineData.filter(([, values]) => {
      const row = side === "end" ? values[values.length - 1] : values[0];
      return sidesOf(row).includes(side);
    });
  const startLabels = measureSide(
    sideLines("start"),
    labelCtx,
    "start",
    yDomain,
  );
  const endLabels = measureSide(sideLines("end"), labelCtx, "end", yDomain);

  const [rangeStart, rangeEnd] = xTest._getRange.bind(xTest)() as number[];
  const endSpace = lineLabelSpace(
    endLabels,
    max(endLabels, d => d.edgeX) as number,
    width,
  );
  const startSpace = lineLabelSpace(
    startLabels,
    min(startLabels, d => d.edgeX) as number,
    width,
  );

  return {
    plotLabelWidths: [...startLabels, ...endLabels],
    plotLargestLabel: max(endLabels.map(d => d.labelWidth)),
    plotXRangeMax:
      endSpace && max(endLabels, d => d.edgeX) === rangeEnd
        ? width - endSpace - viz._margin.right
        : undefined,
    plotStartLabelSpace:
      startSpace && min(startLabels, d => d.edgeX) === rangeStart
        ? startSpace
        : 0,
  };
};
