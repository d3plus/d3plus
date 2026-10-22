import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Bullet's bars take `texture` and `backgroundImage` like every other Rect:
    the measure through `shapeConfig`, the forecast through `forecastConfig`
    (inheriting the measure's texture, but not its image), on SVG and Canvas,
    with the legend swatches matching the measures' textures.
*/

const rows = [
  {id: "Revenue", group: "Money", value: 270, target: 250, forecast: 290},
  {id: "Profit", group: "Money", value: 220, target: 260},
  {id: "Orders", group: "Volume", value: 165, target: 210, forecast: 180},
];

const image = c =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="10"><rect width="20" height="10" fill="${c}"/></svg>`,
  )}`;

/** Renders a Bullet with `config` and reads its bars' fills and images. */
const drawBars = async ({data, config}) => {
  const el = document.querySelector("#viz");
  el.innerHTML = "";
  const viz = new window.d3plus.Bullet()
    .select(el)
    .duration(0)
    .data(data)
    .bands([100, 200])
    .config(config);
  await new Promise(r => viz.render(r));
  const fill = key =>
    document.querySelector(`[data-key='${key}']`)?.getAttribute("fill") ?? null;
  const images = [...el.querySelectorAll("g[data-key$='-bgimage']")].map(g => {
    const key = g.getAttribute("data-key");
    const shape = el.querySelector(
      `[data-key='${key.replace(/-bgimage$/, "")}']`,
    );
    const clip = /url\(#([^)]+)\)/.exec(g.getAttribute("clip-path") || "")?.[1];
    return {
      key,
      href: g.querySelector("image").getAttribute("href"),
      afterShape: Boolean(
        shape.compareDocumentPosition(g) & Node.DOCUMENT_POSITION_FOLLOWING,
      ),
      clipTag: clip
        ? el.querySelector(`#${CSS.escape(clip)}`).firstElementChild.tagName
        : null,
    };
  });
  return {
    measure: fill("bullet-Revenue-measure"),
    forecast: fill("bullet-Revenue-forecast"),
    orders: fill("bullet-Orders-measure"),
    patterns: el.querySelectorAll("pattern").length,
    images,
    kidKeys: viz._chartScene[0].children.map(k => k.key),
  };
};

const svgRun = (config, data = rows) =>
  render("<div id='viz' style='width:600px;height:300px'></div>", drawBars, {
    data,
    config,
  });

it(
  "Bullet's measure and forecast bars take shapeConfig.texture",
  {timeout: 120000},
  async function () {
    const out = await svgRun({shapeConfig: {texture: "lines"}});
    assert.match(out.measure, /^url\(/, "the measure fills with a pattern");
    assert.match(
      out.forecast,
      /^url\(/,
      "the forecast inherits the measure's texture",
    );
    assert.match(out.orders, /^url\(/, "every row's measure is textured");
    assert.ok(out.patterns > 0, "texture patterns are defined");
  },
);

it(
  "Bullet's forecastConfig.texture overrides or turns off the forecast's texture",
  {timeout: 120000},
  async function () {
    const off = await svgRun({
      shapeConfig: {texture: "lines"},
      forecastConfig: {texture: false},
    });
    assert.match(off.measure, /^url\(/, "the measure keeps its texture");
    assert.doesNotMatch(
      off.forecast,
      /^url\(/,
      "forecastConfig.texture(false) leaves the forecast solid",
    );
    const own = await svgRun({forecastConfig: {texture: "crosses"}});
    assert.doesNotMatch(
      own.measure,
      /^url\(/,
      "the measure stays solid without a texture",
    );
    assert.match(
      own.forecast,
      /^url\(/,
      "forecastConfig.texture textures the forecast alone",
    );
  },
);

it(
  "Bullet's measure bar draws shapeConfig.backgroundImage, clipped and over its fill",
  {timeout: 120000},
  async function () {
    const red = image("#ff0000");
    const out = await svgRun({shapeConfig: {backgroundImage: red}});
    assert.deepStrictEqual(
      out.images.map(d => d.key),
      [
        "bullet-Revenue-measure-bgimage",
        "bullet-Profit-measure-bgimage",
        "bullet-Orders-measure-bgimage",
      ],
      "one image per measure; the forecast doesn't inherit it",
    );
    for (const img of out.images) {
      assert.strictEqual(img.href, red);
      assert.ok(img.afterShape, `${img.key} paints over its bar`);
      assert.strictEqual(
        img.clipTag,
        "rect",
        `${img.key} is clipped to its bar`,
      );
    }
    assert.deepStrictEqual(
      out.kidKeys.slice(-4),
      [
        "bullet-Revenue-forecast",
        "bullet-Revenue-measure",
        "bullet-Revenue-measure-bgimage",
        "bullet-Revenue-target",
      ],
      "the target marker stays on top of the image",
    );
  },
);

it(
  "Bullet's forecastConfig.backgroundImage draws inside the forecast bar",
  {timeout: 120000},
  async function () {
    const blue = image("#0000ff");
    const out = await svgRun({
      forecastConfig: {backgroundImage: blue, backgroundImageFit: "contain"},
    });
    assert.deepStrictEqual(
      out.images.map(d => d.key),
      ["bullet-Revenue-forecast-bgimage", "bullet-Orders-forecast-bgimage"],
    );
    assert.ok(out.images.every(d => d.href === blue && d.afterShape));
  },
);

it(
  "Bullet's legend swatches match the measures' textures",
  {timeout: 120000},
  async function () {
    const out = await render(
      "<div id='viz' style='width:600px;height:300px'></div>",
      async data => {
        const viz = new window.d3plus.Bullet()
          .select("#viz")
          .duration(0)
          .data(data)
          .color("group")
          .shapeConfig({texture: d => (d.group === "Money" ? "lines" : false)});
        await new Promise(r => viz.render(r));
        const legend = [
          ...document.querySelectorAll('#viz [data-key="viz-legend"] rect'),
        ];
        return {
          // Each entry also has a transparent hit area.
          legendFills: legend
            .map(r => r.getAttribute("fill"))
            .filter(f => f !== "transparent"),
          money: document
            .querySelector("[data-key='bullet-Revenue-measure']")
            .getAttribute("fill"),
          volume: document
            .querySelector("[data-key='bullet-Orders-measure']")
            .getAttribute("fill"),
        };
      },
      rows,
    );
    assert.match(out.money, /^url\(/);
    assert.doesNotMatch(out.volume, /^url\(/);
    assert.strictEqual(
      out.legendFills.length,
      2,
      `the legend groups the rows (${out.legendFills})`,
    );
    assert.strictEqual(
      out.legendFills.filter(f => /^url\(/.test(f)).length,
      1,
      "only Money's swatch is textured",
    );
  },
);

it(
  "Bullet paints textures and background images on Canvas",
  {timeout: 120000},
  async function () {
    const out = await render(
      "<div id='viz' style='width:600px;height:300px'></div>",
      async ({data, img}) => {
        const draw = async config => {
          const el = document.querySelector("#viz");
          el.innerHTML = "";
          const viz = new window.d3plus.Bullet()
            .select(el)
            .duration(0)
            .renderer("canvas")
            .data(data)
            .forecast(false)
            .target(false)
            .config(config);
          await new Promise(r => viz.render(r));
          if (viz._sceneRenderer && viz._sceneRenderer.whenSettled)
            await viz._sceneRenderer.whenSettled();
          await new Promise(r =>
            requestAnimationFrame(() => setTimeout(r, 30)),
          );
          const canvas = el.querySelector("canvas.d3plus-render-canvas");
          const scale = canvas.width / canvas.getBoundingClientRect().width;
          const measure = viz._chartScene[0].children.find(
            k => k.key === "bullet-Revenue-measure",
          );
          const ctx = canvas.getContext("2d");
          const x0 = viz._chartTransform.x + measure.x + 3;
          const y = viz._chartTransform.y + measure.y + measure.height / 2;
          const colors = new Set();
          let red = 0;
          let n = 0;
          for (let x = x0; x < x0 + measure.width - 6; x += 1, n++) {
            const [r, g, b] = ctx.getImageData(
              Math.round(x * scale),
              Math.round(y * scale),
              1,
              1,
            ).data;
            colors.add(`${r}_${g}_${b}`);
            if (r > 215 && g < 40 && b < 40) red++;
          }
          return {colors: colors.size, red: red / n};
        };
        return {
          solid: await draw({}),
          texture: await draw({
            shapeConfig: {
              texture: "lines",
              textureDefault: {orientation: ["vertical"]},
            },
          }),
          image: await draw({shapeConfig: {backgroundImage: img}}),
        };
      },
      {data: rows, img: image("#ff0000")},
    );
    assert.strictEqual(out.solid.colors, 1, "a plain measure paints one color");
    assert.ok(
      out.texture.colors > 1,
      `a textured measure paints its pattern (${out.texture.colors} colors)`,
    );
    assert.ok(
      out.image.red > 0.9,
      `the measure's image fills it (${out.image.red})`,
    );
  },
);
