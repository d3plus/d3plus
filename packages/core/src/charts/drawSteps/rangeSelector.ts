/**
    A Plot's range selector (`rangeSelector`): buttons in the top-left
    controls (`topLeftControls.ts`) that zoom a time axis to the last month,
    six months, year to date, and so on, or back out to the whole span.

    A button zooms like any other zoom (the transform goes through `zoomTo`),
    so the wheel, a drag, the zoom buttons, and the minimap all carry on from
    the window it shows, and a button reads as pressed whenever the chart
    shows its window, however it got there. A button whose window would take
    in all the data (a "1Y" on four months of data) is disabled, since it
    would show the same as "All".

    @module
*/
import {plotAxisUtc} from "../Plot/plotRangeBreaks.js";
import {rangeSelectorAxis} from "../Plot/zoomAxes.js";
import {
  dataWindow,
  liveTransform,
  windowTransform,
} from "../Plot/zoomWindow.js";
import type Viz from "../viz/Viz.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  controlButtonStyles,
  escapeHtml,
  paintControlButton,
  type ControlButtonStyles,
} from "./controlButtonStyle.js";
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
import {effectiveDuration} from "../viz/reducedMotion.js";

/** A range selector's axis and its buttons, when it shows. */
interface RangeSelectorState {
  axis: "x" | "y";
  buttons: RangeButton[];
}

/** The chart's range selector, or null when it doesn't show (see `rangeSelectorAxis`). */
function rangeSelectorState(viz: Viz): RangeSelectorState | null {
  if (viz.schema.facet) return null;
  const axis = rangeSelectorAxis(viz as unknown as VizInstance);
  if (!axis) return null;
  const buttons = rangeButtons(viz.schema.rangeSelector);
  return buttons.length ? {axis, buttons} : null;
}

const utcAxis = (viz: Viz, axis: "x" | "y"): boolean =>
  plotAxisUtc(viz as never, axis);

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
    The index of the button whose window the chart shows, or -1. "All" is
    pressed at the natural view.
    @param viz The chart.
*/
export function activeRangeButton(viz: Viz): number {
  const state = rangeSelectorState(viz);
  if (!state) return -1;
  const live = liveTransform(viz);
  return state.buttons.findIndex(button => {
    if (button.step === "all") return live.k === 1;
    const t = rangeTransform(viz, state.axis, button);
    return Boolean(t && t.k > 1 && sameView(t, live, state.axis));
  });
}

/**
    Zooms the chart to a button's window, as a click on it does.
    @param viz The chart.
    @param index The button's index.
*/
export function selectRange(viz: Viz, index: number): void {
  const state = rangeSelectorState(viz);
  const button = state?.buttons[index];
  if (!state || !button) return;
  const t = rangeTransform(viz, state.axis, button);
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
  const extent = viz._plotZoomBase ? dataWindow(viz, state.axis) : undefined;
  const utc = utcAxis(viz, state.axis);
  const extraClass = viz.schema.rangeSelectorClassName
    ? ` ${escapeHtml(viz.schema.rangeSelectorClassName)}`
    : "";
  const buttons = state.buttons.map((button, i) => {
    const disabled =
      button.step !== "all" && extent && coversAll(button, extent, utc);
    return `<button type="button" class="d3plus-range-button${extraClass}" data-range="${i}" aria-pressed="false" aria-label="${escapeHtml(rangeAriaLabel(button, translate))}"${disabled ? " disabled" : ""}>${escapeHtml(rangeLabel(button, translate))}</button>`;
  });
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

/** Paints a button's style for its state; a disabled one fades. */
function paintRangeButton(
  viz: Viz,
  btn: HTMLButtonElement,
  hovered: boolean,
): void {
  paintControlButton(
    btn,
    buttonStyles(viz),
    hovered && !btn.disabled,
    btn.classList.contains("active"),
  );
  if (btn.disabled) btn.style.setProperty("opacity", "0.4");
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
          if (btn && !btn.disabled) selectRange(viz, Number(btn.dataset.range));
        },
      },
    },
    onUpdate: (host: HTMLElement) => bindRangeButtons(viz, host),
  };
}
