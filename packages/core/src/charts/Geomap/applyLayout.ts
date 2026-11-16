/**
    `applyGeomapLayout` — Geomap's chart-specific layout stage. Runs
    topojson → feature conversion + filter, builds the d3-geo path
    generator, fits the projection, and stashes `geomapCtx` on `viz.ctx`.
*/

import {extent, max, quantile} from "d3-array";
import * as d3GeoCore from "d3-geo";
import * as scales from "d3-scale";

import {pointDistance} from "@d3plus/math";
import type {DataPoint} from "@d3plus/data";

import {chartBounds} from "../features/chartGeometry.js";
import type {TransformStage, VizContext} from "../pipeline/stages.js";
import type {SizeLegendScale} from "../../components/SizeLegend/sizeLegendLayout.js";
import {flowLinkCoordinates, geomapFlowLinks} from "./flowLinks.js";
import type {FlowLayoutInput} from "./flowLinks.js";
import {clipsToCircle, coordinateVisible, toLonLat} from "./flowGeometry.js";
import {cachedPaths, fitExtentOnce, topoFeatures} from "./geoCache.js";
import {globeHome} from "./globeRotate.js";
import {geomapCartogram} from "./cartogramLayout.js";
import type {
  CartogramLayoutInput,
  CartogramRegion,
  CartogramShape,
} from "./cartogramLayout.js";
import {
  drawnCartogramScale,
  estimateCartogramScale,
  setCartogramLegend,
} from "./cartogramLegend.js";
import type {FlowAnchor} from "./flowLinks.js";
import type {GeoPathFn, LonLat} from "./flowGeometry.js";
import {geomapDensity, geomapRegionRows} from "./densityLayout.js";
import {geoHexbinSettings} from "./geoHexbin.js";
import {geoZoom} from "./geoHexbinZoom.js";
import {geomapPointClusters} from "./pointClusterLayout.js";
import type {GeoClusterState} from "./pointClusterLayout.js";
import {
  geomapTileGrid,
  regionsReshaped,
  tileGridOf,
  tileGridRegions,
} from "./tileGrid.js";

type GeomapViz = VizContext["viz"];

type ScaleFactory = () => {
  domain: (d: [number, number]) => unknown;
  range: (r: [number, number]) => unknown;
};

interface GeomapFeatureCollection {
  type: string;
  features: Record<string, unknown>[];
}
type GeomapPath = ((d: unknown) => string) & {
  area: (d: unknown) => number;
  centroid: (d: unknown) => [number, number];
};
/** The structured slots `applyGeomapLayout` reads back off `viz.ctx`. */
interface GeomapCtx {
  coordData: GeomapFeatureCollection;
  path: GeomapPath;
  extentBounds: GeomapFeatureCollection;
  effectivePadding?: {top: number; right: number; bottom: number; left: number};
  geomapWidth: number;
  geomapHeight: number;
  geomapCtx: unknown;
}

/** Reduces fit features, trimming far-flung MultiPolygon parts via path geometry. */
function reduceExtentFeatures(
  features: Record<string, unknown>[],
  path: GeomapPath,
): Record<string, unknown>[] {
  return features.reduce<Record<string, unknown>[]>((arr, raw) => {
    const d = raw as {
      type: string;
      id: string;
      geometry: {type: string; coordinates: number[][][][]};
    };
    if (!d.geometry) return arr;
    const reduced: {
      type: string;
      id: string;
      geometry: {type: string; coordinates: number[][][][]};
    } = {
      type: d.type,
      id: d.id,
      geometry: {coordinates: d.geometry.coordinates, type: d.geometry.type},
    };

    if (
      d.geometry.type === "MultiPolygon" &&
      d.geometry.coordinates.length > 1
    ) {
      const areas: number[] = [];
      const distances: number[] = [];

      d.geometry.coordinates.forEach((c: number[][][]) => {
        reduced.geometry.coordinates = [c];
        areas.push(path.area(reduced));
      });

      reduced.geometry.coordinates = [
        d.geometry.coordinates[areas.indexOf(max(areas)!)],
      ];
      const center = path.centroid(reduced);

      d.geometry.coordinates.forEach((c: number[][][]) => {
        reduced.geometry.coordinates = [c];
        distances.push(pointDistance(path.centroid(reduced), center));
      });

      const distCutoff = quantile(
        areas.reduce((acc: number[], _dist: number, i: number) => {
          if (distances[i]) acc.push(areas[i] / distances[i]);
          return acc;
        }, []),
        0.9,
      );

      reduced.geometry.coordinates = d.geometry.coordinates.filter(
        (_c: number[][][], i: number) => {
          const dist = distances[i];
          return dist === 0 || areas[i] / dist >= distCutoff!;
        },
      );
    }

    arr.push(reduced);
    return arr;
  }, []);
}

/**
    Builds projected-point extent bounds + padding when no fit features
    exist, from the coordinate points and the coordinate ends of `links`.
*/
function applyPointExtentBounds(
  v: GeomapViz,
  ctx: GeomapCtx,
  pointData: DataPoint[],
  r: (n: number) => number,
  linkCoords: LonLat[],
): void {
  const bounds: (number | undefined)[][] = [
    [undefined, undefined],
    [undefined, undefined],
  ];
  const coords: LonLat[] = pointData
    .map((d: DataPoint, i: number) => v.schema.point(d, i) as LonLat)
    .concat(linkCoords);
  coords.forEach((coord: LonLat) => {
    const point = v.schema.projection(coord);
    if (!point) return;
    if (bounds[0][0] === void 0 || point[0] < bounds[0][0])
      bounds[0][0] = point[0];
    if (bounds[1][0] === void 0 || point[0] > bounds[1][0])
      bounds[1][0] = point[0];
    if (bounds[0][1] === void 0 || point[1] < bounds[0][1])
      bounds[0][1] = point[1];
    if (bounds[1][1] === void 0 || point[1] > bounds[1][1])
      bounds[1][1] = point[1];
  });

  ctx.extentBounds = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "MultiPoint",
          coordinates: bounds.map((b: (number | undefined)[]) =>
            v.schema.projection.invert(b),
          ),
        },
      },
    ],
  };
  const maxSize =
    max(pointData, (d: DataPoint, i: number) => r(v.schema.pointSize(d, i))) ??
    0;
  ctx.effectivePadding = {
    top: v.schema.projectionPadding.top + maxSize,
    right: v.schema.projectionPadding.right + maxSize,
    bottom: v.schema.projectionPadding.bottom + maxSize,
    left: v.schema.projectionPadding.left + maxSize,
  };
}

/** The rows drawn as points: those whose `point` accessor returns coordinates. */
export function geomapPointData(v: GeomapViz): DataPoint[] {
  return v._filteredData.filter(
    (d: DataPoint, i: number) => v.schema.point(d, i) instanceof Array,
  );
}

/** The point radius scale: `pointSizeScale` over the points' `pointSize` extent, onto `[pointSizeMin, pointSizeMax]`. */
export function geomapPointSizeScale(
  v: GeomapViz,
  pointData: DataPoint[],
): SizeLegendScale {
  const scaleName = `scale${v.schema.pointSizeScale.charAt(0).toUpperCase()}${v.schema.pointSizeScale.slice(1)}`;
  return (
    (scales as unknown as Record<string, ScaleFactory>)[scaleName]() as {
      domain: (d: [number, number]) => {
        range: (r: [number, number]) => SizeLegendScale;
      };
    }
  )
    .domain(
      extent(pointData, (d: DataPoint, i: number) =>
        v.schema.pointSize(d, i),
      ) as unknown as [number, number],
    )
    .range([v.schema.pointSizeMin, v.schema.pointSizeMax]);
}

/**
    The coordinate points the fitted projection draws: those its clipping
    keeps, read through d3-geo's path of each point (a projection alone
    places points on the far side of a globe, or outside geoAlbersUsa's
    insets, as if they were visible).
*/
export function visiblePointData(
  v: GeomapViz,
  pointData: DataPoint[],
  path: GeoPathFn,
): DataPoint[] {
  return pointData.filter((d: DataPoint, i: number) => {
    const coord = toLonLat(v.schema.point(d, i));
    return coord !== null && coordinateVisible(path, coord);
  });
}

/**
    Picks the features (or, without any, the coordinate points and the
    coordinate ends of `links`) the projection fits, onto `ctx.extentBounds`.
*/
function fitExtentBounds(
  v: GeomapViz,
  ctx: GeomapCtx,
  coordData: GeomapFeatureCollection,
  path: GeomapPath,
  pointData: DataPoint[],
  r: (n: number) => number,
): void {
  // The point-radius padding belongs with the extent it was computed for,
  // so a later draw that reuses the cached extent fits the same way.
  ctx.effectivePadding = undefined;
  const fitData = v.schema.fitObject
    ? topoFeatures(v.schema.fitObject, v.schema.fitKey)
    : coordData;

  ctx.extentBounds = {
    type: "FeatureCollection",
    features: v.schema.fitFilter
      ? fitData.features.filter(v.schema.fitFilter)
      : fitData.features.slice(),
  };
  ctx.extentBounds.features = reduceExtentFeatures(
    ctx.extentBounds.features,
    path,
  );

  const linkCoords = flowLinkCoordinates(v.schema.links);
  if (
    !ctx.extentBounds.features.length &&
    (pointData.length || linkCoords.length)
  ) {
    applyPointExtentBounds(v, ctx, pointData, r, linkCoords);
  }
}

/**
    Fits the projection to `ctx.extentBounds` (or the whole sphere)
    within the chart area, less its padding. A globe the user has turned is
    fitted at its home rotation (see `globeHome`) and turned back, so its
    scale doesn't change with the side it shows.
*/
function fitProjection(
  v: GeomapViz,
  ctx: GeomapCtx,
  width: number,
  height: number,
): void {
  const effectivePadding = ctx.effectivePadding || v.schema.projectionPadding;
  const home = clipsToCircle(v.schema.projection) ? globeHome(v) : undefined;
  const live = home ? v.schema.projection.rotate() : undefined;
  if (home) v.schema.projection.rotate(home);
  fitExtentOnce(
    v.schema.projection,
    ctx.extentBounds.features.length
      ? [
          [effectivePadding.left, effectivePadding.top],
          [width - effectivePadding.right, height - effectivePadding.bottom],
        ]
      : [
          [0, 0],
          [width, height],
        ],
    ctx.extentBounds.features.length ? ctx.extentBounds : {type: "Sphere"},
  );
  if (live) v.schema.projection.rotate(live);
}

/** Each cartogram shape as a link end, by region id: its center and radius. */
export function cartogramAnchors(
  shapes: Map<string | number, CartogramShape>,
): Map<string, FlowAnchor> {
  const out = new Map<string, FlowAnchor>();
  for (const [id, shape] of shapes)
    out.set(`${id}`, {at: [shape.x, shape.y], r: shape.r});
  return out;
}

/**
    The point size legend's scale, before the map is laid out: a
    cartogram's shapes' sizes, none for a tile grid or bins, else the
    points' radii.
    @param v The Geomap.
    @param available The room the legend may take.
*/
export function geomapSizeLegendScale(
  v: GeomapViz,
  available: Parameters<typeof estimateCartogramScale>[1],
): SizeLegendScale | null {
  // A tile grid's equal tiles have no sizes to show.
  if (!tileGridOf(v) && setCartogramLegend(v))
    return estimateCartogramScale(v, available);
  if (regionsReshaped(v) || geoHexbinSettings(v)) return null;
  const pointData = geomapPointData(v);
  return pointData.length ? geomapPointSizeScale(v, pointData) : null;
}

/** The box a cartogram's shapes fit: the map area, less `projectionPadding`. */
function cartogramBounds(
  v: GeomapViz,
  width: number,
  height: number,
): [number, number, number, number] {
  const p = v.schema.projectionPadding;
  return [p.left, p.top, width - p.right, height - p.bottom];
}

/**
    The regions' tile-grid tiles, or else their cartogram shapes, or null
    on the map. A cartogram's size legend shows its shapes' sizes (a tile
    grid's tiles are all one size).
*/
function reshapeRegions(
  v: GeomapViz,
  regions: CartogramRegion[],
  input: CartogramLayoutInput,
): Map<string | number, CartogramShape> | null {
  const tiles = geomapTileGrid(v, regions, input.bounds);
  const cartogram = tiles ?? geomapCartogram(v, regions, input);
  if (!tiles && setCartogramLegend(v) && cartogram)
    v._sizeLegendFinal = drawnCartogramScale(v, regions, cartogram);
  else if (cartogram) v._sizeLegendFinal = null;
  return cartogram;
}

/**
    The clusters of the points drawn, or null (see `geomapPointClusters`).
    Clustered points keep their pixel size through zoom. A pending repaint
    of the last layout's clusters has nothing left to drop.
*/
function layoutClusters(
  v: GeomapViz,
  ctx: GeomapCtx,
  visible: DataPoint[],
  pointR: (d: DataPoint, i: number) => number,
): GeoClusterState | null {
  const last = (ctx.geomapCtx as {cluster?: GeoClusterState | null} | undefined)
    ?.cluster;
  if (last) clearTimeout(last.timer);
  const cluster = geomapPointClusters(v, visible, pointR, geoZoom(v).k);
  v._pointsHoldSize = Boolean(cluster);
  return cluster;
}

export const applyGeomapLayout: TransformStage = ({viz}) => {
  const v = viz;
  const ctx = viz.ctx as unknown as GeomapCtx;
  const {width, height} = chartBounds(v);

  const coordData: {type: string; features: Record<string, unknown>[]} = v
    .schema.topojson
    ? topoFeatures(v.schema.topojson, v.schema.topojsonKey)
    : {type: "FeatureCollection", features: []};
  ctx.coordData = coordData;

  if (v.schema.topojsonFilter)
    coordData.features = coordData.features.filter(v.schema.topojsonFilter);

  const path = (
    d3GeoCore.geoPath as () => {
      projection: (p: unknown) => unknown;
      area: (d: unknown) => number;
      centroid: (d: unknown) => [number, number];
      (d: unknown): string;
    }
  )().projection(v.schema.projection) as ((d: unknown) => string) & {
    area: (d: unknown) => number;
    centroid: (d: unknown) => [number, number];
  };
  ctx.path = path;

  const pointData = geomapPointData(v);

  const {rows: regionRows, data: pathData} = geomapRegionRows(v);

  const features = coordData.features.reduce(
    (arr: Record<string, unknown>[], feature: Record<string, unknown>) => {
      const id = v.schema.topojsonId(feature);
      arr.push({__d3plus__: true, data: pathData[id], feature, id});
      return arr;
    },
    [],
  ); // A tile grid without a topojson draws a tile for each cell of its layout.
  const grid = tileGridOf(v);
  const topoData =
    grid && !features.length
      ? (tileGridRegions(grid, pathData) as unknown as typeof features)
      : features;

  const r = geomapPointSizeScale(v, pointData);
  // Binned points draw no circles to size.
  const binned = Boolean(geoHexbinSettings(v));
  v._sizeLegendFinal = pointData.length && !binned ? r : null;

  if (!v._zoomSet || !ctx.extentBounds)
    fitExtentBounds(v, ctx, coordData, path, pointData, r);

  // A globe being dragged keeps the scale it was fitted at.
  if (!v._globeDragging) fitProjection(v, ctx, width, height);

  ctx.geomapWidth = width;
  ctx.geomapHeight = height;
  const featurePath = cachedPaths(v.schema.projection, path);

  const pointR = (d: DataPoint, i: number) => r(v.schema.pointSize(d, i));
  // A cartogram or tile grid draws its regions only: coordinate points have
  // no place on it.
  const cartogram = reshapeRegions(
    v,
    topoData as unknown as CartogramRegion[],
    {
      pathD: region => featurePath(region.feature),
      area: region => path.area(region.feature),
      bounds: cartogramBounds(v, width, height),
    },
  );
  const visible = cartogram
    ? []
    : visiblePointData(
        v,
        pointData,
        path as unknown as FlowLayoutInput["path"],
      );
  const cluster = binned ? null : layoutClusters(v, ctx, visible, pointR);
  const density = geomapDensity(v, {
    regions: topoData as unknown as CartogramRegion[],
    rows: regionRows,
    pathD: region => featurePath(region.feature),
    points: visible,
  });
  ctx.geomapCtx = {
    density,
    cartogram,
    flowLinks: geomapFlowLinks(v, {
      pointData,
      topoData: topoData as unknown as FlowLayoutInput["topoData"],
      pointR,
      path: path as unknown as FlowLayoutInput["path"],
      anchors: cartogram ? cartogramAnchors(cartogram) : undefined,
    }),
    topoData,
    pathFn: (d: Record<string, unknown>) => featurePath(d.feature),
    pointData: binned ? [] : visible,
    cluster,
    pointR,
    pointSort: (a: DataPoint, b: DataPoint) =>
      v.schema.pointSize(b) - v.schema.pointSize(a),
    pointX: (d: DataPoint, i: number) =>
      v.schema.projection(v.schema.point(d, i))[0],
    pointY: (d: DataPoint, i: number) =>
      v.schema.projection(v.schema.point(d, i))[1],
  };

  return {shapeData: topoData};
};
