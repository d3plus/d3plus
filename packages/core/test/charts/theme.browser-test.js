import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {rgb} from "d3-color";

import {render} from "~test/browser/render.js";
import {openPage} from "~test/browser/page.js";
import {themeDark, themeLight} from "../../src/utils/theme.ts";

/**
    Chart themes: a forced theme paints its background into the scene and
    takes every chrome color from its tokens on any page, `"auto"` follows
    the page (and redraws when it flips), and colors the user sets win.
*/

const hex = c => (c ? rgb(c).formatHex() : c);

/**
    Draws a titled BarChart with a titled legend into `#viz` and reports the
    colors of its chrome: the background node, the title, the axis texts and
    lines, the gridlines, the legend title, the overlay host's color-scheme,
    and (for canvas) the painted pixel at the chart's top-left corner.
*/
const chrome = ({theme, renderer, extra}) =>
  new Promise((resolve, reject) => {
    const viz = new window.d3plus.BarChart()
      .data([
        {id: "alpha", x: "A", y: 4},
        {id: "beta", x: "A", y: 7},
        {id: "alpha", x: "B", y: 5},
        {id: "beta", x: "B", y: 2},
      ])
      .groupBy("id")
      .x("x")
      .y("y")
      .title("Title")
      .legendConfig({title: "Groups"})
      .renderer(renderer)
      .duration(0)
      .select("#viz");
    if (theme !== undefined) viz.theme(theme);
    if (extra) viz.config(extra);
    window.__viz = viz;
    viz.render(() => {
      try {
        const out = {
          background: null,
          title: null,
          legendTitle: null,
          axisText: [],
          axisLine: [],
          grid: [],
        };
        const walk = (n, inAxis, inLegend) => {
          const axis = inAxis || /^plot-[xy]2?-axis$/.test(n.key);
          const legend = inLegend || n.key === "viz-legend";
          if (n.key === "viz-background") out.background = n.paint.fill;
          if (n.key === "viz-title" && n.type === "text")
            out.title = n.paint.fill;
          if (
            legend &&
            n.type === "text" &&
            (n.lines || []).map(l => l.text).join("") === "Groups"
          )
            out.legendTitle = n.paint.fill;
          if (axis && n.type === "text") out.axisText.push(n.paint.fill);
          if (n.type === "line" && n.paint && n.paint.stroke) {
            if (/^grid-/.test(n.key)) {
              if (n.paint.stroke !== "transparent")
                out.grid.push(n.paint.stroke);
            } else if (axis) out.axisLine.push(n.paint.stroke);
          }
          (n.children || []).forEach(c => walk(c, axis, legend));
        };
        const root = viz.toScene().root;
        walk(root, false, false);
        out.firstKey = root.children[0] && root.children[0].key;
        const host = document.querySelector("#viz .d3plus-render-overlays");
        out.scheme = host ? host.style.colorScheme : null;
        if (renderer === "canvas") {
          const canvas = viz.toCanvas();
          const ratio = canvas.width / canvas.getBoundingClientRect().width;
          const [r, g, b, a] = canvas
            .getContext("2d")
            .getImageData(2 * ratio, 2 * ratio, 1, 1).data;
          out.pixel = a ? `rgb(${r}, ${g}, ${b})` : null;
        } else {
          const rect = document.querySelector(
            '#viz [data-key="viz-background"]',
          );
          out.pixel = rect ? rect.getAttribute("fill") : null;
        }
        resolve(out);
      } catch (e) {
        reject(e);
      }
    });
  });

const page = background =>
  `<div id="viz" style="width:600px;height:400px;background:${background}"></div>`;

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer}: theme("dark") on a white page paints the dark tokens`, async () => {
    const out = await render(page("#ffffff"), chrome, {
      theme: "dark",
      renderer,
    });
    assert.strictEqual(
      out.firstKey,
      "viz-background",
      "background at the back",
    );
    assert.strictEqual(hex(out.background), themeDark.background);
    assert.strictEqual(hex(out.pixel), themeDark.background, "painted");
    assert.strictEqual(hex(out.title), themeDark.text);
    assert.strictEqual(hex(out.legendTitle), themeDark.text);
    assert.ok(out.axisText.length >= 2, "axis texts found");
    for (const f of out.axisText) assert.strictEqual(hex(f), themeDark.axis);
    assert.ok(out.axisLine.length >= 1, "axis lines found");
    for (const s of out.axisLine) assert.strictEqual(hex(s), themeDark.axis);
    assert.ok(out.grid.length >= 1, "gridlines found");
    for (const s of out.grid) assert.strictEqual(hex(s), themeDark.gridline);
    assert.strictEqual(out.scheme, "dark");
  });

  it(`${renderer}: theme("light") on a dark page paints the light tokens`, async () => {
    const out = await render(page("#000000"), chrome, {
      theme: "light",
      renderer,
    });
    assert.strictEqual(hex(out.background), themeLight.background);
    assert.strictEqual(hex(out.pixel), themeLight.background, "painted");
    assert.strictEqual(hex(out.title), themeLight.text);
    assert.strictEqual(hex(out.legendTitle), themeLight.text);
    assert.ok(out.grid.length >= 1, "gridlines found");
    for (const s of out.grid) assert.strictEqual(hex(s), themeLight.gridline);
    assert.strictEqual(out.scheme, "light");
  });
}

it("auto on a dark page paints no background, and its ink and overlays follow", async () => {
  const out = await render(page("#212529"), chrome, {renderer: "svg"});
  assert.strictEqual(out.background, null, "no background node");
  assert.strictEqual(hex(out.title), themeDark.text);
  assert.strictEqual(hex(out.legendTitle), themeDark.text);
  for (const s of out.grid) assert.strictEqual(hex(s), themeDark.gridline);
  assert.strictEqual(out.scheme, "dark");
});

it("auto on a white page keeps the light chrome and the page's color-scheme", async () => {
  const out = await render(page("#ffffff"), chrome, {renderer: "svg"});
  assert.strictEqual(out.background, null);
  assert.strictEqual(hex(out.title), themeLight.text);
  assert.strictEqual(out.scheme, "");
});

it("a custom theme layers its tokens over its base", async () => {
  const out = await render(page("#ffffff"), chrome, {
    theme: {base: "dark", background: "#112233", gridline: "#445566"},
    renderer: "svg",
  });
  assert.strictEqual(hex(out.background), "#112233");
  assert.strictEqual(hex(out.title), themeDark.text);
  for (const s of out.grid) assert.strictEqual(hex(s), "#445566");
});

/** The fills of a LinePlot's end-of-line labels (outside its legend). */
const lineLabelFills = theme =>
  new Promise(resolve => {
    const viz = new window.d3plus.LinePlot()
      .data([
        {id: "alpha", x: 1, y: 4},
        {id: "alpha", x: 2, y: 6},
        {id: "beta", x: 1, y: 2},
        {id: "beta", x: 2, y: 3},
      ])
      .groupBy("id")
      .lineLabels(true)
      .legend(false)
      .theme(theme)
      .duration(0)
      .select("#viz");
    viz.render(() =>
      resolve(
        [...document.querySelectorAll("#viz text")]
          .filter(t => ["alpha", "beta"].includes(t.textContent.trim()))
          .map(t => getComputedStyle(t).fill),
      ),
    );
  });

it("a dark theme's end-of-line labels take its text color", async () => {
  const dark = await render(page("#ffffff"), lineLabelFills, "dark");
  assert.ok(dark.length >= 2);
  for (const f of dark) assert.strictEqual(hex(f), themeDark.text);
  const light = await render(page("#ffffff"), lineLabelFills, "light");
  for (const f of light) assert.strictEqual(hex(f), "#000000");
});

/** The stroke of each link in a Sankey drawn with `theme`. */
const sankeyLinkStrokes = theme =>
  new Promise(resolve => {
    const viz = new window.d3plus.Sankey()
      .links([
        {source: "a", target: "b", value: 4},
        {source: "b", target: "c", value: 2},
      ])
      .theme(theme)
      .duration(0)
      .select("#viz");
    viz.render(() => {
      const strokes = [];
      const walk = n => {
        if (n.type === "path" && n.datum?.source) strokes.push(n.paint.stroke);
        (n.children || []).forEach(walk);
      };
      walk(viz.toScene().root);
      resolve(strokes);
    });
  });

it("a dark Sankey's links recede, and a custom link color still wins", async () => {
  const dark = await render(page("#ffffff"), sankeyLinkStrokes, "dark");
  assert.ok(dark.length >= 2);
  for (const s of dark) assert.strictEqual(hex(s), "#343a40");
  const light = await render(page("#ffffff"), sankeyLinkStrokes, "light");
  for (const s of light) assert.strictEqual(hex(s), "#dbdbdb");
  const custom = await render(page("#ffffff"), sankeyLinkStrokes, {
    base: "dark",
    link: "#ff0000",
  });
  for (const s of custom) assert.strictEqual(hex(s), "#ff0000");
});

it("a titleConfig fontColor the user sets beats the theme", async () => {
  const out = await render(page("#ffffff"), chrome, {
    theme: "dark",
    renderer: "svg",
    extra: {
      titleConfig: {fontColor: "#ff0000"},
      legendConfig: {titleConfig: {fontColor: "#00ff00"}},
    },
  });
  assert.strictEqual(hex(out.title), "#ff0000");
  assert.strictEqual(hex(out.legendTitle), "#00ff00");
});

it("a dark chart's SVG export includes its background", async () => {
  const markup = await render(
    page("#ffffff"),
    () =>
      new Promise(resolve => {
        const viz = new window.d3plus.Treemap()
          .data([
            {id: "a", value: 1},
            {id: "b", value: 2},
          ])
          .theme("dark")
          .duration(0)
          .select("#viz");
        viz.render(() => resolve(viz.toSVGString()));
      }),
  );
  const rect = /<rect[^>]*data-key="viz-background"[^>]*>/.exec(markup);
  assert.ok(rect, "the export has the background rect");
  assert.ok(
    new RegExp(`fill="(${themeDark.background}|rgb\\(33, 37, 41\\))"`).test(
      rect[0],
    ),
    rect[0],
  );
});

it("the table view is readable in a dark theme", async () => {
  const out = await render(
    page("#ffffff"),
    () =>
      new Promise(resolve => {
        new window.d3plus.BarChart()
          .data([
            {id: "a", x: "Q1", y: 10},
            {id: "b", x: "Q1", y: 20},
          ])
          .groupBy("id")
          .x("x")
          .y("y")
          .theme("dark")
          .duration(0)
          .select("#viz")
          .render(() => {
            document
              .querySelector(
                ".d3plus-top-left-controls-item .table-view-toggle",
              )
              .click();
            const frame = document.querySelector(".d3plus-table-view-frame");
            const th = frame.querySelector("th");
            const td = frame.querySelector("td");
            resolve({
              background: getComputedStyle(frame).backgroundColor,
              color: getComputedStyle(frame).color,
              th: getComputedStyle(th).backgroundColor,
              td: getComputedStyle(td).color,
            });
          });
      }),
  );
  assert.strictEqual(hex(out.background), themeDark.table.background);
  assert.strictEqual(hex(out.color), themeDark.table.text);
  assert.strictEqual(hex(out.th), themeDark.table.header);
  assert.strictEqual(hex(out.td), themeDark.table.text);
});

it("an auto chart redraws when the page flips to dark", async () => {
  const out = await render(
    `<div id="viz" style="width:600px;height:400px"></div>`,
    () =>
      new Promise((resolve, reject) => {
        const viz = new window.d3plus.Treemap()
          .data([
            {id: "a", value: 1},
            {id: "b", value: 2},
          ])
          .title("Title")
          .duration(0)
          .select("#viz");
        const titleFill = () => {
          let fill = null;
          const walk = n => {
            if (n.key === "viz-title" && n.type === "text") fill = n.paint.fill;
            (n.children || []).forEach(walk);
          };
          walk(viz.toScene().root);
          return fill;
        };
        viz.render(() => {
          const before = {dark: viz._theme.dark, title: titleFill()};
          document.body.style.background = "#000";
          const started = Date.now();
          const poll = () => {
            if (viz._theme.dark) {
              document.body.style.background = "";
              viz.destroy();
              resolve({before, after: {dark: true, title: titleFill()}});
            } else if (Date.now() - started > 3000) {
              document.body.style.background = "";
              reject(new Error("the chart never redrew"));
            } else setTimeout(poll, 20);
          };
          poll();
        });
      }),
  );
  assert.strictEqual(out.before.dark, false);
  assert.strictEqual(out.after.dark, true);
  assert.strictEqual(hex(out.before.title), themeLight.text);
  assert.strictEqual(hex(out.after.title), themeDark.text);
});

/**
    Hovers the first bar of a BarChart on `background` with `theme` and
    returns the visible tooltip's computed colors.
*/
async function tooltipColors(background, theme, extra) {
  const {page, errors, close} = await openPage(
    `<div id="viz" style="width:600px;height:400px;background:${background}"></div>`,
  );
  try {
    const point = await page.evaluate(
      ([theme, extra]) =>
        new Promise(resolve => {
          const viz = new window.d3plus.BarChart()
            .data([
              {id: "alpha", x: "A", y: 4},
              {id: "beta", x: "B", y: 7},
            ])
            .groupBy("id")
            .x("x")
            .y("y")
            .duration(0)
            .select("#viz");
          if (theme) viz.theme(theme);
          // Rebuilt in the page's realm, where config bags merge as plain objects.
          if (extra) viz.config(JSON.parse(JSON.stringify(extra)));
          viz.render(() => {
            const box = document
              .querySelector("#viz svg")
              .getBoundingClientRect();
            let bar = null;
            const walk = (n, x, y) => {
              const t = n.transform || {};
              const nx = x + (t.x || 0),
                ny = y + (t.y || 0);
              if (!bar && n.shapeType === "Bar" && n.type === "rect")
                bar = [nx + n.x + n.width / 2, ny + n.y + n.height / 2];
              (n.children || []).forEach(c => walk(c, nx, ny));
            };
            walk(viz._paintedScene.root, 0, 0);
            resolve([box.left + bar[0], box.top + bar[1]]);
          });
        }),
      [theme, extra],
    );
    await page.mouse.move(point[0] - 5, point[1] - 5);
    await page.mouse.move(...point, {steps: 3});
    let colors = null;
    for (let i = 0; i < 40 && !colors; i++) {
      await page.waitForTimeout(25);
      colors = await page.evaluate(() => {
        const tip = Array.from(
          document.querySelectorAll(".d3plus-tooltip"),
        ).find(el => getComputedStyle(el).opacity !== "0");
        if (!tip) return null;
        const style = getComputedStyle(tip);
        return {
          background: style.backgroundColor,
          color: style.color,
          border: style.borderTopColor,
          shadow: style.boxShadow,
        };
      });
    }
    assert.deepStrictEqual(errors, [], "no page errors");
    return colors;
  } finally {
    await close();
  }
}

it("the tooltip shown on hover uses the dark tooltip tokens", async () => {
  const colors = await tooltipColors("#ffffff", "dark");
  assert.ok(colors, "a tooltip is shown");
  assert.strictEqual(hex(colors.background), themeDark.tooltip.background);
  assert.strictEqual(hex(colors.color), themeDark.tooltip.text);
  assert.strictEqual(
    rgb(colors.border).formatRgb(),
    rgb(themeDark.tooltip.border).formatRgb(),
  );
});

it("an auto chart's tooltip turns dark on a dark page", async () => {
  const colors = await tooltipColors("#212529");
  assert.ok(colors, "a tooltip is shown");
  assert.strictEqual(hex(colors.background), themeDark.tooltip.background);
});

it("a tooltip background the user sets beats the theme", async () => {
  const colors = await tooltipColors("#ffffff", "dark", {
    tooltipConfig: {background: "#ffffff"},
  });
  assert.ok(colors, "a tooltip is shown");
  assert.strictEqual(hex(colors.background), "#ffffff");
  assert.strictEqual(hex(colors.color), themeLight.tooltip.text);
});

it("a dark Geomap frames its basemap and takes the dark tiles on a white page", async () => {
  const out = await render(
    '<div id="s" style="width:400px;height:300px;background:#fff"></div>',
    () =>
      new Promise(resolve => {
        const viz = new window.d3plus.Geomap()
          .select("#s")
          .duration(0)
          .theme("dark")
          .topojson({
            type: "Topology",
            objects: {
              c: {
                type: "GeometryCollection",
                geometries: [{type: "Polygon", arcs: [[0]], id: "x"}],
              },
            },
            arcs: [
              [
                [-10, 40],
                [10, 40],
                [10, 60],
                [-10, 60],
                [-10, 40],
              ],
            ],
          });
        viz.render(() => {
          const node = viz
            .toScene()
            .root.children.find(n => n.key === "viz-background");
          resolve({
            type: node && node.type,
            d: node && node.d,
            ocean: document
              .querySelector("#s rect.d3plus-geomap-ocean")
              ?.getAttribute("fill"),
            tileUrl: document
              .querySelector("#s image.d3plus-geomap-tile")
              ?.getAttribute("href"),
          });
        });
      }),
  );
  assert.strictEqual(out.type, "path", "a frame, not a covering rect");
  assert.strictEqual((out.d.match(/M/g) || []).length, 2, "with a hole");
  assert.strictEqual(out.ocean, "#222327", "the dark ocean");
  assert.ok(/World_Dark_Gray_Base/.test(out.tileUrl), "the dark tiles");
});
