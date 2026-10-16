import {resetInjectedBoxes} from "@d3plus/render";

import type Viz from "./Viz.js";

/**
    The wrappers a chart's container gets that `@d3plus/render` doesn't own,
    guarded against generic page CSS (see `resetInjectedBoxes`). Every
    selector has a specificity of exactly (0,1,0): class names without a
    `d3plus-` prefix are scoped by a zero-specificity `:where()` to the
    panels d3plus mounts them in (the overlay host and the hidden
    measurement copies), so a page's own `.search-root` is left alone.

    Buttons and inputs aren't listed: their default inline styles pin their
    margin, padding and box-sizing, and a `*ClassName` option hands their
    styling to the page's own button CSS (bare `button` rules included).
*/
const PANELS = ":where(.d3plus-render-overlays, .d3plus-zoom-control, .d3plus-top-left-controls)";
export const CHROME_SELECTORS = [
  ".d3plus-zoom-control",
  ".d3plus-top-left-controls",
  ".d3plus-top-left-controls-item",
  `${PANELS} .tlc-item`,
  `${PANELS} .zoom-control-icon`,
  `${PANELS} .search-root`,
  `${PANELS} .search-input-wrap`,
  `${PANELS} .search-count`,
  ".d3plus-minimap",
  ".d3plus-minimap-viewport",
  ".d3plus-minimap-label",
  ".d3plus-table-view",
  ".d3plus-table-view-frame",
  ".d3plus-table-view-toolbar",
  ".d3plus-table-view-scroll",
  ".d3plus-table-view-table",
  ".d3plus-table-view-cell",
  ".d3plus-table-view-pagination",
  ".d3plus-attribution",
  ".d3plus-attribution-text",
  ".d3plus-attribution-icon",
  ".d3plus-Mask",
  ".d3plus-Message",
];

/** Registers the chart chrome's selectors in the document holding the chart. */
export function resetChromeBoxes(viz: Viz): void {
  resetInjectedBoxes(viz._select?.node() as Node | undefined, CHROME_SELECTORS);
}
