import {it} from "vitest";
import {SvgRenderer} from "@d3plus/render";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

it("a chart's legend composes into its scene (multi-level Treemap)", async () => {
  const res = await render('<div id="A"></div><div id="B"></div>', async () => {
    const NS = "http://www.w3.org/2000/svg";
    const A = document.getElementById("A");
    const B = document.getElementById("B");
    const svgA = document.createElementNS(NS, "svg");
    svgA.setAttribute("width", "400");
    svgA.setAttribute("height", "300");
    A.appendChild(svgA);

    const viz = new window.d3plus.Treemap()
      .data([
        {group: "G1", id: "A", value: 10},
        {group: "G1", id: "B", value: 20},
        {group: "G2", id: "C", value: 30},
        {group: "G2", id: "D", value: 40},
      ])
      .groupBy(["group", "id"])
      .sum("value")
      .width(400)
      .height(300)
      .duration(0);
    await new Promise(resolve => viz.select(svgA).render(resolve));

    // The scene alone redraws the chart, legend included, into a fresh target.
    const r = new SvgRenderer();
    r.mount({container: B, width: 400, height: 300});
    r.drawScene(viz.toScene());
    const svgB = B.querySelector("svg");

    return {
      hasLegendGroup: !!svgB.querySelector('[data-key="viz-legend"]'),
      hasLegendInRender: !!svgA.querySelector('[data-key="viz-legend"]'),
      text: svgB.textContent,
      cells: svgB.querySelectorAll("rect.d3plus-render-rect").length,
    };
  });

  assert.ok(
    res.hasLegendInRender,
    "legend rendered by viz.render() (scene path)",
  );
  assert.ok(res.hasLegendGroup, "legend composed into the scene");
  assert.ok(
    res.text.includes("G1") && res.text.includes("G2"),
    "legend labels present in scene",
  );
  assert.ok(res.cells >= 4, "treemap cells also present");
});
