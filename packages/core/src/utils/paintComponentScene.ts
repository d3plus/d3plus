/**
    Standalone scene paint for the BaseClass-derived components (Axis, Legend,
    ColorScale).

    When one of these components is composed inside a Viz it runs in
    `renderMode("compute")` and the Viz reads its `toScene()` into the chart
    scene — nothing here is used. When it is rendered on its own (e.g. the
    `@d3plus/react` `<Axis>`/`<Legend>`/`<ColorScale>` wrappers, or a bare
    `new Axis().select(svg).render()`), `render()` only computes layout; no
    backend paints the resulting scene. This mounts an SvgRenderer into the
    component's `_select` and draws its scene, reusing the renderer instance
    across re-renders.
*/

import {SvgRenderer} from "@d3plus/render";
import type {GroupNode, Scene} from "@d3plus/render";

interface SceneComponent {
  _select?: {node: () => Element | null};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _sceneRenderer?: any;
  schema: {width?: number; height?: number};
  toScene: () => GroupNode;
}

export function paintComponentScene(instance: SceneComponent): void {
  const sel = instance._select;
  const container =
    sel && typeof sel.node === "function" ? sel.node() : null;
  if (!container) return;

  const width = instance.schema.width ?? 400;
  const height = instance.schema.height ?? 200;

  if (!instance._sceneRenderer) {
    instance._sceneRenderer = new SvgRenderer();
    instance._sceneRenderer.mount({container, width, height});
  } else {
    instance._sceneRenderer.resize(width, height);
  }

  // Wrap the component's group in a synthetic root so the renderer reconciles
  // it as a child (preserving the group's own key/transform); `drawScene`
  // only iterates `scene.root.children`.
  const scene: Scene = {
    root: {type: "group", key: "root", children: [instance.toScene()]},
    width,
    height,
  };
  instance._sceneRenderer.drawScene(scene, {duration: 0});
}
