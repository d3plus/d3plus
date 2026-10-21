import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Date labels lie flat on one line, whole: a crowded date axis thins its
    labels (evenly on a category axis) until every one it draws fits, rather
    than cutting the ends to "Mar 1,…" or wrapping them across lines. The
    first label drawn, and the first drawn after each change of year, names
    the year (at hourly steps, the first drawn each day names the date), and
    hourly labels always read their hour. Driven in Chromium for real text
    measurement, on both renderers, at several widths.
*/

/**
    Renders a LinePlot over the Dates `xs` builds (as categories, or on a time
    axis with `time`), and reads back each painted x label in order: its tick
    value, its lines, and its extent across the chart.
*/
const probe = ([xs, {time, width, kind = "LinePlot", locale}, renderer]) =>
  new Promise(resolve => {
    const el = document.querySelector("#viz");
    el.style.width = `${width}px`;
    el.style.height = "260px";
    const dates = new Function(`return (${xs})();`)();
    const viz = new window.d3plus[kind]()
      .data(dates.map((date, k) => ({id: "A", date, value: 10 + (k % 7)})))
      .groupBy("id")
      .x("date")
      .y("value")
      .legend(false)
      .duration(0)
      .renderer(renderer)
      .select("#viz");
    if (time) viz.time("date").timeline(false);
    if (locale) viz.locale(locale);
    viz.render(() => {
      const labels = [];
      const walk = (node, inAxis, ox = 0) => {
        const within = inAxis || node.key === "plot-x-axis";
        const x = ox + (node.transform?.x || 0);
        if (within && node.type === "text" && node.datum?.data) {
          const center = x + node.x + (node.lines[0]?.x || 0);
          const w = Math.max(0, ...node.lines.map(l => l.width));
          labels.push({
            value: +node.datum.data.id || +new Date(node.datum.data.id),
            lines: node.lines.map(l => l.text),
            left: center - w / 2,
            right: center + w / 2,
          });
        }
        (node.children || []).forEach(c => walk(c, within, x));
      };
      walk(viz._paintedScene.root, false);
      labels.sort((a, b) => a.value - b.value);
      labels.forEach(l => (l.index = dates.findIndex(d => +d === l.value)));
      resolve({labels, width, rotated: viz._xAxis._labelRotation, count: dates.length});
    });
  });

const run = (xs, config, renderer = "svg") =>
  render('<div id="viz"></div>', probe, [xs, config, renderer]);

const sets = {
  daily: "() => Array.from({length: 14}, (_, i) => new Date(2026, 2, 1 + i))",
  hourly: "() => Array.from({length: 12}, (_, i) => new Date(2026, 2, 3, 6 + i))",
  hourly3d: "() => Array.from({length: 48}, (_, i) => new Date(2026, 2, 3, 6 + i))",
  monthly: "() => Array.from({length: 30}, (_, i) => new Date(2023, i, 1))",
  quarterly: "() => Array.from({length: 14}, (_, i) => new Date(2022, i * 3, 1))",
  newYear: "() => Array.from({length: 40}, (_, i) => new Date(2025, 11, 10 + i))",
  candles: "() => Array.from({length: 90}, (_, i) => new Date(2025, 10, 1 + i))",
};

/**
    Every painted label is whole on one line, inside the chart, clear of its
    neighbors, and names the year (or, hourly, the day) exactly when it opens
    one among the painted labels.
*/
function assertFit(r, context, hourly) {
  const texts = r.labels.map(l => l.lines.join("|"));
  assert.ok(r.labels.length >= 2 || r.width < 300, `${context}: paints labels (got ${texts})`);
  r.labels.forEach((l, i) => {
    assert.strictEqual(l.lines.length, 1, `${context}: "${l.lines.join("|")}" lies on one line (got ${texts})`);
    assert.ok(!/…|\.\.\./.test(l.lines[0]), `${context}: "${l.lines[0]}" is whole`);
    assert.ok(l.left >= -1 && l.right <= r.width + 1, `${context}: "${l.lines[0]}" stays inside the chart (got ${JSON.stringify(r.labels)})`);
    if (i) assert.ok(l.left >= r.labels[i - 1].right, `${context}: "${l.lines[0]}" clears its neighbor (got ${texts})`);
    const d = new Date(l.value), prev = i ? new Date(r.labels[i - 1].value) : undefined;
    const year = !prev || prev.getFullYear() !== d.getFullYear();
    assert.strictEqual(/\d{4}/.test(l.lines[0]), year, `${context}: "${l.lines[0]}" ${year ? "names" : "leaves out"} the year (got ${texts})`);
    if (hourly) {
      const day = !prev || prev.getDate() !== d.getDate();
      assert.strictEqual(/^\D{3} \d/.test(l.lines[0]), day, `${context}: "${l.lines[0]}" ${day ? "names" : "leaves out"} the day (got ${texts})`);
      assert.match(l.lines[0], /\d\d [AP]M$/, `${context}: "${l.lines[0]}" reads its hour`);
    }
  });
}

for (const renderer of ["svg", "canvas"]) {
  for (const time of [false, true]) {
    const axis = time ? "time axis" : "category axis";
    it(`LinePlot (${renderer}) — Date labels on a ${axis} fit whole and carry the year at every width`, {timeout: 120000}, async function () {
      for (const [name, xs] of Object.entries(sets)) {
        for (const width of [260, 420, 700, 950]) {
          const r = await run(xs, {time, width}, renderer);
          assertFit(r, `${name}@${width}`, name.startsWith("hourly"));
          if (!time && r.labels.length > 1) {
            const steps = new Set(r.labels.slice(1).map((l, i) => l.index - r.labels[i].index));
            assert.strictEqual(steps.size, 1, `${name}@${width}: thins evenly (got ${[...steps]})`);
            assert.strictEqual(r.labels[0].index, 0, `${name}@${width}: starts with the first label`);
          }
        }
      }
    });
  }

  it(`LinePlot (${renderer}) — hourly end labels read the date and the hour`, async function () {
    for (const time of [false, true]) {
      const r = await run(sets.hourly, {time, width: 900}, renderer);
      const texts = r.labels.map(l => l.lines.join(" "));
      assert.strictEqual(texts[0], "Mar 3, 2026, 06 AM", `the first label (got ${texts})`);
      assert.match(texts[texts.length - 1], /^\d\d [AP]M$/, `the last label reads its hour (got ${texts})`);
    }
  });

  it(`LinePlot (${renderer}) — Date labels fit and carry the year in the chart's locale`, async function () {
    const r = await run(sets.monthly, {width: 300, locale: "es-ES"}, renderer);
    assertFit(r, "es-ES monthly");
    assert.strictEqual(r.labels[0].lines[0], "ene 2023");
    const h = await run(sets.hourly3d, {width: 420, locale: "es-ES"}, renderer);
    assert.match(h.labels[0].lines[0], /^mar 3, 2026, 06/);
  });

  it(`BarChart (${renderer}) — yearly Date categories that fit stay flat and all painted`, async function () {
    const xs = "() => Array.from({length: 8}, (_, i) => new Date(2016 + i, 0, 1))";
    const r = await run(xs, {width: 600, kind: "BarChart"}, renderer);
    assert.deepStrictEqual(r.labels.map(l => l.lines.join(" ")), ["2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023"]);
    assert.strictEqual(r.rotated, false);
  });

  // Thinned evenly, these weekdays end on "Jan 2, 2025", a category before
  // the last: the plot leaves room for that label's overhang (with its year),
  // not the hidden last one's.
  it(`BarChart (${renderer}) — the last label shown stays inside the chart`, async function () {
    const xs = `() => {
      const days = [];
      for (const day = new Date(2025, 0, 3); days.length < 200; day.setDate(day.getDate() - 1))
        if (day.getDay() % 6) days.unshift(new Date(day));
      return days;
    }`;
    for (const width of [500, 700]) {
      const r = await run(xs, {width, kind: "BarChart"}, renderer);
      assert.ok(r.labels[r.labels.length - 1].index < r.count - 1, `${width}px: ends before the last category`);
      assertFit(r, `weekdays@${width}`);
    }
  });
}

it("Axis — date labels rotate only when even the first can't lie flat on one line", async function () {
  const r = await render('<div id="viz"></div>', () => {
    const d3plus = window.d3plus;
    return [90, 140, 400].map(width => {
      const dates = Array.from({length: 6}, (_, i) => new Date(2026, 2, 3, 6 + i));
      const axis = new d3plus.AxisBottom().select("#viz").scale("point").domain(dates)
        .width(width).height(200).duration(0);
      axis.render();
      const {textData, tickFormat} = d3plus.measureAxis(axis);
      return {
        width,
        rotated: axis._labelRotation,
        shown: textData.filter(t => !t.truncated).map(t => ({text: tickFormat(t.d), lines: t.lines})),
      };
    });
  });
  const [narrow, flat, wide] = r;
  assert.strictEqual(narrow.rotated, true, `a ${narrow.width}px axis rotates (got ${JSON.stringify(narrow)})`);
  assert.strictEqual(flat.rotated, false, `a ${flat.width}px axis thins instead (got ${JSON.stringify(flat)})`);
  assert.strictEqual(wide.rotated, false);
  for (const {shown, width} of r) {
    assert.strictEqual(shown[0].text, "Mar 3, 2026, 06 AM", `${width}px`);
    shown.forEach(({text, lines}) => assert.deepStrictEqual(lines, [text], `${width}px: "${text}" lies whole on one line`));
  }
  assert.deepStrictEqual(flat.shown.map(s => s.text), ["Mar 3, 2026, 06 AM"], "thinned to the first label");
});

it("Date categories cost work linear in their count: labels, thinning, and every mark's label", {timeout: 120000}, async function () {
  const out = await render('<div id="viz" style="width:1000px;height:400px"></div>', async () => {
    // Counts Date comparisons and conversions while drawing `n` weekdays.
    const count = async (kind, n, time) => {
      const data = [];
      const day = new Date(2024, 0, 1);
      while (data.length < n) {
        if (day.getDay() % 6) data.push({id: "A", date: new Date(+day), value: 10 + (data.length % 7)});
        day.setDate(day.getDate() + 1);
      }
      const valueOf = Date.prototype.valueOf;
      let calls = 0;
      Date.prototype.valueOf = function () {
        calls++;
        return valueOf.call(this);
      };
      try {
        await new Promise(resolve => {
          const viz = new window.d3plus[kind]().select("#viz").data(data).groupBy("id")
            .x("date").y("value").legend(false).duration(0);
          if (time) viz.time("date");
          viz.render(resolve);
        });
      }
      finally {
        Date.prototype.valueOf = valueOf;
      }
      return calls;
    };
    const out = {};
    for (const [name, kind, time] of [["BarChart", "BarChart"], ["LinePlot", "LinePlot"], ["LinePlot time axis", "LinePlot", true]])
      out[name] = [await count(kind, 250, time), await count(kind, 1000, time)];
    return out;
  });
  // Four times the dates: about four times the work when linear (a little
  // more, as a longer axis tries more intervals when thinning its labels),
  // and sixteen or more when each label or mark reads every date.
  Object.entries(out).forEach(([name, [small, large]]) =>
    assert.ok(large / small < 8, `${name}: ${small} at 250 dates, ${large} at 1000`));
});
