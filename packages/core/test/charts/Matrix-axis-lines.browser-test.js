import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Matrix draws no axis lines along its cells' top and left edges, on SVG
    and Canvas alike: its row and column axes are labels only, their domain
    lines unstroked. Read from the painted pixels (the SVG rasterized), just
    outside the cells, where a domain line would run.
*/

const box = "<div id='viz' style='width:600px;height:400px'></div>";

const data = [];
for (const row of ["a", "b", "c"])
  for (const column of ["x", "y", "z"]) data.push({row, column, value: 1});

/**
    Runs in the page: draws the Matrix on `renderer` and resolves with the
    darkest pixel (its lowest channel) in the strips just left of and just
    above the cells, and in the cells themselves.
*/
const strips = async ({renderer, data, chart}) => {
  const viz = await new Promise(resolve => {
    const v = new window.d3plus[chart]()
      .select("#viz")
      .duration(0)
      .renderer(renderer)
      .legend(false)
      .data(data)
      .groupBy(["row", "column"])
      .row("row")
      .column("column")
      .shapeConfig({fill: "#ff0000"});
    v.render(() => resolve(v));
  });
  const t = viz._chartTransform || {x: 0, y: 0};
  // The cells' band edges, from their centers (a Rect's or a Circle's).
  const centers = viz._chartScene
    .filter(n => n.datum && (n.type === "rect" || n.type === "circle"))
    .map(n =>
      n.type === "rect"
        ? [n.x + n.width / 2, n.y + n.height / 2]
        : [n.cx, n.cy],
    );
  const {cellWidth, cellHeight} = viz.ctx;
  const xs = centers.map(c => t.x + c[0]);
  const ys = centers.map(c => t.y + c[1]);
  const left = Math.min(...xs) - cellWidth / 2;
  const right = Math.max(...xs) + cellWidth / 2;
  const top = Math.min(...ys) - cellHeight / 2;
  const bottom = Math.max(...ys) + cellHeight / 2;

  // The painted chart as a canvas: Canvas's own, or the SVG rasterized.
  let canvas = document.querySelector("#viz canvas.d3plus-render-canvas");
  let origin = canvas?.getBoundingClientRect();
  if (!canvas) {
    const svg = document.querySelector("#viz svg");
    origin = svg.getBoundingClientRect();
    const img = new Image();
    const xml = new XMLSerializer().serializeToString(svg);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
    await img.decode();
    canvas = document.createElement("canvas");
    canvas.width = origin.width;
    canvas.height = origin.height;
    canvas.getContext("2d").drawImage(img, 0, 0, origin.width, origin.height);
  }
  const ratio = canvas.width / origin.width;
  const ctx = canvas.getContext("2d");
  const darkest = (x0, y0, x1, y1) => {
    const [px, py] = [Math.round(x0 * ratio), Math.round(y0 * ratio)];
    const w = Math.max(1, Math.round((x1 - x0) * ratio));
    const h = Math.max(1, Math.round((y1 - y0) * ratio));
    const d = ctx.getImageData(px, py, w, h).data;
    let min = 255;
    for (let i = 0; i < d.length; i += 4) {
      // Transparent pixels show the white page.
      if (d[i + 3] < 128) continue;
      min = Math.min(min, d[i], d[i + 1], d[i + 2]);
    }
    return min;
  };
  return {
    left: darkest(left - 2, top + 2, left + 1, bottom - 2),
    top: darkest(left + 2, top - 2, right - 2, top + 1),
    cell: darkest(
      left + cellWidth / 2 - 2,
      top + cellHeight / 2 - 2,
      left + cellWidth / 2 + 2,
      top + cellHeight / 2 + 2,
    ),
  };
};

for (const chart of ["Matrix", "BubbleMatrix"])
  for (const renderer of ["svg", "canvas"])
    it(`${chart} [${renderer}]: no axis lines along the cells' left and top edges`, async () => {
      const out = await render(box, strips, {renderer, data, chart});
      assert.ok(out.cell < 50, `the cells paint (${out.cell})`);
      assert.ok(out.left > 200, `nothing dark left of the cells (${out.left})`);
      assert.ok(out.top > 200, `nothing dark above the cells (${out.top})`);
    });
