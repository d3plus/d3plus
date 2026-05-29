/**
    `applyRingsLayout` — Rings' chart-specific layout stage. Lays out the
    focal center node + two concentric rings of connected nodes, sizes
    each by extent, builds bezier link `d` accessor, and stashes
    `ringsCtx` + `nodeLookup`/`linkLookup` on `viz.ctx`.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */

import {extent, groups, max, min} from "d3-array";
import * as scales from "d3-scale";

import {colorContrast} from "@d3plus/color";
import {backgroundColor} from "@d3plus/dom";
import type {DataPoint} from "@d3plus/data";

import {chartBounds} from "../chartGeometry.js";
import {shapeConfigFor} from "../emitHelpers.js";
import type {TransformStage} from "../stages.js";

export const applyRingsLayout: TransformStage = ({viz}) => {
  const v = viz as any;

  if (!Array.isArray(v._filteredData)) v._filteredData = [];
  if (!Array.isArray(v._nodes)) v._nodes = [];
  if (!Array.isArray(v._links)) v._links = [];
  if (!v._filteredData.length && !v._nodes.length && !v._links.length) {
    v.ctx.nodeLookup = {};
    v.ctx.linkLookup = {};
    v.ctx.ringsCtx = {edges: [], nodeGroups: [], linkConfig: {}, linkD: () => "", nodeShapeConfig: {}};
    return {viz};
  }

  const data = v._filteredData.reduce((obj: any, d: any, i: any) => {
    obj[v._id(d, i)] = d;
    return obj;
  }, {});

  let nodes = v._nodes;
  if (!v._nodes.length && v._links.length) {
    const nodeIds = Array.from(
      new Set(
        v._links.reduce(
          (ids: any, link: any) => ids.concat([link.source, link.target]),
          [],
        ),
      ),
    );
    nodes = nodeIds.map((node: any) => typeof node === "object" ? node : {id: node});
  }

  nodes = nodes.reduce((obj: any, d: any, i: any) => {
    obj[
      v._nodeGroupBy ? v._nodeGroupBy[v._drawDepth](d, i) : v._id(d, i)
    ] = d;
    return obj;
  }, {});

  nodes = Array.from(new Set(Object.keys(data).concat(Object.keys(nodes))))
    .map((id, i) => {
      const d = data[id];
      const n = nodes[id];
      if (n === undefined) return false;
      return {
        __d3plus__: true,
        data: d || n,
        i,
        id,
        node: n,
        shape:
          d !== undefined && v._shape(d) !== undefined
            ? v._shape(d)
            : v._shape(n),
      };
    })
    .filter((n: any) => n);

  const nodeLookup = nodes.reduce((obj: any, d: any) => {
    obj[d.id] = d;
    return obj;
  }, {});
  v.ctx.nodeLookup = nodeLookup;

  const links = v._links.map((link: any) => {
    const checks = ["source", "target"];
    const edge = checks.reduce((result: any, check: any) => {
      if (typeof link[check] === "number") {
        const original = v._nodes && v._nodes[link[check]];
        if (original == null) result[check] = undefined;
        else if (typeof original === "object")
          result[check] = nodeLookup[original.id] || nodeLookup[original];
        else result[check] = nodeLookup[original];
      } else {
        result[check] = nodeLookup[link[check].id || link[check]];
      }
      return result;
    }, {} as Record<string, any>);
    edge.size = v._linkSize(link);
    return edge;
  });

  const linkMap = links.reduce((map: any, link: any) => {
    if (!map[link.source.id]) map[link.source.id] = [];
    map[link.source.id].push(link);
    if (!map[link.target.id]) map[link.target.id] = [];
    map[link.target.id].push(link);
    return map;
  }, {});

  const {width, height} = chartBounds(v);
  const edges: any[] = [];
  const radius = (min([height, width]) || 0) / 2;
  const ringWidth = radius / 3;
  const primaryRing = ringWidth;
  const secondaryRing = ringWidth * 2;

  const center = nodeLookup[v._center];
  if (!center) {
    v.ctx.ringsCtx = {edges: [], nodeGroups: [], linkConfig: {}, linkD: () => "", nodeShapeConfig: {}};
    return {viz};
  }

  center.x = width / 2;
  center.y = height / 2;
  center.r = v._sizeMin
    ? max([v._sizeMin, primaryRing * 0.65])
    : v._sizeMax
      ? min([v._sizeMax, primaryRing * 0.65])
      : primaryRing * 0.65;

  const claimed = [center];
  const primaries: any[] = [];
  const centerLinks = linkMap[v._center] || [];
  centerLinks.forEach((edge: any) => {
    const node = edge.source.id === v._center ? edge.target : edge.source;
    node.edges = linkMap[node.id].filter(
      (link: any) => link.source.id !== v._center || link.target.id !== v._center,
    );
    node.edge = edge;
    claimed.push(node);
    primaries.push(node);
  });

  primaries.sort((a, b) => a.edges.length - b.edges.length);
  const secondaries: any[] = [];
  let totalEndNodes = 0;

  primaries.forEach(p => {
    const primaryId = p.id;
    p.edges = p.edges.filter(
      (edge: any) =>
        (!claimed.includes(edge.source) && edge.target.id === primaryId) ||
        (!claimed.includes(edge.target) && edge.source.id === primaryId),
    );
    totalEndNodes += p.edges.length || 1;
    p.edges.forEach((edge: any) => {
      const {source, target} = edge;
      const claim = target.id === primaryId ? source : target;
      claimed.push(claim);
    });
  });

  const tau = Math.PI * 2;
  let offset = 0;

  primaries.forEach((p, i) => {
    const children = p.edges.length || 1;
    const space = (tau / totalEndNodes) * children;
    if (i === 0) offset -= space / 2;
    const angle = offset + space / 2 - tau / 4;
    p.radians = angle;
    p.x = width / 2 + primaryRing * Math.cos(angle);
    p.y = height / 2 + primaryRing * Math.sin(angle);
    offset += space;

    p.edges.forEach((edge: any, j: any) => {
      const node = edge.source.id === p.id ? edge.target : edge.source;
      const s = tau / totalEndNodes;
      const a = angle - (s * children) / 2 + s / 2 + s * j;
      node.radians = a;
      node.x = width / 2 + secondaryRing * Math.cos(a);
      node.y = height / 2 + secondaryRing * Math.sin(a);
      secondaries.push(node);
    });
  });

  const primaryDistance = ringWidth / 2;
  const secondaryDistance = ringWidth / 4;

  let primaryMax = primaryDistance / 2 - 4;
  if (primaryDistance / 2 - 4 < 8) primaryMax = min([primaryDistance / 2, 8]) || 0;

  let secondaryMax = secondaryDistance / 2 - 4;
  if (secondaryDistance / 2 - 4 < 4) secondaryMax = min([secondaryDistance / 2, 4]) || 0;
  if (secondaryMax > ringWidth / 10) secondaryMax = ringWidth / 10;
  if (secondaryMax > primaryMax && secondaryMax > 10) secondaryMax = primaryMax * 0.75;
  if (primaryMax > secondaryMax * 1.5) primaryMax = secondaryMax * 1.5;
  primaryMax = Math.floor(primaryMax);
  secondaryMax = Math.floor(secondaryMax);

  let radiusFn: any;
  if (v._size) {
    const domain = extent(
      Object.values(data) as {size: number}[],
      (d: {size: number}) => d.size,
    ) as [number, number];
    if (domain[0] === domain[1]) domain[0] = 0;
    radiusFn = scales.scaleLinear()
      .domain(domain)
      .rangeRound([3, min([primaryMax, secondaryMax]) as number]);
    const val = center.size;
    center.r = radiusFn(val);
  } else {
    radiusFn = scales.scaleLinear()
      .domain([1, 2])
      .rangeRound([primaryMax, secondaryMax]);
  }

  secondaries.forEach(s => {
    s.ring = 2;
    const val = v._size ? s.size : 2;
    s.r = v._sizeMin
      ? max([v._sizeMin, radiusFn(val)])
      : v._sizeMax
        ? min([v._sizeMax, radiusFn(val)])
        : radiusFn(val);
  });
  primaries.forEach(p => {
    p.ring = 1;
    const val = v._size ? p.size : 1;
    p.r = v._sizeMin
      ? max([v._sizeMin, radiusFn(val)])
      : v._sizeMax
        ? min([v._sizeMax, radiusFn(val)])
        : radiusFn(val);
  });

  nodes = ([center] as any[]).concat(primaries).concat(secondaries);

  primaries.forEach(p => {
    const checks = ["source", "target"];
    const {edge} = p;
    checks.forEach((node: any) => {
      edge[node] = nodes.find((n: any) => n.id === edge[node].id);
    });
    edges.push(edge);

    linkMap[p.id].forEach((edge: any) => {
      const node = edge.source.id === p.id ? edge.target : edge.source;
      if (node.id === center.id) return;
      let target = secondaries.find(s => s.id === node.id);
      if (!target) target = primaries.find(s => s.id === node.id);
      if (!target) return;
      edge.spline = true;

      const centerX = width / 2;
      const centerY = height / 2;
      const middleRing = primaryRing + (secondaryRing - primaryRing) * 0.5;
      const checks2 = ["source", "target"];

      checks2.forEach((node: any, i: any) => {
        edge[`${node}X`] =
          edge[node].x +
          Math.cos(
            edge[node].ring === 2
              ? edge[node].radians + Math.PI
              : edge[node].radians,
          ) * edge[node].r;
        edge[`${node}Y`] =
          edge[node].y +
          Math.sin(
            edge[node].ring === 2
              ? edge[node].radians + Math.PI
              : edge[node].radians,
          ) * edge[node].r;
        edge[`${node}BisectX`] = centerX + middleRing * Math.cos(edge[node].radians);
        edge[`${node}BisectY`] = centerY + middleRing * Math.sin(edge[node].radians);
        edge[node] = nodes.find((n: any) => n.id === edge[node].id);
        if (edge[node].edges === undefined) edge[node].edges = {};
        const oppId = i === 0 ? edge.target.id : edge.source.id;
        if (edge[node].id === p.id) {
          edge[node].edges[oppId] = {angle: p.radians + Math.PI, radius: ringWidth / 2};
        } else {
          edge[node].edges[oppId] = {angle: target.radians, radius: ringWidth / 2};
        }
      });
      edges.push(edge);
    });
  });

  nodes.forEach((node: any) => {
    if (node.id === v._center) {
      node.labelBounds = {
        x: -primaryRing / 2,
        y: -primaryRing / 2,
        width: primaryRing,
        height: primaryRing,
      };
      return;
    }
    const fontSize =
      (v._shapeConfig.labelConfig.fontSize && v._shapeConfig.labelConfig.fontSize(node)) || 11;
    const lineHeight = fontSize * 1.4;
    const h = lineHeight * 2;
    const padding = 5;
    const w = ringWidth - node.r;

    let angle = node.radians * (180 / Math.PI);
    let x = node.r + padding;
    let textAnchor = "start";

    if (angle < -90 || angle > 90) {
      x = -node.r - w - padding;
      textAnchor = "end";
      angle += 180;
    }
    node.labelBounds = {x, y: -lineHeight / 2, width: w, height: h};
    node.rotate = angle;
    node.textAnchor = textAnchor;
  });

  v.ctx.linkLookup = links.reduce((obj: any, d: any) => {
    if (!obj[d.source.id]) obj[d.source.id] = [];
    obj[d.source.id].push(d.target);
    if (!obj[d.target.id]) obj[d.target.id] = [];
    obj[d.target.id].push(d.source);
    return obj;
  }, {});

  const strokeExtent = extent(links, (d: {size: number}) => d.size);
  if (strokeExtent[0] !== strokeExtent[1]) {
    const rNodeMin = min(nodes as {r: number}[], (d: {r: number}) => d.r);
    const strokeScale = (scales as any)[
      `scale${v._linkSizeScale.charAt(0).toUpperCase()}${v._linkSizeScale.slice(1)}`
    ]()
      .domain(strokeExtent)
      .range([v._linkSizeMin, rNodeMin]);
    links.forEach((link: any) => {
      link.size = strokeScale(link.size);
    });
  }

  const linkConfig = shapeConfigFor(v, "Path", v._shapeConfig, "edge");
  delete linkConfig.on;

  const linkD = (d: any) =>
    d.spline
      ? `M${d.sourceX},${d.sourceY}C${d.sourceBisectX},${d.sourceBisectY} ${d.targetBisectX},${d.targetBisectY} ${d.targetX},${d.targetY}`
      : `M${(d.source as DataPoint).x},${(d.source as DataPoint).y} ${(d.target as DataPoint).x},${(d.target as DataPoint).y}`;

  const shapeConfig = {
    label: (d: any) =>
      nodes.length <= v._dataCutoff ||
      (v._hover && v._hover(d)) ||
      (v._active && v._active(d))
        ? v._drawLabel(d.data || d.node, d.i)
        : false,
    labelBounds: (d: any) => d.labelBounds,
    labelConfig: {
      fontColor: (d: any) =>
        d.id === v._center
          ? (shapeConfigFor(v, d.key) as any).labelConfig.fontColor(d)
          : colorContrast(
              v._select ? backgroundColor(v._select.node()) : "rgb(255, 255, 255)",
            ),
      fontResize: (d: any) => d.id === v._center,
      padding: 0,
      textAnchor: (d: any) =>
        nodeLookup[d.id].textAnchor ||
        (shapeConfigFor(v, d.key) as any).labelConfig.textAnchor,
      verticalAlign: (d: any) => (d.id === v._center ? "middle" : "top"),
    },
    rotate: (d: any) => nodeLookup[d.id].rotate || 0,
  };

  const nodeGroups = Array.from(
    groups(
      nodes as Record<string, unknown>[],
      (d: Record<string, unknown>) => d.shape as string,
    ),
  );
  v.ctx.ringsCtx = {edges, nodeGroups, linkConfig, linkD, nodeShapeConfig: shapeConfig};

  return {shapeData: nodes};
};
