import {it} from "vitest";
import {SvgRenderer} from "@d3plus/render";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

it("a chart's timeline composes into its scene (time-based Treemap)", async () => {
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
        {id: "A", value: 10, year: 2000},
        {id: "A", value: 14, year: 2001},
        {id: "B", value: 20, year: 2000},
        {id: "B", value: 18, year: 2001},
      ])
      .groupBy("id")
      .sum("value")
      .time("year")
      .width(400)
      .height(300)
      .duration(0);
    await new Promise(resolve => viz.select(svgA).render(resolve));

    // The scene alone redraws the chart, timeline included, into a fresh target.
    const r = new SvgRenderer();
    r.mount({container: B, width: 400, height: 300});
    r.drawScene(viz.toScene());
    const svgB = B.querySelector("svg");

    return {
      hasTimelineGroup: !!svgB.querySelector('[data-key="viz-timeline"]'),
      hasTimelineInRender: !!svgA.querySelector('[data-key="viz-timeline"]'),
      text: svgB.textContent,
    };
  });

  assert.ok(
    res.hasTimelineInRender,
    "timeline rendered by viz.render() (scene path)",
  );
  assert.ok(res.hasTimelineGroup, "timeline composed into the scene");
  assert.ok(
    res.text.includes("2000") && res.text.includes("2001"),
    "timeline tick labels present in scene",
  );
});
