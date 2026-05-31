/**
    Line-label collision resolution + connector emit for the Plot paint phase.

    Plot's `lineLabels` feature draws a label at the end of each series line.
    When several series end at nearby y positions the labels overlap, so they
    are "bumped" apart into discrete y buckets; a thin connector line then
    links each bumped label back to its true series position.

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

import {collectComputed, makeShape} from "./emitHelpers.js";
import type {LabelWidth} from "./plotPaint.js";
import type {VizInstance as Viz} from "../viz/vizTypes.js";

/**
    Resolve label overlaps within each x-group by bumping colliding labels
    into discrete y buckets (capped at 1/8 of the range so a label never
    travels too far from its series). Mutates each `LabelWidth`'s `newY`/
    `defaultY` in place and returns the id→bumped-y map the Line emitter and
    connector emit read. Must run AFTER the production y-axis has rendered —
    `bumpPrevious` reads `viz._yAxis._getPosition`.
*/
export function bumpLineLabels(
  viz: Viz,
  labelWidths: LabelWidth[],
  yRange: number[],
): Record<string, number> {
  let labelPositions: Record<string, number> = {};
  if (labelWidths) {
    groups(labelWidths, d => d.xValue).forEach(([, values]) => {
      const minFontSize = max(values.map(d => d.fontSize))!;
      const yBuckets = range(yRange[0], yRange[1], minFontSize).reverse();
      const bumpLimit = (yRange[1] - yRange[0]) / 8;

      /***/
      function bumpPrevious(d: LabelWidth, i: number, arr: LabelWidth[]) {
        if (!d.defaultY) d.defaultY = viz._yAxis._getPosition(d.value);
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
    });

    labelPositions = labelWidths.reduce<Record<string, number>>((obj, d) => {
      if (d.newY) obj[d.id] = d.newY;
      return obj;
    }, {});
  }
  return labelPositions;
}

/**
    Emit the connector lines for labels that were bumped (`newY` set). Each
    connector runs from the label's true series position to its bumped
    position. Returns the compute-mode scene nodes (empty when nothing was
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
          x: viz._xAxis._getPosition.bind(viz._xAxis)(d.xValue),
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
              viz._xAxis._getPosition.bind(viz._xAxis)(d.xValue) +
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
      stroke: (d: DataPoint) => d.fontColor,
      x: (d: DataPoint) => d.x,
      y: (d: DataPoint) => d.y,
    } as Record<string, unknown>)
    .config(viz._labelConnectorConfig!)
    .renderMode("compute");
  connectorLine.render();
  return collectComputed(connectorLine);
}
