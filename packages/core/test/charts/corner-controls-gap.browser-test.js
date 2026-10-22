import {it} from "vitest";
import assert from "~test/browser/assert.js";

import {render} from "~test/browser/render.js";

/**
    The corner controls (table view + search top-left, zoom top-right) sit
    a few pixels in from the chart's top edge, and the chart leaves that
    same gap below them: the first thing drawn under the top-left buttons
    (a BarChart's y-axis max label) starts one button-margin below their
    bottom edge, with or without a title beside them, in SVG and on canvas.

    Gaps are counted in whole blank pixel rows, the way they read on
    screen: the rows above the buttons, and the rows between the last one
    a button touches and the first one with ink. Fonts place their ink a
    little differently within a line, so the gap below may run a few rows
    past the margin, but never short of it.
*/

const box = '<div id="viz" style="width:500px;height:400px;"></div>';

/**
    Renders a BarChart (optionally titled) and returns, in the chart
    surface's pixels: the blank rows above the buttons, and the blank rows
    between each panel and the first ink under its columns.
*/
const measure = (renderer, title) =>
  render(
    box,
    ({renderer, title}) =>
      new Promise((resolve, reject) => {
        const viz = new window.d3plus.BarChart()
          .select("#viz")
          .data([
            {g: "A", x: "Q1", y: 35},
            {g: "A", x: "Q2", y: 50},
            {g: "B", x: "Q1", y: 20},
            {g: "B", x: "Q2", y: 45},
          ])
          .groupBy("g")
          .x("x")
          .y("y")
          .renderer(renderer)
          .duration(0);
        if (title) viz.title(title);
        viz.render(async () => {
          try {
            const surface = document.querySelector(
              renderer === "canvas"
                ? "#viz canvas.d3plus-render-canvas"
                : "#viz svg.d3plus-viz",
            );
            const origin = surface.getBoundingClientRect();
            const panel = selector => {
              const rects = [...document.querySelectorAll(selector)]
                .map(e => e.getBoundingClientRect())
                .filter(r => r.width);
              return {
                left: Math.min(...rects.map(r => r.left)) - origin.left,
                right: Math.max(...rects.map(r => r.right)) - origin.left,
                top: Math.min(...rects.map(r => r.top)) - origin.top,
                bottom: Math.max(...rects.map(r => r.bottom)) - origin.top,
              };
            };
            const topLeft = panel("#viz .d3plus-top-left-controls-item button");
            const zoom = panel("#viz .d3plus-zoom-control .zoom-control");

            let canvas = surface;
            if (renderer !== "canvas") {
              const img = new Image();
              img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(surface))}`;
              await img.decode();
              canvas = document.createElement("canvas");
              canvas.width = origin.width;
              canvas.height = origin.height;
              canvas
                .getContext("2d")
                .drawImage(img, 0, 0, origin.width, origin.height);
            }
            const ratio = canvas.width / origin.width;
            const {data} = canvas
              .getContext("2d")
              .getImageData(0, 0, canvas.width, canvas.height);
            const ink = i =>
              data[i + 3] > 128 &&
              (data[i] < 235 || data[i + 1] < 235 || data[i + 2] < 235);
            const firstInk = p => {
              const x0 = Math.floor(p.left * ratio),
                x1 = Math.ceil(p.right * ratio);
              for (let y = Math.ceil(p.bottom * ratio); y < canvas.height; y++)
                for (let x = x0; x < x1; x++)
                  if (ink((y * canvas.width + x) * 4)) return y / ratio;
              return Infinity;
            };
            const gap = p => firstInk(p) - Math.ceil(p.bottom);
            resolve({
              offset: Math.floor(Math.min(topLeft.top, zoom.top)),
              topLeft: gap(topLeft),
              zoom: gap(zoom),
            });
          } catch (e) {
            reject(e);
          }
        });
      }),
    {renderer, title},
  );

for (const renderer of ["svg", "canvas"]) {
  for (const title of [false, "Quarterly exports"]) {
    it(`${renderer}: a BarChart ${title ? "with" : "without"} a title leaves a button-margin gap below the corner controls`, async function () {
      const out = await measure(renderer, title);
      assert.ok(
        out.offset > 0,
        `the buttons sit in from the top edge (${out.offset})`,
      );
      // Where a label's ink starts within its line depends on the font, so
      // the gap is at least one button-margin and only a few rows more.
      assert.ok(
        out.topLeft >= out.offset - 1 && out.topLeft <= out.offset + 3,
        `the y-axis max label starts one button-margin below the top-left controls (gap ${out.topLeft} vs margin ${out.offset})`,
      );
      assert.ok(
        out.zoom >= out.offset - 1,
        `nothing comes closer under the zoom controls (gap ${out.zoom})`,
      );
    });
  }
}
