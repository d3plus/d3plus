/**
    `applyPolarAreaLayout` — PolarArea's chart-specific layout stage. Gives
    every category an equal slice of the circle and stacks its rows outward
    as wedges whose radius encodes value (see `polarWedgeLayout`). Without a
    `metric`, every row is its own category. Stores the ring labels on
    `viz.ctx.polarLevelLabels` for the emit to paint over the wedges.
*/

import type {DataPoint} from "@d3plus/data";

import type {TransformStage} from "../pipeline/stages.js";
import {polarWedgeLayout} from "../polar/wedgeLayout.js";
import type {PolarScale} from "../polar/geometry.js";
import type {VizInstance} from "../viz/vizTypes.js";

type Accessor<T> = (d: DataPoint, i: number) => T;

/** The category a row's wedge sits in: its `metric`, else its own id. */
export function polarAreaSlotOf(viz: VizInstance): Accessor<string> {
  const metric = viz.schema.metric as Accessor<unknown> | undefined;
  if (typeof metric === "function") return (d, i) => `${metric(d, i)}`;
  return (d, i) => viz._ids(d, i).join("-");
}

export const applyPolarAreaLayout: TransformStage = ({viz}) => {
  const metric = viz.schema.metric as Accessor<unknown> | undefined;
  const {wedges, levelLabels} = polarWedgeLayout(viz, {
    key: "polararea",
    slotOf: polarAreaSlotOf(viz),
    slotLabel: (key, rows) =>
      typeof metric === "function" || !rows.length
        ? key
        : viz._drawLabel(rows[0], 0),
    scale: (viz.schema.radialScale === "linear"
      ? "linear"
      : "sqrt") as PolarScale,
    slotPadding: 0,
    sweep: Math.PI * 2,
  });
  viz.ctx.polarLevelLabels = levelLabels;
  return {shapeData: wedges as unknown as DataPoint[]};
};
