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
import type {TransformStage} from "../pipeline/stages.js";

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
}

/** Measures one line's label (width, position, overlap coords). */
function measureLineLabel(
  [lineKey, lineValues]: [unknown, Record<string, unknown>[]],
  ctx: LineLabelCtx,
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

  let d = lineValues[lineValues.length - 1] as Record<string, unknown>;
  let i: number | undefined;
  while (d.__d3plus__ && d.data) {
    d = d.data as Record<string, unknown>;
    i = d.i as number | undefined;
  }
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
  const labelWidth = d3plusTextWidth(label, {
    "font-size": fontSize,
    "font-family": fontFamily,
    "font-weight": fontWeight,
  });
  const coords = lineValues.map((d: Record<string, unknown>) => [
    xEstimate(d.x),
    yEstimate(d.y),
  ]);
  // A line always has values, so the max is defined.
  const myMaxX = max(
    lineValues.map((d: Record<string, unknown>) => xEstimate(d.x)),
  ) as number;
  const labelY = (
    lineValues.find(
      (d: Record<string, unknown>) => xEstimate(d.x) === myMaxX,
    ) as Record<string, unknown>
  ).y;
  return {
    id: lineKey,
    labelWidth: labelWidth + labelPadding * 2,
    spaceNeeded: labelWidth + labelPadding * 4,
    value: labelY,
    yEstimate: yEstimate(labelY),
    padding: labelPadding,
    fontSize,
    fontColor,
    maxX: myMaxX,
    xValue: max(lineValues, (d: Record<string, unknown>) => d.x as number),
    coords,
  };
}

/** A measured line label (see `measureLineLabel`). */
type LineLabel = ReturnType<typeof measureLineLabel>;

/**
    Whether another line passes through the space `label` would occupy to the
    right of its line's last point.
*/
function labelOverlapsLine(label: LineLabel, labels: LineLabel[]): boolean {
  const {fontSize, id, labelWidth, maxX, yEstimate} = label;
  const closeLabels = labels.filter(
    l =>
      l.id !== id &&
      l.coords.some(
        (c: number[]) =>
          (c[0] > maxX || (c[0] === maxX && l.maxX !== maxX)) &&
          c[0] <= maxX + labelWidth &&
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
): Omit<LineLabelCtx, "xEstimate" | "yEstimate"> {
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
  if (!viz.schema.lineLabels || y2Exists) {
    return {
      plotLabelWidths: [],
      plotLargestLabel: undefined,
      plotXRangeMax: undefined,
    };
  }
  const labelData = data.filter((d: Record<string, unknown>) => {
    if (d.shape !== "Line") return false;
    return typeof viz.schema.lineLabels === "function"
      ? viz.schema.lineLabels(d.data, d.i)
      : true;
  });
  const lineData = groups(labelData, (d: Record<string, unknown>) => d.id);
  if (!lineData.length) {
    return {
      plotLabelWidths: [],
      plotLargestLabel: undefined,
      plotXRangeMax: undefined,
    };
  }

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

  const labelCtx: LineLabelCtx = {
    ...lineLabelStyle(viz, testLineShape, testTextBox),
    xEstimate: axisEstimate(xTest, xConfigScale, xDomain),
    yEstimate: axisEstimate(yTest, yConfigScale, yDomain),
  };

  const labelWidths = lineData
    .map((entry: [unknown, Record<string, unknown>[]]) =>
      measureLineLabel(entry, labelCtx),
    )
    .sort((a, b) =>
      (yDomain[1] as number) > (yDomain[0] as number)
        ? (a.value as number) - (b.value as number)
        : (b.value as number) - (a.value as number),
    )
    .filter((d, _i, arr) => !labelOverlapsLine(d, arr));

  const maxX = max(labelWidths, d => d.maxX);
  const largestLabel = max(labelWidths.map(d => d.labelWidth));
  let xRangeMax: number | undefined;
  const spaceNeeded =
    maxX === xTest._getRange.bind(xTest)()[1]
      ? max(
          labelWidths.filter(d => d.maxX === maxX),
          d => d.spaceNeeded,
        )
      : 0;
  if (spaceNeeded) {
    const labelSpace = min([spaceNeeded, width / 4]);
    xRangeMax = width - labelSpace! - viz._margin.right;
  }

  return {
    plotLabelWidths: labelWidths,
    plotLargestLabel: largestLabel,
    plotXRangeMax: xRangeMax,
  };
};
