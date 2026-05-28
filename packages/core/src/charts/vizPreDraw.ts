/* eslint-disable @typescript-eslint/no-explicit-any */

/**
    `vizPreDraw(viz)` — the Viz `_preDraw` phase as a free function.

    RFC §3.1 architectural seam: the data-prep phase (drawDepth resolution,
    id/ids/drawLabel accessor synthesis, timeFilter defaulting, filteredData
    + legendData rollup, dataCutoff hover/duration overrides, no-data
    messaging) used to live as `Viz._preDraw`; extracting it lets callers
    drive the pre-draw step without going through the class. `Viz._preDraw`
    is now a thin shim that calls into here, so behavior is unchanged.

    @param viz The Viz instance (or any subclass).
*/

import {group, max, min, rollup} from "d3-array";

import {merge} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";
import {date} from "@d3plus/dom";
import {formatAbbreviate} from "@d3plus/format";

/**
 * Turns an array of values into a list string.
 * @private
 */
function listify(n: DataPoint[keyof DataPoint][]): string {
  return n.reduce<string>(
    (str: string, item: DataPoint[keyof DataPoint], i: number) => {
      if (!i) str += item;
      else if (i === n.length - 1 && i === 1) str += ` and ${item}`;
      else if (i === n.length - 1) str += `, and ${item}`;
      else str += `, ${item}`;
      return str;
    },
    "",
  );
}

/**
 * A function that introspects the `d` Data Object for internally nested
 * d3plus data and indices, runs the accessor function on that user data.
 * @param {Function} acc Accessor function to use.
 * @param {Object} d Data Object
 * @param {Number} i Index of Data Object in Array
 * @private
 */
function accessorFetch(
  acc: (d: DataPoint, i: number) => DataPoint[keyof DataPoint],
  d: DataPoint,
  i: number,
): DataPoint[keyof DataPoint] {
  while (d.__d3plus__ && d.data) {
    d = d.data as DataPoint;
    i = d.i as number;
  }
  return acc(d, i);
}

export function vizPreDraw(viz: any): void {
  const that = viz;
  // based on the groupBy, determine the draw depth and current depth id
  viz._drawDepth =
    viz._depth !== void 0
      ? min([viz._depth >= 0 ? viz._depth : 0, viz._groupBy.length - 1])
      : viz._groupBy.length - 1;

  // Returns the current unique ID for a data point, coerced to a String.
  viz._id = (d: DataPoint, i: number) => {
    const groupByDrawDepth = accessorFetch(
      viz._groupBy[viz._drawDepth],
      d,
      i,
    );
    return typeof groupByDrawDepth === "number"
      ? `${groupByDrawDepth}`
      : groupByDrawDepth;
  };

  // Returns an array of the current unique groupBy ID for a data point, coerced to Strings.
  viz._ids = (d: DataPoint, i: number) =>
    viz._groupBy
      .map(
        (g: (d: DataPoint, i: number) => DataPoint[keyof DataPoint]) =>
          `${accessorFetch(g, d, i)}`,
      )
      .filter(Boolean);

  viz._drawLabel = (
    d: DataPoint,
    i: number,
    depth: number = viz._drawDepth,
  ) => {
    if (!d) return "";
    while (d.__d3plus__ && d.data) {
      d = d.data as DataPoint;
      i = d.i as number;
    }
    if (d._isAggregation) {
      return `${viz._thresholdName(d, i)} < ${formatAbbreviate(
        (d._threshold as number) * 100,
        viz._locale,
      )}%`;
    }
    if (viz._label && depth === viz._drawDepth)
      return `${viz._label(d, i)}`;
    const l = that._ids(d, i).slice(0, depth + 1);
    const n =
      l.reverse().find((ll: string) => !((ll as unknown) instanceof Array)) ||
      l[l.length - 1];
    return n instanceof Array ? listify(n) : `${n}`;
  };

  // set the default timeFilter if it has not been specified
  if (viz._time && !viz._timeFilter && viz._data.length) {
    const dates = viz._data.map(viz._time).map(date);
    const d = viz._data[0],
      i = 0;

    if (
      viz._discrete &&
      `_${viz._discrete}` in viz &&
      viz[`_${viz._discrete}`](d, i) === viz._time(d, i)
    ) {
      viz._timeFilter = () => true;
    } else {
      const latestTime = +max(dates)!;
      viz._timeFilter = (d: DataPoint, i: number) =>
        +date(viz._time(d, i))! === latestTime;
    }
  }

  viz._filteredData = [];
  viz._legendData = [];
  let flatData: DataPoint[] = [];
  if (viz._data.length) {
    flatData = viz._timeFilter
      ? viz._data.filter(viz._timeFilter)
      : viz._data;
    if (viz._filter) flatData = flatData.filter(viz._filter);
    const nestKeys: ((
      d: DataPoint,
      i: number,
    ) => DataPoint[keyof DataPoint])[] = [];
    for (let i = 0; i <= viz._drawDepth; i++)
      nestKeys.push(viz._groupBy[i]);
    if (viz._discrete && `_${viz._discrete}` in viz)
      nestKeys.push(viz[`_${viz._discrete}`]);
    if (viz._discrete && `_${viz._discrete}2` in viz)
      nestKeys.push(viz[`_${viz._discrete}2`]);

    const tree = rollup(
      flatData,
      (leaves: DataPoint[]) => {
        const index = viz._data.indexOf(leaves[0]);
        const shape = viz._shape(leaves[0], index);
        const id = viz._id(leaves[0], index);

        const d = merge(leaves, viz._aggs);

        if (
          !viz._hidden.includes(id) &&
          (!viz._solo.length || viz._solo.includes(id))
        ) {
          if (!viz._discrete && shape === "Line")
            viz._filteredData = viz._filteredData.concat(leaves);
          else viz._filteredData.push(d);
        }
        viz._legendData.push(d);
      },
      ...nestKeys,
    );

    viz._filteredData = viz._thresholdFunction(viz._filteredData, tree);
  }

  // overrides the hoverOpacity of shapes if data is larger than cutoff
  const uniqueIds = group(viz._filteredData, viz._id).size;
  if (uniqueIds > viz._dataCutoff) {
    if (viz._userHover === undefined)
      viz._userHover = viz._shapeConfig.hoverOpacity || 0.5;
    if (viz._userDuration === undefined)
      viz._userDuration = viz._shapeConfig.duration || 600;
    viz._shapeConfig.hoverOpacity = 1;
    viz._shapeConfig.duration = 0;
  } else if (viz._userHover !== undefined) {
    viz._shapeConfig.hoverOpacity = viz._userHover;
    viz._shapeConfig.duration = viz._userDuration;
  }

  if (viz._noDataMessage && !viz._filteredData.length) {
    viz._messageClass.render({
      container: viz._select.node().parentNode,
      html: viz._noDataHTML(viz),
      mask: false,
      style: viz._messageStyle,
    });
    viz._select.transition().duration(viz._duration).attr("opacity", 0);
  }
}
