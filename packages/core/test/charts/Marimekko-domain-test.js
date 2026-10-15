import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    Marimekko's 100% axis keeps "none" rounding (a stack top can land a
    rounding error above 1), so a one-sided `yDomain` or `baseline` (#945)
    leaves its open far end at the data, as the axis would with no domain.
*/

after(closeBrowser);

// Each bar's 0.1 + 0.2 + 0.7 stacks to 1.0000000000000002.
const rows = ["A", "B", "C"].flatMap((cat, i) =>
  [0.1, 0.2, 0.7].map((v, j) => ({cat, g: `g${j}`, v: v * (i + 1)})),
);

/** Renders a Marimekko configured by `config` and reports its value axis's domain, low end first. */
const probe = ([data, config]) =>
  new Promise(resolve => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const viz = new window.d3plus.Marimekko()
      .select(el)
      .data(data)
      .groupBy("g")
      .x("cat")
      .y("v")
      .duration(0)
      .width(700)
      .height(420)
      .config(config);
    viz.render(() => {
      const axis = viz.schema.discrete === "y" ? viz._xAxis : viz._yAxis;
      resolve(axis._d3Scale.domain().map(Number).sort((a, b) => a - b));
    });
  });

it("Marimekko: a one-sided yDomain or baseline keeps the 100% end unrounded", async function () {
  this.timeout(60000);
  const [top] = (await render("", probe, [rows, {}])).slice(-1);
  assert.ok(top > 1 && top < 1.000001, `the stack top lands just above 1 (${top})`);
  for (const config of [{yDomain: [0.2]}, {baseline: 0.2}]) {
    const [lo, hi] = await render("", probe, [rows, config]);
    assert.strictEqual(lo, 0.2, `${JSON.stringify(config)}: pins 0.2`);
    assert.ok(hi < 1.000001, `${JSON.stringify(config)}: the far end stays at the data (${hi})`);
  }
  const [, rounded] = await render("", probe, [rows, {yDomain: [0.2], yConfig: {rounding: "outside"}}]);
  assert.ok(rounded > 1.05, `a user's rounding still rounds the far end (${rounded})`);
});
