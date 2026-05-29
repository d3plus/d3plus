/**
    `applyNetworkLayout` — Network's chart-specific layout stage.

    Resolves nodes + links into a single laid-out node array (running a
    d3-force simulation only when fx/fy coords are missing), normalizes
    link stroke sizes, and stashes `networkCtx` + node/link lookups on
    `viz.ctx` for the click/hover handlers installed by `setup`.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */

import {extent, max, min, merge as d3ArrayMerge, groups} from "d3-array";
import {forceLink, forceManyBody, forceSimulation} from "d3-force";
import type {SimulationNodeDatum, SimulationLinkDatum} from "d3-force";
import {polygonHull} from "d3-polygon";
import * as scales from "d3-scale";

import {largestRect, pointDistance, pointRotate} from "@d3plus/math";
import type {DataPoint} from "@d3plus/data";

import {chartBounds} from "../chartGeometry.js";
import {shapeConfigFor} from "../emitHelpers.js";
import type {TransformStage} from "../stages.js";

interface NetworkLayoutNode extends SimulationNodeDatum {
  id: string;
  size?: number;
  shape?: string;
}
interface NetworkLayoutLink extends SimulationLinkDatum<NetworkLayoutNode> {
  size?: number;
}

export const applyNetworkLayout: TransformStage = ({viz}) => {
  const v = viz as any;
  const {width, height} = chartBounds(v);

  if (!Array.isArray(v._filteredData)) v._filteredData = [];
  if (!Array.isArray(v._nodes)) v._nodes = [];
  if (!Array.isArray(v._links)) v._links = [];

  const nodeId = (d: Record<string, unknown>, i: number) =>
    `${v._id(d, i) || v._nodeGroupBy[min([v._drawDepth, v._nodeGroupBy.length - 1])](d, i)}`;

  const data = v._filteredData.reduce((obj: any, d: any, i: any) => {
    obj[v._id(d, i)] = d;
    return obj;
  }, {});

  let nodes = v._nodes.reduce((obj: any, d: any, i: any) => {
    obj[nodeId(d, i)] = d;
    return obj;
  }, {});

  nodes = Array.from(new Set(Object.keys(data).concat(Object.keys(nodes))))
    .map((id, i) => {
      const d = data[id];
      const n = nodes[id];
      if (n === undefined) return false;
      const pickFrom = <T,>(
        accessor: (x: any) => T,
        validate: (x: T) => boolean = vv => vv !== undefined,
      ): T =>
        d !== undefined && validate(accessor(d)) ? accessor(d) : accessor(n);
      return {
        __d3plus__: true,
        data: d || n,
        i,
        id,
        fx: pickFrom(v._x, (val: number) => !isNaN(val)),
        fy: pickFrom(v._y, (val: number) => !isNaN(val)),
        node: n,
        r: v._size ? pickFrom(v._size) : v._sizeMin,
        shape: pickFrom(v._shape),
      };
    })
    .filter((n: any): n is Exclude<typeof n, false> => !!n);

  const nodeLookup = nodes.reduce((obj: any, d: any) => {
    obj[d.id] = d;
    return obj;
  }, {});
  v.ctx.nodeLookup = nodeLookup;

  const nodeByOriginal = new Map<unknown, unknown>();
  for (const n of nodes as any[]) nodeByOriginal.set(n.node, n);
  const links = v._links.map((l: any) => {
    const referenceType = typeof l.source;
    return {
      size: v._linkSize(l),
      source:
        referenceType === "number"
          ? nodeByOriginal.get(v._nodes[l.source])
          : referenceType === "string"
            ? nodeLookup[l.source]
            : nodeLookup[l.source.id],
      target:
        referenceType === "number"
          ? nodeByOriginal.get(v._nodes[l.target])
          : referenceType === "string"
            ? nodeLookup[l.target]
            : nodeLookup[l.target.id],
    };
  });

  v.ctx.linkLookup = links.reduce((obj: any, d: any) => {
    if (!obj[d.source.id]) obj[d.source.id] = [];
    obj[d.source.id].push(d.target);
    if (!obj[d.target.id]) obj[d.target.id] = [];
    obj[d.target.id].push(d.source);
    return obj;
  }, {});

  const missingCoords = nodes.some(
    (n: any) => n.fx === undefined || n.fy === undefined,
  );

  if (missingCoords) {
    const linkStrength = scales
      .scaleLinear()
      .domain(extent(links, (d: {size: number}) => d.size) as [number, number])
      .range([0.1, 0.5]);

    const simulation = forceSimulation()
      .force(
        "link",
        forceLink(links as unknown as NetworkLayoutLink[])
          .id((d: SimulationNodeDatum) => (d as NetworkLayoutNode).id)
          .distance(1)
          .strength((d: NetworkLayoutLink) => linkStrength(d.size as number))
          .iterations(4),
      )
      .force("charge", forceManyBody().strength(-1))
      .stop();

    const iterations = 100;
    const alphaMin = 0.001;
    const alphaDecay = 1 - Math.pow(alphaMin, 1 / iterations);
    simulation.velocityDecay(0);
    simulation.alphaMin(alphaMin);
    simulation.alphaDecay(alphaDecay);
    simulation.alphaDecay(0);
    simulation.nodes(nodes);
    simulation.tick(iterations).stop();

    const nodePositions = nodes.map(
      (n: any) => [n.vx, n.vy] as [number, number],
    );
    let angle = 0, cx = 0, cy = 0;
    if (nodePositions.length === 2) {
      angle = 100;
    } else if (nodePositions.length > 2) {
      const hull = polygonHull(nodePositions) || [];
      const rect = largestRect(hull, {verbose: true})!;
      angle = rect.angle;
      cx = rect.cx;
      cy = rect.cy;
    }

    nodes.forEach((n: any) => {
      const p = pointRotate([n.vx, n.vy], -1 * ((Math.PI / 180) * angle), [cx, cy]);
      n.fx = p[0];
      n.fy = p[1];
    });
  }

  const xExtent = extent(nodes.map((n: any) => n.fx)) as unknown as [number, number];
  const yExtent = extent(nodes.map((n: any) => n.fy)) as unknown as [number, number];

  const x = scales.scaleLinear().domain(xExtent).range([0, width]);
  const y = scales.scaleLinear().domain(yExtent).range([0, height]);

  const nodeRatio = (xExtent[1] - xExtent[0]) / (yExtent[1] - yExtent[0]) || 1;
  const screenRatio = width / height;

  if (nodeRatio > screenRatio) {
    const h = (height * screenRatio) / nodeRatio;
    y.range([(height - h) / 2, height - (height - h) / 2]);
  } else {
    const w = (width * nodeRatio) / screenRatio;
    x.range([(width - w) / 2, width - (width - w) / 2]);
  }

  nodes.forEach((n: any) => {
    n.x = x(n.fx);
    n.y = y(n.fy);
  });

  const rExtent = extent(nodes.map((n: any) => n.r)) as unknown as [number, number];
  let rMax =
    v._sizeMax ||
    (max([
      1,
      (min(
        d3ArrayMerge(
          nodes.map((n1: any) =>
            nodes.map((n2: any) =>
              n1 === n2 ? null : pointDistance([n1.x, n1.y], [n2.x, n2.y]),
            ),
          ),
        ),
      ) as unknown as number) / 2,
    ]) as unknown as number);

  const r = (scales as any)[
      `scale${v._sizeScale.charAt(0).toUpperCase()}${v._sizeScale.slice(1)}`
    ]()
      .domain(rExtent)
      .range([
        rExtent[0] === rExtent[1] ? rMax : min([rMax / 2, v._sizeMin]),
        rMax,
      ]);
  const xDomain = x.domain();
  const yDomain = y.domain();

  const xOldSize = xDomain[1] - xDomain[0];
  const yOldSize = yDomain[1] - yDomain[0];

  nodes.forEach((n: any) => {
    const size = r(n.r);
    if (xDomain[0] > x.invert(n.x - size)) xDomain[0] = x.invert(n.x - size);
    if (xDomain[1] < x.invert(n.x + size)) xDomain[1] = x.invert(n.x + size);
    if (yDomain[0] > y.invert(n.y - size)) yDomain[0] = y.invert(n.y - size);
    if (yDomain[1] < y.invert(n.y + size)) yDomain[1] = y.invert(n.y + size);
  });

  const xNewSize = xDomain[1] - xDomain[0];
  const yNewSize = yDomain[1] - yDomain[0];
  rMax *= min([xOldSize / xNewSize, yOldSize / yNewSize])!;
  r.range([
    rExtent[0] === rExtent[1] ? rMax : min([rMax / 2, v._sizeMin]),
    rMax,
  ]);
  x.domain(xDomain);
  y.domain(yDomain);

  const fallbackRadius = (nodeRatio > screenRatio ? width : height) / 2;
  nodes.forEach((n: any) => {
    n.x = x(n.fx);
    n.fx = n.x;
    n.y = y(n.fy);
    n.fy = n.y;
    n.r = r(n.r) || fallbackRadius;
    n.width = n.r * 2;
    n.height = n.r * 2;
  });

  const strokeExtent = extent(links, (d: {size: number}) => d.size);
  if (strokeExtent[0] !== strokeExtent[1]) {
    const strokeScale = (scales as any)[
      `scale${v._linkSizeScale.charAt(0).toUpperCase()}${v._linkSizeScale.slice(1)}`
    ]()
      .domain(strokeExtent)
      .range([v._linkSizeMin, r.range()[0]]);
    links.forEach((link: any) => {
      link.size = strokeScale(link.size);
    });
  }

  const linkConfig = shapeConfigFor(v, "Path", v._shapeConfig, "edge");
  delete linkConfig.on;

  const nodeShapeConfig = {
    label: (d: any) =>
      nodes.length <= v._dataCutoff ||
      (v._hover && v._hover(d)) ||
      (v._active && v._active(d))
        ? v._drawLabel(d.data || d.node, d.i)
        : false,
  };
  const linkD = (d: any) =>
    `M${(d.source as DataPoint).x},${(d.source as DataPoint).y} ${(d.target as DataPoint).x},${(d.target as DataPoint).y}`;
  const nodeGroups = Array.from(
    groups(
      nodes as Record<string, unknown>[],
      (d: Record<string, unknown>) => d.shape as string,
    ),
  );

  v.ctx.networkCtx = {links, linkConfig, linkD, nodeGroups, nodeShapeConfig};
  return {shapeData: nodes};
};
