import assert from "assert";
import {scaleLinear} from "d3-scale";

import circleBuffer from "../../es/src/charts/plotBuffers/Circle.js";
import {render, closeBrowser} from "../playwright.js";

after(async () => {
  await closeBrowser();
});

/** A Plot-like `this` and a fresh set of circleBuffer arguments. */
const plot = {schema: {discrete: undefined}};
const args = r => ({
  data: [{x: 0, y: 100, data: {}, i: 0}],
  x: scaleLinear().domain([0, 100]).range([0, 200]),
  y: scaleLinear().domain([100, 0]).range([0, 100]),
  config: {r},
});

it("circleBuffer pads the value axes by a numeric Circle radius", () => {
  const [, y] = circleBuffer.call(plot, args(7));
  const [, yFn] = circleBuffer.call(plot, args(() => 7));
  assert.ok(y.domain()[0] > 100, "the top value gets room");
  assert.deepStrictEqual(y.domain(), yFn.domain(), "a number pads like an accessor returning it");
});

it("Plot draws with a numeric shapeConfig.Circle.r", async function () {
  this.timeout(60000);
  const radii = await render(
    "<div id='viz' style='width:400px;height:300px'></div>",
    () =>
      new Promise(resolve => {
        // A draw that throws never calls back; settle so the page error reports.
        window.addEventListener("error", () => resolve());
        window.addEventListener("unhandledrejection", () => resolve());
        new window.d3plus.Plot()
          .select("#viz")
          .data([
            {id: "a", x: 1, y: 10},
            {id: "b", x: 2, y: 20},
            {id: "c", x: 3, y: 30},
          ])
          .groupBy("id")
          .x("x")
          .y("y")
          .shapeConfig({Circle: {r: 7}})
          .duration(0)
          .render(() =>
            resolve(
              [...document.querySelectorAll("circle.d3plus-render-circle")]
                .filter(c => ["a", "b", "c"].includes(c.closest("[data-key]")?.getAttribute("data-key")))
                .map(c => +c.getAttribute("r")),
            ),
          );
      }),
  );
  assert.deepStrictEqual(radii, [7, 7, 7]);
});
