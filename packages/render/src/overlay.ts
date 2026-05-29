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
    avoids divergence (e.g. one backend gaining scale/rotate support
    that the other misses).
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
  if (el.innerHTML !== o.html) el.innerHTML = o.html;
  applyDeclarativeEvents(el, o.events);
}

/**
    Creates the sibling host div both renderers append next to their
    surface. Container is set to `position: relative` if it doesn't
    already have one so the absolutely-positioned host layers correctly.
*/
export function createOverlayHost(target: RenderTarget): HTMLDivElement {
  const containerStyle =
    target.container instanceof HTMLElement ? target.container.style : null;
  if (containerStyle && !containerStyle.position) {
    containerStyle.position = "relative";
  }
  const host = document.createElement("div");
  host.setAttribute("class", "d3plus-render-overlays");
  host.style.position = "absolute";
  host.style.top = "0";
  host.style.left = "0";
  host.style.width = "100%";
  host.style.height = "100%";
  host.style.pointerEvents = "none";
  target.container.appendChild(host);
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
  };
  const h = host as HostWithState;
  h.__d3plusEvents = events;
  if (!events) return;

  // Collect every event type referenced in the spec.
  const needed = new Set<string>();
  for (const selector of Object.keys(events)) {
    const handlers = events[selector] || {};
    for (const eventType of Object.keys(handlers)) needed.add(eventType);
  }

  if (!h.__d3plusEventTypes) h.__d3plusEventTypes = new Set();
  for (const eventType of needed) {
    if (h.__d3plusEventTypes.has(eventType)) continue;
    h.__d3plusEventTypes.add(eventType);
    host.addEventListener(eventType, function (e: Event) {
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
    });
  }
}
