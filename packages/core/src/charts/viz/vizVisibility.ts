import {select} from "d3-selection";

interface Entry {
  callbacks: Map<Element, () => void>;
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
    shared by every viz using that root. Returns a function that stops observing.
    @private
*/
export function observeVisibility(
  el: Element,
  scrollContainer: unknown,
  onVisible: () => void,
): () => void {
  const root = resolveRoot(scrollContainer);
  const key = root || WINDOW_ROOT;
  let entry = entries.get(key);
  if (!entry) {
    const map = new Map<Element, () => void>();
    const io = new IntersectionObserver(
      changes => {
        changes.forEach(c => {
          if (c.isIntersecting) map.get(c.target)?.();
        });
      },
      {root, rootMargin: ROOT_MARGIN},
    );
    entry = {callbacks: map, io};
    entries.set(key, entry);
  }
  const {callbacks: map, io} = entry;
  map.set(el, onVisible);
  io.observe(el);
  return () => {
    map.delete(el);
    io.unobserve(el);
  };
}
