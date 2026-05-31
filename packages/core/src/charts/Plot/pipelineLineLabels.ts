/**
    `measurePlotLineLabels` — measures label widths for Line shapes so the
    chart's x-axis range can leave space for in-line labels (a common Plot
    feature). Reads pre-measured test-axis state (`xTest._d3Scale`, etc.)
    through the context. Pure compute + textWidth — no DOM.

    Returns `{labelWidths, largestLabel, xRangeMax}` for the paint phase.
    The test axes themselves come via `plotTestAxes` ctx field (Plot._draw
    measures them then injects).
*/
/* eslint-disable @typescript-eslint/no-explicit-any */

import {groups, max, min} from "d3-array";

import {textWidth as d3plusTextWidth} from "@d3plus/dom";

import {shapeConfigFor} from "../features/emitHelpers.js";
import type {TransformStage} from "../pipeline/stages.js";

interface LineLabelCtx {
  labelFunction: any;
  fontColorAccessor: any;
  fontSizeAccessor: any;
  fontWeightAccessor: any;
  fontFamilyAccessor: any;
  paddingAccessor: any;
  xEstimate: (d: any) => any;
  yEstimate: (d: any) => any;
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
  let i;
  while (d.__d3plus__ && d.data) {
    d = d.data as Record<string, unknown>;
    i = d.i;
  }
  const label = typeof labelFunction === "function" ? labelFunction(d, i) : labelFunction;
  const fontColor = typeof fontColorAccessor === "function" ? fontColorAccessor(d, i) : fontColorAccessor;
  const fontSize = typeof fontSizeAccessor === "function" ? fontSizeAccessor(d, i) : fontSizeAccessor;
  const fontWeight = typeof fontWeightAccessor === "function" ? fontWeightAccessor(d, i) : fontWeightAccessor;
  let fontFamily = typeof fontFamilyAccessor === "function" ? fontFamilyAccessor(d, i) : fontFamilyAccessor;
  if (Array.isArray(fontFamily)) fontFamily = fontFamily.map((f: string) => `'${f}'`).join(", ");
  const labelPadding = typeof paddingAccessor === "function" ? paddingAccessor(d, i) : paddingAccessor;
  const labelWidth = d3plusTextWidth(label, {
    "font-size": fontSize,
    "font-family": fontFamily,
    "font-weight": fontWeight,
  });
  const coords = lineValues.map((d: Record<string, unknown>) => [
    xEstimate(d.x),
    yEstimate(d.y),
  ]);
  const myMaxX = max(
    lineValues.map((d: Record<string, unknown>) => xEstimate(d.x)),
  );
  const labelY = (
    lineValues.find((d: Record<string, unknown>) => xEstimate(d.x) === myMaxX) as Record<string, unknown>
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

export const measurePlotLineLabels: TransformStage = ({viz, plotFormattedData, plotScales, plotConfigScales, plotTestAxes, plotLineLabelTest, y2Exists}) => {
  const data = plotFormattedData || [];
  if (!viz.schema.lineLabels || y2Exists) {
    return {plotLabelWidths: [], plotLargestLabel: undefined, plotXRangeMax: undefined};
  }
  const labelData = data.filter((d: any) => {
    if (d.shape !== "Line") return false;
    return typeof viz.schema.lineLabels === "function"
      ? viz.schema.lineLabels(d.data, d.i)
      : true;
  });
  const lineData = groups(labelData, (d: Record<string, unknown>) => d.id);
  if (!lineData.length) {
    return {plotLabelWidths: [], plotLargestLabel: undefined, plotXRangeMax: undefined};
  }

  const {testLineShape, testTextBox} = plotLineLabelTest as any;
  const {xTest, yTest} = plotTestAxes as any;
  const xDomain = plotScales.x.domain();
  const yDomain = plotScales.y.domain();
  const xConfigScale = plotConfigScales.xConfigScale;
  const yConfigScale = plotConfigScales.yConfigScale;
  const width = viz.schema.width - viz._margin.left - viz._margin.right;

  const userConfig = shapeConfigFor(viz, "Line");
  testLineShape.config(userConfig);
  const lineLabelConfig = testLineShape.labelConfig();
  const fontColorAccessor = lineLabelConfig.fontColor !== undefined ? lineLabelConfig.fontColor : testTextBox.fontColor();
  const fontSizeAccessor = lineLabelConfig.fontSize !== undefined ? lineLabelConfig.fontSize : testTextBox.fontSize();
  const fontWeightAccessor = lineLabelConfig.fontWeight !== undefined ? lineLabelConfig.fontWeight : testTextBox.fontWeight();
  const fontFamilyAccessor = lineLabelConfig.fontFamily !== undefined ? lineLabelConfig.fontFamily : testTextBox.fontFamily();
  const paddingAccessor = lineLabelConfig.padding !== undefined ? lineLabelConfig.padding : testTextBox.padding();
  const labelFunction = userConfig.label || viz._drawLabel;

  const xEstimate = (d: any) => {
    if (xConfigScale === "log" && d === 0)
      d = xDomain[0] < 0 ? xTest._d3Scale.domain()[1] : xTest._d3Scale.domain()[0];
    return xTest._getPosition.bind(xTest)(d);
  };
  const yEstimate = (d: any) => {
    if (yConfigScale === "log" && d === 0)
      d = yDomain[0] < 0 ? yTest._d3Scale.domain()[1] : yTest._d3Scale.domain()[0];
    return yTest._getPosition.bind(yTest)(d);
  };

  const labelCtx: LineLabelCtx = {
    labelFunction,
    fontColorAccessor,
    fontSizeAccessor,
    fontWeightAccessor,
    fontFamilyAccessor,
    paddingAccessor,
    xEstimate,
    yEstimate,
  };

  const labelWidths = lineData
    .map((entry: [unknown, Record<string, unknown>[]]) => measureLineLabel(entry, labelCtx))
    .sort((a, b) =>
      yDomain[1] > yDomain[0]
        ? (a.value as number) - (b.value as number)
        : (b.value as number) - (a.value as number),
    )
    .filter((d, _i, arr) => {
      const {fontSize, id, labelWidth, maxX, yEstimate} = d;
      const closeLabels = arr.filter(
        l =>
          l.id !== id &&
          l.coords.some(
            (c: any) =>
              (c[0] > maxX || (c[0] === maxX && l.maxX !== maxX)) &&
              c[0] <= (maxX as number) + labelWidth &&
              c[1] <= yEstimate + fontSize * 0.75 &&
              c[1] >= yEstimate - fontSize * 0.75,
          ),
      );
      return closeLabels.length === 0;
    });

  const maxX = max(labelWidths, d => d.maxX);
  const largestLabel = max(labelWidths.map(d => d.labelWidth));
  let xRangeMax: number | undefined;
  const spaceNeeded =
    maxX === xTest._getRange.bind(xTest)()[1]
      ? max(labelWidths.filter(d => d.maxX === maxX), d => d.spaceNeeded)
      : 0;
  if (spaceNeeded) {
    const labelSpace = min([spaceNeeded, width / 4]);
    xRangeMax = width - labelSpace! - viz._margin.right;
  }

  return {plotLabelWidths: labelWidths, plotLargestLabel: largestLabel, plotXRangeMax: xRangeMax};
};
