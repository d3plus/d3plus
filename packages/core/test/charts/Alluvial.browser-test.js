import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";
import {render} from "~test/browser/render.js";

/**
    Alluvial in Chromium, on SVG and Canvas: three dimensions draw three
    titled columns in order, band thickness follows the row counts, bands keep
    their origin's color in every column, hovering a band (with a real mouse)
    highlights the bands and nodes its rows pass through, and no others,
    and shows the path in the tooltip, the dark
    theme recolors the chrome, keyboard focus walks the nodes and bands, the
    table view lists one row per path, and reducedMotion draws without
    motion.
*/

const repeat = (row, n) => Array.from({length: n}, () => ({...row}));
const sales = [
  ...repeat({region: "West", product: "Chairs", channel: "Online"}, 3),
  ...repeat({region: "West", product: "Chairs", channel: "Store"}, 1),
  ...repeat({region: "West", product: "Tables", channel: "Online"}, 1),
  ...repeat({region: "East", product: "Tables", channel: "Store"}, 2),
  ...repeat({region: "East", product: "Chairs", channel: "Online"}, 1),
];
const config = {data: sales, dimensions: ["region", "product", "channel"]};

/**
    Runs in the page: draws an Alluvial and returns its painted marks in
    surface coordinates, each band with its origin and ends, each node with
    its column, and the column titles.
*/
const draw = async ({config, renderer, theme}) => {
  const d3plus = window.d3plus;
  const viz = new d3plus.Alluvial()
    .select("#viz")
    .config(config)
    .renderer(renderer)
    .width(600)
    .height(400)
    .duration(0);
  if (theme) viz.theme(theme);
  window.__viz = viz;
  await new Promise(r => viz.render(r));
  const bands = [];
  const nodes = [];
  const texts = [];
  const walk = (n, x, y) => {
    const t = n.transform || {};
    const nx = x + (t.x || 0),
      ny = y + (t.y || 0);
    const meta = d3plus.alluvialMeta(n.datum);
    if (n.type === "path" && meta?.kind === "band") {
      const nums = n.d.match(/-?[\d.]+(e-?\d+)?/g).map(Number);
      const [xs, sy0] = nums;
      const [ty0] = [nums[7]];
      const [xt, ty1] = [nums[8], nums[9]];
      const sy1 = nums[nums.length - 1];
      bands.push({
        id: meta.band.id,
        origin: meta.band.origin.label,
        column: meta.band.column,
        value: meta.band.value,
        fill: n.paint.fill,
        opacity: n.paint.opacity,
        sourceWidth: sy1 - sy0,
        targetWidth: ty1 - ty0,
        mid: [nx + (xs + xt) / 2, ny + (sy0 + sy1 + ty0 + ty1) / 4],
        aria: n.aria?.label,
      });
    } else if (n.type === "rect" && meta?.kind === "node") {
      nodes.push({
        id: meta.node.id,
        label: meta.node.label,
        column: meta.node.column,
        value: meta.node.value,
        x: nx + n.x,
        height: n.height,
        fill: n.paint.fill,
      });
    } else if (n.type === "text")
      texts.push({
        text: (n.lines || []).map(l => l.text).join(" "),
        x: nx + (n.lines?.[0]?.x || 0),
        fill: n.paint?.fill,
      });
    (n.children || []).forEach(c => walk(c, nx, ny));
  };
  walk(viz._paintedScene.root, 0, 0);
  return {bands, nodes, texts};
};

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] three dimensions draw three titled columns in order`, async () => {
    const {nodes, texts} = await render("<div id='viz'></div>", draw, {
      config,
      renderer,
    });
    const columns = [0, 1, 2].map(k => nodes.filter(n => n.column === k));
    assert.deepStrictEqual(
      columns.map(c => c.map(n => n.label)),
      [
        ["West", "East"],
        ["Chairs", "Tables"],
        ["Online", "Store"],
      ],
    );
    const xs = columns.map(c => c[0].x);
    for (const c of columns)
      assert.ok(
        c.every(n => n.x === c[0].x),
        "a column shares one x",
      );
    assert.ok(xs[0] < xs[1] && xs[1] < xs[2], "columns run left to right");
    const titles = ["region", "product", "channel"].map(t =>
      texts.find(x => x.text === t),
    );
    assert.ok(titles.every(Boolean), "every column is titled");
    assert.ok(
      titles[0].x < titles[1].x && titles[1].x < titles[2].x,
      "titles follow the columns",
    );
  });

  it(`[${renderer}] node heights and band widths match the row counts`, async () => {
    const {nodes, bands} = await render("<div id='viz'></div>", draw, {
      config,
      renderer,
    });
    const west = nodes.find(n => n.label === "West");
    const ky = west.height / 5;
    for (const n of nodes)
      assert.ok(Math.abs(n.height - n.value * ky) < 0.01, `${n.id} height`);
    for (const b of bands) {
      assert.ok(Math.abs(b.sourceWidth - b.value * ky) < 0.01, b.id);
      assert.ok(Math.abs(b.targetWidth - b.value * ky) < 0.01, b.id);
    }
    const chairsOnline = bands.filter(b =>
      b.id.startsWith("1|Chairs→2|Online"),
    );
    assert.deepStrictEqual(chairsOnline.map(b => [b.origin, b.value]).sort(), [
      ["East", 1],
      ["West", 3],
    ]);
  });

  it(`[${renderer}] bands keep their origin's color in every column`, async () => {
    const {nodes, bands} = await render("<div id='viz'></div>", draw, {
      config,
      renderer,
    });
    for (const origin of ["West", "East"]) {
      const own = bands.filter(b => b.origin === origin);
      const node = nodes.find(n => n.label === origin);
      assert.ok(
        new Set(own.map(b => b.column)).size === 2,
        `${origin} reaches both pairs`,
      );
      for (const b of own) assert.strictEqual(b.fill, node.fill, b.id);
    }
    const [west, east] = ["West", "East"].map(
      o => bands.find(b => b.origin === o).fill,
    );
    assert.notStrictEqual(west, east);
    const chairs = nodes.find(n => n.label === "Chairs");
    assert.ok(![west, east].includes(chairs.fill), "other nodes are neutral");
  });

  it(`[${renderer}] hovering a band highlights exactly its rows' paths and tooltips the path`, async () => {
    const {page, errors, close} = await openPage(
      '<div id="viz" style="width:600px;height:400px"></div>',
    );
    try {
      const {bands} = await page.evaluate(draw, {config, renderer});
      const host = await page.evaluate(() => {
        const el =
          document.querySelector("#viz svg") ||
          document.querySelector("#viz canvas");
        const box = el.getBoundingClientRect();
        return [box.left, box.top];
      });
      const at = id => {
        const b = bands.find(x => x.id === id);
        return [host[0] + b.mid[0], host[1] + b.mid[1]];
      };
      const state = () => {
        const tip = Array.from(
          document.querySelectorAll(".d3plus-tooltip"),
        ).find(el => getComputedStyle(el).opacity !== "0");
        const viz = window.__viz;
        const lit = [];
        const opacity = {};
        const walk = n => {
          const meta = window.d3plus.alluvialMeta(n.datum);
          const mark =
            (n.type === "path" && meta?.kind === "band") ||
            (n.type === "rect" && meta?.kind === "node");
          if (mark) {
            const id = meta.kind === "band" ? meta.band.id : meta.node.id;
            opacity[id] = n.paint?.opacity ?? 1;
            if (viz._hover && viz._hover(n.datum, 0)) lit.push(id);
          }
          (n.children || []).forEach(walk);
        };
        walk(viz._paintedScene.root);
        const title = tip?.querySelector(".d3plus-tooltip-title");
        return {
          title: title ? title.textContent : null,
          text: tip ? tip.textContent : "",
          lit: lit.sort(),
          opacity,
        };
      };

      const point = at("1|Chairs→2|Online@0|West");
      await page.mouse.move(point[0] - 6, point[1] - 6);
      await page.mouse.move(...point, {steps: 3});
      await page.waitForTimeout(150);
      const hovered = await page.evaluate(state);
      assert.strictEqual(hovered.title, "West → Chairs → Online");
      assert.ok(/Count\s*3/.test(hovered.text), hovered.text);
      // Only its rows (West → Chairs → Online) light up, in every column.
      assert.deepStrictEqual(hovered.lit, [
        "0|West",
        "0|West→1|Chairs@0|West",
        "1|Chairs",
        "1|Chairs→2|Online@0|West",
        "2|Online",
      ]);
      const {opacity} = hovered;
      for (const other of ["0|West→1|Tables@0|West", "1|Chairs→2|Store@0|West"])
        assert.ok(
          opacity[other] < opacity["1|Chairs→2|Online@0|West"],
          `${other}, also West, is dimmed`,
        );
      assert.ok(opacity["2|Store"] < opacity["2|Online"], "Store is dimmed");

      const first = at("0|West→1|Chairs@0|West");
      await page.mouse.move(...first, {steps: 3});
      await page.waitForTimeout(150);
      const again = await page.evaluate(state);
      assert.strictEqual(again.title, "West → Chairs");
      assert.deepStrictEqual(again.lit, [
        "0|West",
        "0|West→1|Chairs@0|West",
        "1|Chairs",
        "1|Chairs→2|Online@0|West",
        "1|Chairs→2|Store@0|West",
        "2|Online",
        "2|Store",
      ]);
      assert.ok(
        again.opacity["0|West→1|Tables@0|West"] <
          again.opacity["0|West→1|Chairs@0|West"],
        "West → Tables is dimmed",
      );
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`[${renderer}] a dark theme recolors the titles, labels, and neutral nodes`, async () => {
    const light = await render("<div id='viz'></div>", draw, {
      config,
      renderer,
    });
    const dark = await render("<div id='viz'></div>", draw, {
      config,
      renderer,
      theme: "dark",
    });
    const fill = (r, text) => r.texts.find(t => t.text === text).fill;
    const lum = c => {
      const [r, g, b] = c.match(/\d+/g).map(Number);
      return (r + g + b) / 3;
    };
    const toRgb = c => {
      const el = document.createElement("div");
      el.style.color = c;
      document.body.appendChild(el);
      const rgb = getComputedStyle(el).color;
      el.remove();
      return rgb;
    };
    for (const text of ["region", "Chairs"]) {
      assert.ok(
        lum(toRgb(fill(light, text))) < 100,
        `${text} is dark on light`,
      );
      assert.ok(lum(toRgb(fill(dark, text))) > 150, `${text} is light on dark`);
    }
    const neutral = r => r.nodes.find(n => n.label === "Chairs").fill;
    assert.notStrictEqual(neutral(light), neutral(dark));
    assert.ok(lum(toRgb(neutral(dark))) < lum(toRgb(neutral(light))));
  });

  it(`[${renderer}] keyboard focus walks the nodes and bands`, async () => {
    const records = await render(
      "<div id='viz'></div>",
      async ({config, renderer}) => {
        const viz = new window.d3plus.Alluvial()
          .select("#viz")
          .config(config)
          .renderer(renderer)
          .width(600)
          .height(400)
          .duration(0);
        await new Promise(r => viz.render(r));
        const wait = () =>
          new Promise(r => requestAnimationFrame(() => setTimeout(r, 40)));
        const host = document.querySelector("#viz .d3plus-keyboard-nav");
        const record = () => {
          const tip = document.querySelector(
            ".d3plus-tooltip .d3plus-tooltip-title",
          );
          return {
            live: host.querySelector("[aria-live]").textContent,
            tooltip: tip ? tip.textContent : null,
            hover: typeof viz._hover === "function",
          };
        };
        const out = [];
        host.focus();
        await wait();
        out.push(record());
        for (let i = 0; i < 3; i++) {
          host.dispatchEvent(
            new KeyboardEvent("keydown", {key: "ArrowDown", bubbles: true}),
          );
          await wait();
          out.push(record());
        }
        host.dispatchEvent(
          new KeyboardEvent("keydown", {key: "ArrowRight", bubbles: true}),
        );
        await wait();
        out.push(record());
        return out;
      },
      {config, renderer},
    );
    assert.strictEqual(records[0].live, "region: West, 5.");
    assert.strictEqual(records[0].tooltip, "West");
    for (const r of records) {
      assert.ok(r.hover, "focus hovers the mark");
      assert.ok(r.tooltip, "focus shows the tooltip");
    }
    const lives = records.map(r => r.live);
    assert.ok(
      lives.some(l => l.startsWith("region: East")),
      `reaches East (${lives})`,
    );
    assert.ok(
      lives.some(l => l.includes("→")),
      `reaches a band (${lives})`,
    );
  });
}

it("the table view lists one row per path", async () => {
  const result = await render(
    "<div id='viz'></div>",
    async ({config}) => {
      const viz = new window.d3plus.Alluvial()
        .select("#viz")
        .config(config)
        .width(600)
        .height(400)
        .duration(0);
      await new Promise(r => viz.render(r));
      document.querySelector("#viz .table-view-toggle").click();
      await new Promise(r => setTimeout(r, 50));
      const table = document.querySelector(".d3plus-table-view table");
      return {
        headers: Array.from(table.querySelectorAll("thead th")).map(th =>
          th.textContent.trim(),
        ),
        rows: Array.from(table.querySelectorAll("tbody tr")).map(tr =>
          Array.from(tr.querySelectorAll("td")).map(td => td.textContent),
        ),
      };
    },
    {config},
  );
  assert.deepStrictEqual(result.headers, [
    "region",
    "product",
    "channel",
    "Count",
  ]);
  assert.deepStrictEqual(result.rows, [
    ["West", "Chairs", "Online", "3"],
    ["West", "Chairs", "Store", "1"],
    ["West", "Tables", "Online", "1"],
    ["East", "Chairs", "Online", "1"],
    ["East", "Tables", "Store", "2"],
  ]);
});

it("reducedMotion redraws without motion", async () => {
  const durations = await render(
    "<div id='viz'></div>",
    ({config}) =>
      new Promise(resolve => {
        const viz = new window.d3plus.Alluvial()
          .select("#viz")
          .config(config)
          .reducedMotion(true)
          .width(600)
          .height(400);
        viz.render(() => {
          const seen = [];
          const drawScene = viz._sceneRenderer.drawScene.bind(
            viz._sceneRenderer,
          );
          viz._sceneRenderer.drawScene = (scene, opts) => {
            seen.push(opts?.duration ?? 0);
            return drawScene(scene, opts);
          };
          viz.data(config.data.slice(2)).render(() => resolve(seen));
        });
      }),
    {config},
  );
  assert.ok(durations.length > 0, "redraws");
  assert.ok(
    durations.every(d => d === 0),
    `no motion (${durations})`,
  );
});
