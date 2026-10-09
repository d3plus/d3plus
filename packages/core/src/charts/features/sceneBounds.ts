/**
    Bounding boxes of a chart's data marks, read off its scene graph — the
    obstacles `negativeSpace` keeps chart chrome clear of.

    @module
*/

import {path2polygon, pathBounds} from "@d3plus/math";
import type {Bounds} from "@d3plus/math";
import type {SceneNode, TextNode, Transform} from "@d3plus/render";

type Point = [number, number];

/** Maps a point through a node transform: rotate (about its anchor), scale, then translate. */
function applyTransform([px, py]: Point, t: Transform | undefined): Point {
  if (!t) return [px, py];
  let x = px, y = py;
  if (t.rotate) {
    const [ax, ay] = t.rotateAnchor ?? [0, 0];
    const a = (t.rotate * Math.PI) / 180, cos = Math.cos(a), sin = Math.sin(a);
    const dx = x - ax, dy = y - ay;
    x = ax + dx * cos - dy * sin;
    y = ay + dx * sin + dy * cos;
  }
  const s = t.scale ?? 1;
  return [x * s + (t.x ?? 0), y * s + (t.y ?? 0)];
}

/** How finely a path's curves are traced into outline points, in pixels. */
const PATH_STEP = 10;

/** A zero-size box at a series vertex. */
const vertexBox = ([x, y]: Point): Bounds => ({x, y, width: 0, height: 0});

/** One box per laid-out line of a text node, from its anchor, baseline, and font size. */
function textBoxes(node: TextNode): Bounds[] {
  const size = node.font?.size ?? 0;
  const anchor = node.font?.anchor ?? "start";
  const baseline = node.font?.baseline ?? "alphabetic";
  const above = baseline === "hanging" ? 0 : baseline === "middle" ? size / 2 : size * 0.8;
  return (node.lines || [])
    .filter(line => line.text && line.width)
    .map(line => {
      const shift = anchor === "middle" ? line.width / 2 : anchor === "end" ? line.width : 0;
      return {x: node.x + line.x - shift, y: node.y + line.y - above, width: line.width, height: size};
    });
}

/** Boxes of a node's own geometry, before its transform. Line/area series and paths contribute one box per outline point. */
function ownBoxes(node: SceneNode): Bounds[] {
  switch (node.type) {
    case "rect":
    case "image":
      return [{x: node.x, y: node.y, width: node.width, height: node.height}];
    case "circle":
      return [{x: node.cx - node.r, y: node.cy - node.r, width: node.r * 2, height: node.r * 2}];
    case "path": {
      // Its outline, so a curved shape (a pie wedge, a map region) doesn't
      // claim the empty corners of its bounding box.
      const outline = path2polygon(node.d, PATH_STEP);
      return outline.length ? outline.map(vertexBox) : [pathBounds(node.d)];
    }
    case "line":
      return node.points.map(vertexBox);
    case "area":
      return [...node.topline, ...node.baseline].map(vertexBox);
    case "text":
      return textBoxes(node);
    default:
      return [];
  }
}

/** Composes a chain of transforms (outermost first) into one point mapper. */
function mapper(chain: Transform[]): (p: Point) => Point {
  return p => chain.reduceRight<Point>((q, t) => applyTransform(q, t), p);
}

/** The axis-aligned box around a box mapped through `map`. */
function mapBox(b: Bounds, map: (p: Point) => Point): Bounds {
  const corners = [
    map([b.x, b.y]), map([b.x + b.width, b.y]),
    map([b.x, b.y + b.height]), map([b.x + b.width, b.y + b.height]),
  ];
  const xs = corners.map(c => c[0]), ys = corners.map(c => c[1]);
  const x = Math.min(...xs), y = Math.min(...ys);
  return {x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y};
}

/**
    Boxes, in the coordinate space of `nodes` after `base` is applied, of
    every data mark and label in a scene: datum-bearing nodes at any depth,
    with group transforms composed. `::hit` duplicates and chart decorations
    (axes, gridlines and other nodes without a datum) are skipped.
    @param nodes The chart's scene nodes (e.g. `viz._chartScene`).
    @param base A transform applied to all of them (e.g. `viz._chartTransform`).
    @param skip Excludes a node and everything inside it, for decorations that carry a datum (like axis ticks).
*/
export function markBoxes(
  nodes: SceneNode[],
  base?: Transform,
  skip?: (node: SceneNode) => boolean,
): Bounds[] {
  const out: Bounds[] = [];
  const walk = (list: SceneNode[], chain: Transform[]): void => {
    for (const node of list) {
      if (String(node.key).endsWith("::hit") || (skip && skip(node))) continue;
      const next = node.transform ? [...chain, node.transform] : chain;
      if (node.type === "group") {
        walk(node.children, next);
        continue;
      }
      if (node.datum === undefined) continue;
      const map = mapper(next);
      for (const b of ownBoxes(node)) {
        if ([b.x, b.y, b.width, b.height].every(Number.isFinite)) out.push(mapBox(b, map));
      }
    }
  };
  walk(nodes, base ? [base] : []);
  return out;
}
