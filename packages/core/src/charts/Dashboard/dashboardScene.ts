/**
    Dashboard: the whole dashboard as one scene (its own chrome with every chart's
    scene placed in its box), for saving and serializing it.

    @module
*/
import {SvgRenderer} from "@d3plus/render";
import type {Scene, SceneNode} from "@d3plus/render";

import {prefixKeys} from "../facet/facetScene.js";

/** One chart's scene and where it sits in the dashboard. */
export interface DashboardPart {
  scene: Scene;
  x: number;
  y: number;
}

/**
    Composes the dashboard's own scene (`own`) and each chart's (`parts`) into
    one: every chart's root goes in a group of its own, moved to its box and
    with its keys prefixed so charts drawing the same keys stay distinct.
*/
export function composeDashboardScene(
  own: Scene,
  parts: DashboardPart[],
): Scene {
  const charts: SceneNode[] = parts.map((part, i) => {
    const key = `dashboard-chart-${i}`;
    return {
      type: "group",
      key,
      transform: {x: part.x, y: part.y},
      children: prefixKeys([part.scene.root], key),
    };
  });
  return {
    width: own.width,
    height: own.height,
    root: {
      type: "group",
      key: "dashboard-root",
      children: [own.root, ...charts],
    },
  };
}

/**
    Serializes a scene to SVG markup through a throwaway SVG renderer, or
    `""` without a document to draw it in.
*/
export function sceneMarkup(scene: Scene): string {
  if (typeof document === "undefined") return "";
  const holder = document.createElement("div");
  const svg = new SvgRenderer();
  svg.mount({container: holder, width: scene.width, height: scene.height});
  svg.drawScene(scene);
  const markup = svg.toSVGString();
  svg.destroy();
  return markup;
}
