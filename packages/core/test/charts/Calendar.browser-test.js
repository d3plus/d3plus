import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Calendar renders in Chromium on both backends: one cell per day of every
    year the data touches, data days colored by the colorScale and the rest in
    the empty fill, month outlines, localized labels, the week start, vertical
    and month layouts, the tooltip, small multiples, a dark background, and
    Canvas painting + picking.
*/

const box = "<div id='viz' style='width:900px;height:360px'></div>";

/** Daily rows from `start` for `n` days, skipping every third day. */
const daily = `
  window.daily = (start, n) => {
    const rows = [];
    const pad = v => String(v).padStart(2, "0");
    for (let k = 0; k < n; k++) {
      if (k % 3 === 2) continue;
      const d = new Date(start[0], start[1] - 1, start[2] + k);
      rows.push({date: d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()), value: (k % 7) + 1});
    }
    return rows;
  };
`;

it("Calendar draws a cell for every day of each year the data touches", async function () {
  const out = await render(box, async src => {
    eval(src);
    const viz = new window.d3plus.Calendar()
      .select("#viz")
      .duration(0)
      .data(window.daily([2024, 3, 1], 30));
    await new Promise(r => viz.render(r));
    const nodes = viz._chartScene;
    const cells = nodes.filter(n => n.type === "rect");
    const data = cells.filter(n => n.datum);
    const empty = cells.filter(n => !n.datum);
    const svg = document.querySelector("#viz svg");
    return {
      cells: cells.length,
      data: data.length,
      keys: [cells[0].key, cells[cells.length - 1].key],
      emptyInteractive: empty.every(n => n.interactive === false),
      emptyFills: [...new Set(empty.map(n => n.paint.fill))],
      dataFills: new Set(data.map(n => n.paint.fill)).size,
      emptyAria: empty[0].aria.label,
      dataAria: data[0].aria.label,
      radius: cells[0].rx,
      gap: cells[1].y - cells[0].y - cells[0].height,
      outlines: nodes.filter(n => n.type === "path").length,
      texts: nodes.filter(n => n.type === "text").map(n => n.lines[0].text),
      year: nodes.find(n => n.key === "calendar-label-2024-year").transform.rotate,
      painted: svg.querySelectorAll("rect").length,
      zoom: viz.zoom(),
      zoomButtons: document.querySelectorAll("#viz .zoom-control").length,
      legend: viz.schema.legend({}, viz._filteredData),
      nan: [...svg.querySelectorAll("*")].filter(n =>
        [...n.attributes].some(a => a.value.includes("NaN")),
      ).length,
    };
  }, daily);
  assert.strictEqual(out.cells, 366, "every day of 2024");
  assert.strictEqual(out.data, 20, "one colored cell per data day");
  assert.deepStrictEqual(out.keys, ["calendar-2024-01-01", "calendar-2024-12-31"]);
  assert.ok(out.emptyInteractive, "empty days take no pointer");
  assert.strictEqual(out.emptyFills.length, 1, "one neutral empty fill");
  assert.ok(out.dataFills > 1, "data days shade by value");
  assert.strictEqual(out.emptyAria, "Monday, 1/1/2024, No Data.");
  assert.strictEqual(out.dataAria, "Friday, 3/1/2024, 1.");
  assert.strictEqual(out.radius, 2, "rounded cells");
  assert.ok(Math.abs(out.gap - 2) < 1e-6, `2px between cells (${out.gap})`);
  assert.strictEqual(out.outlines, 12, "a month outline per month");
  for (const t of ["Jan", "Dec", "Mon", "Wed", "2024"]) assert.ok(out.texts.includes(t), t);
  assert.strictEqual(out.year, -90, "the year runs up the side");
  assert.ok(out.painted >= 366, "cells reach the SVG");
  assert.strictEqual(out.zoom, false, "zoom is off");
  assert.strictEqual(out.zoomButtons, 0);
  assert.strictEqual(out.legend, false, "no per-day legend");
  assert.strictEqual(out.nan, 0);
});

it("Calendar merges rows on the same day and reads custom date accessors", async function () {
  const out = await render(box, async () => {
    const viz = new window.d3plus.Calendar()
      .select("#viz")
      .duration(0)
      .date(d => d.when)
      .data([
        {when: new Date(2025, 0, 3, 9), value: 2},
        {when: new Date(2025, 0, 3, 17), value: 5},
        {when: +new Date(2025, 0, 4, 12), value: 1},
        {when: "garbage", value: 9},
      ]);
    await new Promise(r => viz.render(r));
    const cells = viz._chartScene.filter(n => n.type === "rect" && n.datum);
    return cells.map(n => [n.key, n.datum.value]);
  });
  assert.deepStrictEqual(out, [
    ["calendar-2025-01-03", 7],
    ["calendar-2025-01-04", 1],
  ]);
});

it("Calendar follows the locale's names and first day of the week", async function () {
  const out = await render(box, async src => {
    eval(src);
    const run = async config => {
      const viz = new window.d3plus.Calendar()
        .select("#viz")
        .duration(0)
        .data(window.daily([2024, 1, 1], 60))
        .config(config);
      await new Promise(r => viz.render(r));
      const cells = viz._chartScene.filter(n => n.type === "rect");
      const at = k => cells.find(n => n.key === `calendar-${k}`);
      const top = Math.min(...cells.map(n => n.y));
      const step = at("2024-01-03").y - at("2024-01-02").y;
      const slot = k => Math.round((at(k).y - top) / step);
      return {
        texts: viz._chartScene.filter(n => n.type === "text").map(n => n.lines[0].text),
        monday: slot("2024-01-01"),
        sunday: slot("2024-01-07"),
        tooltip: viz.schema.tooltipConfig.tbody[0][0](),
        title: viz._drawLabel({date: "2024-01-05"}, 0),
      };
    };
    return {
      us: await run({}),
      es: await run({locale: "es-ES"}),
      sunday: await run({locale: "es-ES", weekStart: 0}),
    };
  }, daily);
  assert.ok(out.us.texts.includes("Jan") && out.us.texts.includes("Mon"));
  assert.deepStrictEqual([out.us.sunday, out.us.monday], [0, 1], "en-US weeks start on Sunday");
  assert.ok(out.es.texts.includes("ene"), "Spanish month names");
  assert.ok(out.es.texts.some(t => ["lun", "mar", "mié"].includes(t)), "Spanish weekday names");
  assert.deepStrictEqual([out.es.monday, out.es.sunday], [0, 6], "es-ES weeks start on Monday");
  assert.deepStrictEqual([out.sunday.sunday, out.sunday.monday], [0, 1], "weekStart overrides the locale");
  assert.strictEqual(out.es.tooltip, "Valor", "the tooltip row is translated");
  assert.strictEqual(out.es.title, "viernes, 5 de enero de 2024");
});

it("Calendar lays weeks down the page with orient vertical", async function () {
  const out = await render("<div id='viz' style='width:400px;height:800px'></div>", async src => {
    eval(src);
    const viz = new window.d3plus.Calendar()
      .select("#viz")
      .duration(0)
      .orient("vertical")
      .data(window.daily([2024, 1, 1], 30));
    await new Promise(r => viz.render(r));
    const cells = viz._chartScene.filter(n => n.type === "rect");
    const at = k => cells.find(n => n.key === `calendar-${k}`);
    return {
      across: at("2024-01-02").x - at("2024-01-01").x,
      down: at("2024-01-08").y - at("2024-01-01").y,
      size: at("2024-01-01").width + viz.cellPadding(),
      bottom: Math.max(...cells.map(n => n.y + n.height)),
      area: viz.schema.height - viz._margin.top - viz._margin.bottom,
    };
  }, daily);
  assert.ok(Math.abs(out.across - out.size) < 1e-6, "weekdays run across");
  assert.ok(Math.abs(out.down - out.size) < 1e-6, "weeks run down");
  assert.ok(out.bottom <= out.area + 1e-6, "the year fits the chart area");
});

it("Calendar draws month blocks as small wall calendars", async function () {
  const out = await render(box, async src => {
    eval(src);
    const viz = new window.d3plus.Calendar()
      .select("#viz")
      .duration(0)
      .period("month")
      .data(window.daily([2025, 1, 10], 70));
    await new Promise(r => viz.render(r));
    const texts = viz._chartScene.filter(n => n.type === "text").map(n => n.lines[0].text);
    return {
      cells: viz._chartScene.filter(n => n.type === "rect").length,
      outlines: viz._chartScene.filter(n => n.type === "path").length,
      titles: texts.filter(t => /2025/.test(t)),
      headers: texts.filter(t => t.length <= 3).length,
    };
  }, daily);
  assert.strictEqual(out.cells, 31 + 28 + 31, "January–March");
  assert.strictEqual(out.outlines, 0);
  assert.deepStrictEqual(out.titles, ["January 2025", "February 2025", "March 2025"]);
  assert.strictEqual(out.headers, 21, "a weekday header over each month");
});

it("Calendar fills days without a value with emptyFill, keeping their tooltip", async function () {
  const out = await render(box, async () => {
    const viz = new window.d3plus.Calendar()
      .select("#viz")
      .duration(0)
      .emptyFill("rgb(1, 2, 3)")
      .monthOutline(false)
      .cellRadius(0)
      .data([
        {date: "2024-06-01", value: 3},
        {date: "2024-06-02", value: 8},
        {date: "2024-06-03"},
      ]);
    await new Promise(r => viz.render(r));
    const cells = viz._chartScene.filter(n => n.type === "rect");
    const at = k => cells.find(n => n.key === `calendar-${k}`);
    return {
      noValue: [at("2024-06-03").paint.fill, Boolean(at("2024-06-03").datum)],
      missing: at("2024-06-04").paint.fill,
      valued: at("2024-06-01").paint.fill,
      outlines: viz._chartScene.filter(n => n.type === "path").length,
      radius: at("2024-06-01").rx,
    };
  });
  assert.deepStrictEqual(out.noValue, ["rgb(1, 2, 3)", true], "a row without a value");
  assert.strictEqual(out.missing, "rgb(1, 2, 3)", "a day without a row");
  assert.notStrictEqual(out.valued, "rgb(1, 2, 3)");
  assert.strictEqual(out.outlines, 0, "monthOutline(false)");
  assert.strictEqual(out.radius, undefined, "square cells");
});

it("Calendar reads its chrome colors against a dark background", async function () {
  const out = await render(
    "<div style='background:rgb(20, 20, 20)'><div id='light' style='width:600px;height:240px;background:#fff'></div><div id='dark' style='width:600px;height:240px'></div></div>",
    async () => {
      const draw = async sel => {
        const viz = new window.d3plus.Calendar()
          .select(sel)
          .duration(0)
          .data([{date: "2024-06-01", value: 3}]);
        await new Promise(r => viz.render(r));
        const empty = viz._chartScene.find(n => n.type === "rect" && !n.datum);
        const label = viz._chartScene.find(n => n.type === "text");
        return {empty: empty.paint.fill, label: label.paint.fill};
      };
      return {light: await draw("#light"), dark: await draw("#dark")};
    },
  );
  const lum = c => c.match(/\d+/g).slice(0, 3).reduce((a, b) => a + +b, 0) / 3;
  assert.ok(lum(out.light.empty) > 200, `light empty ${out.light.empty}`);
  assert.ok(lum(out.dark.empty) > 20 && lum(out.dark.empty) < 80, `dark empty ${out.dark.empty}`);
  assert.ok(lum(out.dark.label) > 150, `dark labels ${out.dark.label}`);
});

it("Calendar small multiples share one date range", async function () {
  const out = await render("<div id='viz' style='width:900px;height:500px'></div>", async () => {
    const viz = new window.d3plus.Calendar()
      .select("#viz")
      .duration(0)
      .facet("repo")
      .data([
        {repo: "a", date: "2024-02-01", value: 1},
        {repo: "b", date: "2025-07-04", value: 5},
      ]);
    await new Promise(r => viz.render(r));
    const rects = [];
    const walk = n => {
      if (n.type === "rect" && /calendar-\d/.test(n.key)) rects.push(n);
      (n.children || []).forEach(walk);
    };
    viz._chartScene.forEach(walk);
    return {rects: rects.length, data: rects.filter(n => n.datum).map(n => n.datum.repo).sort()};
  });
  assert.strictEqual(out.rects, 2 * (366 + 365), "both panels draw 2024 and 2025");
  assert.deepStrictEqual(out.data, ["a", "b"]);
});

it("Calendar paints and picks cells on the Canvas renderer", async function () {
  const out = await render(box, async () => {
    const viz = new window.d3plus.Calendar()
      .select("#viz")
      .duration(0)
      .renderer("canvas")
      .data([
        {date: "2024-06-10", value: 1},
        {date: "2024-06-11", value: 9},
      ])
      .on("click", d => (window.__clicked = d));
    await new Promise(r => viz.render(r));
    const canvas = document.querySelector("#viz canvas.d3plus-render-canvas");
    if (!canvas) return {hasCanvas: false};
    const ctx = canvas.getContext("2d");
    const px = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const colors = new Set();
    for (let i = 0; i < px.length; i += 4)
      if (px[i + 3] > 250) colors.add(`${px[i] >> 4}_${px[i + 1] >> 4}_${px[i + 2] >> 4}`);
    const cell = viz._chartScene.find(n => n.key === "calendar-2024-06-11");
    const t = viz._chartTransform;
    const rect = canvas.getBoundingClientRect();
    canvas.dispatchEvent(
      new MouseEvent("click", {
        clientX: rect.left + t.x + cell.x + cell.width / 2,
        clientY: rect.top + t.y + cell.y + cell.height / 2,
        bubbles: true,
      }),
    );
    return {
      hasCanvas: true,
      colors: colors.size,
      clicked: window.__clicked && window.__clicked.date,
      svgRects: document.querySelectorAll("#viz svg rect").length,
    };
  });
  assert.ok(out.hasCanvas, "a <canvas> is mounted");
  assert.ok(out.colors >= 4, `canvas paints cells and labels (${out.colors} colors)`);
  assert.strictEqual(out.clicked, "2024-06-11", "clicking a cell picks its row");
});

/** Page helpers: move the pointer onto a scene node's SVG element, and wait for the hover repaint. */
const pointer = `
  window.pointAt = key => {
    const el = document.querySelector('#viz svg [data-key="' + key + '"]');
    const r = el.getBoundingClientRect();
    el.dispatchEvent(new MouseEvent("mousemove", {
      clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true,
    }));
  };
  window.settle = () => new Promise(r => setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(r)), 50));
  window.painted = key => {
    const el = document.querySelector('#viz svg [data-key="' + key + '"]');
    return {opacity: +(el.getAttribute("opacity") ?? 1), stroke: el.getAttribute("stroke"), width: +(el.getAttribute("stroke-width") ?? 0)};
  };
`;

it("Calendar outlines the hovered day without dimming the others, past the dataCutoff too", async function () {
  const out = await render(box, async src => {
    eval(src);
    const viz = new window.d3plus.Calendar()
      .select("#viz")
      .duration(0)
      .data(window.daily([2024, 1, 1], 200));
    await new Promise(r => viz.render(r));
    const days = viz._chartScene.filter(n => n.type === "rect" && n.datum).map(n => n.key);
    window.pointAt("calendar-2024-01-02");
    await window.settle();
    const hovered = window.painted("calendar-2024-01-02");
    const others = days.filter(k => k !== "calendar-2024-01-02").map(window.painted);
    window.pointAt("calendar-2024-12-01");
    await window.settle();
    const empty = {hover: typeof viz._hover === "function" && viz._hover(viz._filteredData[0], 0), day: window.painted("calendar-2024-01-02")};
    return {
      rows: days.length,
      hoverOpacity: viz.schema.shapeConfig.hoverOpacity,
      hovered,
      dimmed: others.filter(p => p.opacity < 1).length,
      outlined: others.filter(p => p.width > 0).length,
      empty,
    };
  }, daily + pointer);
  assert.ok(out.rows > 100, "more days than the dataCutoff");
  assert.strictEqual(out.hoverOpacity, 1);
  assert.strictEqual(out.hovered.opacity, 1);
  assert.strictEqual(out.hovered.width, 2, "the hovered day's stroke doubles");
  assert.ok(out.hovered.stroke, "and darkens from its fill");
  assert.strictEqual(out.dimmed, 0, "no other day dims");
  assert.strictEqual(out.outlined, 0, "no other day is outlined");
  assert.strictEqual(out.empty.hover, false, "moving onto an empty day clears the hover");
  assert.strictEqual(out.empty.day.width, 0, "and the outline");
});

it("Calendar keeps a user's hoverOpacity", async function () {
  const out = await render(box, async src => {
    eval(src);
    const viz = new window.d3plus.Calendar()
      .select("#viz")
      .duration(0)
      .shapeConfig({hoverOpacity: 0.3})
      .data(window.daily([2024, 3, 1], 30));
    await new Promise(r => viz.render(r));
    const keys = viz._chartScene.filter(n => n.type === "rect" && n.datum).map(n => n.key);
    window.pointAt(keys[0]);
    await window.settle();
    return {
      dims: keys.slice(1).map(window.painted).map(p => p.opacity),
      hovered: window.painted(keys[0]),
      merged: Object.keys(viz.schema.shapeConfig).length > 1,
    };
  }, daily + pointer);
  assert.ok(out.dims.length && out.dims.every(o => Math.abs(o - 0.3) < 1e-6), "every other day dims to it");
  assert.strictEqual(out.hovered.opacity, 1);
  assert.strictEqual(out.hovered.width, 2, "the hovered day is outlined");
  assert.ok(out.merged, "the setter merges over the default shapeConfig");
});

it("Calendar's colorScale bucket hover dims the days outside the bucket", async function () {
  const out = await render(box, async src => {
    eval(src);
    const viz = new window.d3plus.Calendar()
      .select("#viz")
      .duration(0)
      .data(window.daily([2024, 3, 1], 30));
    await new Promise(r => viz.render(r));
    const cells = viz._chartScene.filter(n => n.type === "rect" && n.datum);
    const bucketOf = n => viz._colorScaleClass._colorScale(n.datum.value);
    const color = bucketOf(cells[0]);
    viz.schema.on.mouseenter.call(viz, {_isColorScaleBucket: true, color}, 0);
    await window.settle();
    const inBucket = cells.filter(n => bucketOf(n) === color).map(n => window.painted(n.key).opacity);
    const outside = cells.filter(n => bucketOf(n) !== color).map(n => window.painted(n.key).opacity);
    return {inBucket, outside};
  }, daily + pointer);
  assert.ok(out.inBucket.length && out.inBucket.every(o => o === 1), "days in the bucket stay bright");
  assert.ok(out.outside.length && out.outside.every(o => o === 0.5), "days outside it dim");
});

/** Renders a Calendar in a `width` × `height` box and reports its colorScale's inset placement against every node it draws. */
const placement = (width, height, config, days = 365) =>
  render(`<div id='viz' style='width:${width}px;height:${height}px'></div>`, async ([src, cfg, n]) => {
    eval(src);
    const viz = new window.d3plus.Calendar()
      .select("#viz")
      .duration(0)
      .data(window.daily([2025, 1, 1], n))
      .config(cfg);
    await new Promise(r => viz.render(r));
    const nodes = window.d3plus.markBoxes(viz._chartScene, viz._chartTransform, undefined, true);
    const top = Math.min(...nodes.map(b => b.y));
    const bottom = Math.max(...nodes.map(b => b.y + b.height));
    return {placement: viz._insetPlacement, margin: viz._margin, nodes, top, bottom, kinds: new Set(viz._chartScene.map(n => n.type)).size};
  }, [daily, config, days]);

const overlaps = (a, b) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

it("Calendar places its colorScale below or above the calendar when there's room", async function () {
  for (const [config, days, below] of [[{}, 365, true], [{locale: "es-ES"}, 365, true], [{period: "month"}, 181]]) {
    const out = await placement(900, 360, config, days);
    const p = out.placement;
    assert.ok(p, `${JSON.stringify(config)}: placed inside the chart`);
    assert.strictEqual(p.key, "colorScale");
    if (below) {
      assert.strictEqual(p.orient, "row");
      assert.ok(p.y >= out.bottom || p.y + p.height <= out.top, "above or below every node");
      assert.strictEqual(out.kinds, 3, "cells, month outlines, and labels are all checked");
    }
    assert.strictEqual(out.margin.right, 0, "no side margin claimed");
    const hits = out.nodes.filter(b => overlaps(b, p));
    assert.strictEqual(hits.length, 0, `overlaps ${JSON.stringify(hits[0])}`);
  }
});

it("Calendar's colorScale falls back to a side margin when there's no room inside", async function () {
  const out = await placement(900, 220, {});
  assert.strictEqual(out.placement, null);
  assert.ok(out.margin.right > 0, "a wide chart's colorScale goes right");
});
