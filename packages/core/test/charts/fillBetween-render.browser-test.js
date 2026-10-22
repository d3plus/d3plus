import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    #283 in a real browser: LinePlot's `fillBetween` on both backends, and
    with the pairs it accepts.
*/

/** Page-side helpers, installed before each probe. */
const helpers = () => {
  window.__draw = (Chart, configure, size = [800, 500]) =>
    new Promise(resolve => {
      const el = document.createElement("div");
      el.style.cssText = `width:${size[0]}px;height:${size[1]}px`;
      document.body.appendChild(el);
      const viz = new window.d3plus[Chart]()
        .select(el)
        .detectVisible(false)
        .duration(0)
        .width(size[0])
        .height(size[1]);
      configure(viz);
      viz.render(() => resolve({el, viz}));
    });
  window.__flat = nodes =>
    nodes.flatMap(n => [n, ...(n.children ? window.__flat(n.children) : [])]);
  window.__nan = el =>
    Array.from(el.querySelectorAll("*")).filter(n =>
      Array.from(n.attributes).some(a => a.value.includes("NaN")),
    ).length;
};

const run = (fn, arg) =>
  render("", new Function("arg", `return (${helpers})(), (${fn})(arg);`), arg);

it(
  "LinePlot fillBetween fills between two lines, clipped at each crossing, on both backends",
  {timeout: 120000},
  async function () {
    const out = await run(async () => {
      const data = [];
      for (let t = 0; t < 12; t++) {
        data.push({name: "High", t, v: 10 + 4 * Math.sin(t / 2)});
        data.push({name: "Low", t, v: 10 + 4 * Math.cos(t / 2)});
      }
      const result = {};
      for (const renderer of ["svg", "canvas"]) {
        const {el, viz} = await window.__draw("LinePlot", v =>
          v
            .data(data)
            .groupBy("name")
            .x("t")
            .y("v")
            .fillBetween(true)
            .renderer(renderer),
        );
        const nodes = window.__flat(viz._chartScene);
        const clips = nodes.filter(n =>
          /^fill-between-.*::clip$/.test(`${n.key}`),
        );
        const lines = nodes.filter(
          n =>
            n.type === "path" &&
            n.shapeType === "Line" &&
            ["High", "Low"].includes(n.key),
        );
        result[renderer] = {
          clips: clips.map(n => n.key),
          clipped: clips.every(n => n.clip && n.clip.type === "path"),
          fills: clips.map(n => n.children[0].paint.fill),
          lines: lines.map(n => n.paint.stroke),
          inert: clips.every(
            n =>
              n.interactive === false &&
              n.children.every(c => c.interactive === false),
          ),
          domClips: el.querySelectorAll("[clip-path]").length,
          nan: window.__nan(el),
        };
      }
      return result;
    });
    for (const renderer of ["svg", "canvas"]) {
      const r = out[renderer];
      assert.deepStrictEqual(
        r.clips,
        ["fill-between-High-Low-High::clip", "fill-between-High-Low-Low::clip"],
        renderer,
      );
      assert.ok(r.clipped, `${renderer}: each copy is clipped to one side`);
      assert.deepStrictEqual(
        r.fills,
        r.lines,
        `${renderer}: each region in its higher series' color`,
      );
      assert.ok(
        r.inert,
        `${renderer}: the fill leaves the pointer to the lines`,
      );
      assert.strictEqual(r.nan, 0);
    }
    assert.ok(out.svg.domClips >= 2, "SVG clips the fills");
  },
);

it(
  "LinePlot fillBetween: named pairs, a missing series, and off",
  {timeout: 120000},
  async function () {
    const out = await run(async () => {
      const data = [];
      ["a", "b", "c", "d"].forEach((id, s) => {
        for (let t = 0; t < 8; t++)
          data.push({id, t, v: 10 + s * 5 + Math.sin(t + s)});
      });
      const groups = async fillBetween => {
        const {el, viz} = await window.__draw("LinePlot", v =>
          v.data(data).groupBy("id").x("t").y("v").fillBetween(fillBetween),
        );
        const keys = window
          .__flat(viz._chartScene)
          .filter(n => /^fill-between-.*::clip$/.test(`${n.key}`))
          .map(n => n.key);
        return {keys, nan: window.__nan(el)};
      };
      return {
        pairs: await groups([
          ["a", "b"],
          ["c", "d"],
        ]),
        missing: await groups(["a", "zzz"]),
        off: await groups(false),
      };
    });
    assert.deepStrictEqual(
      out.pairs.keys,
      [
        "fill-between-a-b-a::clip",
        "fill-between-a-b-b::clip",
        "fill-between-c-d-c::clip",
        "fill-between-c-d-d::clip",
      ],
      "each pair fills between its own lines",
    );
    assert.deepStrictEqual(
      out.missing.keys,
      [],
      "a pair naming a missing series is ignored",
    );
    assert.deepStrictEqual(out.off.keys, [], "false draws nothing");
    assert.strictEqual(out.pairs.nan, 0);
  },
);

it(
  "LinePlot fillBetween takes the chart's texture and backgroundImage, or its own, on both backends",
  {timeout: 120000},
  async function () {
    const out = await run(async () => {
      const image =
        "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%2F%3E";
      const data = [];
      for (let t = 0; t < 12; t++) {
        data.push({name: "High", t, v: 10 + 4 * Math.sin(t / 2)});
        data.push({name: "Low", t, v: 10 + 4 * Math.cos(t / 2)});
      }
      const probe = async (renderer, configure) => {
        const {el, viz} = await window.__draw("LinePlot", v => {
          v.data(data)
            .groupBy("name")
            .x("t")
            .y("v")
            .fillBetween(true)
            .renderer(renderer);
          configure(v);
        });
        const clips = window
          .__flat(viz._chartScene)
          .filter(n => /^fill-between-.*::clip$/.test(`${n.key}`));
        const legend = [];
        const walk = (n, inLegend) => {
          const here = inLegend || /viz-legend/.test(`${n.key}`);
          if (n.type === "group")
            (n.children || []).forEach(c => walk(c, here));
          else if (
            here &&
            n.type === "rect" &&
            n.datum &&
            !`${n.key}`.endsWith("::hit")
          )
            legend.push(n);
        };
        walk(viz._lastSceneRendered.root, false);
        const svg = el.querySelector("svg.d3plus-render-svg");
        return {
          regions: clips.map(c => ({
            side: c.key,
            textured: `${c.children[0].paint.fill}`.startsWith("pattern:"),
            image: c.children.some(
              n => n.key === `${c.children[0].key}-bgimage`,
            ),
            inert: c.children.every(n => n.interactive === false),
          })),
          legendTextured: legend.map(n =>
            `${n.paint.fill}`.startsWith("pattern:"),
          ),
          domPatterns: svg
            ? svg.querySelectorAll("[fill^='url(#']").length
            : null,
          domImages: svg ? svg.querySelectorAll("image").length : null,
        };
      };
      const result = {};
      for (const renderer of ["svg", "canvas"]) {
        result[renderer] = {
          // shapeConfig styles every filled shape, the fills included.
          inherited: await probe(renderer, v =>
            v.shapeConfig({texture: "lines"}),
          ),
          // A per-row accessor: the texture follows the higher series, as the color does.
          accessor: await probe(renderer, v =>
            v.shapeConfig({
              texture: d => (d.name === "High" ? "lines" : false),
            }),
          ),
          inheritedImage: await probe(renderer, v =>
            v.shapeConfig({backgroundImage: image}),
          ),
          // fillBetweenConfig styles the fills alone, and overrides shapeConfig.
          own: await probe(renderer, v =>
            v.fillBetweenConfig({texture: "lines", backgroundImage: image}),
          ),
          off: await probe(renderer, v =>
            v
              .shapeConfig({texture: "lines", backgroundImage: image})
              .fillBetweenConfig({texture: false, backgroundImage: false}),
          ),
        };
      }
      return result;
    });
    const sides = [
      "fill-between-High-Low-High::clip",
      "fill-between-High-Low-Low::clip",
    ];
    const regions = (textured, image) =>
      sides.map(side => ({side, textured, image, inert: true}));
    for (const renderer of ["svg", "canvas"]) {
      const r = out[renderer];
      assert.deepStrictEqual(
        r.inherited.regions,
        regions(true, false),
        `${renderer}: shapeConfig.texture reaches the fills`,
      );
      assert.deepStrictEqual(
        r.inherited.legendTextured,
        [true, true],
        `${renderer}: and the legend swatches`,
      );
      assert.deepStrictEqual(
        r.accessor.regions.map(x => x.textured),
        [true, false],
        `${renderer}: a texture accessor sees the higher series' row`,
      );
      assert.deepStrictEqual(
        r.accessor.legendTextured,
        [true, false],
        `${renderer}: the legend swatches match`,
      );
      assert.deepStrictEqual(
        r.inheritedImage.regions,
        regions(false, true),
        `${renderer}: shapeConfig.backgroundImage reaches the fills`,
      );
      assert.deepStrictEqual(
        r.own.regions,
        regions(true, true),
        `${renderer}: fillBetweenConfig styles the fills`,
      );
      assert.deepStrictEqual(
        r.own.legendTextured,
        [false, false],
        `${renderer}: but not the series' legend swatches`,
      );
      assert.deepStrictEqual(
        r.off.regions,
        regions(false, false),
        `${renderer}: fillBetweenConfig overrides shapeConfig`,
      );
    }
    // The legend draws 2 patterned swatches; the fills add the rest.
    assert.ok(
      out.svg.inherited.domPatterns >= 4,
      `SVG draws the fills' patterns (${out.svg.inherited.domPatterns})`,
    );
    assert.ok(
      out.svg.own.domPatterns >= 2 && out.svg.own.domImages >= 2,
      "SVG draws fillBetweenConfig's pattern and images",
    );
  },
);
