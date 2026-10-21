import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    The root <svg> takes the chart's size on the first draw instead of growing
    into it from the browser's default 300×150. Growing it clipped the first
    draw to the growing box (the SVG viewport and `content-visibility: auto`
    both clip), and under `content-visibility: auto` the unsized SVG measured
    0×0, so the visibility check deferred the draw. A long `duration` keeps the
    first draw's transition running while the page is measured.
*/

after(async () => {
  await closeBrowser();
});

const DURATION = 20000;

/** Renders a chart, waits a few frames into its first draw, and measures it. */
const firstDraw = async ({chart, renderer, width, height, duration}) => {
  const data = Array.from({length: 12}, (_, i) => ({id: `item ${i}`, value: (i + 1) * 10}));
  const viz = new window.d3plus[chart]()
    .select("#viz")
    .renderer(renderer)
    .duration(duration)
    .data(data)
    .groupBy("id")
    .legend(false);
  if (chart === "Treemap") viz.sum("value");
  else viz.x("id").y("value");
  if (width) viz.width(width);
  if (height) viz.height(height);
  viz.render();
  for (let i = 0; i < 5; i++) await new Promise(r => requestAnimationFrame(r));

  const svg = document.querySelector("#viz svg.d3plus-viz");
  const box = svg.getBoundingClientRect();
  const canvas = document.querySelector("#viz canvas");
  const canvasBox = canvas?.getBoundingClientRect();
  // Where each rect mark lands once its entrance finishes, from the painted
  // scene; the one reaching furthest into the bottom-right corner is probed.
  const marks = [];
  const walk = (node, x, y) => {
    const nx = x + (node.transform?.x || 0);
    const ny = y + (node.transform?.y || 0);
    if (node.type === "rect" && node.width > 4 && node.height > 4)
      marks.push({key: String(node.key), left: nx + node.x, top: ny + node.y, right: nx + node.x + node.width, bottom: ny + node.y + node.height});
    for (const child of node.children || []) walk(child, nx, ny);
  };
  walk(viz._paintedScene.root, box.left, box.top);
  marks.sort((a, b) => b.right + b.bottom - (a.right + a.bottom));
  const corner = marks[0];
  // Drawn: its element exists. Visible: the point just inside its corner is
  // inside the SVG's painted box, so a hit there lands in the SVG rather than
  // falling through the clip to the page behind it.
  const drawn = !!corner && !!svg.querySelector(`[data-key="${CSS.escape(corner.key)}"]`);
  const hit = corner ? document.elementFromPoint(corner.right - 2, corner.bottom - 2) : null;
  return {
    size: [Math.round(box.width), Math.round(box.height)],
    final: [viz.width(), viz.height()],
    contentVisibility: getComputedStyle(svg).contentVisibility,
    canvas: canvasBox ? [Math.round(canvasBox.width), Math.round(canvasBox.height)] : null,
    corner: corner ? [Math.round(corner.right - box.left), Math.round(corner.bottom - box.top)] : null,
    drawn,
    hit: !!hit && svg.contains(hit),
  };
};

const sizings = [
  ["an explicit width and height", "width:800px;height:600px", 600, 400],
  ["an explicit height", "width:600px;height:600px", undefined, 400],
];

for (const chart of ["Treemap", "BarChart"]) {
  for (const [label, style, width, height] of sizings) {
    it(`first draw: ${chart} with ${label} is full size and unclipped early in its transition`, async () => {
      const result = await render(
        `<div id='viz' style='${style}'></div>`,
        firstDraw,
        {chart, renderer: "svg", width, height, duration: DURATION},
      );
      assert.strictEqual(result.contentVisibility, "auto");
      assert.deepStrictEqual(result.size, result.final);
      assert.ok(result.corner, "the chart has a mark");
      assert.ok(
        result.corner[0] > result.final[0] / 2 && result.corner[1] > result.final[1] / 2,
        `the corner mark sits in the bottom-right quadrant (${result.corner})`,
      );
      assert.ok(result.drawn, "the bottom-right mark is drawn");
      assert.ok(result.hit, "the bottom-right mark is not clipped");
    });
  }
}

it("first draw: the canvas renderer paints at full size early in the transition", async () => {
  const result = await render(
    "<div id='viz' style='width:800px;height:600px'></div>",
    firstDraw,
    {chart: "Treemap", renderer: "canvas", width: 600, height: 400, duration: DURATION},
  );
  assert.deepStrictEqual(result.size, [600, 400]);
  assert.deepStrictEqual(result.canvas, [600, 400]);
});

it("first draw: a later size change still transitions", async () => {
  const result = await render(
    "<div id='viz' style='width:800px;height:600px'></div>",
    async ({duration}) => {
      const viz = new window.d3plus.Treemap()
        .select("#viz")
        .duration(duration)
        .data([{id: "a", value: 1}, {id: "b", value: 2}])
        .groupBy("id")
        .sum("value")
        .width(400)
        .height(300);
      viz.render();
      for (let i = 0; i < 3; i++) await new Promise(r => requestAnimationFrame(r));
      const svg = document.querySelector("#viz svg.d3plus-viz");
      const first = svg.getBoundingClientRect();
      viz.width(600).height(400).render();
      for (let i = 0; i < 3; i++) await new Promise(r => requestAnimationFrame(r));
      const resized = svg.getBoundingClientRect();
      return {first: [first.width, first.height], resized: [resized.width, resized.height]};
    },
    {duration: DURATION},
  );
  assert.deepStrictEqual(result.first, [400, 300]);
  assert.ok(
    result.resized[0] < 600 && result.resized[1] < 400,
    `the resize is still in transition (${result.resized})`,
  );
});
