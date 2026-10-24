import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    #784: Treemap's and Waffle's threshold bucket needs two or more items,
    and its tooltip (and Waffle's legend entry's) lists them with their
    values, largest first, on SVG and Canvas.
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
const data = Object.entries(sizes).map(([id, value]) => ({id, value}));
const SMALL = ["Fox", "India", "Golf", "Hotel", "Juliet"];

/** Opens a page with `kind` rendered into #viz, kept as `window.__viz`. */
async function chart(kind, renderer, rows = data) {
  const opened = await openPage(
    '<div id="viz" style="width:800px;height:500px;font-family:sans-serif;"></div>',
  );
  await opened.page.evaluate(
    ([kind, rows, renderer]) =>
      new Promise(resolve => {
        const viz = new window.d3plus[kind]()
          .data(rows)
          .groupBy("id")
          .sum("value")
          .threshold(0.05);
        window.__viz = viz;
        window.__surface = renderer === "canvas" ? "canvas" : "svg";
        viz.renderer(renderer).duration(0).select("#viz").render(resolve);
      }),
    [kind, rows, renderer],
  );
  return opened;
}

/**
    The client center of the bucket's mark (or, with `legend`, its legend
    swatch), and the labels of every drawn mark.
*/
function locate(page, legend = false) {
  return page.evaluate(legend => {
    const viz = window.__viz;
    const surface = document
      .querySelector(`#viz ${window.__surface}`)
      .getBoundingClientRect();
    const unwrap = d => {
      while (d && d.__d3plus__ && d.data) d = d.data;
      return d;
    };
    let point;
    const walk = (nodes, x, y) =>
      nodes.forEach(n => {
        const t = n.transform || {};
        const nx = x + (t.x || 0),
          ny = y + (t.y || 0);
        const inLegend = n.interactionGroup === "legend";
        if (
          !point &&
          n.type === "rect" &&
          inLegend === legend &&
          !`${n.key}`.endsWith("::hit") &&
          unwrap(n.datum)?._isAggregation
        )
          point = [
            surface.left + nx + n.x + n.width / 2,
            surface.top + ny + n.y + n.height / 2,
          ];
        if (n.children) walk(n.children, nx, ny);
      });
    walk([viz._paintedScene.root], 0, 0);
    return {
      point,
      labels: [...new Set(viz._filteredData.map(d => viz._drawLabel(d)))],
    };
  }, legend);
}

async function tooltipAt(page, point) {
  await page.mouse.move(5, 5);
  await page.mouse.move(point[0], point[1], {steps: 3});
  await page.waitForTimeout(150);
  return page.evaluate(
    () => document.querySelector(".d3plus-tooltip")?.innerText ?? "",
  );
}

/** Asserts every tooltip row has a value: none ends at its name's tab. */
function assertNoEmptyRows(tooltip) {
  assert.ok(
    !/\t[ \t]*$/m.test(tooltip),
    `an empty row: ${JSON.stringify(tooltip)}`,
  );
}

/** Asserts the tooltip lists `names`, one per row, in that order. */
function assertListed(tooltip, names) {
  const at = names.map(n => tooltip.indexOf(`${n}\t`));
  assert.ok(
    at.every((p, i) => p >= 0 && (i === 0 || p > at[i - 1])),
    `members ${names} in order: ${JSON.stringify(tooltip)}`,
  );
}

for (const renderer of ["svg", "canvas"]) {
  it(`Treemap threshold: the bucket's tooltip lists its items, largest first (${renderer})`, async () => {
    const {page, close} = await chart("Treemap", renderer);
    try {
      const {point} = await locate(page);
      const tooltip = await tooltipAt(page, point);
      assert.ok(tooltip.includes("Values < 5%"), `tooltip: ${tooltip}`);
      assertListed(tooltip, ["Share", ...SMALL]);
      assert.ok(tooltip.includes("Fox\t1.2"), tooltip);
    } finally {
      await close();
    }
  });

  it(`Treemap threshold: a lone small item stays as itself (${renderer})`, async () => {
    const lone = data.filter(d => !SMALL.slice(1).includes(d.id));
    const {page, close} = await chart("Treemap", renderer, lone);
    try {
      const {point, labels} = await locate(page);
      assert.strictEqual(point, undefined, "no bucket cell");
      assert.ok(labels.includes("Fox"), `labels: ${labels}`);
    } finally {
      await close();
    }
  });

  it(`Waffle threshold: the bucket's legend entry lists its items (${renderer})`, async () => {
    const {page, close} = await chart("Waffle", renderer);
    try {
      const {point} = await locate(page, true);
      const tooltip = await tooltipAt(page, point);
      assert.ok(tooltip.includes("Values < 5%"), `tooltip: ${tooltip}`);
      assertListed(tooltip, ["Value", "Share", ...SMALL]);
      assertNoEmptyRows(tooltip);
      assert.ok(tooltip.includes("Share\t2.91%"), tooltip);
      const labels = await page.evaluate(() =>
        window.__viz._legendClass.data().map(d => window.__viz._drawLabel(d)),
      );
      assert.deepStrictEqual(labels, [
        "Alpha",
        "Bravo",
        "Charlie",
        "Delta",
        "Echo",
        "Values < 5%",
      ]);
    } finally {
      await close();
    }
  });
}
