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

  // The ocean rect and basemap tiles normally live in the imperative geomap
  // <svg> (`_container`), outside the scene graph. That's fine on-screen, but a
  // server render serializes only the scene, so under SSR (`viz._ssr`) — and on
  // the canvas backend, whose compute <svg> keeps its ocean transparent — paint
  // them into the scene here, beneath the geography, so the output is complete.
  if (viz._renderer === "canvas" || viz._ssr) {
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

  // Basemap tiles, pre-fetched + inlined as data URIs by @d3plus/ssr. Placed
  // above the ocean and below the geography, at the positions `_computeTileList`
  // derives from the fitted projection (same math as the live `_renderTiles`).
  const ssrTiles = viz._ssrTiles as Map<string, string> | undefined;
  if (ssrTiles && ssrTiles.size && typeof viz._computeTileList === "function") {
    for (const t of viz._computeTileList()) {
      const href = ssrTiles.get(t.key);
      if (!href) continue;
      out.push({
        type: "image",
        key: `geomap-tile-${t.key}`,
        x: t.x,
        y: t.y,
        width: t.size,
        height: t.size,
        href,
        preserveAspectRatio: "none",
        interactive: false,
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
        // Topojson geography is a data shape: keep its border stroke a constant
        // screen width as the map zooms (v3 parity), rather than scaling with
        // the zoom transform. Honors an explicit shapeConfig.vectorEffect.
        paint: {...paint, vectorEffect: paint.vectorEffect ?? "non-scaling-stroke"},
      } as SceneNode);
    }
  }

  if (c.pointData && c.pointData.length) {
    const circleConfig = shapeConfigFor(viz, "Circle");
    const points = c.pointSort ? [...c.pointData].sort(c.pointSort) : c.pointData;
    for (let i = 0; i < points.length; i++) {
      const d = points[i];
      const paint = paintFromShapeConfig(circleConfig, d, i);
      // Origin-centered geometry with the projected position in `transform`,
      // matching how Shape-emitted Circle marks are placed (cx/cy = 0, group
      // transform positions the mark). The motion-trail layer reads a mark's
      // position off `transform.x/y`, so points must follow this convention to
      // trail when they move between timeline frames (`Circle.trail`, on by
      // default for Geomap points).
      out.push({
        type: "circle",
        key: `geomap-point-${viz._id(d, i)}`,
        cx: 0,
        cy: 0,
        r: c.pointR(d, i),
        transform: {x: c.pointX(d, i), y: c.pointY(d, i)},
        datum: d,
        // Coordinate points are data shapes: hold their stroke at a constant
        // screen width through zoom (v3 parity), like the topojson borders.
        paint: {...paint, vectorEffect: paint.vectorEffect ?? "non-scaling-stroke"},
        ...(circleConfig.trail ? {trail: true} : {}),
        ...(circleConfig.trailPersist ? {trailPersist: circleConfig.trailPersist} : {}),
      } as SceneNode);
    }
  }

  return out;
};
