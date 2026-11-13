import {describe, it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    `centerLabel` draws text in the empty middle of a Donut (a Pie with a
    hole), a Sunburst before any zoom, and a RadialBar, on both backends:
    inert chrome that fits the hole or is left out. Font metrics differ by
    platform, so these check what is drawn and where, not exact sizes.
*/

const shares = [
  {id: "alpha", value: 1200},
  {id: "beta", value: 500},
  {id: "gamma", value: 300},
];

const tree = [
  {area: "Frontend", module: "Components", size: 530},
  {area: "Frontend", module: "Pages", size: 700},
  {area: "Backend", module: "API", size: 790},
  {area: "Backend", module: "Jobs", size: 310},
  {area: "Docs", module: "Guides", size: 300},
];

/** In-page helpers: build and render a chart into `#viz`, and read its center label. */
const setup = `
  window.build = (name, rows, opts = {}) => new Promise(resolve => {
    const viz = new window.d3plus[name]()
      .select(opts.select || "#viz")
      .data(rows.map(d => ({...d})))
      .duration(0);
    if (opts.renderer) viz.renderer(opts.renderer);
    viz.config(opts.config || {});
    viz.render(() => resolve(viz));
  });
  window.wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  window.centerGroup = viz =>
    (viz._chartScene || []).find(n => n.key === "center-label");
  window.centerLabel = viz => {
    const group = window.centerGroup(viz);
    if (!group) return null;
    const texts = group.children.filter(n => n.type === "text");
    const lines = texts.flatMap(n => n.lines.map(l => ({
      text: l.text,
      y: (n.transform?.y ?? 0) + l.y,
      size: n.font.size,
    })));
    // Each line's glyphs run from 0.8em above its baseline to 0.2em below.
    const top = Math.min(...lines.map(l => l.y - 0.8 * l.size));
    const bottom = Math.max(...lines.map(l => l.y + 0.2 * l.size));
    return {
      text: lines.map(l => l.text).join(" "),
      lines: lines.length,
      size: Math.max(...lines.map(l => l.size)),
      middle: (top + bottom) / 2,
      top,
      bottom,
      x: texts[0].transform?.x ?? 0,
      width: texts[0].width,
      anchor: texts[0].font.anchor,
      fill: texts[0].paint?.fill,
      weight: texts[0].font.weight,
      interactive: group.interactive,
      childInteractive: texts.map(n => n.interactive),
      datum: texts.some(n => n.datum !== undefined),
    };
  };
`;

/** Runs `fn(arg)` in a page holding `html` (a 500×400 `#viz` by default), with the helpers above. */
const page = (fn, arg, html) =>
  render(
    html || "<div id='viz' style='width:500px;height:400px'></div>",
    new Function("arg", `${setup}; return (${fn})(arg);`),
    arg,
  );

for (const renderer of ["svg", "canvas"])
  describe(`centerLabel (${renderer})`, () => {
    it("Donut draws the formatted total, centered, inert, and painted", async () => {
      const out = await page(
        async ({rows, renderer}) => {
          const viz = await window.build("Donut", rows, {
            renderer,
            config: {centerLabel: true},
          });
          const t = viz._chartTransform;
          const pick = viz._sceneRenderer.pick([t.x, t.y]);
          const surface = document.querySelector(
            renderer === "canvas"
              ? "#viz canvas.d3plus-render-canvas"
              : "#viz svg.d3plus-render-svg",
          );
          const svgText =
            renderer === "svg"
              ? [...surface.querySelectorAll("text")].map(n => n.textContent)
              : [];
          // Canvas: the ink in a small box around the ring's center.
          const ink = () => {
            if (renderer !== "canvas") return null;
            const scale = surface.width / surface.getBoundingClientRect().width;
            const ctx = surface.getContext("2d");
            const s = 12 * scale;
            const px = ctx.getImageData(
              t.x * scale - s,
              t.y * scale - s,
              s * 2,
              s * 2,
            ).data;
            let n = 0;
            for (let k = 3; k < px.length; k += 4) if (px[k] > 0) n++;
            return n;
          };
          const withLabel = ink();
          const label = window.centerLabel(viz);
          viz.centerLabel(false);
          await new Promise(r => viz.render(r));
          return {
            label,
            pick: pick ? {key: pick.node?.key, datum: !!pick.datum} : null,
            svgText,
            withLabel,
            without: ink(),
            off: window.centerGroup(viz) || null,
          };
        },
        {rows: shares, renderer},
      );
      const {label} = out;
      assert.ok(label, "draws a center label");
      assert.strictEqual(label.text, "2k");
      assert.strictEqual(label.lines, 1);
      assert.strictEqual(label.anchor, "middle");
      assert.ok(Math.abs(label.x + label.width / 2) < 1, "centered across");
      assert.ok(Math.abs(label.middle) < 1.5, `centered (${label.middle})`);
      assert.ok(label.size > 10 && label.size <= 40, `size ${label.size}`);
      assert.strictEqual(label.interactive, false, "the group is inert");
      assert.ok(label.childInteractive.every(v => v === false));
      assert.strictEqual(label.datum, false, "carries no datum");
      assert.ok(
        !out.pick || !out.pick.datum,
        "a pick at the center finds no datum",
      );
      assert.strictEqual(out.off, null, "centerLabel(false) removes it");
      if (renderer === "svg") assert.ok(out.svgText.includes("2k"));
      else
        assert.ok(
          out.withLabel > 10 && out.without === 0,
          `canvas paints the text (${out.withLabel} vs ${out.without})`,
        );
    });

    it("Donut draws a string styled by centerLabelConfig", async () => {
      const out = await page(
        async ({rows, renderer}) => {
          const viz = await window.build("Donut", rows, {
            renderer,
            config: {
              centerLabel: "Sales",
              centerLabelConfig: {
                fontColor: "rgb(255, 0, 0)",
                fontWeight: 700,
                fontMax: 18,
              },
            },
          });
          const el =
            renderer === "svg"
              ? [...document.querySelectorAll("#viz svg text")].find(
                  n => n.textContent === "Sales",
                )
              : null;
          return {
            label: window.centerLabel(viz),
            fill: el && el.getAttribute("fill"),
            weight: el && el.getAttribute("font-weight"),
            defaults: viz.centerLabelConfig(),
          };
        },
        {rows: shares, renderer},
      );
      assert.strictEqual(out.label.text, "Sales");
      assert.strictEqual(out.label.fill, "rgb(255, 0, 0)");
      assert.strictEqual(Number(out.label.weight), 700);
      assert.ok(out.label.size <= 18, "fontMax caps the size");
      assert.strictEqual(out.defaults.fontMin, 10, "merged over the defaults");
      assert.strictEqual(out.defaults.fontMax, 18);
      if (renderer === "svg") {
        assert.strictEqual(out.fill, "rgb(255, 0, 0)");
        assert.strictEqual(out.weight, "700");
      }
    });

    it("Donut passes the drawn rows and their total to a function", async () => {
      const out = await page(
        async ({rows, renderer}) => {
          const calls = [];
          const viz = await window.build("Donut", rows, {
            renderer,
            config: {
              centerLabel: (data, total) => {
                calls.push({ids: data.map(d => d.id), total});
                return `${data.length} for ${total}`;
              },
            },
          });
          return {
            label: window.centerLabel(viz),
            last: calls[calls.length - 1],
          };
        },
        {rows: shares, renderer},
      );
      assert.deepStrictEqual(out.last.ids.sort(), ["alpha", "beta", "gamma"]);
      assert.strictEqual(out.last.total, 2000);
      assert.strictEqual(out.label.text, "3 for 2000");
    });

    it("Donut wraps and shrinks text in a small hole, and leaves out what can't fit", async () => {
      const out = await page(
        async ({rows, renderer}) => {
          const text = "Total sales across every region";
          const viz = await window.build("Donut", rows, {
            renderer,
            config: {centerLabel: text, innerRadius: 45},
          });
          const fits = window.centerLabel(viz);
          viz.innerRadius(10);
          await new Promise(r => viz.render(r));
          return {fits, tiny: window.centerLabel(viz)};
        },
        {rows: shares, renderer},
      );
      assert.strictEqual(out.fits.text, "Total sales across every region");
      assert.ok(out.fits.lines > 1, `wraps (${out.fits.lines} lines)`);
      assert.ok(out.fits.size < 40, `shrinks (${out.fits.size})`);
      assert.ok(
        out.fits.top >= -45 && out.fits.bottom <= 45,
        "stays inside the hole",
      );
      assert.strictEqual(out.tiny, null, "nothing in a hole too small");
    });

    it("Pie draws no center label without a hole, and a half Donut draws it above the center", async () => {
      const out = await page(
        async ({rows, renderer}) => {
          const pie = await window.build("Pie", rows, {
            renderer,
            config: {centerLabel: true},
          });
          const none = window.centerGroup(pie) || null;
          document.querySelector("#viz").innerHTML = "";
          const half = await window.build("Donut", rows, {
            renderer,
            config: {centerLabel: true, startAngle: -90, endAngle: 90},
          });
          return {none, half: window.centerLabel(half)};
        },
        {rows: shares, renderer},
      );
      assert.strictEqual(out.none, null);
      assert.strictEqual(out.half.text, "2k");
      assert.ok(
        out.half.bottom <= 0.5,
        `above the center (${out.half.bottom})`,
      );
    });

    it("Donut updates the total when a legend click hides a slice", async () => {
      const out = await page(
        async ({rows, renderer}) => {
          const viz = await window.build("Donut", rows, {
            renderer,
            config: {centerLabel: true, legend: true},
          });
          const before = window.centerLabel(viz).text;
          viz.schema.on["click.legend"].call(viz, rows[0], 0, undefined, {
            shiftKey: false,
          });
          for (let k = 0; k < 50 && viz._hidden.length === 0; k++)
            await window.wait(20);
          await window.wait(200);
          return {before, hidden: viz._hidden, after: window.centerLabel(viz)};
        },
        {rows: shares, renderer},
      );
      assert.strictEqual(out.before, "2k");
      assert.deepStrictEqual(out.hidden, ["alpha"]);
      assert.strictEqual(out.after.text, "800");
    });

    it("Sunburst draws the total until a click zooms into a node", async () => {
      const out = await page(
        async ({rows, renderer}) => {
          const viz = await window.build("Sunburst", rows, {
            renderer,
            config: {
              centerLabel: true,
              groupBy: ["area", "module"],
              sum: "size",
            },
          });
          const before = window.centerLabel(viz);
          const backend = viz._chartScene.find(
            n => n.key === 'sunburst-["Backend"]',
          );
          viz._routeSceneEvent({
            type: "click",
            point: [1, 1],
            pick: {node: backend, datum: backend.datum, index: backend.index},
            nativeEvent: {stopPropagation() {}, clientX: 10, clientY: 10},
          });
          await window.wait(150);
          const zoomed = window.centerGroup(viz) || null;
          document.querySelector("#viz .back-control").click();
          await window.wait(150);
          return {before, zoomed, back: window.centerLabel(viz)};
        },
        {rows: tree, renderer},
      );
      assert.strictEqual(out.before.text, "2.63k");
      assert.ok(Math.abs(out.before.middle) < 1.5, "centered");
      assert.strictEqual(out.zoomed, null, "the zoomed node fills the center");
      assert.strictEqual(out.back.text, "2.63k", "back out, it returns");
    });

    it("RadialBar draws the total in its empty middle", async () => {
      const out = await page(
        async ({rows, renderer}) => {
          const tracks = await window.build("RadialBar", rows, {
            renderer,
            config: {centerLabel: true, innerRadius: 60},
          });
          const label = window.centerLabel(tracks);
          const inner = tracks.ctx.polar.inner;
          document.querySelector("#viz").innerHTML = "";
          const bars = await window.build("RadialBar", rows, {
            renderer,
            config: {centerLabel: "Share", discrete: "angle"},
          });
          return {label, inner, bars: window.centerLabel(bars)};
        },
        {rows: shares, renderer},
      );
      assert.strictEqual(out.inner, 60);
      assert.strictEqual(out.label.text, "2k");
      assert.ok(Math.abs(out.label.middle) < 1.5, "centered");
      assert.ok(
        out.label.top >= -60 && out.label.bottom <= 60,
        "inside the hole",
      );
      assert.strictEqual(out.bars.text, "Share");
    });
  });

it("centerLabel paints the same scene on SVG and Canvas", async () => {
  const out = await page(
    async rows => {
      const scene = async (renderer, select) => {
        const viz = await window.build("Donut", rows, {
          renderer,
          select,
          config: {centerLabel: "Total sales this year"},
        });
        return JSON.parse(JSON.stringify(window.centerGroup(viz)));
      };
      return {
        svg: await scene("svg", "#a"),
        canvas: await scene("canvas", "#b"),
      };
    },
    shares,
    "<div id='a' style='width:500px;height:400px'></div><div id='b' style='width:500px;height:400px'></div>",
  );
  assert.ok(out.svg, "draws a label");
  assert.deepStrictEqual(out.canvas, out.svg);
});
