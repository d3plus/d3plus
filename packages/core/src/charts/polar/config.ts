/**
    Config defaults shared by the polar charts (PolarArea, RadialBar): the
    axis styles, the legend rule, the tooltip's value row, and the wedge
    emit.
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";
import type {SceneNode} from "@d3plus/render";

import constant from "../../utils/constant.js";
import type {D3plusConfig} from "../../utils/D3plusConfig.js";
import {gridStroke} from "../../components/Axis/gridStroke.js";
import {backgroundImageNodes} from "../features/backgroundImageEmit.js";
import {paintFromShapeConfig, shapeConfigFor} from "../features/emitHelpers.js";
import {arcPath} from "../Gauge/emitDial.js";
import {backgroundInk} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";

import type {PolarWedge} from "./wedgeLayout.js";

/**
    The axis styles, named after the parts of a Plot axis like Radar's: the
    inner value rings are gridlines (`gridConfig`), the outer ring is the axis
    line (`barConfig`), and the category and tick labels are tick labels
    (`shapeConfig.labelConfig`).
*/
export function polarAxisConfig(viz: VizInstance): Record<string, unknown> {
  return {
    barConfig: {stroke: () => backgroundInk(viz), strokeWidth: 1},
    gridConfig: {
      stroke: () => gridStroke(viz._select?.node(), viz.schema.colorDefaults),
      strokeWidth: 1,
    },
    shapeConfig: {
      fill: constant("none"),
      labelConfig: {
        fontColor: () => backgroundInk(viz),
        fontResize: false,
        padding: 0,
        textAnchor: (d: {data?: {textAnchor?: string}}) =>
          d.data?.textAnchor ?? "middle",
        verticalAlign: "middle",
      },
      stroke: () => backgroundInk(viz),
      strokeWidth: constant(1),
    },
  };
}

/**
    Wraps the base legend so it hides when every drawn row is its own legend
    entry and `labeled` says the chart's labels already name each one.
*/
export function polarLegend(
  viz: VizInstance,
  labeled: (viz: VizInstance) => boolean = () => true,
): (config: D3plusConfig, arr: DataPoint[]) => unknown {
  const base = viz.schema.legend as (
    config: D3plusConfig,
    arr: DataPoint[],
  ) => unknown;
  return (config: D3plusConfig, arr: DataPoint[]) => {
    if (arr.length === viz._filteredData.length && labeled(viz)) return false;
    return base.call(viz, config, arr);
  };
}

/** The tooltip's "Value" row, formatted with the locale's abbreviated number format. */
export function polarValueRow(viz: VizInstance): unknown[] {
  return [
    () => viz.schema.translate("Value"),
    (d: DataPoint, i: number) => {
      const v = Number(
        (viz.schema.value as (d: DataPoint, i: number) => unknown)(d, i),
      );
      return Number.isFinite(v) ? formatAbbreviate(v, viz.schema.locale) : "";
    },
  ];
}

/**
    One Path node per wedge, painted from `shapeConfig`, plus any background
    images. Wedges with no extent are left out.
*/
export function polarWedgeNodes(
  viz: VizInstance,
  wedges: PolarWedge[],
  key: string,
  aria: (w: PolarWedge) => string,
): SceneNode[] {
  const sc = shapeConfigFor(viz, "Path");
  const drawn = wedges.filter(
    w =>
      w.arc.outerRadius > w.arc.innerRadius &&
      w.arc.endAngle > w.arc.startAngle,
  );
  const nodes: SceneNode[] = drawn.map(w => {
    const paint = paintFromShapeConfig(sc, w.data, w.i);
    return {
      type: "path",
      key: `${key}-${viz._ids(w.data, w.i).join("-")}-${w.slot}`,
      d: arcPath(w.arc),
      arc: w.arc,
      datum: w.data,
      index: w.i,
      // Explicit, so an exiting wedge fades from a real starting opacity.
      paint: {...paint, opacity: paint.opacity ?? 1},
      aria: {label: aria(w)},
    } as SceneNode;
  });
  const images = backgroundImageNodes(sc, nodes, k => [
    drawn[k].data,
    drawn[k].i,
  ]);
  return [...nodes, ...images];
}
