import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    A legend at its default position is laid out twice on an animated chart's
    first render (once as an inset candidate at the origin, then in its margin
    band), and the second placement must be the one painted. With a title or
    total above the chart, painting the first placement drew the legend over
    the bottom of the chart.
*/

after(async () => {
  await closeBrowser();
});

const labels = ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very dissatisfied"];

/** Renders the chart and returns where its painted legend sits. */
const pageFn = async ({chart, renderer, extra, labels}) => {
  const data = labels.map((id, i) => ({id, value: 10 + i * 3}));
  const viz = new window.d3plus[chart]()
    .select("#viz")
    .renderer(renderer)
    .data(data)
    .groupBy("id")
    .legend(true)
    .config(extra);
  if (chart === "Pie") viz.value("value");
  else viz.sum("value");
  await new Promise(r => viz.render(r));
  if (viz._sceneRenderer.whenSettled) await viz._sceneRenderer.whenSettled();

  // Offset of the painted legend group: its own translate plus its ancestors'.
  const find = (node, y) => {
    const here = y + (node.transform?.y || 0);
    if (String(node.key).startsWith("Legend-")) return here;
    for (const child of node.children || []) {
      const found = find(child, here);
      if (found !== undefined) return found;
    }
    return undefined;
  };
  const sceneY = find(viz._sceneRenderer._scene.root, 0);
  const svgGroup = document.querySelector("#viz svg g[data-key^='Legend-']");
  const svgTop = svgGroup
    ? svgGroup.getBoundingClientRect().top - document.querySelector("#viz svg").getBoundingClientRect().top
    : null;
  return {
    bandTop: viz.schema.height - viz._margin.bottom,
    top: sceneY + viz._legendClass.outerBounds().y,
    svgTop,
  };
};

const cases = [
  ["Treemap", "<div id='viz' style='width:500px;height:450px'></div>", {title: "Satisfaction"}],
  ["Treemap", "<div id='viz' style='width:500px;height:450px'></div>", {total: "value"}],
  ["Pie", "<div id='viz' style='width:300px;height:380px'></div>", {title: "Satisfaction"}],
];

for (const renderer of ["svg", "canvas"]) {
  for (const [chart, html, extra] of cases) {
    it(`${chart} (${renderer}, ${Object.keys(extra)[0]}): a bottom legend paints below the chart on first render`, async function () {
      this.timeout(60000);
      const out = await render(html, pageFn, {chart, renderer, extra, labels});
      assert.ok(
        out.top >= out.bandTop - 1,
        `legend (${out.top}) sits below the chart area (${out.bandTop})`,
      );
      if (renderer === "svg")
        assert.ok(
          out.svgTop >= out.bandTop - 1,
          `painted legend (${out.svgTop}) sits below the chart area (${out.bandTop})`,
        );
    });
  }
}
