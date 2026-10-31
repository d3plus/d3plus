import {onFontsLoaded, textWidth} from "@d3plus/dom";

// Measured before the font arrives: the fallback font's width.
let width = textWidth("Sphinx of black quartz, judge my vow", {
  "font-family": "Lobster",
  "font-size": 20,
});

const stop = onFontsLoaded(() => {
  // Lobster has loaded, and the earlier measurement is stale.
  width = textWidth("Sphinx of black quartz, judge my vow", {
    "font-family": "Lobster",
    "font-size": 20,
  });
});

// Later, to stop listening:
stop();
