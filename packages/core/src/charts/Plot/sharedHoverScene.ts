/**
    Scene nodes for Plot's shared tooltip (#779): the transparent hover surface,
    the crosshair (drawn as a Line annotation), and markers on the hovered Line
    points.
*/
import type {DataPoint} from "@d3plus/data";
import type {Scene, SceneNode} from "@d3plus/render";

import {collectComputed, makeShape} from "../features/emitHelpers.js";
import {
  PLOT_ZOOM_CONTENT_KEY,
  collectAnnotationGroup,
  renderPlotAnnotation,
  type PlotAxisFn,
} from "../features/plotPaint.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {hasSharedMarks, type ShapeNode} from "./sharedHover.js";

type Parent = {key?: string | number; children?: SceneNode[]};
type HoverState = NonNullable<VizInstance["_sharedHoverState"]>;

/** Stamps a subtree inert chrome: no hit-testing, never dimmed by hover. */
function inert(node: SceneNode): SceneNode {
  const n = node as ShapeNode;
  n.interactive = false;
  n.interactionGroup = "axis";
  if (n.children) n.children.forEach(inert);
  return node;
}

/**
    The crosshair: a Line annotation through the snapped discrete position,
    spanning the continuous axis's current domain, styled by `crosshairConfig`
    and rendered through the same path as user `annotations`.
*/
function crosshairAnnotation(viz: VizInstance, state: HoverState): SceneNode | null {
  // The discrete-axis position is the snapped pixel itself — a column's
  // position, or a side-by-side bar's own center within its band.
  const snapped: PlotAxisFn = () => state.px;
  const x = state.axis === "x" ? snapped : viz._xFunc as PlotAxisFn | undefined;
  const y = state.axis === "y" ? snapped : viz._yFunc as PlotAxisFn | undefined;
  const xDomain = viz._xAxis?._d3Scale?.domain();
  const yDomain = viz._yAxis?._d3Scale?.domain();
  if (!x || !y || !xDomain || !yDomain) return null;
  const span = (state.axis === "x" ? yDomain : xDomain) as unknown[];
  const ends = [span[0], span[span.length - 1]];
  const data = ends.map(v =>
    state.axis === "x" ? {x: state.value, y: v} : {x: v, y: state.value});
  const inst = renderPlotAnnotation(
    viz,
    {shape: "Line", data, id: () => "crosshair", ...viz._crosshairConfig},
    x,
    y,
    {x: xDomain, y: yDomain},
    0,
  );
  const group = collectAnnotationGroup(inst, "plot-crosshair");
  return group ? inert(group) : null;
}

/** Circles on the hovered Line points, styled by `lineMarkerConfig`. */
function hoverMarkers(viz: VizInstance, state: HoverState): SceneNode[] {
  if (viz._lineMarkers || !state.markers.length) return [];
  const at = new Map<DataPoint, {x: number; y: number}>(
    state.markers.map(m => [m.datum, m]),
  );
  const markers = makeShape("Circle")
    .renderMode("compute")
    .data(state.markers.map(m => m.datum))
    .config(viz._lineMarkerConfig)
    .x((d: DataPoint) => at.get(d)!.x)
    .y((d: DataPoint) => at.get(d)!.y)
    .id((d: DataPoint) => `${d.id}_shared`);
  markers.render();
  return [{type: "group", key: "plot-shared-markers", children: collectComputed(markers)} as SceneNode]
    .map(inert);
}

/** Whether a node is a data mark (vs. background, grid, connectors, chrome). */
const isMark = (node: SceneNode): boolean => {
  const n = node as ShapeNode;
  const datum = n.datum as {id?: unknown} | undefined;
  return !!n.shapeType && !n.interactionGroup && n.interactive !== false &&
    !!datum && datum.id !== undefined;
};

/**
    Places the crosshair behind the first data mark ("back") or after every
    mark ("front"), then the markers on top. Returns a fresh array — `nodes` may
    be `_chartScene` itself, which must not accumulate per-paint nodes.
*/
function layer(nodes: SceneNode[], crosshair: SceneNode | null, markers: SceneNode[], side: "back" | "front"): SceneNode[] {
  const out = [...nodes];
  if (crosshair) {
    const first = out.findIndex(isMark);
    if (side === "back" && first >= 0) out.splice(first, 0, crosshair);
    else out.push(crosshair);
  }
  out.push(...markers);
  return out;
}

/**
    Adds the snapped hover's scene nodes to the chart body group (content
    space, so they track zoom): with `tooltipShared`, a transparent hover
    surface behind the marks, so the SVG backend receives pointer events over
    empty plot space; and — while a hover is active — the crosshair and the
    hovered Line markers, inside the zoom-clipped plot content when the chart
    is zoomable.
*/
export function appendSharedHoverNodes(viz: VizInstance, scene: Scene): void {
  const area = viz._plotArea;
  const discrete = viz.schema.discrete;
  if (!area || (discrete !== "x" && discrete !== "y")) return;
  const cells = (scene.root.children as Parent[]).find(n => n.key === "viz-chart-cells");
  const zoom = cells && cells.children && (cells.children[0] as Parent);
  const body = zoom && zoom.children && (zoom.children[0] as Parent);
  if (!body || !body.children) return;
  // The surface is only needed for shared hovers over empty space; a single
  // hover (tooltipShared off) needs the pointer on a mark anyway.
  const surface = viz.schema.tooltipShared && hasSharedMarks(viz) ? [{
    type: "rect",
    key: "plot-hover-surface",
    ...area,
    interactionGroup: "axis",
    paint: {fill: "transparent"},
  } as SceneNode] : [];
  let children = body.children;
  const state = viz._sharedHoverState;
  if (state) {
    const crosshair = crosshairAnnotation(viz, state);
    const markers = hoverMarkers(viz, state);
    const content = children.findIndex(n => n.key === PLOT_ZOOM_CONTENT_KEY);
    if (content >= 0) {
      const group = children[content] as Parent;
      children = [...children];
      children[content] = {
        ...group,
        children: layer(group.children || [], crosshair, markers, state.layer),
      } as SceneNode;
    }
    else children = layer(children, crosshair, markers, state.layer);
  }
  body.children = [...surface, ...children];
}
