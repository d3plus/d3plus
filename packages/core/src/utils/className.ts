/**
    The user's `className` config: CSS classes added to the outermost element
    a chart or component draws into, next to its fixed d3plus classes, so page
    CSS can target one chart.
*/

/** The fixed classes of a scene renderer's drawing surfaces. */
export const RENDERER_CLASSES = ["d3plus-render-svg", "d3plus-render-canvas"];

/** A scene renderer, as far as `className` reads it. */
export interface ElementsSource {
  elements?(): Element[];
}

/**
    A scene renderer's drawing surface (its `<svg>` or `<canvas>`), leaving out
    the HTML overlay layer it stacks over the drawing, where page CSS such as
    a background would hide the chart.
    @param renderer The scene renderer, once mounted.
    @private
*/
export function rendererSurfaces(renderer: ElementsSource | undefined) {
  return (renderer?.elements?.() ?? []).filter(
    el => el.localName === "svg" || el.localName === "canvas",
  );
}

/** The user classes last added to each element, so a new value can replace them. */
const applied = new WeakMap<Element, string[]>();

/**
    The distinct class names in a `className` value. A string is split on
    whitespace, an array's entries are split the same way, and anything else
    gives none.
    @param value The config value.
    @private
*/
export function classNames(value: unknown): string[] {
  const list = Array.isArray(value) ? value : [value];
  const names = list.flatMap(v =>
    typeof v === "string" ? v.split(/\s+/).filter(Boolean) : [],
  );
  return Array.from(new Set(names));
}

/**
    Adds `value`'s classes to `el`, first removing the classes an earlier call
    added that `value` no longer has. Classes the element has for any other
    reason (its fixed d3plus classes) are left alone, unless an earlier call
    added them.
    @param el The element.
    @param value The `className` config value.
    @param keep Classes never to remove (the element's fixed classes).
    @private
*/
export function setUserClasses(
  el: Element,
  value: unknown,
  keep: string[] = [],
): void {
  const next = classNames(value);
  for (const name of applied.get(el) ?? [])
    if (!next.includes(name) && !keep.includes(name)) el.classList.remove(name);
  for (const name of next) el.classList.add(name);
  applied.set(el, next);
}

/** An instance whose `className` applies to elements it reports. */
export interface ClassNameHost {
  schema: {className?: unknown};
  _classNameTargets(): {el: Element; keep?: string[]}[];
}

/**
    Applies an instance's `className` to every element it currently draws
    into. Before the first render there are none, and the classes are added
    when it renders.
    @param host The chart or component.
    @private
*/
export function applyClassName(host: ClassNameHost): void {
  for (const {el, keep} of host._classNameTargets())
    setUserClasses(el, host.schema.className, keep);
}

const escapeAttr = (v: string): string =>
  v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/**
    SVG markup with `value`'s classes added to its root element, so a saved or
    server-rendered chart keeps the classes its page element has.
    @param markup Markup whose first tag is the root element.
    @param value The `className` config value.
    @private
*/
export function withRootClasses(markup: string, value: unknown): string {
  const names = classNames(value);
  const open = /^\s*<[a-zA-Z][^\s>/]*/.exec(markup);
  if (!names.length || !open) return markup;
  const end = markup.indexOf(">", open[0].length);
  const tag = markup.slice(0, end < 0 ? markup.length : end);
  const existing = /\sclass="([^"]*)"/.exec(tag);
  if (!existing)
    return `${open[0]} class="${escapeAttr(names.join(" "))}"${markup.slice(open[0].length)}`;
  const current = existing[1].split(/\s+/).filter(Boolean);
  const merged = [...current, ...names.filter(n => !current.includes(n))];
  const at = existing.index;
  return `${markup.slice(0, at)} class="${escapeAttr(merged.join(" "))}"${markup.slice(at + existing[0].length)}`;
}
