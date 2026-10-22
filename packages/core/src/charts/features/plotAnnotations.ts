/**
    Plot annotations: user `annotations` rendered in compute mode through the
    plot's axis functions, layered behind ("back") or in front of the data
    shapes, and grouped into inert, stably-keyed scene groups.
*/

import type {SceneNode} from "@d3plus/render";

import * as shapes from "../../shapes/index.js";
import {markSharedConfig} from "../../utils/configWarnings.js";
import type {VizInstance as Viz} from "../viz/vizTypes.js";
import {makeShape} from "./emitHelpers.js";
import type {PlotAxisFn, PlotDatum} from "./plotPaint.js";

/** A user annotation: a shape key plus its config, optionally z-layered. */
export interface Annotation {
  shape: string;
  layer?: string;
  [key: string]: unknown;
}

/**
    Annotations are decorative chrome, not data marks. Stamp their scene nodes
    `interactive: false` so the renderer's hit-test skips them: they fire no
    shape tooltips and let pointer events pass through to the data shapes
    beneath — matching v3, where annotations had no tooltips.
*/
function markAnnotationsInert(nodes: SceneNode[]): SceneNode[] {
  const mark = (node: SceneNode): void => {
    (node as {interactive?: boolean}).interactive = false;
    const kids = (node as {children?: SceneNode[]}).children;
    if (kids) for (const child of kids) mark(child);
  };
  nodes.forEach(mark);
  return nodes;
}

/**
    Wraps one annotation's scene in its OWN stable-keyed group, keeping the
    shape's node group and label group as distinct sub-groups (rather than
    flattening them into the chart-cell siblings, as `collectComputed` would).

    The per-annotation `key` scopes the renderer's keyed join: ids reused
    across different annotation shapes (e.g. "curve-mask" on both a Circle and
    a Rect) no longer collide into one sibling list, so each annotation's nodes
    match old→new by id frame-to-frame and TWEEN instead of exit/entering. The
    subtree is marked inert (annotations never show tooltips).
*/
export function collectAnnotationGroup(
  inst: shapes.Shape,
  key: string,
): SceneNode | null {
  const children: SceneNode[] = [];
  try {
    const s = inst.toScene();
    if (s && Array.isArray(s.children) && s.children.length)
      children.push(s as unknown as SceneNode);
    const lbl = (
      inst as {_labelClass?: {toScene?: () => {children?: unknown[]}}}
    )._labelClass;
    if (lbl && typeof lbl.toScene === "function") {
      const ls = lbl.toScene();
      if (ls && Array.isArray(ls.children) && ls.children.length)
        children.push(ls as unknown as SceneNode);
    }
  } catch {
    return null;
  }
  if (!children.length) return null;
  const group: SceneNode = {type: "group", key, children} as SceneNode;
  markAnnotationsInert([group]);
  return group;
}

/**
    Renders one annotation in compute mode: the annotation's own config, with
    positions mapped from data space through the plot's axis functions — the
    same mapping user `annotations` get.
*/
export function renderPlotAnnotation(
  viz: Viz,
  annotation: Annotation,
  x: PlotAxisFn,
  y: PlotAxisFn,
  domains: Record<string, unknown[]>,
  yOffset: number,
): shapes.Shape {
  // `shape` and `layer` pick the class and z-layer; the rest is shape config.
  const config: Record<string, unknown> = Object.assign({}, annotation);
  delete config.shape;
  delete config.layer;
  const inst = makeShape(annotation.shape)
    .renderMode("compute")
    .duration(viz.schema.duration)
    .config(config)
    .config(
      markSharedConfig({
        x: (d: PlotDatum) => (d.x2 ? x(d.x2, "x2") : x(d.x)),
        x0:
          viz.schema.discrete === "x"
            ? (d: PlotDatum) => (d.x2 ? x(d.x2, "x2") : x(d.x))
            : x(domains.x[0]),
        x1:
          viz.schema.discrete === "x"
            ? null
            : (d: PlotDatum) => (d.x2 ? x(d.x2, "x2") : x(d.x)),
        y: (d: PlotDatum) => (d.y2 ? y(d.y2, "y2") : y(d.y)),
        y0:
          viz.schema.discrete === "y"
            ? (d: PlotDatum) => (d.y2 ? y(d.y2, "y2") : y(d.y))
            : y(domains.y[1]) - yOffset,
        y1:
          viz.schema.discrete === "y"
            ? null
            : (d: PlotDatum) => (d.y2 ? y(d.y2, "y2") : y(d.y) - yOffset),
      }),
    );
  inst.render();
  return inst;
}

/**
    Renders back/front annotations, pushing back-layer scenes onto `out` and
    returning the front-layer shape instances for later absorption.
*/
export function emitAnnotations(
  viz: Viz,
  out: SceneNode[],
  x: PlotAxisFn,
  y: PlotAxisFn,
  domains: Record<string, number[]>,
  yOffset: number,
): shapes.Shape[] {
  // Annotations run in `renderMode("compute")` and their scenes are
  // absorbed into `_chartScene`. Layering: "back" annotations absorb here
  // (before the main shape loop below); "front" annotations queue and
  // absorb AFTER the shape loop, giving back → shapes → front.
  const frontAnnotationShapes: shapes.Shape[] = [];
  const renderAnnotation = (annotation: Annotation) =>
    renderPlotAnnotation(viz, annotation, x, y, domains, yOffset);

  Object.keys(viz._previousAnnotations!).forEach(layer => {
    const annotationData: Annotation[] = (
      viz._annotations as unknown as Annotation[]
    ).filter(
      (d: Annotation) => (layer === "back" && !d.layer) || d.layer === layer,
    );
    const annotationShapes = annotationData.map(d => d.shape);
    annotationData.forEach((annotation, i) => {
      const inst = renderAnnotation(annotation);
      if (layer === "front") frontAnnotationShapes.push(inst);
      else {
        const group = collectAnnotationGroup(inst, `annotation-${layer}-${i}`);
        if (group) out.push(group);
      }
    });
    // Exits: render with empty data in compute mode so their scenes go
    // empty; no DOM to clean up.
    const exitAnnotations = viz._previousAnnotations![layer].filter(
      (d: string) => !annotationShapes.includes(d),
    );
    exitAnnotations.forEach(shape => {
      makeShape(shape).renderMode("compute").data([]).render();
    });

    viz._previousAnnotations![layer] = annotationShapes;
  });

  return frontAnnotationShapes;
}
