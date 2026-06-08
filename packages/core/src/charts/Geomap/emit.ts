/**
    `geomapEmit` — country Paths + point Circles using `geomapCtx`
    stashed on `viz.ctx`. Emits flat SceneNodes directly (no transient
    Shape compute pass).
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {chartBounds} from "../features/chartGeometry.js";
import {paintFromShapeConfig, shapeConfigFor} from "../features/emitHelpers.js";
import type {ChartEmit} from "../definition/ChartDefinition.js";

interface GeomapCtx {
  topoData: Array<{__d3plus__?: true; data?: DataPoint; feature: unknown; id: string | number}>;
  pathFn: (d: {feature: unknown}) => string;
  pointData: DataPoint[];
  pointR: (d: DataPoint, i: number) => number;
  pointX: (d: DataPoint, i: number) => number;
  pointY: (d: DataPoint, i: number) => number;
  pointSort?: (a: DataPoint, b: DataPoint) => number;
}

export const geomapEmit: ChartEmit = ({viz}) => {
  const c = viz.ctx.geomapCtx as GeomapCtx | undefined;
  if (!c) return [];
  const out: SceneNode[] = [];

  // Canvas backend: ensureZoomDom keeps its imperative ocean rect transparent
  // (it lives in the overlaying compute <svg>), so paint the ocean into the
  // scene here — first, beneath the geography — to match the SVG backend.
  if (viz._renderer === "canvas") {
    const ocean = viz.schema.ocean as string | undefined;
    if (ocean && ocean !== "transparent") {
      const {width, height} = chartBounds(viz);
      out.push({
        type: "rect",
        key: "geomap-ocean",
        x: viz._margin.left,
        y: viz._margin.top,
        width,
        height,
        paint: {fill: ocean},
      } as SceneNode);
    }
  }

  if (c.topoData && c.topoData.length) {
    const pathConfig = shapeConfigFor(viz, "Path");
    for (let i = 0; i < c.topoData.length; i++) {
      const d = c.topoData[i];
      const datum = (d.data ?? d) as DataPoint;
      const paint = paintFromShapeConfig(pathConfig, datum, i);
      out.push({
        type: "path",
        key: `geomap-path-${d.id}`,
        d: c.pathFn(d),
        datum,
        paint,
      } as SceneNode);
    }
  }

  if (c.pointData && c.pointData.length) {
    const circleConfig = shapeConfigFor(viz, "Circle");
    const points = c.pointSort ? [...c.pointData].sort(c.pointSort) : c.pointData;
    for (let i = 0; i < points.length; i++) {
      const d = points[i];
      const paint = paintFromShapeConfig(circleConfig, d, i);
      out.push({
        type: "circle",
        key: `geomap-point-${viz._id(d, i)}`,
        cx: c.pointX(d, i),
        cy: c.pointY(d, i),
        r: c.pointR(d, i),
        datum: d,
        paint,
      } as SceneNode);
    }
  }

  return out;
};
