import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    #784: a StackedArea with `threshold` draws its small series as one bucket
    band, stacked on top, with one legend entry that highlights and hides
    it, on SVG and Canvas.
*/

const sizes = {
  Alpha: 40,
  Bravo: 30,
  Charlie: 25,
  Delta: 20,
  Echo: 15,
  Fox: 1.2,
  Golf: 0.8,
  Hotel: 0.6,
  India: 0.9,
  Juliet: 0.4,
};
const data = [];
Object.entries(sizes).forEach(([id, base], s) => {
  for (let year = 2015; year <= 2024; year++) {
    // Golf has no 2018 row: the bucket keeps one band anyway.
    if (id === "Golf" && year === 2018) continue;
    data.push({
      parent: s < 3 ? "Top" : "Rest",
      id,
      year,
      value: +(base * (1 + 0.15 * Math.sin(year + s))).toFixed(2),
    });
  }
});
const BUCKET = "Fox,Golf,Hotel,India,Juliet";

/** Opens a page with the chart rendered into #viz, kept as `window.__viz`. */
async function chart(renderer, calls = []) {
  const opened = await openPage(
    '<div id="viz" style="width:800px;height:500px;font-family:sans-serif;"></div>',
  );
  await opened.page.evaluate(
    ([data, renderer, calls]) =>
      new Promise(resolve => {
        const viz = new window.d3plus.StackedArea()
          .data(data)
          .groupBy("id")
          .x("year")
          .y("value")
          .threshold(0.05);
        // Rebuilt in this realm, so arrays read as arrays.
        for (const [method, ...args] of JSON.parse(JSON.stringify(calls)))
          viz[method](...args);
        window.__viz = viz;
        window.__surface = renderer === "canvas" ? "canvas" : "svg";
        viz.renderer(renderer).duration(0).select("#viz").render(resolve);
      }),
    [data, renderer, calls],
  );
  return opened;
}

/**
    The painted bands (key → opacity and fill, bottom to top), the legend's
    labels, and the client point of the legend entry and of the bucket band.
*/
function painted(page) {
  return page.evaluate(BUCKET => {
    const viz = window.__viz;
    const surface = document
      .querySelector(`#viz ${window.__surface}`)
      .getBoundingClientRect();
    const bands = [];
    let entry, band;
    const walk = (nodes, x, y) =>
      nodes.forEach(n => {
        const t = n.transform || {};
        const nx = x + (t.x || 0),
          ny = y + (t.y || 0);
        if (n.type === "path" && !n.interactionGroup && n.interactionPoints)
          bands.push({
            key: `${n.key}`,
            opacity: n.paint.opacity ?? 1,
            fill: n.paint.fill,
          });
        if (
          n.type === "rect" &&
          n.interactionGroup === "legend" &&
          `${n.key}`.startsWith("[") &&
          !`${n.key}`.endsWith("::hit")
        )
          entry = [
            surface.left + nx + n.x + n.width / 2,
            surface.top + ny + n.y + n.height / 2,
          ];
        if (n.type === "path" && `${n.key}` === BUCKET && n.interactionPoints) {
          const c = viz._chartTransform || {x: 0, y: 0};
          const p = n.interactionPoints[7];
          band = [surface.left + c.x + p.x, surface.top + c.y + p.y];
        }
        if (n.children) walk(n.children, nx, ny);
      });
    walk([viz._paintedScene.root], 0, 0);
    const legend = viz._legendClass;
    return {
      bands,
      labels: legend.data().map((d, i) => legend.label()(d, i)),
      entry,
      band,
      tooltip: document.querySelector(".d3plus-tooltip")?.textContent ?? "",
    };
  }, BUCKET);
}

async function moveTo(page, point) {
  await page.mouse.move(5, 5);
  await page.mouse.move(point[0], point[1], {steps: 3});
  await page.waitForTimeout(150);
}

for (const renderer of ["svg", "canvas"]) {
  it(`StackedArea threshold: one bucket band, with one legend entry (${renderer})`, async () => {
    const {page, close} = await chart(renderer);
    try {
      const result = await painted(page);
      assert.deepStrictEqual(
        result.bands.map(b => b.key).sort(),
        ["Alpha", "Bravo", "Charlie", "Delta", "Echo", BUCKET].sort(),
      );
      const fills = result.bands.map(b => b.fill);
      assert.strictEqual(new Set(fills).size, fills.length, "distinct colors");
      assert.deepStrictEqual(result.labels, [
        "Alpha",
        "Bravo",
        "Charlie",
        "Delta",
        "Echo",
        "Values < 5%",
      ]);
      const stack = await page.evaluate(() => {
        const viz = window.__viz;
        const top = viz._filteredData
          .filter(d => d.year === 2020)
          .map(d => [viz._drawLabel(d), d.value]);
        return top;
      });
      assert.strictEqual(stack.length, 6, "one row per band at 2020");
    } finally {
      await close();
    }
  });

  it(`StackedArea threshold: the legend entry highlights and hides the bucket band (${renderer})`, async () => {
    const {page, close} = await chart(renderer);
    try {
      const {entry} = await painted(page);
      await moveTo(page, entry);
      const hovered = await painted(page);
      const opacity = key => hovered.bands.find(b => b.key === key).opacity;
      assert.strictEqual(opacity(BUCKET), 1, "the bucket stays lit");
      assert.ok(opacity("Alpha") < 1, "the others dim");

      await page.mouse.click(entry[0], entry[1]);
      await page.waitForTimeout(400);
      const hidden = await painted(page);
      assert.ok(
        !hidden.bands.some(b => b.key === BUCKET),
        "the bucket band is hidden",
      );
      assert.ok(hidden.labels.includes("Values < 5%"), "its entry stays");
      assert.deepStrictEqual(await page.evaluate(() => window.__viz._hidden), [
        "Fox",
        "Golf",
        "Hotel",
        "India",
        "Juliet",
      ]);
    } finally {
      await close();
    }
  });

  it(`StackedArea threshold: hovering the bucket band names it in the tooltip (${renderer})`, async () => {
    const {page, close} = await chart(renderer, [["tooltipShared", false]]);
    try {
      const {band} = await painted(page);
      await moveTo(page, [band[0], band[1] - 1]);
      const result = await painted(page);
      assert.ok(
        result.tooltip.includes("Values < 5%"),
        `tooltip: ${result.tooltip}`,
      );
    } finally {
      await close();
    }
  });
}

it("StackedArea threshold: clicking the bucket opens onto the groups it holds", async () => {
  const {page, close} = await chart("svg", [
    ["groupBy", ["parent", "id"]],
    ["depth", 0],
    ["threshold", 0.45],
  ]);
  try {
    const labels = () =>
      page.evaluate(() => {
        const viz = window.__viz;
        return Array.from(
          new Set(viz._filteredData.map(d => viz._drawLabel(d))),
        );
      });
    assert.deepStrictEqual(await labels(), ["Top", "Values < 45%"]);
    await page.evaluate(
      () =>
        new Promise(resolve => {
          const viz = window.__viz;
          const bucket = viz._filteredData.find(d => d._isAggregation);
          viz.schema.on["click.shape"].call(viz, bucket, 0, undefined, {
            stopPropagation() {},
          });
          setTimeout(resolve, 400);
        }),
    );
    const opened = await labels();
    assert.ok(opened.includes("Delta"), `opened onto Rest: ${opened}`);
    assert.ok(!opened.includes("Alpha"), "Top's series stay out");
  } finally {
    await close();
  }
});
