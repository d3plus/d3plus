/**
    `radialBarEmit` — one bar per row with a transparent hit area over its
    whole track (so a short bar is still easy to hover), then the ring value
    labels of the circular bar layout on top.
*/

import {formatAbbreviate} from "@d3plus/format";
import type {SceneNode} from "@d3plus/render";

import type {ChartEmit} from "../definition/ChartDefinition.js";
import {arcPath} from "../Gauge/emitDial.js";
import {polarWedgeNodes} from "../polar/config.js";
import type {PolarFrame, PolarWedge} from "../polar/wedgeLayout.js";

import type {RadialBarFrame} from "./trackLayout.js";

export const radialBarEmit: ChartEmit = ({viz, shapeData}) => {
  const wedges = (shapeData ?? []) as unknown as PolarWedge[];
  if (!wedges.length) return [];
  const angular = viz.schema.discrete === "angle";
  const frame = viz.ctx.polar as PolarFrame | RadialBarFrame;
  const hits: SceneNode[] = wedges.map((w, k) => {
    const arc = angular
      ? {...(frame as PolarFrame).tracks[k], padAngle: 0}
      : {
          innerRadius: w.arc.innerRadius,
          outerRadius: w.arc.outerRadius,
          startAngle: (frame as RadialBarFrame).start,
          endAngle: (frame as RadialBarFrame).end,
        };
    return {
      type: "path",
      key: `radialbar-${viz._ids(w.data, w.i).join("-")}-${w.slot}::hit`,
      d: arcPath(arc),
      datum: w.data,
      index: w.i,
      paint: {fill: "transparent"},
    };
  });
  const bars = polarWedgeNodes(
    viz,
    wedges,
    "radialbar",
    w =>
      `${viz._drawLabel(w.data, w.i)}, ${formatAbbreviate(w.value, viz.schema.locale)}.`,
  );
  return [
    ...hits,
    ...bars,
    ...((viz.ctx.polarLevelLabels ?? []) as SceneNode[]),
  ];
};
