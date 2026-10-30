/**
    Line-label collision resolution + connector emit for the Plot paint phase.

    Plot's `lineLabels` feature draws a label at the end of each series line.
    When several series end at nearby y positions the labels overlap, so they
    are "bumped" apart into discrete y buckets; a thin connector line then
    links each bumped label back to its true series position.

    Labels at a line's left end (`lineLabels: "start"` or `"both"`) are
    placed the same way, apart from the right-end labels.

    The measure half (which series get labels + their widths) lives upstream
    as the `measurePlotLineLabels` pipeline stage. This module owns the two
    remaining pieces:

      - `bumpLineLabels` — resolve overlaps, returning the id→bumped-y map.
      - `emitLineLabelConnectors` — draw the connector lines for bumped labels.

    This is Plot-family-specific (it depends on Line series + the rendered
    y-axis position function), not a generic cross-viz feature.

    @module
*/

import {groups, max, range} from "d3-array";

import type {DataPoint} from "@d3plus/data";
import {assign} from "@d3plus/dom";

import type {SceneNode} from "@d3plus/render";

import {lineLabelKey} from "../Plot/lineLabelSides.js";
import {spreadLabelPositions} from "../Plot/lineLabelSpread.js";
import {collectComputed, makeShape} from "./emitHelpers.js";
import type {LabelWidth} from "./plotPaint.js";
import type {VizInstance as Viz} from "../viz/vizTypes.js";

/**
    Spreads one group of labels (one end, one x value) apart so none
    overlap, each as close to its series as the others allow (see
    `spreadLabelPositions`). Sets `newY` on each label that moved.
*/
function spreadGroup(viz: Viz, values: LabelWidth[], yRange: number[]) {
  const sorted = values
    .map(d => {
      if (!d.defaultY) d.defaultY = viz._yAxis!._getPosition(d.value);
      return d;
    })
    .sort((a, b) => a.defaultY! - b.defaultY!);
  const positions = spreadLabelPositions(
    sorted.map(d => d.defaultY!),
    sorted.map(d => d.fontSize * LABEL_LINE_HEIGHT),
    yRange,
  );
  sorted.forEach((d, i) => {
    if (Math.abs(positions[i] - d.defaultY!) > 0.5) d.newY = positions[i];
  });
}

/** A label's height, as a multiple of its font size, when spread apart. */
const LABEL_LINE_HEIGHT = 1.2;

/**
    Resolve label overlaps within each x-group, each end of the lines on its
    own. With `spread`, labels are spread apart until none overlap (see
    `spreadGroup`); otherwise colliding labels are bumped into discrete y
    buckets (capped at 1/8 of the range so a label never travels too far
    from its series). Mutates each `LabelWidth`'s `newY`/`defaultY` in place
    and returns the bumped-y map, keyed by `lineLabelKey`, that the Line
    emitter and connector emit read. Must run AFTER the production y-axis
    has rendered — `bumpPrevious` reads `viz._yAxis._getPosition`.
*/
export function bumpLineLabels(
  viz: Viz,
  labelWidths: LabelWidth[],
  yRange: number[],
  spread = false,
): Record<string, number> {
  let labelPositions: Record<string, number> = {};
  if (labelWidths) {
    groups(
      labelWidths,
      d => d.side ?? "end",
      d => d.xValue,
    ).forEach(([, xGroups]) =>
      xGroups.forEach(([, values]) => {
        if (spread) return spreadGroup(viz, values, yRange);
        const minFontSize = max(values.map(d => d.fontSize))!;
        const yBuckets = range(yRange[0], yRange[1], minFontSize).reverse();
        const bumpLimit = (yRange[1] - yRange[0]) / 8;

        /***/
        function bumpPrevious(d: LabelWidth, i: number, arr: LabelWidth[]) {
          if (!d.defaultY) d.defaultY = viz._yAxis!._getPosition(d.value);
          if (i) {
            const prev = arr[i - 1];
            const {fontSize, padding} = d;
            const y = (d.newY || d.defaultY)!;
            const prevY = (prev.newY || prev.defaultY)!;
            if (y - fontSize / 2 - padding < prevY) {
              const newY = yBuckets.find(n => n < prevY);
              const change = d.defaultY! - newY!;
              if (change < bumpLimit) {
                prev.newY = newY;
                if (i) bumpPrevious(prev, i - 1, arr);
              }
            }
          }
        }

        values.forEach(bumpPrevious);
      }),
    );

    labelPositions = labelWidths.reduce<Record<string, number>>((obj, d) => {
      if (d.newY) obj[lineLabelKey(d.side, d.id)] = d.newY;
      return obj;
    }, {});
  }
  return labelPositions;
}

/**
    Emit the connector lines for labels that were bumped (`newY` set). Each
    connector runs from the label's true series position to its bumped
    position, rightward for a right-end label and leftward for a left-end one. Returns the compute-mode scene nodes (empty when nothing was
    bumped). Coords are relative to `_chartTransform`, which the chart-cells
    group applies.
*/
export function emitLineLabelConnectors(
  viz: Viz,
  labelWidths: LabelWidth[],
): SceneNode[] {
  const labelConnectors = labelWidths.filter(d => d.newY !== undefined);
  if (!labelConnectors.length) return [];

  const data = labelConnectors
    .map(d =>
      assign(
        {
          x: viz._xAxis!._getPosition.bind(viz._xAxis!)(d.xValue),
          y: d.defaultY,
        },
        d as unknown as Record<string, unknown>,
      ),
    )
    .concat(
      labelConnectors.map(d =>
        assign(
          {
            x:
              d.side === "start"
                ? viz._xAxis!._getPosition.bind(viz._xAxis!)(d.xValue) -
                  d.padding +
                  1
                : viz._xAxis!._getPosition.bind(viz._xAxis!)(d.xValue) +
                  d.padding -
                  1,
            y: d.newY || d.defaultY,
          },
          d as unknown as Record<string, unknown>,
        ),
      ),
    );

  const connectorLine = makeShape("Line")
    .config({
      data: data as DataPoint[],
      // Each label's connector is its own line, the two ends of a series apart.
      id: (d: DataPoint) =>
        d.side === "start" ? lineLabelKey("start", d.id) : d.id,
      stroke: (d: DataPoint) => d.fontColor,
      x: (d: DataPoint) => d.x,
      y: (d: DataPoint) => d.y,
    } as Record<string, unknown>)
    .config(viz._labelConnectorConfig!)
    .renderMode("compute");
  connectorLine.render();
  return collectComputed(connectorLine);
}
