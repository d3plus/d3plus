/**
    `geomapEmit` — country Paths, links, and point Circles using
    `geomapCtx` stashed on `viz.ctx`. Emits flat SceneNodes directly (no transient
    Shape compute pass).
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import type {LabelCircle} from "../features/circleLabelPlacement.js";
import {chartBounds} from "../features/chartGeometry.js";
import {paintFromShapeConfig, shapeConfigFor} from "../features/emitHelpers.js";
import {backgroundImageNodes} from "../features/backgroundImageEmit.js";
import {rowIndex} from "../features/rowIndex.js";
import type {ChartEmit} from "../definition/ChartDefinition.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {resolveThemed} from "./basemapTheme.js";
import {geomapPointLabels} from "./pointLabels.js";
import {emitFlowLabels, emitFlowLinks} from "./flowEmit.js";
import {cartogramLabels} from "./cartogramLabels.js";
import type {CartogramShape} from "./cartogramLayout.js";
import type {FlowLink} from "./flowLinks.js";
import {emitBins, emitDots} from "./densityEmit.js";
import type {GeomapDensity} from "./densityLayout.js";
import {geoHexbinSettings} from "./geoHexbin.js";
import {TILE_GRID_FONT_MAX, tileGridOcean, tileGridOf} from "./tileGrid.js";
import {pairLabels} from "../features/labelLayering.js";
import {emitClusterScene, pointNode} from "./pointClusterEmit.js";
import type {ClusterSceneInput} from "./pointClusterEmit.js";
import type {GeoClusterState} from "./pointClusterLayout.js";
import {emitDrillRegions} from "./drillEmit.js";
import type {GeoDrillScene} from "./drillEmit.js";

interface GeomapCtx {
  density?: GeomapDensity;
  cartogram?: Map<string | number, CartogramShape> | null;
  flowLinks?: FlowLink[];
  topoData: Array<{
    __d3plus__?: true;
    data?: DataPoint;
    feature: unknown;
    id: string | number;
  }>;
  pathFn: (d: {feature: unknown}) => string;
  pointData: DataPoint[];
  pointR: (d: DataPoint, i: number) => number;
  pointX: (d: DataPoint, i: number) => number;
  pointY: (d: DataPoint, i: number) => number;
  pointSort?: (a: DataPoint, b: DataPoint) => number;
  cluster?: GeoClusterState | null;
  drill?: GeoDrillScene | null;
}

/**
    The ocean rect and basemap tiles, for a server render or a small-multiples
    panel (empty otherwise).
*/
function emitGeomapBasemap(viz: VizInstance): SceneNode[] {
  const out: SceneNode[] = [];

  // The ocean rect and basemap tiles normally live in the imperative geomap
  // <svg> (`_container`), outside the scene graph — beneath the scene on SVG,
  // or in an underlay beneath the <canvas>. That's fine on-screen, but a
  // server render serializes only the scene, so under SSR (`viz._ssr`) paint
  // them into the scene here, beneath the geography, so the output is complete.
  // A small-multiples panel does the same: the imperative layer holds one map.
  const panel = viz._facetStep === "panel";
  if (viz._ssr || panel) {
    const ocean = resolveThemed(
      tileGridOcean(viz),
      Boolean(viz._basemapDark),
    ) as string | undefined;
    if (ocean && ocean !== "transparent") {
      const {width, height} = chartBounds(viz);
      out.push({
        type: "rect",
        key: "geomap-ocean",
        x: 0,
        y: 0,
        width,
        height,
        paint: {fill: ocean},
      } as SceneNode);
    }
  }

  // Basemap tiles, pre-fetched + inlined as data URIs by @d3plus/ssr (or
  // linked by URL in a small-multiples panel). Placed above the ocean and
  // below the geography, at the positions `_computeTileList` derives from the
  // fitted projection (same math as the live `_renderTiles`).
  const ssrTiles = viz._ssrTiles;
  const sceneTiles = (ssrTiles && ssrTiles.size) || (panel && !viz._ssr);
  if (sceneTiles && typeof viz._computeTileList === "function") {
    for (const t of viz._computeTileList()) {
      const href = ssrTiles && ssrTiles.size ? ssrTiles.get(t.key) : t.url;
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
  return out;
}

/**
    Whether a scene node is a basemap region drawn for no data row: such a
    region's datum is its bare feature wrapper rather than a row. A box or
    lasso selection picks only regions with data (see `selectMark`).
*/
export function bareFeature(node: SceneNode): boolean {
  return Boolean((node.datum as {feature?: unknown} | undefined)?.feature);
}

/**
    The labels inside a cartogram's shapes or a tile grid's tiles (a tile
    grid labels every tile, a built-in layout with its own keys, up to
    `TILE_GRID_FONT_MAX` pixels), or none on the map.
*/
function reshapedLabels(
  viz: VizInstance,
  c: GeomapCtx,
  pathConfig: Record<string, unknown>,
): SceneNode[] {
  if (!c.cartogram) return [];
  const grid = tileGridOf(viz);
  return cartogramLabels(
    viz,
    c.topoData,
    c.cartogram,
    pathConfig,
    grid
      ? {
          all: true,
          text: grid.builtin ? r => grid.key(r.id) : undefined,
          fontMax: TILE_GRID_FONT_MAX,
        }
      : undefined,
  );
}

export const geomapEmit: ChartEmit = pairLabels(({viz}) => {
  const c = viz.ctx.geomapCtx as GeomapCtx | undefined;
  if (!c) return [];
  const out: SceneNode[] = emitGeomapBasemap(viz);

  // Drilled into a region, it and its neighbors lie beneath its children.
  if (c.drill)
    out.push(
      ...emitDrillRegions(viz, c.drill, region =>
        c.pathFn({feature: region.feature}),
      ),
    );

  if (c.topoData && c.topoData.length) {
    const pathConfig = shapeConfigFor(viz, "Path");
    // Bins take the colorScale from the regions.
    const colorScale = (
      geoHexbinSettings(viz) ? undefined : viz.schema.colorScale
    ) as ((d: DataPoint, i: number) => unknown) | undefined;
    const start = out.length;
    const drawn: number[] = [];
    for (let i = 0; i < c.topoData.length; i++) {
      const d = c.topoData[i];
      // A cartogram or tile grid draws only the regions it placed.
      const shape = c.cartogram?.get(d.id);
      if (c.cartogram && !shape) continue;
      drawn.push(i);
      const datum = (d.data ?? d) as DataPoint;
      // The row's position in the data, as the region's handlers get it.
      const ri = rowIndex(viz._filteredData, datum);
      const paint = paintFromShapeConfig(pathConfig, datum, ri);
      const validColorScale = colorScale ? `, ${colorScale(datum, ri)}` : "";
      out.push({
        type: "path",
        key: `geomap-path-${d.id}`,
        d: shape ? shape.d : c.pathFn(d),
        // Outlines and cartogram shapes morph into one another.
        morph: true,
        datum,
        index: ri,
        // Topojson geography is a data shape: keep its border stroke a constant
        // screen width as the map zooms (v3 parity), rather than scaling with
        // the zoom transform. Honors an explicit shapeConfig.vectorEffect.
        paint: {
          ...paint,
          vectorEffect: paint.vectorEffect ?? "non-scaling-stroke",
        },
        aria: {label: `${viz._drawLabel(datum, ri)}${validColorScale}.`},
      } as SceneNode);
    }
    out.push(
      ...backgroundImageNodes(pathConfig, out.slice(start), k => {
        const d = c.topoData[drawn[k]];
        const datum = (d.data ?? d) as DataPoint;
        return [datum, rowIndex(viz._filteredData, datum)];
      }),
    );
    out.push(...reshapedLabels(viz, c, pathConfig));
  }

  out.push(...emitDots(viz, c.density?.dots));
  out.push(...emitBins(viz, c.density?.bins));

  if (c.cluster) {
    const draw = emitClusterScene(viz, c as ClusterSceneInput);
    c.cluster.drawn = draw;
    out.push(...draw.nodes);
    return out;
  }

  const links = c.flowLinks ?? [];
  out.push(...emitFlowLinks(viz, links));

  const circles: LabelCircle[] = [];
  if (c.pointData && c.pointData.length) {
    const circleConfig = shapeConfigFor(viz, "Circle");
    const points = c.pointSort
      ? [...c.pointData].sort(c.pointSort)
      : c.pointData;
    const start = out.length;
    for (let i = 0; i < points.length; i++) {
      const d = points[i];
      const p = {d, i, x: c.pointX(d, i), y: c.pointY(d, i), r: c.pointR(d, i)};
      circles.push({x: p.x, y: p.y, r: p.r});
      out.push(pointNode(viz, circleConfig, p));
    }
    out.push(
      ...backgroundImageNodes(circleConfig, out.slice(start), k => [
        points[k],
        rowIndex(viz._filteredData, points[k]),
      ]),
    );
    out.push(
      ...geomapPointLabels(
        viz,
        {points, pointR: c.pointR, pointX: c.pointX, pointY: c.pointY},
        circleConfig,
      ),
    );
  }

  out.push(...emitFlowLabels(viz, links, circles));
  return out;
});
