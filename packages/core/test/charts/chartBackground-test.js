import {it} from "vitest";
import assert from "assert";
import {select} from "d3-selection";
import {useJsdom} from "~test/jsdom.js";
import {backgroundInk, chartBackground} from "../../src/charts/viz/backgroundInk.ts";

useJsdom();

it("chartBackground reads the color behind the chart's container", () => {
  const host = document.body.appendChild(document.createElement("div"));
  host.style.backgroundColor = "rgb(10, 20, 30)";
  const svg = host.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "svg"));
  assert.strictEqual(chartBackground({_select: select(svg)}), "rgb(10, 20, 30)");
  host.remove();
});

it("chartBackground falls back to white before the chart is mounted", () => {
  assert.strictEqual(chartBackground({}), "rgb(255, 255, 255)");
  assert.strictEqual(chartBackground({_select: {}}), "rgb(255, 255, 255)");
});

it("backgroundInk contrasts with the chart's background", () => {
  const host = document.body.appendChild(document.createElement("div"));
  host.style.backgroundColor = "rgb(0, 0, 0)";
  const svg = host.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "svg"));
  const onDark = backgroundInk({_select: select(svg), schema: {}});
  const onLight = backgroundInk({schema: {}});
  assert.notStrictEqual(onDark, onLight, "light ink on dark, dark ink on light");
  host.remove();
});
