import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {chart, hover, pointOf} from "./colorScale-page.js";

/**
    A swatch that stands for a mark (a tooltip's title or row, a legend
    entry) carries the mark's stroke: a Geomap region's tooltip swatch is
    outlined in the region's border, and a mark with no visible stroke gives
    its swatch none, even while hover emphasis outlines the mark itself.
*/

const regions = [{id: "alpha"}, {id: "beta"}, {id: "gamma"}];

const topojson = {
  type: "Topology",
  objects: {
    geo: {
      type: "GeometryCollection",
      geometries: regions.map((r, k) => ({
        type: "Polygon",
        id: r.id,
        arcs: [[k]],
      })),
    },
  },
  arcs: regions.map((r, k) => [
    [k * 12, 0],
    [k * 12, 10],
    [k * 12 + 10, 10],
    [k * 12 + 10, 0],
    [k * 12, 0],
  ]),
};

const geomap = (theme = "light") => `lib => new lib.Geomap()
  .data([{id: "alpha", value: 4}, {id: "gamma", value: 9}])
  .groupBy("id")
  .colorScale("value")
  .tiles(false)
  .ocean("transparent")
  .theme(${JSON.stringify(theme)})
  .topojson(${JSON.stringify(topojson)})`;

const rows = [
  {id: "Alpha", value: 30},
  {id: "Beta", value: 20},
  {id: "Gamma", value: 10},
];

const treemap = (shapeConfig = {}) => `lib => new lib.Treemap()
  .data(${JSON.stringify(rows)})
  .groupBy("id")
  .sum("value")
  .legend(true)
  .shapeConfig(${JSON.stringify(shapeConfig)})`;

const stacked = [];
["Alpha", "Beta", "Gamma"].forEach((id, s) =>
  [2010, 2011, 2012].forEach((year, k) =>
    stacked.push({id, year, value: 10 * (s + 1) + k}),
  ),
);

const plot = (kind, config) => `lib => new lib.${kind}()
  .data(${JSON.stringify(stacked)})
  .groupBy("id")
  .x("year")
  .y("value")
  .config(${JSON.stringify(config)})`;

/** Hovers `point`, then nudges the pointer so the pick lands on the hover-emphasized repaint. */
async function hoverAgain(page, point) {
  await hover(page, point);
  await page.mouse.move(point[0] + 1, point[1] + 1);
  await page.waitForTimeout(120);
}

/** Every tooltip swatch, title first: its fill, its outline (or null), and its kind. */
const swatches = page =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll(".d3plus-tooltip-swatch")).map(sw => {
      const line = sw.classList.contains("d3plus-tooltip-swatch-line");
      return {
        line,
        fill: (line ? sw.lastElementChild : sw).style.backgroundColor,
        image: /url\("data:image\/svg\+xml/.test(sw.style.backgroundImage),
        outline:
          sw.style.borderStyle === "solid"
            ? [sw.style.borderColor, sw.style.borderWidth]
            : null,
      };
    }),
  );

/** `color` as the browser serializes it, to compare with a swatch's style. */
const css = (page, color) =>
  page.evaluate(c => {
    const el = document.createElement("span");
    el.style.color = c;
    return el.style.color;
  }, color);

/** The paint of the chart's own (un-emphasized) mark matching `match`. */
const markPaint = (page, match) =>
  page.evaluate(match => {
    const test = new Function("node", `return (${match})(node);`);
    let found = null;
    const walk = node => {
      if (!found && node.paint && node.datum && test(node)) found = node.paint;
      (node.children || []).forEach(walk);
    };
    (window.__viz._chartScene || []).forEach(walk);
    return found;
  }, match);

/** The painted paint of the mark matching `match` (after any hover emphasis). */
const paintedPaint = (page, match) =>
  page.evaluate(match => {
    const test = new Function("node", `return (${match})(node);`);
    let found = null;
    const walk = node => {
      if (
        !found &&
        node.paint &&
        node.datum &&
        !String(node.key).endsWith("::hit") &&
        test(node)
      )
        found = node.paint;
      (node.children || []).forEach(walk);
    };
    walk(window.__viz._paintedScene.root);
    return found;
  }, match);

/** The legend's swatches as the legend draws them: `[stroke, strokeWidth]` per swatch. */
const legendStrokes = page =>
  page.evaluate(() => {
    const out = [];
    const walk = node => {
      if (
        (node.type === "rect" || node.type === "circle") &&
        node.datum &&
        !String(node.key).endsWith("::hit")
      )
        out.push([node.paint.stroke, node.paint.strokeWidth]);
      (node.children || []).forEach(walk);
    };
    walk(window.__viz._legendClass.toScene());
    return out;
  });

/** The painted legend swatches, after any hover or active emphasis: `[stroke, strokeWidth]` per swatch. */
const paintedLegend = page =>
  page.evaluate(() => {
    const out = [];
    const walk = node => {
      if (
        node.interactionGroup === "legend" &&
        (node.type === "rect" || node.type === "circle") &&
        node.datum &&
        !String(node.key).endsWith("::hit")
      )
        out.push([node.paint.stroke, node.paint.strokeWidth]);
      (node.children || []).forEach(walk);
    };
    walk(window.__viz._paintedScene.root);
    return out;
  });

/** Sets the chart's active predicate and waits for its repaint. */
const activate = (page, id) =>
  page.evaluate(
    id =>
      new Promise(resolve => {
        window.__viz.active(d => d.id === id);
        requestAnimationFrame(() => setTimeout(resolve, 50));
      }),
    id,
  );

/** The legend's textured swatches: their scene fill tokens, and on SVG the DOM fills. */
const legendTextures = page =>
  page.evaluate(() => {
    const scene = [];
    const walk = node => {
      if (
        node.interactionGroup === "legend" &&
        (node.type === "rect" || node.type === "circle") &&
        node.datum &&
        !String(node.key).endsWith("::hit")
      )
        scene.push(String(node.paint.fill));
      (node.children || []).forEach(walk);
    };
    walk(window.__viz._paintedScene.root);
    const legend = document.querySelector('#viz [data-key="viz-legend"]');
    const dom = legend
      ? Array.from(legend.querySelectorAll("rect, circle"))
          .map(n => n.getAttribute("fill") || "")
          .filter(f => f.startsWith("url("))
      : [];
    return {scene, dom};
  });

const bar = id =>
  `n => n.shapeType === "Bar" && n.datum && (n.datum.data || n.datum).id === "${id}" && (n.datum.data || n.datum).year === 2010`;

const region = id =>
  `n => n.type === "path" && n.datum && n.datum.id === ${JSON.stringify(id)}`;

for (const renderer of ["svg", "canvas"]) {
  for (const theme of ["light", "dark"])
    for (const id of ["alpha", "beta"])
      it(`${renderer}, ${theme}: a Geomap region's tooltip swatch takes its border (${id === "beta" ? "no data" : "data"})`, async () => {
        const {page, close} = await chart(geomap(theme), renderer);
        try {
          const paint = await markPaint(page, region(id));
          assert.ok(paint.strokeWidth > 0, "the region draws a border");
          await hoverAgain(page, await pointOf(page, region(id)));
          const [title] = await swatches(page);
          assert.ok(title, "the title leads with a swatch");
          assert.strictEqual(title.fill, await css(page, paint.fill));
          assert.deepStrictEqual(title.outline, [
            await css(page, paint.stroke),
            "1px",
          ]);
        } finally {
          await close();
        }
      });

  it(`${renderer}: a mark without a stroke gives its swatch none, hovered or not`, async () => {
    const {page, close} = await chart(treemap(), renderer);
    try {
      const alpha = `n => n.type === "rect" && n.datum && n.datum.id === "Alpha"`;
      assert.strictEqual((await markPaint(page, alpha)).strokeWidth, 0);
      await hoverAgain(page, await pointOf(page, alpha));
      assert.ok(
        (await paintedPaint(page, alpha)).strokeWidth > 0,
        "hover outlines the mark itself",
      );
      const [title] = await swatches(page);
      assert.ok(title, "the title leads with a swatch");
      assert.strictEqual(title.outline, null);
      for (const [, width] of await legendStrokes(page))
        assert.strictEqual(width, 0, "no legend swatch outline");
      const lit = (await paintedLegend(page)).map(([, w]) => w);
      assert.ok(lit.includes(1), "the lit legend swatch takes a 1px outline");
      assert.ok(
        lit.every(w => w === 0 || w === 1),
        `and none wider (${lit})`,
      );
    } finally {
      await close();
    }
  });

  it(`${renderer}: tooltip and legend swatches take shapeConfig's per-shape stroke`, async () => {
    const {page, close} = await chart(
      treemap({Rect: {stroke: "#ff0000", strokeWidth: 3}}),
      renderer,
    );
    try {
      const red = await css(page, "#ff0000");
      const legend = await legendStrokes(page);
      assert.strictEqual(legend.length, 3, "a swatch per entry");
      for (const [stroke, width] of legend) {
        assert.strictEqual(stroke, "#ff0000");
        assert.strictEqual(width, 1, "1px, whatever the mark's width");
      }
      await hoverAgain(
        page,
        await pointOf(
          page,
          `n => n.type === "rect" && n.datum && n.datum.id === "Alpha"`,
        ),
      );
      const [title] = await swatches(page);
      assert.deepStrictEqual(
        title.outline,
        [red, "1px"],
        "1px, whatever the mark's width",
      );
      for (const [, width] of await paintedLegend(page))
        assert.strictEqual(width, 1, "a lit legend swatch stays 1px");
      await activate(page, "Beta");
      for (const [, width] of await paintedLegend(page))
        assert.strictEqual(width, 1, "an active legend swatch stays 1px");
    } finally {
      await close();
    }
  });

  it(`${renderer}: a legend entry's tooltip swatch takes its stroke`, async () => {
    const {page, close} = await chart(
      treemap({Rect: {stroke: "#ff0000", strokeWidth: 1}}),
      renderer,
    );
    try {
      await hoverAgain(
        page,
        await pointOf(
          page,
          `n => n.interactionGroup === "legend" && n.type === "rect"`,
        ),
      );
      const [title] = await swatches(page);
      assert.ok(title, "the legend tooltip leads with a swatch");
      assert.deepStrictEqual(title.outline, [
        await css(page, "#ff0000"),
        "1px",
      ]);
    } finally {
      await close();
    }
  });

  it(`${renderer}: shared tooltip rows take each bar's fill and stroke`, async () => {
    const {page, close} = await chart(
      plot("BarChart", {
        stacked: true,
        shapeConfig: {Bar: {stroke: "#00aa00", strokeWidth: 1}},
      }),
      renderer,
    );
    try {
      const beta = bar("Beta");
      await hoverAgain(page, await pointOf(page, beta));
      const rows = await swatches(page);
      assert.strictEqual(rows.length, 3, "a row per series");
      const green = await css(page, "#00aa00");
      for (const row of rows)
        assert.deepStrictEqual(row.outline, [green, "1px"]);
      const fills = await Promise.all(
        ["Alpha", "Beta", "Gamma"].map(async id =>
          css(page, (await markPaint(page, bar(id))).fill),
        ),
      );
      assert.deepStrictEqual(
        rows.map(r => r.fill).sort(),
        fills.sort(),
        "each row in its bar's fill",
      );
    } finally {
      await close();
    }
  });

  it(`${renderer}: shared tooltip rows of Lines take no outline`, async () => {
    const {page, close} = await chart(
      plot("LinePlot", {shapeConfig: {Line: {strokeWidth: 4}}}),
      renderer,
    );
    try {
      await hoverAgain(
        page,
        await pointOf(
          page,
          `n => n.shapeType === "Line" && n.datum && n.datum.id === "Beta"`,
        ),
      );
      const rows = await swatches(page);
      assert.ok(rows.length > 1, "a row per series");
      for (const row of rows) {
        assert.ok(row.line, "a line swatch");
        assert.strictEqual(row.outline, null);
      }
    } finally {
      await close();
    }
  });

  for (const theme of ["light", "dark"]) {
    it(`${renderer}, ${theme}: a textured mark's swatches draw its texture`, async () => {
      const {page, close} = await chart(
        treemap({
          Rect: {texture: "lines", stroke: "#123456", strokeWidth: 1},
        }).replace(".legend(true)", `.legend(true).theme("${theme}")`),
        renderer,
      );
      try {
        const alpha = `n => n.type === "rect" && n.datum && n.datum.id === "Alpha"`;
        const {fill} = await markPaint(page, alpha);
        assert.ok(fill.startsWith("pattern:"), "the mark is textured");
        const legend = await legendTextures(page);
        assert.strictEqual(legend.scene.length, 3, "a swatch per entry");
        assert.ok(
          legend.scene.every(f => f.startsWith("pattern:")),
          "every legend swatch takes the per-shape texture",
        );
        assert.ok(
          legend.scene.includes(fill),
          "Alpha's swatch draws Alpha's own pattern",
        );
        if (renderer === "svg")
          assert.strictEqual(legend.dom.length, 3, "drawn as SVG patterns");
        await hoverAgain(page, await pointOf(page, alpha));
        const [title] = await swatches(page);
        assert.ok(title.image, "the tooltip swatch draws the pattern");
        assert.strictEqual(
          title.fill,
          await css(page, JSON.parse(fill.slice("pattern:".length)).background),
          "over its background",
        );
        assert.deepStrictEqual(title.outline, [
          await css(page, "#123456"),
          "1px",
        ]);
      } finally {
        await close();
      }
    });

    it(`${renderer}, ${theme}: shared tooltip rows draw each bar's texture`, async () => {
      const {page, close} = await chart(
        plot("BarChart", {
          stacked: true,
          theme,
          shapeConfig: {Bar: {texture: "lines"}},
        }),
        renderer,
      );
      try {
        await hoverAgain(page, await pointOf(page, bar("Beta")));
        const rows = await swatches(page);
        assert.strictEqual(rows.length, 3, "a row per series");
        assert.ok(
          rows.every(r => r.image),
          "every row draws its texture",
        );
        const legend = await legendTextures(page);
        assert.ok(
          legend.scene.length === 3 &&
            legend.scene.every(f => f.startsWith("pattern:")),
          "the legend draws shapeConfig.Bar's texture",
        );
      } finally {
        await close();
      }
    });
  }

  for (const theme of ["light", "dark"])
    it(`${renderer}, ${theme}: a stroke in the chart's background is a gap, not an outline`, async () => {
      const {page, close} = await chart(
        `lib => new lib.Pie()
          .data(${JSON.stringify(rows)})
          .groupBy("id")
          .value("value")
          .legend(true)
          .theme(${JSON.stringify(theme)})`,
        renderer,
      );
      try {
        const alpha = `n => n.type === "path" && n.datum && n.datum.id === "Alpha"`;
        const paint = await markPaint(page, alpha);
        assert.ok(paint.strokeWidth > 0, "the wedges are cut apart");
        for (const [, width] of await legendStrokes(page))
          assert.strictEqual(width, 0, "no legend swatch outline");
        await hoverAgain(page, await pointOf(page, alpha));
        const [title] = await swatches(page);
        assert.ok(title, "the title leads with a swatch");
        assert.strictEqual(title.outline, null);
      } finally {
        await close();
      }
    });
}
