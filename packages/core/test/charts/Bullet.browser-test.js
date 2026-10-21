import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    Bullet renders in Chromium on both backends: the emitted scene (a group
    per row with static bands and axis, labels, a hit area, and the forecast,
    measure, and target marks), painted labels and ticks, a shared domain,
    vertical bullets, hover dimming, the tooltip rows (translated), the
    legend staying off for labeled rows, small multiples sharing each row's
    domain, a dark background, and Canvas painting + picking.
*/

after(async () => {
  await closeBrowser();
});

const kpis = [
  {id: "Revenue", unit: "US$", value: 270, target: 250, forecast: 290},
  {id: "Profit", unit: "%", value: 22.5, target: 27},
  {id: "Orders", unit: "count", value: 1650, target: 2100},
];

it("Bullet emits one labeled bullet per row with bands, axis, and marks", async function () {
  this.timeout(180000);
  const out = await render(
    "<div id='viz' style='width:600px;height:360px'></div>",
    async data => {
      const viz = new window.d3plus.Bullet()
        .select("#viz")
        .duration(0)
        .data(data)
        .bands([100, 200])
        .subLabel("unit");
      await new Promise(r => viz.render(r));
      const svg = document.querySelector("#viz svg");
      const scene = viz._chartScene;
      return {
        keys: scene.map(g => g.key),
        kidKeys: scene[0].children.map(k => k.key),
        staticKeys: scene[0].children[0].children.map(k => k.key).slice(0, 5),
        staticInteractive: scene[0].children[0].interactive,
        texts: [...svg.querySelectorAll("text")].map(t => t.textContent),
        nan: [...svg.querySelectorAll("*")].filter(n =>
          [...n.attributes].some(a => a.value.includes("NaN")),
        ).length,
        aria: [...svg.querySelectorAll("[aria-label]")].map(n =>
          n.getAttribute("aria-label"),
        ),
        legend: document.querySelectorAll('#viz [data-key="viz-legend"] rect').length,
        legendFn: viz.schema.legend({}, viz._filteredData),
        zoomButtons: document.querySelectorAll("#viz .zoom-control").length,
        measureWidth: Number(
          document.querySelector("[data-key='bullet-Revenue-measure']").getAttribute("width"),
        ),
        forecastWidth: Number(
          document.querySelector("[data-key='bullet-Revenue-forecast']").getAttribute("width"),
        ),
      };
    },
    kpis,
  );
  assert.deepStrictEqual(out.keys, ["bullet-Revenue", "bullet-Profit", "bullet-Orders"]);
  assert.deepStrictEqual(out.kidKeys, [
    "bullet-Revenue-static",
    "bullet-Revenue::hit",
    "bullet-Revenue-name",
    "bullet-Revenue-sub",
    "bullet-Revenue-forecast",
    "bullet-Revenue-measure",
    "bullet-Revenue-target",
  ]);
  assert.deepStrictEqual(out.staticKeys, [
    "bullet-Revenue-track",
    "bullet-Revenue-band-0",
    "bullet-Revenue-band-1",
    "bullet-Revenue-band-2",
    "bullet-Revenue-ticks",
  ]);
  assert.strictEqual(out.staticInteractive, false, "bands and axis are never hit targets");
  for (const t of ["Revenue", "US$", "Profit", "%", "Orders", "count", "0", "300"])
    assert.ok(out.texts.includes(t), `renders "${t}"`);
  assert.strictEqual(out.nan, 0, "no NaN attributes");
  assert.ok(out.aria.includes("Revenue, 270, Target 250."), "measure aria label");
  assert.strictEqual(out.legendFn, false, "labeled rows need no legend");
  assert.strictEqual(out.legend, 0, "no legend is drawn");
  assert.strictEqual(out.zoomButtons, 0, "zoom is off");
  assert.ok(out.forecastWidth > out.measureWidth, "the forecast runs past the measure");
});

it("Bullet grows every rect in from its baseline at full thickness", async function () {
  this.timeout(180000);
  const out = await render(
    "<div id='viz' style='width:600px;height:360px'></div>",
    async data => {
      const viz = new window.d3plus.Bullet()
        .select("#viz")
        .duration(0)
        .data(data)
        .bands([100, 200]);
      await new Promise(r => viz.render(r));
      const [revenue] = viz._chartScene;
      const nodes = [...revenue.children[0].children, ...revenue.children].filter(
        n => n.type === "rect" && !`${n.key}`.endsWith("::hit"),
      );
      return nodes.map(n => ({key: n.key, x: n.x, y: n.y, width: n.width, height: n.height, enter: n.enterRect}));
    },
    kpis,
  );
  assert.deepStrictEqual(out.map(n => n.key), [
    "bullet-Revenue-track",
    "bullet-Revenue-band-0",
    "bullet-Revenue-band-1",
    "bullet-Revenue-band-2",
    "bullet-Revenue-forecast",
    "bullet-Revenue-measure",
  ]);
  const zero = out[0].x;
  for (const n of out) {
    assert.deepStrictEqual(n.enter, {x: zero, y: n.y, width: 0, height: n.height}, n.key);
  }
});

it("Bullet shares one domain and axis, and runs vertically", async function () {
  this.timeout(60000);
  const out = await render(
    "<div id='a' style='width:600px;height:300px'></div><div id='b' style='width:500px;height:400px'></div>",
    async data => {
      const shared = new window.d3plus.Bullet()
        .select("#a")
        .duration(0)
        .data(data.slice(0, 2))
        .sharedDomain(true);
      await new Promise(r => shared.render(r));
      const vertical = new window.d3plus.Bullet()
        .select("#b")
        .duration(0)
        .data(data)
        .orient("vertical")
        .bands([50]);
      await new Promise(r => vertical.render(r));
      const ticks = id =>
        [...document.querySelectorAll(`${id} [data-key$='-ticks']`)].map(n => n.getAttribute("data-key"));
      const rect = key => {
        const el = document.querySelector(`[data-key='${key}']`);
        return ["x", "y", "width", "height"].map(a => Number(el.getAttribute(a)));
      };
      return {
        sharedTicks: ticks("#a"),
        verticalTicks: ticks("#b").length,
        revenue: rect("bullet-Revenue-track"),
        profit: rect("bullet-Profit-track"),
        vRevenue: vertical._chartScene[0].children[0].children[0],
        vProfit: vertical._chartScene[1].children[0].children[0],
      };
    },
    kpis,
  );
  assert.deepStrictEqual(out.sharedTicks, ["bullet-Profit-ticks"], "one axis, under the last row");
  assert.strictEqual(out.verticalTicks, 3, "each vertical bullet has its axis");
  assert.ok(out.vProfit.x > out.vRevenue.x, "columns run left to right");
  assert.ok(out.vRevenue.height > out.vRevenue.width, "vertical bullets are tall");
});

it("Bullet dims other rows on hover and lists Value, Target, and Forecast", async function () {
  this.timeout(60000);
  const out = await render(
    "<div id='viz' style='width:600px;height:300px'></div>",
    async data => {
      const viz = new window.d3plus.Bullet()
        .select("#viz")
        .duration(0)
        .locale("es-ES")
        .data(data);
      await new Promise(r => viz.render(r));
      viz.hover(d => d.id === "Revenue");
      await new Promise(r => setTimeout(r, 50));
      const attr = (key, a) => {
        const el = document.querySelector(`#viz [data-key='${key}']`);
        return el && el.getAttribute(a);
      };
      const tbody = viz.schema.tooltipConfig.tbody;
      return {
        profitMeasure: attr("bullet-Profit-measure", "opacity"),
        profitName: attr("bullet-Profit-name", "opacity"),
        profitBands: attr("bullet-Profit-band-0", "opacity"),
        revenueMeasure: attr("bullet-Revenue-measure", "opacity"),
        revenueStroke: Number(attr("bullet-Revenue-measure", "stroke-width")),
        rows: tbody(data[0], 0),
        orders: tbody(data[2], 2),
      };
    },
    kpis,
  );
  assert.strictEqual(Number(out.profitMeasure), 0.5, "other rows' measures dim");
  assert.strictEqual(Number(out.profitName), 0.5, "and their labels");
  assert.ok(!out.profitBands || Number(out.profitBands) === 1, "bands stay put");
  assert.ok(!out.revenueMeasure || Number(out.revenueMeasure) === 1, "hovered row stays opaque");
  assert.ok(out.revenueStroke >= 2, "hovered measure is emphasized");
  assert.deepStrictEqual(out.rows, [
    ["Valor", "270"],
    ["Objetivo", "250"],
    ["Pronóstico", "290"],
  ]);
  assert.deepStrictEqual(out.orders.map(r => r[0]), ["Valor", "Objetivo"]);
});

it("Bullet small multiples read each row against one domain across panels", async function () {
  this.timeout(60000);
  const out = await render(
    "<div id='viz' style='width:900px;height:360px'></div>",
    async () => {
      const data = [];
      ["East", "West"].forEach((region, r) =>
        ["Revenue", "Profit"].forEach((id, k) =>
          data.push({id, region, value: (k ? 20 : 200) * (r ? 3 : 1), target: k ? 25 : 250}),
        ),
      );
      const viz = new window.d3plus.Bullet()
        .select("#viz")
        .duration(0)
        .data(data)
        .facet("region");
      await new Promise(r => viz.render(r));
      const texts = [...document.querySelectorAll("#viz text")].map(t => t.textContent);
      return {
        panels: viz._chartScene.length,
        texts,
        aspect: viz._facetHooks().aspect,
      };
    },
  );
  assert.ok(out.texts.includes("East") && out.texts.includes("West"), "panel titles");
  assert.strictEqual(out.texts.filter(t => t === "Revenue").length, 2, "a Revenue bullet per panel");
  assert.ok(out.texts.includes("600"), "East's Revenue axis reaches West's value");
  assert.strictEqual(out.aspect, 2);
});

it("Bullet reads on a dark background", async function () {
  this.timeout(60000);
  const out = await render(
    "<div id='viz' style='width:600px;height:300px;background:#1f2328'></div>",
    async data => {
      const viz = new window.d3plus.Bullet()
        .select("#viz")
        .duration(0)
        .data(data)
        .bands([100, 200]);
      await new Promise(r => viz.render(r));
      const probe = document.createElement("canvas").getContext("2d");
      const lum = c => {
        probe.fillStyle = c;
        const hex = probe.fillStyle.slice(1);
        const [r, g, b] = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
        return 0.299 * r + 0.587 * g + 0.114 * b;
      };
      const fill = key => document.querySelector(`[data-key='${key}']`).getAttribute("fill");
      return {
        name: lum(fill("bullet-Revenue-name")),
        band0: lum(fill("bullet-Revenue-band-0")),
        band2: lum(fill("bullet-Revenue-band-2")),
        target: lum(document.querySelector("[data-key='bullet-Revenue-target']").getAttribute("stroke")),
        outline: document.querySelector("[data-key='bullet-Revenue-measure']").getAttribute("stroke"),
      };
    },
    kpis,
  );
  assert.ok(out.name > 200, `labels turn light (${out.name})`);
  assert.ok(out.band0 > out.band2, "the first band contrasts most with the dark background");
  assert.ok(out.band2 > 40, "the lightest band still shows against the background");
  assert.ok(out.target > 200, "the target marker turns light");
  assert.strictEqual(out.outline, "rgb(31, 35, 40)", "measures are outlined in the background color");
});

it("Bullet paints on Canvas and picks the row under the pointer", async function () {
  this.timeout(60000);
  const out = await render(
    "<div id='viz' style='width:600px;height:300px'></div>",
    async data => {
      const viz = new window.d3plus.Bullet()
        .select("#viz")
        .duration(0)
        .renderer("canvas")
        .data(data)
        .bands([100])
        .on("click", d => (window.__clicked = d && d.data ? d.data : d));
      await new Promise(r => viz.render(r));
      const canvas = document.querySelector("#viz canvas.d3plus-render-canvas");
      if (!canvas) return {hasCanvas: false};
      const ctx = canvas.getContext("2d");
      const px = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const colors = new Set();
      for (let i = 0; i < px.length; i += 4)
        if (px[i + 3] > 250 && !(px[i] > 245 && px[i + 1] > 245 && px[i + 2] > 245))
          colors.add(`${px[i] >> 4}_${px[i + 1] >> 4}_${px[i + 2] >> 4}`);
      // Click the Profit row's empty track near its end, so the pick lands
      // on the row's hit area rather than a mark.
      const track = viz._chartScene[1].children[0].children[0];
      const x = viz._chartTransform.x + track.x + track.width - 3;
      const y = viz._chartTransform.y + track.y + 3;
      const rect = canvas.getBoundingClientRect();
      window.__clicked = undefined;
      canvas.dispatchEvent(
        new MouseEvent("click", {clientX: rect.left + x, clientY: rect.top + y, bubbles: true}),
      );
      return {hasCanvas: true, colors: colors.size, clicked: window.__clicked && window.__clicked.id};
    },
    kpis,
  );
  assert.ok(out.hasCanvas, "a <canvas> is mounted");
  assert.ok(out.colors >= 4, `canvas paints the bullets (${out.colors} colors)`);
  assert.strictEqual(out.clicked, "Profit", "clicking a bullet picks its row");
});
