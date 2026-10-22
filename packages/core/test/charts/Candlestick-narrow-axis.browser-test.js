import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Candlestick's evenly spaced trading days tick on calendar boundaries, and
    at narrow widths still name every year the data spans: the axis draws the
    finest boundaries (years, quarters, months, …) whose labels fit whole on
    one line, labeling the first period (or, when it crowds the next, the
    first boundary) with its year and the first tick of each later year with
    the year. Driven in Chromium for real text measurement, on both
    renderers, with and without the volume strip.
*/

/**
    Renders a Candlestick over `days` seeded trading days from `start`, and
    reads back each painted x label in order: its date, its lines, and its
    extent across the chart.
*/
const probe = ([{start, days, width, volume}, renderer]) =>
  new Promise(resolve => {
    const el = document.querySelector("#viz");
    el.style.width = `${width}px`;
    el.style.height = "360px";
    let seed = 11;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const rows = [];
    const day = new Date(...start);
    let close = 120;
    while (rows.length < days) {
      if (day.getDay() % 6) {
        const open = close * (1 + (random() - 0.5) * 0.02);
        close = open * (1 + (random() - 0.48) * 0.04);
        rows.push({
          symbol: "ACME",
          date: new Date(day),
          open,
          high: Math.max(open, close) * 1.01,
          low: Math.min(open, close) * 0.99,
          close,
          volume: 1e6 * (1 + random()),
        });
      }
      day.setDate(day.getDate() + 1);
    }
    const viz = new window.d3plus.Candlestick()
      .data(rows)
      .groupBy("symbol")
      .duration(0)
      .renderer(renderer)
      .select("#viz");
    if (volume) viz.volume("volume");
    viz.render(() => {
      const labels = [];
      const walk = (node, inAxis, ox = 0) => {
        const within = inAxis || node.key === "plot-x-axis";
        const x = ox + (node.transform?.x || 0);
        if (within && node.type === "text" && node.datum?.data) {
          const center = x + node.x + (node.lines[0]?.x || 0);
          const w = Math.max(0, ...node.lines.map(l => l.width));
          labels.push({
            value: +new Date(node.datum.data.id),
            lines: node.lines.map(l => l.text),
            left: center - w / 2,
            right: center + w / 2,
          });
        }
        (node.children || []).forEach(c => walk(c, within, x));
      };
      walk(viz._paintedScene.root, false);
      labels.sort((a, b) => a.value - b.value);
      resolve({labels, width, first: +rows[0].date});
    });
  });

const run = (config, renderer) =>
  render('<div id="viz"></div>', probe, [config, renderer]);

/**
    Every painted label is whole on one line, inside the chart, and clear of
    its neighbors; the first names its year, as does the first of each later
    year, and the labels name every year the data spans.
*/
function assertFit(r, context, years) {
  const texts = r.labels.map(l => l.lines.join("|"));
  assert.ok(
    r.labels.length >= 2,
    `${context}: paints at least two labels (got ${texts})`,
  );
  r.labels.forEach((l, i) => {
    assert.strictEqual(
      l.lines.length,
      1,
      `${context}: "${l.lines.join("|")}" lies on one line (got ${texts})`,
    );
    assert.ok(
      !/…|\.\.\./.test(l.lines[0]),
      `${context}: "${l.lines[0]}" is whole`,
    );
    assert.ok(
      l.left >= -1 && l.right <= r.width + 1,
      `${context}: "${l.lines[0]}" stays inside the chart (got ${JSON.stringify(r.labels)})`,
    );
    if (i)
      assert.ok(
        l.left >= r.labels[i - 1].right,
        `${context}: "${l.lines[0]}" clears its neighbor (got ${texts})`,
      );
    const d = new Date(l.value),
      prev = i ? new Date(r.labels[i - 1].value) : undefined;
    const year = !prev || prev.getFullYear() !== d.getFullYear();
    assert.strictEqual(
      /\d{4}/.test(l.lines[0]),
      year,
      `${context}: "${l.lines[0]}" ${year ? "names" : "leaves out"} the year (got ${texts})`,
    );
  });
  years.forEach(y =>
    assert.ok(
      texts.some(t => t.includes(`${y}`)),
      `${context}: names ${y} (got ${texts})`,
    ),
  );
}

const spans = {
  january: {start: [2023, 0, 2], days: 300},
  midyear: {start: [2023, 5, 15], days: 300},
};

for (const renderer of ["svg", "canvas"]) {
  for (const volume of [false, true]) {
    const strip = volume ? " with volume" : "";
    it(
      `Candlestick (${renderer}${strip}) names both years at every width, with whole labels`,
      {timeout: 120000},
      async function () {
        for (const [name, span] of Object.entries(spans)) {
          for (const width of [260, 320, 420, 700]) {
            const r = await run({...span, width, volume}, renderer);
            assertFit(r, `${name}@${width}`, [2023, 2024]);
            if (name === "january")
              assert.strictEqual(
                r.labels[0].value,
                r.first,
                `${name}@${width}: labels the first period`,
              );
          }
        }
      },
    );

    it(
      `Candlestick (${renderer}${strip}) keeps wide charts on quarters`,
      {timeout: 120000},
      async function () {
        for (const width of [420, 700]) {
          const january = await run(
            {...spans.january, width, volume},
            renderer,
          );
          assert.deepStrictEqual(
            january.labels.map(l => l.lines[0]),
            ["Jan 2023", "Apr", "Jul", "Oct", "2024"],
            `january@${width}`,
          );
          const midyear = await run(
            {...spans.midyear, width, volume},
            renderer,
          );
          assert.deepStrictEqual(
            midyear.labels.map(l => l.lines[0]),
            ["Jul 2023", "Oct", "2024", "Apr", "Jul"],
            `midyear@${width}: the first period crowds July's, which leads`,
          );
        }
      },
    );
  }
}
