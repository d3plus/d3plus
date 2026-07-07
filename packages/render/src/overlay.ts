/**
    Shared overlay-host helpers consumed by both SvgRenderer and
    CanvasRenderer. Extracting them here keeps the two backends in
    lockstep — code-review #27 (2026-05-29).
*/

import type {GroupNode, HtmlOverlayNode, Scene, SceneNode} from "./scene.js";
import type {RenderTarget} from "./Renderer.js";

/**
    Walks the scene tree gathering every `htmlOverlay` node and the
    inherited (x, y) translate offset from its ancestor `group`
    transforms. Both renderers run this identical walk; consolidating
    avoids divergence between SVG and Canvas.

    LIMITATION: accumulates TRANSLATE only — ancestor `scale` and
    `rotate` are not composed into the overlay's screen position. An
    HtmlOverlayNode inside a scaled or rotated group will be positioned
    at the un-scaled / un-rotated coordinate, while the canvas/svg
    children of the same group ARE rendered with the transform applied.
    Effects: overlays drift away from anchored shapes when the wrapping
    group's scale or rotation changes (zoom, programmatic rotation).

    The right fix is a 2D-affine matrix accumulator that returns
    `{x, y, scale, rotation}` and a renderer-side `transform: ...` on
    the overlay div. Today no in-tree consumer puts an overlay inside a
    scaled/rotated group (zoomControls overlays sit at the root), so
    the translate-only model is sufficient. Callers that want anchored
    overlays inside zoom containers should anchor at scene-level
    coordinates after the zoom transform.
*/
export function walkOverlays(scene: Scene): {
  node: HtmlOverlayNode;
  ox: number;
  oy: number;
}[] {
  const collected: {node: HtmlOverlayNode; ox: number; oy: number}[] = [];
  const walk = (n: SceneNode, ox: number, oy: number): void => {
    const tx = (n.transform?.x as number | undefined) ?? 0;
    const ty = (n.transform?.y as number | undefined) ?? 0;
    const cx = ox + tx;
    const cy = oy + ty;
    if (n.type === "htmlOverlay") {
      collected.push({node: n as HtmlOverlayNode, ox: cx, oy: cy});
    } else if (n.type === "group") {
      for (const c of (n as GroupNode).children) walk(c, cx, cy);
    }
  };
  walk(scene.root, 0, 0);
  return collected;
}

/**
    Applies one overlay's resolved style/dimensions/innerHTML to its
    host element. Both renderers run this identical block; consolidated
    here so a new style key, dimension attribute, or html-diff strategy
    lands in one place. Excludes the per-renderer enter/onMount path,
    which differs (d3-selection vs Map-based reconcile).
*/
export function applyOverlayToElement(
  el: HTMLElement,
  item: {node: HtmlOverlayNode; ox: number; oy: number},
): void {
  const o = item.node;
  el.style.left = `${item.ox + o.x}px`;
  el.style.top = `${item.oy + o.y}px`;
  if (o.width !== undefined) el.style.width = `${o.width}px`;
  if (o.height !== undefined) el.style.height = `${o.height}px`;
  if (o.className) el.className = `d3plus-render-overlay ${o.className}`;
  if (o.style) {
    for (const k of Object.keys(o.style))
      (el.style as unknown as Record<string, string>)[k] = String(o.style[k]);
  }
  // Dedupe against the html WE last wrote, not the live innerHTML: an `onMount`
  // consumer (e.g. the zoom controls) mutates the realized DOM — adding inline
  // styles, classes, listeners to the child elements — which changes
  // `el.innerHTML`. Comparing against live innerHTML would then see a diff on
  // the next draw and rewrite it back to `o.html`, wiping those mutations (and
  // `onMount` only fires once, so they'd never be reapplied). Tracking the
  // last-written string rewrites only when the desired html actually changes.
  const elx = el as HTMLElement & {__d3plusHTML?: string};
  if (elx.__d3plusHTML !== o.html) {
    el.innerHTML = o.html;
    elx.__d3plusHTML = o.html;
  }
  applyDeclarativeEvents(el, o.events);
}

/**
    Creates the sibling host div both renderers append next to their
    surface. Container is set to `position: relative` if it doesn't
    already have one so the absolutely-positioned host layers correctly.
*/
export function createOverlayHost(target: RenderTarget): HTMLDivElement {
  // The overlay host is an HTML <div>, which only lays out inside HTML flow: a
  // <div> nested directly inside an <svg> (as happens when the render target IS
  // an svg) gets a 0×0 box, so its contents — zoom-control buttons, HTML
  // annotations — render present-but-invisible. Resolve the mount to the nearest
  // HTMLElement: the target itself when it's HTML, otherwise its closest HTML
  // ancestor. The svg fills that ancestor's top-left box, so overlay
  // coordinates still line up with the scene.
  let mount: HTMLElement | null =
    target.container instanceof HTMLElement ? target.container : null;
  if (!mount) {
    let el: Element | null = target.container;
    while (el && !(el instanceof HTMLElement)) el = el.parentElement;
    mount = el instanceof HTMLElement ? el : null;
  }
  const container: Element = mount ?? target.container;
  // Promote the mount to a positioned ancestor so absolutely-positioned
  // overlays anchor correctly. Read the COMPUTED style (not just inline) — a
  // container with `position: absolute` from a CSS class has
  // `style.position === ""` but `getComputedStyle().position === "absolute"`.
  // Without this we'd silently override the host page's CSS-driven positioning.
  if (mount) {
    const computed =
      typeof getComputedStyle === "function"
        ? getComputedStyle(mount).position
        : "";
    if (computed === "static" || computed === "") {
      mount.style.position = "relative";
    }
  }
  const host = document.createElement("div");
  host.setAttribute("class", "d3plus-render-overlays");
  host.style.position = "absolute";
  host.style.top = "0";
  host.style.left = "0";
  host.style.width = "100%";
  host.style.height = "100%";
  host.style.pointerEvents = "none";
  container.appendChild(host);
  return host;
}


/**
    Declarative event delegation for `HtmlOverlayNode.events`. Attaches
    ONE delegated listener per event type on the host element; each
    listener walks the live spec by `event.target.closest(selector)`
    matching. The spec is stored on the host via `__d3plusEvents` so
    subsequent draws can replace handlers in place without re-binding
    DOM listeners.

    Idempotent: safe to call on every draw — a host that already has
    delegated listeners just gets its spec replaced.
*/
export function applyDeclarativeEvents(
  host: HTMLElement,
  events: HtmlOverlayNode["events"],
): void {
  type HostWithState = HTMLElement & {
    __d3plusEvents?: HtmlOverlayNode["events"];
    __d3plusEventTypes?: Set<string>;
    __d3plusListeners?: Map<string, (e: Event) => void>;
  };
  const h = host as HostWithState;
  h.__d3plusEvents = events;

  // Collect every event type referenced in the spec.
  const needed = new Set<string>();
  if (events) {
    for (const selector of Object.keys(events)) {
      const handlers = events[selector] || {};
      for (const eventType of Object.keys(handlers)) needed.add(eventType);
    }
  }

  if (!h.__d3plusEventTypes) h.__d3plusEventTypes = new Set();
  if (!h.__d3plusListeners) h.__d3plusListeners = new Map();

  // Remove orphaned listeners — event types the previous spec needed
  // but the new spec no longer does. Without this, every spec change
  // accumulates dead listeners on the host element forever (per-overlay
  // DOM-node leak across draws).
  for (const eventType of Array.from(h.__d3plusEventTypes)) {
    if (!needed.has(eventType)) {
      const fn = h.__d3plusListeners.get(eventType);
      if (fn) host.removeEventListener(eventType, fn);
      h.__d3plusListeners.delete(eventType);
      h.__d3plusEventTypes.delete(eventType);
    }
  }

  if (!events) return;

  for (const eventType of needed) {
    if (h.__d3plusEventTypes.has(eventType)) continue;
    h.__d3plusEventTypes.add(eventType);
    const listener = function (e: Event): void {
      const spec = (host as HostWithState).__d3plusEvents;
      if (!spec) return;
      const target = e.target as Element | null;
      if (!target) return;
      for (const selector of Object.keys(spec)) {
        const matchEl = target.closest(selector);
        if (matchEl && host.contains(matchEl)) {
          const handler = spec[selector]?.[e.type];
          if (handler) handler(e);
        }
      }
    };
    host.addEventListener(eventType, listener);
    h.__d3plusListeners.set(eventType, listener);
  }
}
