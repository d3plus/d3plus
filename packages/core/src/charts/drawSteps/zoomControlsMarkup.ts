/**
    Markup, styling, and measurement for the zoom-control button panel —
    shared by the zoom feature (which renders and wires the panel) and the
    top-positioned layout features (title, subtitle, total, legend), which
    measure the panel so their content can leave room for it.

    @module
*/

import type Viz from "../viz/Viz.js";
import {
  zoomControlStyleActiveDefault,
  zoomControlStyleDefault,
  zoomControlStyleHoverDefault,
} from "../viz/vizDefaults.js";

/**
    Brush mode is per-chart, not global: it lives on `viz._brushing` and is
    read/written via these helpers.
*/
export function isBrushing(viz: Viz): boolean {
  return Boolean(viz._brushing);
}
export function setBrushing(viz: Viz, value: boolean): void {
  viz._brushing = value;
}

type StyleObject = Record<string, string | number | undefined | null | false>;
type ZoomControlStyleValue = StyleObject | false | null | undefined;

/** `alignItems` / `align-items` → `align-items`, for `style.setProperty`. */
const kebab = (key: string): string => key.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);

/**
    Fallbacks for CSS system colors a browser may not support yet: the
    active-button default uses the OS accent color (Firefox, Safari), and
    Chromium falls back to the text-selection highlight.
*/
const SYSTEM_COLOR_FALLBACKS: Record<string, string> = {
  AccentColor: "Highlight",
  AccentColorText: "HighlightText",
};

/** Sets one style property, swapping an unsupported system color for its fallback. */
function setStyle(el: HTMLElement, key: string, value: string): void {
  const prop = kebab(key);
  el.style.setProperty(prop, value);
  const fallback = SYSTEM_COLOR_FALLBACKS[value];
  if (fallback && !el.style.getPropertyValue(prop)) el.style.setProperty(prop, fallback);
}

/**
    Resolves a `zoomControlStyle`/`Active`/`Hover` value for painting.
    Setting `zoomControlClassName` auto-disables whichever of the three is
    still the untouched built-in default (identified by reference — see
    `zoomControlStyleDefault` et al. in `vizDefaults.ts`) so a host page's own
    button styling can apply through the cascade without also requiring
    `.zoomControlStyle(false)` etc. An explicit custom style object (a
    different reference) always wins, className or not.
*/
function resolveZoomControlStyle(
  viz: Viz,
  value: ZoomControlStyleValue,
  defaultValue: ZoomControlStyleValue,
): StyleObject {
  if (viz.schema.zoomControlClassName && value === defaultValue) return {};
  return value || {};
}

/** The resolved base / active / hover button styles for a chart. */
function buttonStyles(viz: Viz): {base: StyleObject; active: StyleObject; hover: StyleObject} {
  return {
    base: resolveZoomControlStyle(viz, viz.schema.zoomControlStyle, zoomControlStyleDefault),
    active: resolveZoomControlStyle(viz, viz.schema.zoomControlStyleActive, zoomControlStyleActiveDefault),
    hover: resolveZoomControlStyle(viz, viz.schema.zoomControlStyleHover, zoomControlStyleHoverDefault),
  };
}

/**
    Paints a zoom-control button's inline style for its current state: the
    base style, then the hover style while hovered, then the active style
    while its mode is on (so an active button reads as active even under the
    cursor). Every property any of the three styles sets is cleared first, so
    leaving a state fully undoes it.
*/
export function paintZoomButton(viz: Viz, btn: HTMLElement, hovered = false): void {
  const {base, active, hover} = buttonStyles(viz);
  const isActive = btn.classList.contains("active");
  for (const key of new Set([...Object.keys(base), ...Object.keys(active), ...Object.keys(hover)]))
    btn.style.removeProperty(kebab(key));
  for (const style of [base, hovered ? hover : {}, isActive ? active : {}])
    for (const key in style) {
      const v = style[key];
      if (v !== undefined && v !== null && v !== false) setStyle(btn, key, String(v));
    }
}

/**
    Shared attributes for the four icon `<svg>`s below: one `viewBox`, one
    `stroke-width`, `currentColor` for the stroke (so the icon still follows
    `color` from `zoomControlStyle`/a host page's CSS, same as the glyph
    characters this replaced). Sizing and `vertical-align: middle` live in
    the `style` attribute rather than as `width`/`height` SVG attributes —
    plenty of CSS resets (Bulma's base stylesheet, for one) include a plain
    `svg { width: auto; height: auto }` rule, and *any* CSS declaration beats
    a presentation attribute. An SVG with only a `viewBox` and no definite
    CSS size can collapse to 0×0 inside a flex layout, which is exactly what
    happened here — an inline `style` has enough specificity that no host
    page's element-selector reset can strip it back out. `vertical-align:
    middle` matters because an inline `svg` defaults to `vertical-align:
    baseline` like text, which sits it a couple pixels off-center inside a
    host page's own button styling (Bootstrap/Tailwind/Bulma center *text*
    via their own line-height/padding, not a replaced element's baseline).
    `zoomControlClassName` intentionally drops our own `align-items`/
    `justify-content` centering so it doesn't fight a framework's layout —
    `vertical-align: middle` is what keeps the icon itself centered
    regardless of whose CSS is doing the centering. `flex-shrink: 0` guards
    against a different failure mode: if a host framework's own button
    (Bulma's `.button`, for one) is itself `display: flex` with padding wide
    enough to leave less than 12px of content room, the icon — a flex item
    of that button — would otherwise shrink to fit, quietly distorting it
    into a non-square sliver instead of keeping its aspect ratio.

    Text-glyph icons (`+`, `−`, a Unicode home/square symbol, …) come from
    different font fallback chains, and browsers apply synthetic bold to
    each inconsistently — no single font reliably bolds all of them to the
    same visual stroke thickness across OSes. Vector paths sidestep that
    entirely: every icon renders at the exact same stroke weight regardless
    of the visitor's font/OS/browser (and all four share the same 4–20
    bounding box within the 24x24 viewBox, so they also match in apparent
    size) — this is how icon sets like Feather/Lucide/Material Symbols do it.
*/
const ICON_ATTRS = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;vertical-align:middle;flex-shrink:0"';
const ZOOM_IN_ICON = `<svg ${ICON_ATTRS}><line x1="12" y1="4" x2="12" y2="20"/><line x1="4" y1="12" x2="20" y2="12"/></svg>`;
const ZOOM_OUT_ICON = `<svg ${ICON_ATTRS}><line x1="4" y1="12" x2="20" y2="12"/></svg>`;
// A simple house outline — the conventional "reset to home view" icon.
const ZOOM_RESET_ICON = `<svg ${ICON_ATTRS}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
// A dashed square — a "marquee select" icon, reading as "drag a box".
const ZOOM_BRUSH_ICON = `<svg ${ICON_ATTRS} stroke-dasharray="4 3"><rect x="4" y="4" width="16" height="16" rx="1"/></svg>`;

/**
    A custom zoom-control icon: either raw markup (a string — inserted as the
    button's content in place of the built-in `<svg>`, no wrapper) or a mount
    function, the escape hatch for a live component (a React/Vue/Svelte tree,
    a canvas sprite, anything imperative). The function receives the actual
    `<span>` reserved for the icon — sized to match the built-ins, 12x12px —
    once per fresh button element (see `mountCustomIcons` below), and may
    return a cleanup function, called right before that element is discarded
    (the panel's html regenerates wholesale on a brush toggle, a `.locale(...)`
    change, or a `zoomControlClassName` change — see `zoomControlsHtml`'s own
    doc — so a mounted icon is torn down and remounted on those, not just once
    per chart). Omit the return value for icons with nothing to clean up.

    @example
      // Raw markup — a single emoji.
      viz.zoomControlIcons({zoomIn: "➕"})

      // A React tree, mounted imperatively into the reserved slot.
      viz.zoomControlIcons({
        zoomIn: el => {
          const root = createRoot(el);
          root.render(<PlusIcon />);
          return () => root.unmount();
        },
      })
*/
export type ZoomControlIconRenderer = (el: HTMLElement) => void | (() => void);
export type ZoomControlIconValue = string | ZoomControlIconRenderer;
export type ZoomControlIconKey = "zoomIn" | "zoomOut" | "zoomReset" | "zoomBrush";
export type ZoomControlIcons = Partial<Record<ZoomControlIconKey, ZoomControlIconValue>>;

/**
    Markup for a mount-function icon: an empty `<span>` sized like the built-in
    `<svg>`s (so panel measurement — `zoomControlsBox` — stays correct whether
    or not the mount function has run yet; it never invokes the function
    itself, only ever renders this placeholder) and tagged with its icon key
    so `mountCustomIcons` can find it inside the button.
*/
const iconSlot = (key: ZoomControlIconKey): string =>
  `<span class="zoom-control-icon" data-icon="${key}" style="display:inline-block;width:12px;height:12px;vertical-align:middle;flex-shrink:0"></span>`;

/** Resolves one button's glyph markup: a custom override, or the built-in icon. */
function iconFor(viz: Viz, key: ZoomControlIconKey, builtin: string): string {
  const icon = (viz.schema.zoomControlIcons as ZoomControlIcons | undefined)?.[key];
  if (typeof icon === "string") return icon;
  if (typeof icon === "function") return iconSlot(key);
  return builtin;
}

/** Which button class carries which icon key — shared with `mountCustomIcons`. */
const ICON_BUTTON_CLASS: Record<ZoomControlIconKey, string> = {
  zoomIn: "zoom-in",
  zoomOut: "zoom-out",
  zoomReset: "zoom-reset",
  zoomBrush: "zoom-brush",
};

/**
    The panel's own layout: a right-aligned flex row. Spacing lives here, not
    on the buttons — per-button `margin` doesn't collapse between flex
    siblings, so two adjacent 4px margins would add up to an 8px gap. A
    container `gap` gives exactly one 4px gap between each pair, and
    `padding` (with `box-sizing: border-box`) one 4px inset from the chart's
    top/right edge. This isn't part of the auto-disable `zoomControlClassName`
    triggers, so a host page never has to re-add its own spacing utility.
*/
export const ZOOM_PANEL_STYLE: Record<string, string> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "4px",
  boxSizing: "border-box",
  paddingTop: "4px",
  paddingRight: "4px",
};

/**
    The four buttons' markup. Real <button>s (not <div>s) so a host page's own
    button styling (Tailwind, Bootstrap, a design system's global `button`
    reset) applies through the cascade once a `zoomControlClassName`
    auto-disables the inline defaults. `zoomControlClassName` layers a
    consumer's own class onto each button without losing the fixed classes
    event delegation depends on. The brush toggle carries `aria-pressed` (and
    the `.active` class frameworks like Bootstrap style) while brush mode is on.
*/
export function zoomControlsHtml(viz: Viz): string {
  const extraClass = viz.schema.zoomControlClassName ? ` ${viz.schema.zoomControlClassName}` : "";
  const button = (cls: string, label: string, glyph: string, pressed?: boolean) =>
    `<button type="button" class="zoom-control ${cls}${pressed ? " active" : ""}${extraClass}" aria-label="${viz.schema.translate(label)}"${pressed === undefined ? "" : ` aria-pressed="${pressed}"`}>${glyph}</button>`;
  return (
    button("zoom-in", "Zoom In", iconFor(viz, "zoomIn", ZOOM_IN_ICON)) +
    button("zoom-out", "Zoom Out", iconFor(viz, "zoomOut", ZOOM_OUT_ICON)) +
    button("zoom-reset", "Reset Zoom", iconFor(viz, "zoomReset", ZOOM_RESET_ICON)) +
    button("zoom-brush", "Brush Zoom", iconFor(viz, "zoomBrush", ZOOM_BRUSH_ICON), isBrushing(viz))
  );
}

/**
    Mounts each configured custom icon function into its button's reserved
    slot — called once per fresh button element (from the same `onUpdate`
    guard in `zoomControls.ts` that binds hover/style exactly once), so a
    remount only happens when the whole panel's html actually regenerates
    (see `ZoomControlIconRenderer`'s doc for when that is). Runs any PREVIOUS
    mount's cleanup for that icon key first — the prior button element (if
    any) is about to be discarded regardless of whether its content was
    custom-mounted, so this is the one place that teardown can happen.
*/
export function mountCustomIcons(viz: Viz, btn: HTMLElement): void {
  const icons = viz.schema.zoomControlIcons as ZoomControlIcons | undefined;
  if (!icons) return;
  const key = (Object.keys(ICON_BUTTON_CLASS) as ZoomControlIconKey[]).find(
    k => btn.classList.contains(ICON_BUTTON_CLASS[k]),
  );
  const icon = key && icons[key];
  if (!key || typeof icon !== "function") return;
  const slot = btn.querySelector<HTMLElement>(".zoom-control-icon");
  if (!slot) return;
  const cleanups = (viz._zoomIconCleanup ||= {});
  cleanups[key]?.();
  cleanups[key] = icon(slot) || undefined;
}

/** The HTML element a chart's overlays (the zoom controls) mount in. */
function overlayHost(viz: Viz): HTMLElement | null {
  let host = viz._select && viz._select.node() ? viz._select.node().parentNode : null;
  while (host && !(host instanceof HTMLElement)) host = host.parentNode;
  return host instanceof HTMLElement ? host : null;
}

/**
    Reflects the brush mode onto the brush toggle button (its `.active`
    class, `aria-pressed`, and active style) when the mode changes without
    a click on the button itself — e.g. leaving brush mode after a selection.
*/
export function syncBrushButton(viz: Viz): void {
  const btn = overlayHost(viz)?.querySelector<HTMLElement>(".d3plus-zoom-control .zoom-brush");
  if (!btn) return;
  const pressed = isBrushing(viz);
  btn.classList.toggle("active", pressed);
  btn.setAttribute("aria-pressed", String(pressed));
  paintZoomButton(viz, btn, btn.matches(":hover"));
}

/** Whether a chart shows the zoom-control panel. */
export function showsZoomControls(viz: Viz): boolean {
  return Boolean(viz.schema.zoom) && !viz._ssr;
}

/** Panel size before it has been measured (the default 20px buttons). */
const ESTIMATED_BOX = {width: 4 * 20 + 3 * 4 + 4, height: 20 + 4};

/**
    The zoom-control panel's size (padding included) as it will render in the
    chart's page, so top-positioned content can leave room for it. Measured
    by mounting a hidden copy beside the chart — the buttons' size depends on
    the host page's CSS (a `zoomControlClassName`, a global `button` reset) —
    and cached until the markup or styling changes. Returns null when the
    chart shows no controls.
*/
export function zoomControlsBox(viz: Viz): {width: number; height: number} | null {
  if (!showsZoomControls(viz)) return null;
  const html = zoomControlsHtml(viz);
  const {base} = buttonStyles(viz);
  const signature = `${html}|${JSON.stringify(base)}`;
  const cached = viz._zoomControlsBox;
  if (cached && cached.signature === signature) return cached;

  let box = ESTIMATED_BOX;
  const host = overlayHost(viz);
  if (host) {
    const probe = document.createElement("div");
    probe.className = "d3plus-zoom-control";
    for (const key in ZOOM_PANEL_STYLE) probe.style.setProperty(kebab(key), ZOOM_PANEL_STYLE[key]);
    // Shrink-wrapped and invisible, so it measures without affecting layout.
    probe.style.setProperty("display", "inline-flex");
    probe.style.setProperty("position", "absolute");
    probe.style.setProperty("visibility", "hidden");
    probe.style.setProperty("pointer-events", "none");
    probe.innerHTML = html;
    probe.querySelectorAll<HTMLElement>(".zoom-control").forEach(btn => paintZoomButton(viz, btn));
    host.appendChild(probe);
    const rect = probe.getBoundingClientRect();
    host.removeChild(probe);
    if (rect.width && rect.height) box = {width: Math.ceil(rect.width), height: Math.ceil(rect.height)};
  }
  viz._zoomControlsBox = {...box, signature};
  return viz._zoomControlsBox;
}
