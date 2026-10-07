/**
    Small multiples: the scene nodes for each panel — its title and its chart
    nodes — composed into one group per panel.

    @module
*/
import type {ClipShape, SceneNode, Transform} from "@d3plus/render";

import {TextBox} from "../../components/index.js";

/** A panel's title, ready to measure and draw. */
export interface FacetTitle {
  text: string;
  x: number;
  y: number;
  width: number;
}

/**
    Returns a copy of `nodes` with every key (at any depth) prefixed by
    `prefix` (or mapped through it, when it's a function), so panels drawing
    the same series keep distinct keys: the renderers key clip paths,
    overlays, and hover state by node key.
*/
export function prefixKeys(nodes: SceneNode[], prefix: string | ((key: string) => string)): SceneNode[] {
  const rekey = typeof prefix === "function" ? prefix : (key: string) => `${prefix}/${key}`;
  return nodes.map(node => {
    const kids = (node as {children?: SceneNode[]}).children;
    const next = {...node, key: rekey(`${node.key}`)} as SceneNode;
    if (kids) (next as {children: SceneNode[]}).children = prefixKeys(kids, rekey);
    return next;
  });
}

/** A TextBox configured for panel titles. */
function titleBox(titles: FacetTitle[], config: Record<string, unknown>, locale?: string): TextBox {
  const box = new TextBox()
    .data(titles.map((t, i) => ({id: `facet-title-${i}`, text: t.text})))
    .x((_: unknown, i: number) => titles[i].x)
    .y((_: unknown, i: number) => titles[i].y)
    .width((_: unknown, i: number) => titles[i].width)
    .height(() => 1e4)
    .verticalAlign("top")
    .config(config);
  if (locale) box.locale(locale);
  return box;
}

/**
    The height of the tallest panel title (lines × line height, plus the
    title's padding above and below), or 0 when there are none.
*/
export function measureFacetTitles(
  titles: FacetTitle[],
  config: Record<string, unknown>,
  locale?: string,
): number {
  if (!titles.length) return 0;
  const padding = typeof config.padding === "number" ? config.padding : 0;
  const data = titleBox(titles, {...config, padding: 0}, locale)._textData();
  const tallest = Math.max(0, ...data.map(d => d.lines.length * d.lH));
  return tallest ? tallest + padding * 2 : 0;
}

/**
    One text node per panel title, offset by the title padding. Titles are
    chrome: they carry no datum and take no pointer events.
*/
export function facetTitleNodes(
  titles: FacetTitle[],
  config: Record<string, unknown>,
  locale?: string,
): SceneNode[] {
  if (!titles.length) return [];
  const padding = typeof config.padding === "number" ? config.padding : 0;
  const shifted = titles.map(t => ({...t, x: t.x + padding, y: t.y + padding, width: t.width - padding * 2}));
  const group = titleBox(shifted, {...config, padding: 0}, locale).toScene();
  return group.children.map(node => {
    const next = {...node, interactive: false, interactionGroup: "facet"} as SceneNode;
    delete next.datum;
    delete next.index;
    return next;
  });
}

/**
    Wraps one panel's chart nodes the way `Viz.toScene` wraps a whole chart's:
    an untransformed group carrying the chart's clip (in surface pixels)
    around a group carrying its chart transform.
*/
export function facetBodyNode(
  key: string,
  nodes: SceneNode[],
  transform?: Transform,
  clip?: ClipShape,
): SceneNode {
  const body: SceneNode = {type: "group", key: `${key}/body`, ...(transform ? {transform} : {}), children: nodes};
  return {type: "group", key: `${key}/cells`, ...(clip ? {clip} : {}), children: [body]};
}

/** A panel's group: its chart nodes, then its title, with the panel title as its accessible name. */
export function facetPanelNode(
  key: string,
  title: SceneNode | undefined,
  body: SceneNode | undefined,
  label: string,
): SceneNode {
  const children: SceneNode[] = [];
  if (body) children.push(body);
  if (title) children.push(title);
  return {type: "group", key, children, ...(label ? {aria: {role: "group", label}} : {})};
}
