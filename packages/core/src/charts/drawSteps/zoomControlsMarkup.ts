/**
    Markup, styling, and measurement for the zoom-control button panel —
    shared by the zoom feature (which renders and wires the panel) and the
    top-positioned layout features (title, subtitle, total, legend), which
    measure the panel so their content can leave room for it.

    @module
*/

import type Viz from "../viz/Viz.js";
import {
  saveControlMenuItemStyleDefault,
  saveControlMenuStyleDefault,
  zoomControlStyleActiveDefault,
  zoomControlStyleDefault,
  zoomControlStyleHoverDefault,
} from "../viz/vizDefaults.js";
import {
  controlButtonStyles,
  escapeHtml,
  kebab,
  paintControlButton,
  type ControlButtonStyles,
} from "./controlButtonStyle.js";
export {kebab};

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

/**
    Resets the select tool a drag uses to `selectMode` whenever `selectMode`
    changes, so the config sets the tool a chart starts with and the
    toolbar buttons switch it from there.
*/
export function syncSelectTool(
  viz: Pick<Viz, "schema"> &
    Partial<Pick<Viz, "_selectTool" | "_selectModeSeen">>,
): void {
  const mode = viz.schema.selectMode || false;
  if (mode === viz._selectModeSeen) return;
  viz._selectModeSeen = mode;
  viz._selectTool = mode || null;
}

/** The resolved base / active / hover button styles for a chart. */
function buttonStyles(viz: Viz): ControlButtonStyles {
  return controlButtonStyles(viz.schema, "zoomControl", {
    base: zoomControlStyleDefault,
    active: zoomControlStyleActiveDefault,
    hover: zoomControlStyleHoverDefault,
  });
}

/** Paints a zoom-control button's inline style for its current state (base/hover/active) — see `paintControlButton`. */
export function paintZoomButton(
  viz: Viz,
  btn: HTMLElement,
  hovered = false,
): void {
  paintControlButton(
    btn,
    buttonStyles(viz),
    hovered,
    btn.classList.contains("active"),
  );
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
export const ICON_ATTRS =
  'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;vertical-align:middle;flex-shrink:0"';
const ZOOM_IN_ICON = `<svg ${ICON_ATTRS}><line x1="12" y1="4" x2="12" y2="20"/><line x1="4" y1="12" x2="20" y2="12"/></svg>`;
const ZOOM_OUT_ICON = `<svg ${ICON_ATTRS}><line x1="4" y1="12" x2="20" y2="12"/></svg>`;
// A simple house outline — the conventional "reset to home view" icon.
const ZOOM_RESET_ICON = `<svg ${ICON_ATTRS}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
// A dashed square — a "marquee select" icon, reading as "drag a box".
const ZOOM_BRUSH_ICON = `<svg ${ICON_ATTRS} stroke-dasharray="4 3"><rect x="4" y="4" width="16" height="16" rx="1"/></svg>`;
// A dashed box with an arrow pointer at its corner: "pick the marks in a box".
const SELECT_BOX_ICON = `<svg ${ICON_ATTRS}><path stroke-dasharray="3 3" d="M15 4H4v11"/><path d="M11 11l2.5 9 1.8-3.7 3.7-1.8z"/></svg>`;
// A dashed loop with a tail: the conventional lasso.
const SELECT_LASSO_ICON = `<svg ${ICON_ATTRS}><ellipse stroke-dasharray="3 3" cx="12" cy="9.5" rx="8" ry="5.5"/><path d="M7 14c-1.5 1.5-1 4 1.5 5.5"/></svg>`;

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
export type ZoomControlIconKey =
  | "zoomIn"
  | "zoomOut"
  | "zoomReset"
  | "zoomBrush"
  | "selectBox"
  | "selectLasso";
export type ZoomControlIcons = Partial<
  Record<ZoomControlIconKey, ZoomControlIconValue>
>;

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
  const icon = (viz.schema.zoomControlIcons as ZoomControlIcons | undefined)?.[
    key
  ];
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
  selectBox: "select-box",
  selectLasso: "select-lasso",
};

/** How far the zoom buttons sit in from the chart's top and right edges. */
export const ZOOM_PANEL_PADDING = 4;

/**
    The panel's own layout: a right-aligned flex row. Spacing lives here, not
    on the buttons — per-button `margin` doesn't collapse between flex
    siblings, so two adjacent 4px margins would add up to an 8px gap. A
    container `gap` gives exactly one 4px gap between each pair, and
    `padding` (with `box-sizing: border-box`) one 4px inset from the chart's
    top/right edge. This isn't part of the auto-disable `zoomControlClassName`
    triggers, so a host page never has to re-add its own spacing utility.
    The panel spans the chart's width, so it lets the pointer through to
    whatever it covers (a color scale's axis, a title) and only its buttons
    (see `zoomControlsHtml`) take it.
*/
export const ZOOM_PANEL_STYLE: Record<string, string> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "4px",
  boxSizing: "border-box",
  paddingTop: `${ZOOM_PANEL_PADDING}px`,
  paddingRight: `${ZOOM_PANEL_PADDING}px`,
  pointerEvents: "none",
};

/** The width the top-left controls take (see `reserveZoomControlsLeft`). */
let leftReserve: (viz: Viz) => number = () => 0;

/**
    Registers how wide the chart's top-left controls are, which the zoom
    buttons keep clear of on a narrow chart by moving the ones that don't
    fit into the "More Controls" menu. `topLeftControls.ts` registers it: it
    can't be imported here, since the top-left controls' own modules import
    this one.
    @param fn The top-left controls' width for a chart, padding included.
*/
export function reserveZoomControlsLeft(fn: (viz: Viz) => number): void {
  leftReserve = fn;
}

/** One zoom-control button: its icon key, class, label, icon, and pressed state (for a toggle). */
export interface ZoomButtonSpec {
  key: ZoomControlIconKey;
  cls: string;
  label: string;
  icon: string;
  pressed?: boolean;
}

/** The six buttons, in their order: zoom in, zoom out, reset, brush, box select, lasso select. */
export function zoomButtonSpecs(viz: Viz): ZoomButtonSpec[] {
  const spec = (
    key: ZoomControlIconKey,
    label: string,
    builtin: string,
    pressed?: boolean,
  ): ZoomButtonSpec => ({
    key,
    cls: ICON_BUTTON_CLASS[key],
    label,
    icon: iconFor(viz, key, builtin),
    ...(pressed === undefined ? {} : {pressed}),
  });
  return [
    spec("zoomIn", "Zoom In", ZOOM_IN_ICON),
    spec("zoomOut", "Zoom Out", ZOOM_OUT_ICON),
    spec("zoomReset", "Reset Zoom", ZOOM_RESET_ICON),
    spec("zoomBrush", "Brush Zoom", ZOOM_BRUSH_ICON, isBrushing(viz)),
    spec("selectBox", "Box Select", SELECT_BOX_ICON, viz._selectTool === "box"),
    spec(
      "selectLasso",
      "Lasso Select",
      SELECT_LASSO_ICON,
      viz._selectTool === "lasso",
    ),
  ];
}

/** The `zoomControlClassName` a chart layers onto its buttons, with a leading space. */
function extraClass(viz: Viz): string {
  return viz.schema.zoomControlClassName
    ? ` ${viz.schema.zoomControlClassName}`
    : "";
}

/** One button's markup (see `zoomControlsHtml`). */
function buttonHtml(viz: Viz, spec: ZoomButtonSpec): string {
  const {cls, label, icon, pressed} = spec;
  return `<button type="button" style="pointer-events:auto" class="zoom-control ${cls}${pressed ? " active" : ""}${extraClass(viz)}" aria-label="${viz.schema.translate(label)}"${pressed === undefined ? "" : ` aria-pressed="${pressed}"`}>${icon}</button>`;
}

/** The "More Controls" button's icon: three dots in a row. */
export const ZOOM_MORE_ICON = `<svg ${ICON_ATTRS}><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>`;

/** The label of the button that opens the menu of buttons that don't fit. */
export const ZOOM_MORE_LABEL = "More Controls";

/**
    The "More Controls" button: it shows the icon of `active` (a tool that
    is on while its button sits in the menu), and otherwise three dots.
*/
function moreButtonHtml(viz: Viz, active?: ZoomButtonSpec): string {
  const label = escapeHtml(viz.schema.translate(ZOOM_MORE_LABEL));
  return `<button type="button" style="pointer-events:auto" class="zoom-control zoom-more${active ? " active" : ""}${extraClass(viz)}" aria-label="${label}" title="${label}" aria-haspopup="menu" aria-expanded="false" aria-controls="${viz._uuid}-zoom-menu">${active ? active.icon : ZOOM_MORE_ICON}</button>`;
}

/** Inline style text from style objects. */
function styleText(...styles: Record<string, unknown>[]): string {
  return styles
    .flatMap(style => Object.entries(style))
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => `${kebab(k)}:${escapeHtml(v)}`)
    .join(";");
}

/** The menu's fixed layout while closed; the menu shows by setting `display: flex`. */
export const ZOOM_MENU_STYLE: Record<string, string> = {
  position: "absolute",
  top: "100%",
  right: "0",
  "z-index": "1",
  display: "none",
  "flex-direction": "column",
  "min-width": "max-content",
};

/** Each menu item's fixed layout: its icon beside its label. */
export const ZOOM_MENU_ITEM_STYLE: Record<string, string> = {
  display: "flex",
  "align-items": "center",
  gap: "6px",
  width: "100%",
  "text-align": "start",
  "white-space": "nowrap",
  cursor: "pointer",
};

/**
    The "More Controls" button and its menu of the buttons that don't fit:
    a column of the same icons, each with its label, styled like the
    download menu. A toggle (brush, box, lasso) is a `menuitemcheckbox`.
*/
function moreHtml(viz: Viz, hidden: ZoomButtonSpec[]): string {
  const t = (text: string): string => escapeHtml(viz.schema.translate(text));
  const itemStyle = styleText(
    saveControlMenuItemStyleDefault,
    ZOOM_MENU_ITEM_STYLE,
  );
  const items = hidden
    .map(({cls, label, icon, pressed}) => {
      const role = pressed === undefined ? "menuitem" : "menuitemcheckbox";
      const checked = pressed === undefined ? "" : ` aria-checked="${pressed}"`;
      return `<button type="button" role="${role}" tabindex="-1" class="zoom-menu-item ${cls}${pressed ? " active" : ""}"${checked} style="${itemStyle}">${icon}<span class="zoom-menu-label">${t(label)}</span></button>`;
    })
    .join("");
  return (
    `<span class="zoom-more-root" style="position:relative;display:inline-flex;align-items:center;pointer-events:auto">` +
    moreButtonHtml(
      viz,
      hidden.find(spec => spec.pressed),
    ) +
    `<span class="d3plus-zoom-menu" id="${viz._uuid}-zoom-menu" role="menu" aria-label="${t(ZOOM_MORE_LABEL)}" style="${styleText(saveControlMenuStyleDefault, ZOOM_MENU_STYLE)}">${items}</span></span>`
  );
}

/**
    The panel's markup: as many of the six buttons as fit beside the
    top-left controls (`visible`, see `zoomControlsBox`), in order, and the
    rest in a "More Controls" menu. Real <button>s (not <div>s) so a host
    page's own button styling (Tailwind, Bootstrap, a design system's global
    `button` reset) applies through the cascade once a
    `zoomControlClassName` auto-disables the inline defaults.
    `zoomControlClassName` layers a consumer's own class onto each button
    without losing the fixed classes event delegation depends on. A toggle
    (brush, box, lasso) carries `aria-pressed` (and the `.active` class
    frameworks like Bootstrap style) while it is on. Each button takes the
    pointer back from the panel (`ZOOM_PANEL_STYLE`).
    @param viz The chart.
    @param visible How many buttons show before the menu; all of them by default.
*/
export function zoomControlsHtml(
  viz: Viz,
  visible: number = zoomControlsBox(viz)?.visible ?? 6,
): string {
  const specs = zoomButtonSpecs(viz);
  const hidden = specs.slice(visible);
  return (
    specs
      .slice(0, visible)
      .map(spec => buttonHtml(viz, spec))
      .join("") + (hidden.length ? moreHtml(viz, hidden) : "")
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
  const key = (Object.keys(ICON_BUTTON_CLASS) as ZoomControlIconKey[]).find(k =>
    btn.classList.contains(ICON_BUTTON_CLASS[k]),
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
export function overlayHost(viz: Viz): HTMLElement | null {
  let host =
    viz._select && viz._select.node() ? viz._select.node().parentNode : null;
  while (host && !(host instanceof HTMLElement)) host = host.parentNode;
  return host instanceof HTMLElement ? host : null;
}

/**
    Reflects the brush mode onto the brush toggle button (its `.active`
    class, `aria-pressed`, and active style) when the mode changes without
    a click on the button itself — e.g. leaving brush mode after a selection.
*/
export function syncBrushButton(viz: Viz): void {
  syncToggle(viz, "zoom-brush", isBrushing(viz));
  syncMoreButton(viz);
}

/** Reflects the select tool onto the box and lasso select buttons, as `syncBrushButton` does for brush mode. */
export function syncSelectButtons(viz: Viz): void {
  syncToggle(viz, "select-box", viz._selectTool === "box");
  syncToggle(viz, "select-lasso", viz._selectTool === "lasso");
  syncMoreButton(viz);
}

/**
    Shows the icon of a tool that is on while its button sits in the "More
    Controls" menu on that menu's button (pressed), or three dots.
*/
export function syncMoreButton(viz: Viz): void {
  const host = overlayHost(viz);
  const btn = host?.querySelector<HTMLElement>(
    ".d3plus-zoom-control .zoom-more",
  );
  if (!host || !btn) return;
  const active = host.querySelector<HTMLElement>(
    ".d3plus-zoom-menu .zoom-menu-item.active",
  );
  btn.innerHTML = active
    ? [...active.childNodes]
        .filter(
          n =>
            !(n instanceof Element && n.classList.contains("zoom-menu-label")),
        )
        .map(n => (n instanceof Element ? n.outerHTML : n.textContent))
        .join("")
    : ZOOM_MORE_ICON;
  btn.classList.toggle("active", Boolean(active));
  paintZoomButton(viz, btn, btn.matches(":hover"));
}

/** Sets a toggle's `.active` class and `aria-pressed` (or a menu item's `aria-checked`), and its style. */
function syncToggle(viz: Viz, cls: string, pressed: boolean): void {
  overlayHost(viz)
    ?.querySelectorAll<HTMLElement>(`.d3plus-zoom-control .${cls}`)
    .forEach(el => {
      el.classList.toggle("active", pressed);
      if (el.classList.contains("zoom-menu-item")) {
        el.setAttribute("aria-checked", String(pressed));
        return;
      }
      el.setAttribute("aria-pressed", String(pressed));
      paintZoomButton(viz, el, el.matches(":hover"));
    });
}

/** Whether a chart shows the zoom-control panel: it zooms, and `zoomControls` isn't false. */
export function showsZoomControls(viz: Viz): boolean {
  return (
    Boolean(viz.schema.zoom) && viz.schema.zoomControls !== false && !viz._ssr
  );
}

/**
    The zoom-control panel's measured size (padding included); how many of
    its six buttons show before the "More Controls" menu takes the rest; and
    the width of its four zoom buttons alone (zoom in, zoom out, reset,
    brush), which the minimap matches.
*/
export interface ZoomControlsBox {
  width: number;
  height: number;
  visible: number;
  zoomWidth: number;
}

/** Panel size before it has been measured (the default 20px buttons). */
const ESTIMATED_BOX: ZoomControlsBox = {
  width: 6 * 20 + 5 * 4 + ZOOM_PANEL_PADDING,
  height: 20 + ZOOM_PANEL_PADDING,
  visible: 6,
  zoomWidth: 4 * 20 + 3 * 4 + ZOOM_PANEL_PADDING,
};

/** A measured panel: its buttons' widths, the "More Controls" button's, and its spacing. */
export interface ZoomPanelMetrics {
  widths: number[];
  more: number;
  gap: number;
  padLeft: number;
  padRight: number;
  height: number;
}

/**
    Lays the panel out in `available` pixels: every button when they all
    fit, else as many as fit (in order) beside the "More Controls" button,
    which takes the rest. Returns the panel's size and how many buttons show.
    @param m The measured panel (see `ZoomPanelMetrics`).
    @param available The room from the chart's right edge to the top-left controls.
*/
export function fitZoomPanel(
  m: ZoomPanelMetrics,
  available: number,
): ZoomControlsBox {
  const run = (k: number): number =>
    m.widths.slice(0, k).reduce((sum, w) => sum + w, 0) +
    Math.max(0, k - 1) * m.gap;
  const zoomWidth = Math.ceil(run(4) + m.padRight);
  const box = (width: number, visible: number): ZoomControlsBox => ({
    width: Math.ceil(width),
    height: Math.ceil(m.height),
    visible,
    zoomWidth,
  });
  const all = m.widths.length;
  const full = m.padLeft + run(all) + m.padRight;
  if (full <= available) return box(full, all);
  for (let k = all - 1; k > 0; k--) {
    const width = m.padLeft + run(k) + m.gap + m.more + m.padRight;
    if (width <= available) return box(width, k);
  }
  return box(m.padLeft + m.more + m.padRight, 0);
}

/**
    The zoom-control panel's size (padding included) as it will render in the
    chart's page, so top-positioned content can leave room for it, and how
    many buttons fit beside the top-left controls (see `fitZoomPanel`).
    Measured by mounting a hidden copy of every button beside the chart — the
    buttons' size depends on the host page's CSS (a `zoomControlClassName`, a
    global `button` reset) — and cached until the markup, styling, or room
    changes. Returns null when the chart shows no controls.
*/
export function zoomControlsBox(viz: Viz): ZoomControlsBox | null {
  if (!showsZoomControls(viz)) return null;
  const html =
    zoomButtonSpecs(viz)
      .map(spec => buttonHtml(viz, spec))
      .join("") + moreButtonHtml(viz);
  const {base} = buttonStyles(viz);
  const reserve = leftReserve(viz);
  const width = viz.schema.width;
  const signature = `${html}|${JSON.stringify(base)}|${reserve}|${width}`;
  const cached = viz._zoomControlsBox;
  if (cached && cached.signature === signature) return cached;

  let box = ESTIMATED_BOX;
  const host = overlayHost(viz);
  if (host) {
    const probe = document.createElement("div");
    probe.className = "d3plus-zoom-control";
    for (const key in ZOOM_PANEL_STYLE)
      probe.style.setProperty(kebab(key), ZOOM_PANEL_STYLE[key]);
    // Shrink-wrapped and invisible, so it measures without affecting layout.
    probe.style.setProperty("display", "inline-flex");
    probe.style.setProperty("position", "absolute");
    probe.style.setProperty("visibility", "hidden");
    probe.style.setProperty("pointer-events", "none");
    probe.innerHTML = html;
    const buttons = [...probe.querySelectorAll<HTMLElement>(".zoom-control")];
    buttons.forEach(btn => paintZoomButton(viz, btn));
    host.appendChild(probe);
    const rect = probe.getBoundingClientRect();
    const rects = buttons.map(btn => btn.getBoundingClientRect());
    host.removeChild(probe);
    const more = rects.pop();
    if (more && rects.length > 1 && rect.width && rect.height) {
      const available = width
        ? width - (reserve ? reserve + ZOOM_PANEL_PADDING : 0)
        : Infinity;
      box = fitZoomPanel(
        {
          widths: rects.map(r => r.width),
          more: more.width,
          gap: rects[1].left - rects[0].right,
          padLeft: rects[0].left - rect.left,
          padRight: rect.right - more.right,
          height: rect.height,
        },
        available,
      );
    }
  }
  viz._zoomControlsBox = {...box, signature};
  return viz._zoomControlsBox;
}

/**
    The box the minimap hangs beneath: as wide as the zoom-control panel's
    four zoom buttons (it sits flush with the panel's right edge) and as tall
    as the panel, or, with the buttons hidden (`zoomControls: false`), a
    strip as wide as the default zoom buttons down to the chart area's top, so the minimap overlays the chart
    area rather than the title and other top content that take the
    buttons' room. Null when the chart doesn't zoom.
*/
export function minimapAnchor(
  viz: Viz,
): {width: number; height: number} | null {
  const box = zoomControlsBox(viz);
  if (box) return {width: box.zoomWidth, height: box.height};
  return viz.schema.zoom && !viz._ssr
    ? {width: ESTIMATED_BOX.zoomWidth, height: viz._margin?.top ?? 0}
    : null;
}

/**
    How far down the chart content must start to clear the zoom buttons
    with the same gap below them as above: the panel's height (its top
    padding included) plus that padding again. Zero when the chart shows no
    controls.
*/
export function zoomControlsReach(viz: Viz): number {
  const box = zoomControlsBox(viz);
  return box && box.height ? box.height + ZOOM_PANEL_PADDING : 0;
}
