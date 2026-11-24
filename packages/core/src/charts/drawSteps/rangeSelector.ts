/**
    A Plot's range selector (`rangeSelector`): buttons in the top-left
    controls (`topLeftControls.ts`) that zoom a time axis to the last month,
    six months, year to date, and so on, or back out to the whole span.

    A button zooms like any other zoom (the transform goes through `zoomTo`),
    so the wheel, a drag, the zoom buttons, and the minimap all carry on from
    the window it shows, and a button reads as pressed whenever the chart
    shows its window, however it got there. A button whose window would take
    in all the data (a "1Y" on four months of data) is hidden, since it
    would show the same as "All"; when only "All" would be left, the whole
    selector hides. Small multiples apply a button to each panel's own data
    (see `Plot/facetZoom.ts`).

    @module
*/
import {facetDataWindow} from "../Plot/facetZoom.js";
import {plotAxisUtc} from "../Plot/plotRangeBreaks.js";
import {rangeSelectorAxis} from "../Plot/zoomAxes.js";
import {
  dataWindow,
  liveTransform,
  windowTransform,
  type ZoomWindow,
} from "../Plot/zoomWindow.js";
import type Viz from "../viz/Viz.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  controlButtonStyles,
  escapeHtml,
  paintControlButton,
  type ControlButtonStyles,
} from "./controlButtonStyle.js";
import {setFacetZoom} from "./facetZoomRedraw.js";
import {
  coversAll,
  rangeAriaLabel,
  rangeButtons,
  rangeLabel,
  rangeSelectorStyleActiveDefault,
  rangeSelectorStyleDefault,
  rangeSelectorStyleHoverDefault,
  rangeWindow,
  type RangeButton,
} from "./rangeSelectorButtons.js";
import type {Contribution} from "./topLeftControlsMarkup.js";
import {clampTransform, zoomTo} from "./zoomControls.js";
import {broadcastWindows} from "./zoomLink.js";
import {effectiveDuration} from "../viz/reducedMotion.js";

/** A button the range selector shows, with its place in `rangeSelector`. */
interface ShownButton {
  button: RangeButton;
  index: number;
}

/** A range selector's axis and the buttons it shows. */
interface RangeSelectorState {
  axis: "x" | "y";
  buttons: ShownButton[];
}

const utcAxis = (viz: Viz, axis: "x" | "y"): boolean =>
  plotAxisUtc(viz as never, axis);

/**
    The extent of the chart's data along the range selector's axis: every
    panel's, in small multiples. Undefined before the chart has drawn it.
    @param viz The chart.
    @param axis The axis.
*/
export function rangeExtent(viz: Viz, axis: "x" | "y"): ZoomWindow | undefined {
  if (viz._facetPanels) return facetDataWindow(viz as never, axis);
  return viz._plotZoomBase ? dataWindow(viz, axis) : undefined;
}

/**
    The buttons a range selector shows: each one whose window falls short
    of the data's whole span, and "All" while any of those show. Every
    button shows before the chart has drawn its data.
    @param buttons The buttons `rangeSelector` asks for.
    @param extent The data's extent along the axis, when known.
    @param utc Whether the axis reads dates in UTC.
*/
export function shownRangeButtons(
  buttons: RangeButton[],
  extent: ZoomWindow | undefined,
  utc = false,
): ShownButton[] {
  const all = buttons.map((button, index) => ({button, index}));
  if (!extent) return all;
  const shown = all.filter(
    ({button}) => button.step === "all" || !coversAll(button, extent, utc),
  );
  return shown.some(({button}) => button.step !== "all") ? shown : [];
}

/** The chart's range selector, or null when it doesn't show (see `rangeSelectorAxis`). */
function rangeSelectorState(viz: Viz): RangeSelectorState | null {
  const axis = rangeSelectorAxis(viz as unknown as VizInstance);
  if (!axis) return null;
  const buttons = shownRangeButtons(
    rangeButtons(viz.schema.rangeSelector),
    rangeExtent(viz, axis),
    utcAxis(viz, axis),
  );
  return buttons.length ? {axis, buttons} : null;
}

/**
    The transform a button zooms to, clamped like a gesture's, or null when
    the chart hasn't drawn its zoomable axes yet. "All" is the identity.
    @param viz The chart.
    @param axis The range selector's axis.
    @param button The button.
*/
export function rangeTransform(
  viz: Viz,
  axis: "x" | "y",
  button: RangeButton,
): {k: number; x: number; y: number} | null {
  if (button.step === "all") return {k: 1, x: 0, y: 0};
  const extent = dataWindow(viz, axis);
  if (!extent || !viz._zoomBehavior) return null;
  const window = rangeWindow(button, extent, utcAxis(viz, axis));
  if (!window) return {k: 1, x: 0, y: 0};
  const t = windowTransform(viz, {[axis]: window});
  return t ? clampTransform(viz, t.k, t.x, t.y) : null;
}

/** Whether two transforms show the same view, to within half a pixel. */
function sameView(
  a: {k: number; x: number; y: number},
  b: {k: number; x: number; y: number},
  axis: "x" | "y",
): boolean {
  return Math.abs(a.k - b.k) <= 1e-6 * a.k && Math.abs(a[axis] - b[axis]) < 0.5;
}

/**
    The `rangeSelector` index of the button whose window the chart shows,
    or -1. "All" is pressed at the natural view; in small multiples, the
    button last pressed until another window replaces it.
    @param viz The chart.
*/
export function activeRangeButton(viz: Viz): number {
  const state = rangeSelectorState(viz);
  if (!state) return -1;
  const all = state.buttons.find(({button}) => button.step === "all");
  if (viz._facetPanels) {
    const zoom = viz._facetZoom;
    if (!zoom) return all ? all.index : -1;
    return zoom.range ? zoom.range.index : -1;
  }
  const live = liveTransform(viz);
  const shown = state.buttons.find(({button}) => {
    if (button.step === "all") return live.k === 1;
    const t = rangeTransform(viz, state.axis, button);
    return Boolean(t && t.k > 1 && sameView(t, live, state.axis));
  });
  return shown ? shown.index : -1;
}

/** Shows a button's window in each panel of small multiples, and in the charts linked with them. */
function selectFacetRange(
  viz: Viz,
  axis: "x" | "y",
  index: number,
  button: RangeButton,
): void {
  const duration = effectiveDuration(viz);
  const live = liveTransform(viz);
  // The window replaces any zoom of the whole picture.
  if (live.k !== 1 || live.x || live.y) zoomTo(viz, 1, 0, 0, 0);
  const vi = viz as unknown as VizInstance;
  if (button.step === "all") {
    setFacetZoom(vi, undefined, duration);
    return broadcastWindows(viz, null, duration);
  }
  const utc = utcAxis(viz, axis);
  setFacetZoom(vi, {range: {axis, index, button, utc}}, duration);
  const extent = rangeExtent(viz, axis);
  const window = extent && rangeWindow(button, extent, utc);
  if (window) broadcastWindows(viz, {[axis]: window}, duration);
}

/**
    Zooms the chart to a button's window, as a click on it does.
    @param viz The chart.
    @param index The button's index in `rangeSelector`.
*/
export function selectRange(viz: Viz, index: number): void {
  const state = rangeSelectorState(viz);
  const shown = state?.buttons.find(b => b.index === index);
  if (!state || !shown) return;
  if (viz._facetPanels)
    return selectFacetRange(viz, state.axis, index, shown.button);
  const t = rangeTransform(viz, state.axis, shown.button);
  if (t) zoomTo(viz, t.k, t.x, t.y, effectiveDuration(viz));
}

/** The resolved base, active, and hover button styles. */
function buttonStyles(viz: Viz): ControlButtonStyles {
  return controlButtonStyles(viz.schema, "rangeSelector", {
    base: rangeSelectorStyleDefault,
    active: rangeSelectorStyleActiveDefault,
    hover: rangeSelectorStyleHoverDefault,
  });
}

/** The range selector's markup: a labelled group of buttons. */
function rangeSelectorHtml(viz: Viz, state: RangeSelectorState): string {
  const translate = viz.schema.translate;
  const extraClass = viz.schema.rangeSelectorClassName
    ? ` ${escapeHtml(viz.schema.rangeSelectorClassName)}`
    : "";
  const buttons = state.buttons.map(
    ({button, index}) =>
      `<button type="button" class="d3plus-range-button${extraClass}" data-range="${index}" aria-pressed="false" aria-label="${escapeHtml(rangeAriaLabel(button, translate))}">${escapeHtml(rangeLabel(button, translate))}</button>`,
  );
  return `<div class="d3plus-range-selector" role="group" aria-label="${escapeHtml(translate("Zoom range"))}" style="display:inline-flex;gap:2px">${buttons.join("")}</div>`;
}

/**
    Marks the button showing the chart's current window as pressed, and
    paints each button's style for its state.
    @param viz The chart.
    @param host The element holding the buttons.
*/
export function syncRangeButtons(viz: Viz, host: ParentNode): void {
  const active = activeRangeButton(viz);
  host
    .querySelectorAll<HTMLButtonElement>(".d3plus-range-button")
    .forEach(btn => {
      const on = Number(btn.dataset.range) === active;
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-pressed", String(on));
      paintRangeButton(viz, btn, btn.dataset.hovered === "1");
    });
}

/** Paints a button's style for its state. */
function paintRangeButton(
  viz: Viz,
  btn: HTMLButtonElement,
  hovered: boolean,
): void {
  paintControlButton(
    btn,
    buttonStyles(viz),
    hovered,
    btn.classList.contains("active"),
  );
}

/** Binds each button's hover styling once. */
function bindRangeButtons(viz: Viz, host: HTMLElement): void {
  host
    .querySelectorAll<HTMLButtonElement>(".d3plus-range-button")
    .forEach(btn => {
      if (btn.dataset.rangeBound) return;
      btn.dataset.rangeBound = "1";
      btn.addEventListener("mouseenter", () => {
        btn.dataset.hovered = "1";
        paintRangeButton(viz, btn, true);
      });
      btn.addEventListener("mouseleave", () => {
        delete btn.dataset.hovered;
        paintRangeButton(viz, btn, false);
      });
    });
  syncRangeButtons(viz, host);
}

/** The range selector's piece of the top-left controls, or null when it doesn't show. */
export function rangeSelectorContribution(viz: Viz): Contribution | null {
  const state = rangeSelectorState(viz);
  if (!state) return null;
  return {
    key: "range-selector",
    html: rangeSelectorHtml(viz, state),
    styleSignature: JSON.stringify(buttonStyles(viz)),
    events: {
      ".d3plus-range-button": {
        click: (e: Event) => {
          const btn = (e.target as Element | null)?.closest<HTMLButtonElement>(
            ".d3plus-range-button",
          );
          if (btn) selectRange(viz, Number(btn.dataset.range));
        },
      },
    },
    onUpdate: (host: HTMLElement) => bindRangeButtons(viz, host),
  };
}
