import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    Switching a drawn chart's theme, in Chromium on SVG and Canvas, with the
    chart's own transition: `.theme("dark")` after the first render paints the
    dark background beneath the marks (a Canvas chart once painted the new
    background over them, leaving it blank), and an `"auto"` chart follows
    the system's color scheme when it flips.
*/

const box = "<div id='viz' style='width:480px;height:360px'></div>";

const charts = {
  Network: {
    nodes: [
      {id: "a", x: 0, y: 0},
      {id: "b", x: 10, y: 5},
      {id: "c", x: 3, y: 9},
    ],
    links: [
      {source: "a", target: "b"},
      {source: "b", target: "c"},
    ],
  },
  Treemap: {
    data: [
      {id: "a", value: 30},
      {id: "b", value: 20},
      {id: "c", value: 12},
    ],
    sum: "value",
  },
};

/** Runs in the page: draws `chart`, resolving once its transition settles. */
const draw = ([chart, json, renderer]) =>
  new Promise(resolve => {
    const viz = new window.d3plus[chart]()
      .select("#viz")
      .renderer(renderer)
      .legend(false)
      .config(JSON.parse(json));
    window.__viz = viz;
    viz.render(() => setTimeout(resolve, viz.duration() + 200));
  });

/** Runs in the page: sets a forced theme and redraws, with the transition. */
const switchTheme = theme =>
  new Promise(resolve => {
    const viz = window.__viz;
    viz.theme(theme).render(() => setTimeout(resolve, viz.duration() + 200));
  });

/**
    Runs in the page: the color painted inside mark "a" (clear of its label)
    and at the middle of the chart's top edge (in the controls' row, clear of
    every mark and control), each as `[r, g, b, a]`, with the mark's fill and the theme's
    background as the same. Canvas reads its pixels; SVG is rasterized
    first.
*/
const sample = async () => {
  const viz = window.__viz;
  let mark = null;
  const walk = (n, x, y) => {
    const t = n.transform || {};
    const nx = x + (t.x || 0);
    const ny = y + (t.y || 0);
    const id = n.datum?.id ?? n.datum?.data?.id;
    if (!mark && id === "a" && (n.type === "circle" || n.type === "rect"))
      mark = {
        x: n.type === "circle" ? nx + n.cx - n.r * 0.7 : nx + n.x + 4,
        y: n.type === "circle" ? ny + n.cy : ny + n.y + n.height - 4,
        fill: n.paint?.fill,
      };
    (n.children || []).forEach(c => walk(c, nx, ny));
  };
  walk(viz._paintedScene.root, 0, 0);
  const swatch = document.createElement("canvas").getContext("2d");
  const rgba = color => {
    swatch.clearRect(0, 0, 1, 1);
    swatch.fillStyle = color;
    swatch.fillRect(0, 0, 1, 1);
    return Array.from(swatch.getImageData(0, 0, 1, 1).data);
  };
  const edge = {x: viz.schema.width / 2, y: 3};
  let canvas = document.querySelector("#viz canvas");
  if (!canvas) {
    // Rasterize the SVG, to read its pixels the same way.
    const svg = document.querySelector("#viz svg");
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      new XMLSerializer().serializeToString(svg),
    )}`;
    await img.decode();
    canvas = document.createElement("canvas");
    canvas.width = viz.schema.width;
    canvas.height = viz.schema.height;
    canvas.getContext("2d").drawImage(img, 0, 0);
  }
  const ratio = canvas.width / viz.schema.width;
  const ctx = canvas.getContext("2d");
  const at = p =>
    Array.from(
      ctx.getImageData(Math.round(p.x * ratio), Math.round(p.y * ratio), 1, 1)
        .data,
    );
  return {
    mark: at(mark),
    edge: at(edge),
    fill: rgba(mark.fill),
    background: rgba(viz._theme.background),
    dark: viz._theme.dark,
  };
};

const near = (a, b, msg) =>
  assert.ok(
    a.every((v, k) => Math.abs(v - b[k]) <= 3),
    `${msg}: ${a} vs ${b}`,
  );

for (const renderer of ["svg", "canvas"])
  for (const [chart, config] of Object.entries(charts)) {
    it(`${chart} ${renderer}: setting a dark theme after the first render paints it beneath the marks`, async () => {
      const {page, errors, close} = await openPage(box);
      try {
        await page.evaluate(draw, [chart, JSON.stringify(config), renderer]);
        const before = await page.evaluate(sample);
        near(before.mark, before.fill, "the mark is painted");
        await page.evaluate(switchTheme, "dark");
        const after = await page.evaluate(sample);
        assert.ok(after.dark, "the theme is dark");
        near(after.edge, after.background, "the dark background");
        near(after.mark, after.fill, "the mark stays on top");
        await page.evaluate(switchTheme, "light");
        const back = await page.evaluate(sample);
        near(back.edge, back.background, "the light background");
        near(back.mark, back.fill, "the mark stays on top");
        assert.deepStrictEqual(errors, [], "no page errors");
      } finally {
        await close();
      }
    });
  }

for (const renderer of ["svg", "canvas"])
  it(`Treemap ${renderer}: an "auto" chart follows the system color scheme when it flips`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.emulateColorScheme("light");
      await page.evaluate(() => {
        document.documentElement.style.colorScheme = "light dark";
      });
      await page.evaluate(draw, [
        "Treemap",
        JSON.stringify(charts.Treemap),
        renderer,
      ]);
      const before = await page.evaluate(sample);
      assert.ok(!before.dark, "light to start");
      await page.emulateColorScheme("dark");
      await page.waitForTimeout(1200);
      const after = await page.evaluate(sample);
      assert.ok(after.dark, "dark once the system is");
      near(after.mark, after.fill, "the marks are painted");
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await page.emulateColorScheme(null);
      await close();
    }
  });
