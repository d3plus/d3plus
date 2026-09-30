import {select} from "d3-selection";

import type Viz from "./Viz.js";

interface Target {
  delay: number;
  onHidden?: () => void;
  onVisible: () => void;
  timer?: ReturnType<typeof setTimeout>;
}

interface Entry {
  targets: Map<Element, Set<Target>>;
  io: IntersectionObserver;
}

/** Vertical buffer around the scroll root, so charts start rendering just before they scroll into view. */
const ROOT_MARGIN = "25% 0px";

const WINDOW_ROOT = {};
const entries = new WeakMap<object, Entry>();

/**
    Whether viewport observation is available (false in JSDOM/SSR, where the
    scroll-polling fallback in `vizRender` is used instead).
    @private
*/
export function canObserveVisibility(): boolean {
  return typeof IntersectionObserver !== "undefined";
}

/**
    Resolves `schema.scrollContainer` (window, element, or selector) to an
    IntersectionObserver root: `null` (the viewport) for window/document.
    @private
*/
function resolveRoot(scrollContainer: unknown): Element | null {
  if (
    !scrollContainer ||
    (typeof window !== "undefined" && scrollContainer === window)
  )
    return null;
  if (typeof scrollContainer === "string") return select(scrollContainer).node() as Element | null;
  if (typeof Element !== "undefined" && scrollContainer instanceof Element) return scrollContainer;
  return null;
}

/**
    Observes `el` against `scrollContainer` through one IntersectionObserver
    shared by every viz using that root. `onVisible` runs once `el` has stayed in
    view for `delay` ms, so elements scrolled past quickly never fire; leaving
    view cancels the pending call and runs `onHidden`, if given. Returns a function
    that stops observing.
    @private
*/
export function observeVisibility(
  el: Element,
  scrollContainer: unknown,
  onVisible: () => void,
  delay = 0,
  onHidden?: () => void,
): () => void {
  const root = resolveRoot(scrollContainer);
  const key = root || WINDOW_ROOT;
  let entry = entries.get(key);
  if (!entry) {
    const map = new Map<Element, Set<Target>>();
    const io = new IntersectionObserver(
      changes => {
        changes.forEach(c => {
          map.get(c.target)?.forEach(t => {
            clearTimeout(t.timer);
            t.timer = undefined;
            if (!c.isIntersecting) {
              t.onHidden?.();
              return;
            }
            if (t.delay > 0) t.timer = setTimeout(t.onVisible, t.delay);
            else t.onVisible();
          });
        });
      },
      {root, rootMargin: ROOT_MARGIN},
    );
    entry = {targets: map, io};
    entries.set(key, entry);
  }
  const {targets: map, io} = entry;
  const target: Target = {delay, onHidden, onVisible};
  let set = map.get(el);
  if (!set) map.set(el, (set = new Set()));
  set.add(target);
  // An IntersectionObserver only reports changes after observe() starts, so
  // restart observation to give a registration added to an already-observed
  // element (e.g. a redraw of a drawn chart) its current state right away.
  io.unobserve(el);
  io.observe(el);
  return () => {
    clearTimeout(target.timer);
    set.delete(target);
    if (!set.size) {
      map.delete(el);
      io.unobserve(el);
    }
  };
}

/**
    Releases a chart's DOM/scene while it is off-screen. The `<svg>` and its
    size stay in place so the page doesn't reflow; data and config are kept, so
    `vizReload` can redraw it without refetching.
    @private
*/
export function vizUnload(viz: Viz): void {
  if (viz._unloaded) return;
  viz._unloaded = true;
  viz._resizePoll = clearTimeout(viz._resizePoll);
  const parent = viz._select.node()?.parentNode;
  if (parent) viz._resizeObserver?.unobserve(parent);
  viz._tooltipClass.data([]).render();
  if (viz._sceneRepaintRAF != null) {
    cancelAnimationFrame(viz._sceneRepaintRAF);
    viz._sceneRepaintRAF = undefined;
  }
  if (viz._sceneRenderer && typeof viz._sceneRenderer.destroy === "function") {
    viz._sceneRenderer.destroy();
    viz._sceneRenderer = undefined;
  }
  viz._select.selectAll("g.data-table").remove();
}

/**
    Redraws an unloaded chart without an entrance animation.
    @private
*/
export function vizReload(viz: Viz): void {
  if (!viz._unloaded) return;
  viz._unloaded = false;
  viz._instantNextDraw = true;
  viz._forceVisible = true;
  viz.render();
}

/**
    Installs (or removes) the persistent observer that unloads the chart when it
    leaves the viewport and reloads it on return. Idempotent.
    @private
*/
export function syncUnloadObserver(viz: Viz): void {
  const want =
    viz.schema.detectVisible &&
    viz.schema.detectVisibleUnload &&
    canObserveVisibility();
  if (!want) {
    viz._unloadUnobserve?.();
    viz._unloadUnobserve = undefined;
    return;
  }
  if (viz._unloadUnobserve) return;
  viz._unloadUnobserve = observeVisibility(
    viz._select.node(),
    viz.schema.scrollContainer,
    () => vizReload(viz),
    0,
    () => vizUnload(viz),
  );
}
