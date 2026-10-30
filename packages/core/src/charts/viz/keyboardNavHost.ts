/**
    The focusable element keyboard navigation listens on: one per chart,
    beside its root svg (outside that svg's `aria-hidden` subtree), holding
    the navigation instructions and the live region that announces the
    focused mark.

    @module
*/

import type {VizInstance} from "./vizTypes.js";

/** The host's elements. */
export interface KeyboardNavHost {
  /** The focusable element, laid over the chart without taking pointer events. */
  host: HTMLDivElement;
  /** Visually hidden instructions, referenced by the host's `aria-describedby`. */
  desc: HTMLSpanElement;
  /** Visually hidden `aria-live` region announcing the focused mark. */
  live: HTMLSpanElement;
}

/** The instructions read when the chart gains focus. */
export const KEYBOARD_NAV_INSTRUCTIONS =
  "Use arrow keys to move between data points, Enter to select, and Escape to exit.";

/** Hides an element from sight while leaving it in the accessibility tree. */
const VISUALLY_HIDDEN: Record<string, string> = {
  position: "absolute",
  width: "1px",
  height: "1px",
  margin: "-1px",
  padding: "0",
  border: "0",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
};

/** The text of an HTML string, tags removed and whitespace collapsed. */
export function plainText(html: unknown): string {
  return String(html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
    The chart's accessible name: its `svgTitle`, else its `title` text, else
    the translated word "Chart".
*/
export function chartName(viz: Pick<VizInstance, "schema">): string {
  const {schema} = viz;
  const svgTitle = plainText(schema.svgTitle);
  if (svgTitle) return svgTitle;
  if (typeof schema.title === "function") {
    try {
      const title = plainText(
        schema.title((viz as VizInstance)._filteredData || []),
      );
      if (title) return title;
    } catch {
      // A title accessor that needs data the chart has not loaded names nothing.
    }
  }
  return schema.translate("Chart");
}

/**
    Creates the host inside `parent`: a `tabindex="0"`, `role="application"`
    element laid over the chart, with its instructions and live region.
*/
export function createKeyboardNavHost(
  parent: HTMLElement,
  uuid: string,
): KeyboardNavHost {
  const doc = parent.ownerDocument;
  const host = doc.createElement("div");
  host.className = "d3plus-keyboard-nav";
  host.setAttribute("tabindex", "0");
  host.setAttribute("role", "application");
  Object.assign(host.style, {
    position: "absolute",
    pointerEvents: "none",
    outline: "none",
  });
  const desc = doc.createElement("span");
  desc.id = `${uuid}-keyboard-desc`;
  const live = doc.createElement("span");
  live.setAttribute("aria-live", "polite");
  live.setAttribute("aria-atomic", "true");
  for (const el of [desc, live]) {
    Object.assign(el.style, VISUALLY_HIDDEN);
    host.appendChild(el);
  }
  parent.appendChild(host);
  return {host, desc, live};
}

/**
    Refreshes the host's name, description, and box from the chart's current
    config and size, laying it over the chart's root svg.
*/
export function updateKeyboardNavHost(
  viz: VizInstance,
  {host, desc}: KeyboardNavHost,
): void {
  const t = (s: string): string => viz.schema.translate(s);
  host.setAttribute("aria-label", chartName(viz));
  host.setAttribute("aria-roledescription", t("interactive chart"));
  const describedBy = viz.schema.svgDesc
    ? `${viz._uuid}-desc ${desc.id}`
    : desc.id;
  host.setAttribute("aria-describedby", describedBy);
  desc.textContent = t(KEYBOARD_NAV_INSTRUCTIONS);
  const svg = viz._select?.node?.() as SVGElement | null | undefined;
  Object.assign(host.style, {
    top: svg?.style.top || "0px",
    left: svg?.style.left || "0px",
    width: `${viz.schema.width || 0}px`,
    height: `${viz.schema.height || 0}px`,
  });
}
