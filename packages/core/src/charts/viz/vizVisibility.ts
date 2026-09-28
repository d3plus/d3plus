import {select} from "d3-selection";

interface Target {
  delay: number;
  onVisible: () => void;
  timer?: ReturnType<typeof setTimeout>;
}

interface Entry {
  targets: Map<Element, Target>;
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
    view cancels the pending call. Returns a function that stops observing.
    @private
*/
export function observeVisibility(
  el: Element,
  scrollContainer: unknown,
  onVisible: () => void,
  delay = 0,
): () => void {
  const root = resolveRoot(scrollContainer);
  const key = root || WINDOW_ROOT;
  let entry = entries.get(key);
  if (!entry) {
    const map = new Map<Element, Target>();
    const io = new IntersectionObserver(
      changes => {
        changes.forEach(c => {
          const t = map.get(c.target);
          if (!t) return;
          clearTimeout(t.timer);
          t.timer = undefined;
          if (!c.isIntersecting) return;
          if (t.delay > 0) t.timer = setTimeout(t.onVisible, t.delay);
          else t.onVisible();
        });
      },
      {root, rootMargin: ROOT_MARGIN},
    );
    entry = {targets: map, io};
    entries.set(key, entry);
  }
  const {targets: map, io} = entry;
  const target: Target = {delay, onVisible};
  map.set(el, target);
  io.observe(el);
  return () => {
    clearTimeout(target.timer);
    map.delete(el);
    io.unobserve(el);
  };
}
