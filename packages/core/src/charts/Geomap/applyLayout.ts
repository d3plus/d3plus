/**
    `applyGeomapLayout` — Geomap's chart-specific layout stage. Runs
    topojson → feature conversion + filter, builds the d3-geo path
    generator, fits the projection, and stashes `geomapCtx` on `viz.ctx`.
*/

import {extent, max, quantile} from "d3-array";
import * as d3GeoCore from "d3-geo";
import * as scales from "d3-scale";
import {feature as topojsonFeature} from "topojson-client";

import {pointDistance} from "@d3plus/math";
import type {DataPoint} from "@d3plus/data";

import {chartBounds} from "../chartGeometry.js";
import type {TransformStage} from "../stages.js";

type ScaleFactory = () => {
  domain: (d: [number, number]) => unknown;
  range: (r: [number, number]) => unknown;
};

function topo2feature(
  topo: Record<string, unknown>,
  key?: string,
): {type: string; features: Record<string, unknown>[]} {
  const k =
    key && (topo.objects as Record<string, unknown>)[key]
      ? key
      : Object.keys(topo.objects as Record<string, unknown>)[0];
  return topojsonFeature(
    topo as unknown as Parameters<typeof topojsonFeature>[0],
    k,
  ) as unknown as {type: string; features: Record<string, unknown>[]};
}

export const applyGeomapLayout: TransformStage = ({viz}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = viz as any;
  const {width, height} = chartBounds(v);

  const coordData: {type: string; features: Record<string, unknown>[]} = v.schema.topojson
    ? topo2feature(v.schema.topojson, v._topojsonKey)
    : {type: "FeatureCollection", features: []};
  v.ctx.coordData = coordData;

  if (v.schema.topojsonFilter) coordData.features = coordData.features.filter(v.schema.topojsonFilter);

  const path = (d3GeoCore.geoPath as () => {
    projection: (p: unknown) => unknown;
    area: (d: unknown) => number;
    centroid: (d: unknown) => [number, number];
    (d: unknown): string;
  })().projection(v.schema.projection) as ((d: unknown) => string) & {
    area: (d: unknown) => number;
    centroid: (d: unknown) => [number, number];
  };
  v.ctx.path = path;

  const pointData = v._filteredData.filter(
    (d: DataPoint, i: number) => v._point(d, i) instanceof Array,
  );

  const pathData = v._filteredData
    .filter((d: DataPoint, i: number) => !(v._point(d, i) instanceof Array))
    .reduce((obj: Record<string, DataPoint>, d: DataPoint) => {
      obj[v._id(d)] = d;
      return obj;
    }, {});

  const topoData = coordData.features.reduce(
    (arr: Record<string, unknown>[], feature: Record<string, unknown>) => {
      const id = v.schema.topojsonId(feature);
      arr.push({__d3plus__: true, data: pathData[id], feature, id});
      return arr;
    },
    [],
  );

  const scaleName = `scale${v.schema.pointSizeScale.charAt(0).toUpperCase()}${v.schema.pointSizeScale.slice(1)}`;
  const r = ((scales as unknown as Record<string, ScaleFactory>)[scaleName]() as {
    domain: (d: [number, number]) => {range: (r: [number, number]) => (v: number) => number};
  })
    .domain(extent(pointData, (d: DataPoint, i: number) => v.schema.pointSize(d, i)) as unknown as [number, number])
    .range([v.schema.pointSizeMin, v.schema.pointSizeMax]);

  if (!v._zoomSet || !v.ctx.extentBounds) {
    const fitData = v.schema.fitObject ? topo2feature(v.schema.fitObject, v._fitKey) : coordData;

    v.ctx.extentBounds = {
      type: "FeatureCollection",
      features: v._fitFilter
        ? fitData.features.filter(v._fitFilter)
        : fitData.features.slice(),
    };
    v.ctx.extentBounds.features = v.ctx.extentBounds.features.reduce(
      (
        arr: Record<string, unknown>[],
        d: {type: string; id: string; geometry: {type: string; coordinates: number[][][][]}},
      ) => {
        if (!d.geometry) return arr;
        const reduced: {type: string; id: string; geometry: {type: string; coordinates: number[][][][]}} = {
          type: d.type,
          id: d.id,
          geometry: {coordinates: d.geometry.coordinates, type: d.geometry.type},
        };

        if (d.geometry.type === "MultiPolygon" && d.geometry.coordinates.length > 1) {
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
      },
      [],
    );

    if (!v.ctx.extentBounds.features.length && pointData.length) {
      const bounds: (number | undefined)[][] = [[undefined, undefined], [undefined, undefined]];
      pointData.forEach((d: DataPoint, i: number) => {
        const point = v.schema.projection(v._point(d, i));
        if (bounds[0][0] === void 0 || point[0] < bounds[0][0]) bounds[0][0] = point[0];
        if (bounds[1][0] === void 0 || point[0] > bounds[1][0]) bounds[1][0] = point[0];
        if (bounds[0][1] === void 0 || point[1] < bounds[0][1]) bounds[0][1] = point[1];
        if (bounds[1][1] === void 0 || point[1] > bounds[1][1]) bounds[1][1] = point[1];
      });

      v.ctx.extentBounds = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "MultiPoint",
              coordinates: bounds.map((b: (number | undefined)[]) => v.schema.projection.invert(b)),
            },
          },
        ],
      };
      const maxSize = max(pointData, (d: DataPoint, i: number) => r(v.schema.pointSize(d, i)));
      v.ctx.effectivePadding = {
        top: v.schema.projectionPadding.top + maxSize,
        right: v.schema.projectionPadding.right + maxSize,
        bottom: v.schema.projectionPadding.bottom + maxSize,
        left: v.schema.projectionPadding.left + maxSize,
      };
    }
  }

  const effectivePadding = v.ctx.effectivePadding || v.schema.projectionPadding;
  v.ctx.effectivePadding = undefined;

  v.schema.projection = v.schema.projection.fitExtent(
    v.ctx.extentBounds.features.length
      ? [
          [effectivePadding.left, effectivePadding.top],
          [width - effectivePadding.right, height - effectivePadding.bottom],
        ]
      : [[0, 0], [width, height]],
    v.ctx.extentBounds.features.length ? v.ctx.extentBounds : {type: "Sphere"},
  );

  v.ctx.geomapWidth = width;
  v.ctx.geomapHeight = height;

  v.ctx.geomapCtx = {
    topoData,
    pathFn: (d: Record<string, unknown>) => path(d.feature),
    pointData,
    pointR: (d: DataPoint, i: number) => r(v.schema.pointSize(d, i)),
    pointSort: (a: DataPoint, b: DataPoint) => v.schema.pointSize(b) - v.schema.pointSize(a),
    pointX: (d: DataPoint, i: number) => v.schema.projection(v._point(d, i))[0],
    pointY: (d: DataPoint, i: number) => v.schema.projection(v._point(d, i))[1],
  };

  return {shapeData: topoData};
};
