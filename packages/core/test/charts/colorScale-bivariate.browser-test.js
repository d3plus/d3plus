import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    #298: two fields given to `colorScale` make it bivariate. Each shape is
    colored from a grid by its two values' quantile bins, a row missing
    either value keeps the missing-data color, and the key draws the grid as
    a diamond. Hovering a key cell highlights the shapes in it, hovering a
    shape lights its cell, and the tooltip reads both values.
*/

const STEVENS = [
  "#e8e8e8",
  "#e4acac",
  "#c85a5a",
  "#b0d5df",
  "#ad9ea5",
  "#985356",
  "#64acbe",
  "#627f8c",
  "#574249",
];

// Nine rows across the grid (a: 1–9, b rising with a's thirds offset), and
// one missing its second value.
const rows = [
  {id: "a1", a: 1, b: 1},
  {id: "a2", a: 2, b: 5},
  {id: "a3", a: 3, b: 9},
  {id: "a4", a: 4, b: 2},
  {id: "a5", a: 5, b: 6},
  {id: "a6", a: 6, b: 7},
  {id: "a7", a: 7, b: 3},
  {id: "a8", a: 8, b: 4},
  {id: "a9", a: 9, b: 8},
  {id: "gap", a: 5},
];
const sizes = rows.map((d, i) => ({...d, size: 10 + i}));

/** A 5×2 grid of square regions, one per row id. */
const topojson = {
  type: "Topology",
  objects: {
    geo: {
      type: "GeometryCollection",
      geometries: rows.map((d, k) => ({
        type: "Polygon",
        id: d.id,
        arcs: [[k]],
      })),
    },
  },
  arcs: rows.map((d, k) => {
    const x = (k % 5) * 12;
    const y = Math.floor(k / 5) * 12;
    return [
      [x, y],
      [x, y + 10],
      [x + 10, y + 10],
      [x + 10, y],
      [x, y],
    ];
  }),
};

const charts = {
  Geomap: `lib => new lib.Geomap()
    .data(${JSON.stringify(rows)})
    .groupBy("id")
    .colorScale(["a", "b"])
    .colorScalePosition("right")
    .tiles(false)
    .ocean("transparent")
    .topojsonFill("#123456")
    .topojson(${JSON.stringify(topojson)})`,
  Treemap: `lib => new lib.Treemap()
    .data(${JSON.stringify(sizes)})
    .sum("size")
    .color(() => "#123456")
    .colorScale(["a", "b"])
    .colorScalePosition("right")`,
  Plot: `lib => new lib.Plot()
    .data(${JSON.stringify(rows.filter(d => d.b !== undefined))})
    .x("a")
    .y(d => d.a * 2)
    .colorScale(["a", d => d.b])
    .colorScaleConfig({bivariateLabels: ["A", "B"]})
    .colorScalePosition("right")`,
};

/**
    Opens a page and renders a chart built by `src` (`lib => viz`) into a
    720×420 #viz, kept as `window.__viz`.
*/
async function chart(src, renderer) {
  const opened = await openPage(
    `<div id="viz" style="width:720px;height:420px;font-family:sans-serif"></div>`,
  );
  await opened.page.evaluate(
    ([src, renderer]) =>
      new Promise(resolve => {
        const viz = new Function("lib", `return (${src})(lib);`)(window.d3plus);
        window.__viz = viz;
        viz.renderer(renderer).duration(0).select("#viz").render(resolve);
      }),
    [src, renderer],
  );
  return opened;
}

/**
    The painted data shapes (by row id) and key cells (by color), each with
    its fill and opacity.
*/
function painted(page) {
  return page.evaluate(() => {
    const viz = window.__viz;
    const shapes = {};
    const cells = {};
    const labels = [];
    const unwrap = d => {
      while (d && d.__d3plus__ && d.data) d = d.data;
      return d;
    };
    const walk = (node, opacity) => {
      const own = opacity * (node.paint?.opacity ?? 1);
      const key = String(node.key);
      const d = unwrap(node.datum);
      if (
        node.type !== "group" &&
        node.type !== "text" &&
        d &&
        !key.endsWith("::hit")
      ) {
        if (d._isColorScaleBucket)
          cells[d.color] = {
            opacity: own,
            title: d.id,
            x: d._bivariateX,
            y: d._bivariateY,
          };
        else if (
          typeof d.id === "string" &&
          ["rect", "path", "circle"].includes(node.type)
        )
          shapes[d.id] = {fill: node.paint?.fill, opacity: own};
      }
      if (node.type === "text" && key.startsWith("bivariate-label"))
        labels.push({
          text: node.lines.map(l => l.text).join(" "),
          rotate: node.transform?.rotate,
        });
      (node.children || []).forEach(c => walk(c, own));
    };
    walk(viz._paintedScene.root, 1);
    const scale = viz._colorScaleClass._colorScale;
    return {shapes, cells, labels, colors: scale.colors};
  });
}

/**
    The client point at the center of the first painted scene node matching
    `match` (a `node => boolean` source), or `null`.
*/
function pointOf(page, match) {
  return page.evaluate(match => {
    const test = new Function("node", `return (${match})(node);`);
    const toClient = ([x, y]) => {
      const svg = document.querySelector("#viz svg.d3plus-render-svg");
      if (svg) {
        const m = svg.getScreenCTM();
        return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
      }
      const r = document.querySelector("#viz canvas").getBoundingClientRect();
      return [r.left + x, r.top + y];
    };
    const box = node => {
      if (node.type === "rect")
        return [node.x, node.y, node.x + node.width, node.y + node.height];
      if (node.type === "circle")
        return [
          node.cx - node.r,
          node.cy - node.r,
          node.cx + node.r,
          node.cy + node.r,
        ];
      if (node.type === "path") {
        const n = (node.d.match(/-?[\d.]+(e-?\d+)?/g) || []).map(Number);
        const xs = n.filter((_, i) => i % 2 === 0);
        const ys = n.filter((_, i) => i % 2 === 1);
        return [
          Math.min(...xs),
          Math.min(...ys),
          Math.max(...xs),
          Math.max(...ys),
        ];
      }
      return null;
    };
    const apply = (chain, [x, y]) =>
      chain.reduceRight(
        ([px, py], t) => [
          px * (t.scale ?? 1) + (t.x ?? 0),
          py * (t.scale ?? 1) + (t.y ?? 0),
        ],
        [x, y],
      );
    let found = null;
    const walk = (node, chain) => {
      if (found) return;
      const next = node.transform ? [...chain, node.transform] : chain;
      if (
        node.type !== "group" &&
        !String(node.key).endsWith("::hit") &&
        node.datum &&
        test(node)
      ) {
        const b = box(node);
        if (b) found = apply(next, [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]);
      }
      (node.children || []).forEach(c => walk(c, next));
    };
    walk(window.__viz._paintedScene.root, []);
    return found && toClient(found);
  }, match);
}

/** Moves the real mouse to `point` and waits for the hover repaint. */
async function hover(page, point) {
  assert.ok(point, "found the node to hover");
  await page.mouse.move(point[0] - 3, point[1] - 3);
  await page.mouse.move(point[0], point[1], {steps: 3});
  await page.waitForTimeout(120);
}

/** The text of the visible tooltip's body rows. */
const tooltipRows = page =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll(".d3plus-tooltip-tbody tr")).map(tr =>
      Array.from(tr.querySelectorAll("td")).map(td => td.textContent),
    ),
  );

/** The node matcher for the shape of row "a7". */
const shapeA7 = `n => n.type !== "text" && n.datum && !n.datum._isColorScaleBucket && (n.datum.id === "a7" || (n.datum.data && n.datum.data.id === "a7"))`;

/** The node matcher for a key cell of `color`. */
const cell = color =>
  `n => n.type === "path" && n.datum && n.datum._isColorScaleBucket && n.datum.color === ${JSON.stringify(color)}`;

for (const renderer of ["svg", "canvas"]) {
  for (const name of Object.keys(charts)) {
    it(`${renderer}: ${name} colors each shape by its two values' bins`, async () => {
      const {page, close} = await chart(charts[name], renderer);
      try {
        const {shapes, cells, colors} = await painted(page);
        assert.deepStrictEqual(colors, STEVENS, "Stevens' scheme");
        assert.strictEqual(Object.keys(cells).length, 9, "nine key cells");
        assert.strictEqual(shapes.a1.fill, "#e8e8e8", "low/low");
        assert.strictEqual(shapes.a9.fill, "#574249", "high/high");
        assert.strictEqual(shapes.a7.fill, "#c85a5a", "a high, b low");
        assert.strictEqual(shapes.a3.fill, "#64acbe", "a low, b high");
        assert.strictEqual(shapes.a5.fill, "#ad9ea5", "middle/middle");
        if (name !== "Plot")
          assert.strictEqual(
            shapes.gap?.fill,
            "#123456",
            "the missing-data color",
          );
      } finally {
        await close();
      }
    });
  }

  it(`${renderer}: the key's labels name the fields along its edges`, async () => {
    const {page, close} = await chart(charts.Treemap, renderer);
    try {
      const {labels, cells} = await painted(page);
      assert.deepStrictEqual(labels, [
        {text: "a →", rotate: -45},
        {text: "← b", rotate: 45},
      ]);
      assert.strictEqual(cells["#574249"].title, "a: 7 - 9, b: 7 - 9");
      const plot = await chart(charts.Plot, renderer);
      try {
        const {labels: own} = await painted(plot.page);
        assert.deepStrictEqual(
          own.map(l => l.text),
          ["A →", "← B"],
          "bivariateLabels",
        );
      } finally {
        await plot.close();
      }
    } finally {
      await close();
    }
  });

  for (const name of ["Treemap", "Geomap"]) {
    it(`${renderer}: ${name} — hovering a key cell highlights its shapes`, async () => {
      const {page, close} = await chart(charts[name], renderer);
      try {
        await hover(page, await pointOf(page, cell("#574249")));
        const {shapes, cells} = await painted(page);
        assert.strictEqual(shapes.a9.opacity, 1, "the shape in the cell");
        assert.ok(shapes.a1.opacity < 1, "a shape outside it dims");
        assert.ok(shapes.a5.opacity < 1, "a shape outside it dims");
        assert.strictEqual(cells["#574249"].opacity, 1, "the hovered cell");
        assert.ok(cells["#e8e8e8"].opacity < 1, "the other cells dim");
        const title = await page.evaluate(
          () => document.querySelector(".d3plus-tooltip-title")?.textContent,
        );
        assert.strictEqual(title, "a: 7 - 9, b: 7 - 9", "the cell's ranges");
      } finally {
        await close();
      }
    });

    it(`${renderer}: ${name} — hovering a shape lights its cell and reads both values`, async () => {
      const {page, close} = await chart(charts[name], renderer);
      try {
        await hover(page, await pointOf(page, shapeA7));
        const {cells} = await painted(page);
        assert.strictEqual(cells["#c85a5a"].opacity, 1, "its cell stays lit");
        assert.ok(cells["#574249"].opacity < 1, "the other cells dim");
        const body = await tooltipRows(page);
        assert.deepStrictEqual(body.slice(0, 2), [
          ["a", "7"],
          ["b", "3"],
        ]);
        // Straight from a key cell to the shape: the cell's highlight clears
        // and the shape's cell lights.
        await hover(page, await pointOf(page, cell("#574249")));
        await hover(page, await pointOf(page, shapeA7));
        await page.waitForTimeout(600);
        const [x, y] = await pointOf(page, shapeA7);
        await page.mouse.move(x + 1, y + 1);
        await page.waitForTimeout(120);
        const after = await painted(page);
        assert.strictEqual(after.cells["#c85a5a"].opacity, 1, "lit again");
        assert.ok(after.cells["#574249"].opacity < 1, "the left cell dims");
        assert.strictEqual(after.shapes.a7.opacity, 1, "the hovered shape");
        // Geomap doesn't dim the other shapes on a shape hover: the cell's
        // highlight must not linger.
        if (name === "Geomap")
          assert.strictEqual(after.shapes.a9.opacity, 1, "nothing dimmed");
      } finally {
        await close();
      }
    });
  }
}

it("svg: 2×2 and 4×4 keys", async () => {
  for (const [n, count] of [
    [2, 4],
    [4, 16],
  ]) {
    const {page, close} = await chart(
      `${charts.Treemap}.colorScaleConfig({bivariateBuckets: ${n}})`,
      "svg",
    );
    try {
      const {cells, shapes} = await painted(page);
      assert.strictEqual(Object.keys(cells).length, count);
      assert.strictEqual(shapes.a1.fill, "#e8e8e8");
      assert.strictEqual(shapes.a9.fill, "#574249");
    } finally {
      await close();
    }
  }
});
