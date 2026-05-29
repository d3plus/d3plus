/**
    `applyNetworkLayout` — Network's chart-specific layout stage.

    Resolves nodes + links into a single laid-out node array (running a
    d3-force simulation only when fx/fy coords are missing), normalizes
    link stroke sizes, and stashes `networkCtx` + node/link lookups on
    `viz.ctx` for the click/hover handlers installed by `setup`.
*/

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

/** Single laid-out node — accreted across the layout's passes. */
interface NetworkNode {
  __d3plus__: true;
  data: DataPoint;
  i: number;
  id: string;
  fx: number;
  fy: number;
  node: DataPoint;
  r: number;
  shape: string;
  vx?: number;
  vy?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

/** Resolved link record consumed by the d3-force simulation + emit. */
interface NetworkLink {
  source: NetworkNode;
  target: NetworkNode;
  size: number;
}

export const applyNetworkLayout: TransformStage = ({viz}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = viz as any;
  const {width, height} = chartBounds(v);

  if (!Array.isArray(v._filteredData)) v._filteredData = [];
  if (!Array.isArray(v.schema.nodes)) v.schema.nodes = [];
  if (!Array.isArray(v.schema.links)) v.schema.links = [];

  const nodeId = (d: Record<string, unknown>, i: number) =>
    `${v._id(d, i) || v.schema.nodeGroupBy[min([v._drawDepth, v.schema.nodeGroupBy.length - 1])](d, i)}`;

  const data = (v._filteredData as DataPoint[]).reduce(
    (obj: Record<string, DataPoint>, d, i) => {
      obj[v._id(d, i) as string] = d;
      return obj;
    },
    {},
  );

  let rawNodes: Record<string, DataPoint> = (v.schema.nodes as DataPoint[]).reduce(
    (obj: Record<string, DataPoint>, d, i) => {
      obj[nodeId(d as Record<string, unknown>, i)] = d;
      return obj;
    },
    {},
  );

  let nodes: NetworkNode[] = Array.from(
    new Set(Object.keys(data).concat(Object.keys(rawNodes))),
  )
    .map((id, i) => {
      const d = data[id];
      const n = rawNodes[id];
      if (n === undefined) return false;
      const pickFrom = <T,>(
        accessor: (x: DataPoint) => T,
        validate: (x: T) => boolean = vv => vv !== undefined,
      ): T =>
        d !== undefined && validate(accessor(d)) ? accessor(d) : accessor(n);
      return {
        __d3plus__: true,
        data: (d || n) as DataPoint,
        i,
        id,
        fx: pickFrom(v._x, (val: number) => !isNaN(val)),
        fy: pickFrom(v._y, (val: number) => !isNaN(val)),
        node: n,
        r: v._size ? pickFrom(v._size) : (v.schema.sizeMin as number),
        shape: pickFrom(v._shape) as string,
      } as NetworkNode;
    })
    .filter((n): n is NetworkNode => !!n);
  // rawNodes was used above; drop to avoid retention.
  rawNodes = {};
  void rawNodes;

  const nodeLookup: Record<string, NetworkNode> = nodes.reduce(
    (obj: Record<string, NetworkNode>, d) => {
      obj[d.id] = d;
      return obj;
    },
    {},
  );
  v.ctx.nodeLookup = nodeLookup;

  const nodeByOriginal = new Map<DataPoint, NetworkNode>();
  for (const n of nodes) nodeByOriginal.set(n.node, n);
  type RawLink = {source: string | number | DataPoint; target: string | number | DataPoint};
  const links: NetworkLink[] = (v.schema.links as RawLink[]).map(l => {
    const referenceType = typeof l.source;
    return {
      size: v.schema.linkSize(l) as number,
      source: (referenceType === "number"
        ? nodeByOriginal.get((v.schema.nodes as DataPoint[])[l.source as number])
        : referenceType === "string"
          ? nodeLookup[l.source as string]
          : nodeLookup[(l.source as DataPoint).id as string]) as NetworkNode,
      target: (referenceType === "number"
        ? nodeByOriginal.get((v.schema.nodes as DataPoint[])[l.target as number])
        : referenceType === "string"
          ? nodeLookup[l.target as string]
          : nodeLookup[(l.target as DataPoint).id as string]) as NetworkNode,
    };
  });

  v.ctx.linkLookup = links.reduce(
    (obj: Record<string, NetworkNode[]>, d) => {
      if (!obj[d.source.id]) obj[d.source.id] = [];
      obj[d.source.id].push(d.target);
      if (!obj[d.target.id]) obj[d.target.id] = [];
      obj[d.target.id].push(d.source);
      return obj;
    },
    {},
  );

  const missingCoords = nodes.some(
    n => n.fx === undefined || n.fy === undefined,
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
      n => [n.vx ?? 0, n.vy ?? 0] as [number, number],
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

    nodes.forEach(n => {
      const p = pointRotate([n.vx ?? 0, n.vy ?? 0], -1 * ((Math.PI / 180) * angle), [cx, cy]);
      n.fx = p[0];
      n.fy = p[1];
    });
  }

  const xExtent = extent(nodes.map(n => n.fx)) as unknown as [number, number];
  const yExtent = extent(nodes.map(n => n.fy)) as unknown as [number, number];

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

  nodes.forEach(n => {
    n.x = x(n.fx);
    n.y = y(n.fy);
  });

  const rExtent = extent(nodes.map(n => n.r)) as unknown as [number, number];
  let rMax =
    v.schema.sizeMax ||
    (max([
      1,
      (min(
        d3ArrayMerge(
          nodes.map(n1 =>
            nodes.map(n2 =>
              n1 === n2 ? null : pointDistance([n1.x ?? 0, n1.y ?? 0], [n2.x ?? 0, n2.y ?? 0]),
            ),
          ) as unknown as Iterable<Iterable<number>>,
        ),
      ) as unknown as number) / 2,
    ]) as unknown as number);

  interface RScale {
    (v: number): number;
    domain: (d: [number, number]) => RScale;
    range: ((r: [number, number]) => RScale) & (() => [number, number]);
  }
  const r: RScale = ((scales as unknown as Record<string, () => RScale>)[
      `scale${v.schema.sizeScale.charAt(0).toUpperCase()}${v.schema.sizeScale.slice(1)}`
    ]())
      .domain(rExtent)
      .range([
        rExtent[0] === rExtent[1] ? rMax : (min([rMax / 2, v.schema.sizeMin as number]) as number),
        rMax,
      ]);
  const xDomain = x.domain();
  const yDomain = y.domain();

  const xOldSize = xDomain[1] - xDomain[0];
  const yOldSize = yDomain[1] - yDomain[0];

  nodes.forEach(n => {
    const size = r(n.r);
    const nx = n.x ?? 0;
    const ny = n.y ?? 0;
    if (xDomain[0] > x.invert(nx - size)) xDomain[0] = x.invert(nx - size);
    if (xDomain[1] < x.invert(nx + size)) xDomain[1] = x.invert(nx + size);
    if (yDomain[0] > y.invert(ny - size)) yDomain[0] = y.invert(ny - size);
    if (yDomain[1] < y.invert(ny + size)) yDomain[1] = y.invert(ny + size);
  });

  const xNewSize = xDomain[1] - xDomain[0];
  const yNewSize = yDomain[1] - yDomain[0];
  rMax *= min([xOldSize / xNewSize, yOldSize / yNewSize])!;
  r.range([
    rExtent[0] === rExtent[1] ? rMax : min([rMax / 2, v.schema.sizeMin]),
    rMax,
  ]);
  x.domain(xDomain);
  y.domain(yDomain);

  const fallbackRadius = (nodeRatio > screenRatio ? width : height) / 2;
  nodes.forEach(n => {
    n.x = x(n.fx);
    n.fx = n.x;
    n.y = y(n.fy);
    n.fy = n.y;
    n.r = r(n.r) || fallbackRadius;
    n.width = n.r * 2;
    n.height = n.r * 2;
  });

  const strokeExtent = extent(links, (d: NetworkLink) => d.size);
  if (strokeExtent[0] !== strokeExtent[1]) {
    const strokeScale = (scales as unknown as Record<string, () => RScale>)[
      `scale${v.schema.linkSizeScale.charAt(0).toUpperCase()}${v.schema.linkSizeScale.slice(1)}`
    ]()
      .domain(strokeExtent as [number, number])
      .range([v.schema.linkSizeMin as number, r.range()[0]]);
    links.forEach(link => {
      link.size = strokeScale(link.size);
    });
  }

  const linkConfig = shapeConfigFor(v, "Path", v._shapeConfig, "edge");
  delete linkConfig.on;

  const nodeShapeConfig = {
    label: (d: NetworkNode) =>
      nodes.length <= v.schema.dataCutoff ||
      (v._hover && v._hover(d)) ||
      (v._active && v._active(d))
        ? v._drawLabel(d.data || d.node, d.i)
        : false,
  };
  const linkD = (d: NetworkLink) =>
    `M${d.source.x},${d.source.y} ${d.target.x},${d.target.y}`;
  const nodeGroups = Array.from(groups(nodes, d => d.shape));

  v.ctx.networkCtx = {links, linkConfig, linkD, nodeGroups, nodeShapeConfig};
  return {shapeData: nodes as unknown as DataPoint[]};
};
