/**
    Column emphasis for Plot charts whose marks read as one per category
    (Lollipop, Dumbbell, Candlestick): Plot's snapped hover keeps the hovered
    column's marks bright and dims every other mark the chart plots, the way
    hovering a bar dims the other bars. Set as a chart's
    `viz._plotColumnHighlight`.

    @module
*/

import type {DataPoint} from "@d3plus/data";

import {forEachSceneRow} from "../viz/sceneRows.js";
import type {VizInstance} from "../viz/vizTypes.js";

type Predicate = (d: DataPoint, i: number) => boolean;

/**
    A chart's column-highlight predicate factory. Given the rows of the
    hovered column's marks, the predicate matches those rows among the rows
    the chart plots (every small-multiples panel's, so other panels dim too),
    and any other row, such as a legend swatch's, sharing an id with them. A
    wrapped datum defers to the row it wraps, which the interaction walk
    tries next.
    @param viz The chart.
*/
export function columnHighlight(
  viz: VizInstance,
): (rows: Set<DataPoint>) => Predicate {
  const ids = (d: DataPoint, i: number): unknown[] => {
    const id = viz._id(d, i) as unknown;
    return Array.isArray(id) ? id : [id];
  };
  return rows => {
    const plotted = new Set<DataPoint>();
    const scenes = viz._facetPanels
      ? viz._facetPanels.map(panel => panel.scene)
      : [viz._chartScene || []];
    scenes.forEach(nodes => forEachSceneRow(nodes, row => plotted.add(row)));
    const hovered = new Set<unknown>();
    rows.forEach(row => ids(row, 0).forEach(id => hovered.add(id)));
    return (d: DataPoint, i: number) => {
      if ((d as {__d3plus__?: boolean}).__d3plus__) return false;
      if (plotted.has(d)) return rows.has(d);
      return ids(d, i).some(id => hovered.has(id));
    };
  };
}
