import {describe, it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    RadialArea renders in Chromium on both backends: see-through rings down
    to the center by default, bands stacked on the series before them with
    `stacked`, ring value labels above the areas, series labels inside the
    bands, hover and Canvas picking, growing out of the baseline on enter,
    and small multiples.
*/

const hours = [0, 6, 12, 18];
const sources = {Base: [30, 30, 30, 30], Heat: [40, 20, 10, 30]};
const energy = Object.keys(sources).flatMap(source =>
  hours.map((hour, k) => ({source, hour, kwh: sources[source][k]})),
);

const box = "<div id='viz' style='width:600px;height:500px'></div>";

/** Every painted node whose key matches `pattern`. Runs in the page. */
const paintedNodes = pattern => {
  const viz = window.__viz;
  const surface = document
    .querySelector("#viz svg, #viz canvas")
    .getBoundingClientRect();
  const out = [];
  const walk = (node, x, y) => {
    const t = node.transform || {};
    const nx = x + (t.x ?? 0),
      ny = y + (t.y ?? 0);
    if (new RegExp(pattern).test(`${node.key}`))
      out.push({
        key: `${node.key}`,
        shapeType: node.shapeType,
        d: node.d,
        enterD: node.enterD,
        paint: node.paint || {},
        interactive: node.interactive,
        text: node.lines?.map(l => l.text).join(" "),
        local: [t.x ?? 0, t.y ?? 0],
        at: [surface.left + nx, surface.top + ny],
      });
    (node.children || []).forEach(c => walk(c, nx, ny));
  };
  walk(viz._paintedScene.root, 0, 0);
  return out;
};

/** The visible tooltip's title and rows, or null. Runs in the page. */
const tooltip = () => {
  const t = document.querySelector(".d3plus-tooltip");
  if (!t || getComputedStyle(t).visibility === "hidden") return null;
  return {
    title: t.querySelector(".d3plus-tooltip-title")?.textContent ?? "",
    rows: Array.from(t.querySelectorAll(".d3plus-tooltip-tbody tr")).map(tr =>
      Array.from(tr.querySelectorAll("td")).map(td => td.textContent),
    ),
  };
};

/** Draws a RadialArea into a fresh page, kept as `window.__viz`. */
async function chart(renderer, config, rows = energy) {
  const opened = await openPage(box);
  await opened.page.evaluate(
    ([rows, renderer, src]) =>
      new Promise(resolve => {
        const viz = new window.d3plus.RadialArea()
          .select("#viz")
          .renderer(renderer)
          .duration(0)
          .data(rows)
          .groupBy("source")
          .x("hour")
          .y("kwh")
          .xDomain([0, 24])
          .config(new Function(`return (${src});`)());
        window.__viz = viz;
        viz.render(resolve);
      }),
    [rows, renderer, config],
  );
  return opened;
}

const probe = (page, pattern) =>
  page.evaluate(
    ([src, p]) => new Function(`return (${src})`)()(p),
    [paintedNodes.toString(), pattern],
  );
const run = (page, fn) =>
  page.evaluate(src => new Function(`return (${src})`)()(), fn.toString());

/** The radius of a dot's local position. */
const radius = dot => Math.hypot(...dot.local);

describe.each(["svg", "canvas"])("RadialArea (%s)", renderer => {
  it("fills see-through areas down to the center, under the ring labels", async () => {
    const {page, close} = await chart(renderer, "{}");
    try {
      const areas = await probe(page, "^radial-area-");
      assert.deepStrictEqual(areas.map(a => a.key).sort(), [
        "radial-area-Base",
        "radial-area-Heat",
      ]);
      for (const a of areas) {
        assert.strictEqual(a.shapeType, "Area");
        assert.strictEqual(a.paint.fillOpacity, 0.25, `${a.key}: see-through`);
        assert.strictEqual(a.paint.strokeWidth, 2);
        assert.strictEqual(a.interactive, true, "an area takes the pointer");
        assert.ok(/Z$/.test(a.d), `${a.key}: closed`);
        assert.ok(
          a.enterD && a.enterD !== a.d,
          `${a.key}: grows from the center`,
        );
      }
      const order = (
        await probe(page, "^radial-(area-|level-labels|point-)")
      ).map(n => n.key);
      const at = key => order.indexOf(key);
      assert.ok(
        at("radial-area-Heat") < at("radial-level-labels"),
        "ring labels sit above the areas",
      );
      assert.ok(
        at("radial-level-labels") < at("radial-point-Base-0"),
        "and beneath the dots",
      );
      const domain = await page.evaluate(
        () => window.__viz.ctx.radial.levels.domain,
      );
      assert.deepStrictEqual(domain, [0, 40], "unstacked: the largest value");
    } finally {
      await close();
    }
  });

  it("stacks each series on the ones before it, labeled inside its band", async () => {
    const {page, close} = await chart(
      renderer,
      "{stacked: true, lineLabels: true, levels: [0, 35, 70]}",
    );
    try {
      const frame = await page.evaluate(() => ({
        outer: window.__viz.ctx.radial.outer,
        domain: window.__viz.ctx.radial.levels.domain,
      }));
      assert.deepStrictEqual(frame.domain, [0, 70], "the tallest stack");
      const dots = Object.fromEntries(
        (await probe(page, "^radial-point-")).map(d => [d.key, d]),
      );
      const near = (a, b, msg) =>
        assert.ok(Math.abs(a - b) < 1e-6, `${msg}: ${a} ≈ ${b}`);
      near(
        radius(dots["radial-point-Base-0"]),
        (30 / 70) * frame.outer,
        "Base",
      );
      near(
        radius(dots["radial-point-Heat-0"]),
        (70 / 70) * frame.outer,
        "Heat sits on Base",
      );
      const areas = await probe(page, "^radial-area-");
      for (const a of areas) {
        assert.strictEqual(a.paint.fillOpacity, 0.85, `${a.key}: solid`);
        assert.strictEqual(a.d.split("Z").filter(Boolean).length, 2, "a ring");
      }
      const labels = await probe(page, "^radial-series-label-");
      assert.ok(labels.length >= 1, "a band is named");
      for (const l of labels) {
        const r = radius(l);
        const name = l.key.replace("radial-series-label-", "");
        const [lo, hi] = name === "Base" ? [0, 30] : [30, 70];
        assert.ok(
          r >= (lo / 70) * frame.outer && r <= (hi / 70) * frame.outer,
          `${name} sits inside its band (${r})`,
        );
      }
    } finally {
      await close();
    }
  });

  it("hovering a stacked dot shows the series' own value", async () => {
    const {page, close} = await chart(renderer, "{stacked: true}");
    try {
      const [dot] = await probe(page, "^radial-point-Heat-6$");
      await page.mouse.move(5, 5);
      await page.mouse.move(dot.at[0], dot.at[1], {steps: 3});
      await page.waitForTimeout(80);
      assert.deepStrictEqual(await run(page, tooltip), {
        title: "Heat",
        rows: [["6", "20"]],
      });
      const opacity = Object.fromEntries(
        (await probe(page, "^radial-area-")).map(n => [
          n.key,
          n.paint.opacity ?? 1,
        ]),
      );
      assert.strictEqual(opacity["radial-area-Heat"], 1);
      assert.strictEqual(opacity["radial-area-Base"], 0.5);
    } finally {
      await close();
    }
  });

  it("draws one panel per facet", async () => {
    const rows = ["North", "South"].flatMap(region =>
      energy.map(d => ({...d, region})),
    );
    const {page, close} = await chart(
      renderer,
      `{stacked: true, facet: "region"}`,
      rows,
    );
    try {
      const areas = await probe(page, "radial-area-");
      assert.strictEqual(areas.length, 4, "two bands per panel");
    } finally {
      await close();
    }
  });
});
