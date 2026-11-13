import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {Treemap} from "../../index.ts";
import {
  ZOOM_PANEL_STYLE,
  zoomControlsHtml,
} from "../../src/charts/drawSteps/zoomControlsMarkup.ts";

useJsdom();

it("ZOOM_PANEL_STYLE — the full-width panel lets the pointer through", () => {
  assert.strictEqual(ZOOM_PANEL_STYLE.pointerEvents, "none");
});

it("zoomControlsHtml — every button takes the pointer back", () => {
  const host = document.createElement("div");
  host.innerHTML = zoomControlsHtml(new Treemap());
  const buttons = [...host.querySelectorAll("button")];
  assert.deepStrictEqual(
    buttons.map(button => button.classList[1]),
    ["zoom-in", "zoom-out", "zoom-reset", "zoom-brush"],
  );
  for (const button of buttons)
    assert.strictEqual(button.style.pointerEvents, "auto", button.className);
});
