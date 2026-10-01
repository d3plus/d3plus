import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    Histogram bins raw observations onto a linear x axis: one bar per bin
    (per group), each spanning exactly its bin so neighbors touch, with
    heights proportional to the bin counts and groups stacked per bin.
*/

after(async () => {
  await closeBrowser();
});

it("Histogram draws contiguous, count-proportional bins", async function () {
  this.timeout(60000);

  const out = await render("", () => {
    const draw = configure =>
      new Promise(resolve => {
        const el = document.createElement("div");
        document.body.appendChild(el);
        const viz = new window.d3plus.Histogram()
          .select(el)
          .duration(0)
          .width(800)
          .height(500);
        configure(viz);
        viz.render(() => {
          const rects = [
            ...el.querySelectorAll("g[data-key='plot-zoom-content'] rect.d3plus-render-rect"),
          ].map(r => {
            const b = r.getBoundingClientRect();
            return {key: r.getAttribute("data-key"), left: b.left, right: b.right, top: b.top, bottom: b.bottom, height: b.height};
          });
          const nan = [...el.querySelectorAll("*")].filter(n =>
            [...n.attributes].some(a => a.value.includes("NaN")),
          ).length;
          resolve({rects, nan});
        });
      });

    // Counts per bin of width 10: [0,10)→1, [10,20)→2, [20,30)→4, [30,40]→3.
    const values = [5, 12, 18, 21, 22, 25, 29, 31, 35, 40];
    return (async () => ({
      single: await draw(viz => viz.data(values.map(v => ({v}))).value("v").binWidth(10)),
      stacked: await draw(viz =>
        viz
          .data(values.flatMap(v => [{g: "a", v}, {g: "b", v}]))
          .groupBy("g")
          .value("v")
          .binWidth(10),
      ),
    }))();
  });

  const {single, stacked} = out;
  assert.strictEqual(single.nan, 0, "no NaN attributes");
  assert.strictEqual(single.rects.length, 4, "one bar per bin");

  const bars = single.rects.sort((a, b) => a.left - b.left);
  for (let i = 1; i < bars.length; i++) {
    const gap = bars[i].left - bars[i - 1].right;
    assert.ok(gap >= 0 && gap <= 2, `bars ${i - 1}/${i} touch (gap ${gap})`);
  }
  const widths = bars.map(b => b.right - b.left);
  assert.ok(Math.max(...widths) - Math.min(...widths) < 1, "equal-width bins are equally wide");

  const unit = bars[0].height;
  [1, 2, 4, 3].forEach((count, i) =>
    assert.ok(Math.abs(bars[i].height - count * unit) < 1.5, `bin ${i} height ∝ ${count}`),
  );

  assert.strictEqual(stacked.nan, 0, "stacked: no NaN attributes");
  assert.strictEqual(stacked.rects.length, 8, "stacked: one bar per group per bin");
  const columns = new Map();
  stacked.rects.forEach(r => {
    const col = Math.round(r.left);
    columns.set(col, [...(columns.get(col) || []), r]);
  });
  assert.strictEqual(columns.size, 4, "stacked: groups share bin positions");
  for (const [, [lo, hi]] of columns) {
    const [top, bottom] = lo.top < hi.top ? [lo, hi] : [hi, lo];
    assert.ok(Math.abs(top.bottom - bottom.top) < 1, "stacked: segments sit on each other");
  }
});

it("Histogram bar hover highlights only that bin of that series", async function () {
  this.timeout(60000);

  const out = await render("", () =>
    new Promise(resolve => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      const values = [5, 12, 18, 21, 22, 25, 29, 31, 35, 40];
      const viz = new window.d3plus.Histogram()
        .select(el)
        .duration(0)
        .width(800)
        .height(500)
        .data(values.flatMap(v => [{g: "a", v}, {g: "b", v}]))
        .groupBy("g")
        .value("v")
        .binWidth(10);
      viz.render(() => {
        const rows = viz._filteredData;
        const target = rows.find(d => d.g === "a" && d.x0 === 20);
        viz.schema.on["mousemove.shape"](target, 0, target, new MouseEvent("mousemove"));
        const matches = rows.filter((d, i) => viz._hover(d, i)).map(d => `${d.g}:${d.x0}`);
        // A legend swatch's datum merges the series, so `x` lists every bin.
        const legendA = {g: "a", x: [5, 15, 25, 35]};
        const legendB = {g: "b", x: [5, 15, 25, 35]};
        resolve({matches, legendA: viz._hover(legendA, 0), legendB: viz._hover(legendB, 0)});
      });
    }),
  );

  assert.deepStrictEqual(out.matches, ["a:20"], "only the hovered bin of the hovered series");
  assert.strictEqual(out.legendA, true, "the hovered series' legend entry stays highlighted");
  assert.strictEqual(out.legendB, false, "other series' legend entries dim");
});

it("Histogram translates its axis title and tooltip labels", async function () {
  this.timeout(60000);

  const out = await render("", () =>
    new Promise(resolve => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      const viz = new window.d3plus.Histogram()
        .select(el)
        .duration(0)
        .width(800)
        .height(500)
        .locale("es-ES")
        .data([1, 2, 3, 11, 12].map(v => ({g: "a", v})))
        .groupBy("g")
        .value("v")
        .binWidth(10)
        .binNormalize("density");
      viz.render(() => {
        const bin = viz._filteredData[0];
        const tbody = viz.schema.tooltipConfig.tbody(bin, 0).map(([label]) => label);
        resolve({yTitle: viz._yConfig.title, tbody});
      });
    }),
  );

  assert.strictEqual(out.yTitle, "Densidad");
  assert.deepStrictEqual(out.tbody, ["Rango", "Recuento", "Densidad"]);
});
