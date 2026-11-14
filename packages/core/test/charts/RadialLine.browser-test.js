import {describe, it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";
import {render} from "~test/browser/render.js";

/**
    RadialLine renders in Chromium on both backends: one closed line per
    group around the circle, `x` as the angle (categories evenly, numbers by
    value over their period) and `y` as the radius, value rings, spokes and
    `x` labels beneath the lines, a dot on every point whose hover shows its
    value and keeps only its `x` label bright, `closed`, `direction` and
    `startAngle`, series labels, keyboard focus, and small multiples.
*/

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const highs = {Oslo: [1, 2, 5, 10, 16, 20], Cairo: [19, 21, 24, 28, 32, 34]};
const temps = Object.keys(highs).flatMap(city =>
  months.map((month, m) => ({city, month, high: highs[city][m]})),
);

const box = "<div id='viz' style='width:600px;height:500px'></div>";

/** Every painted node whose key matches `pattern`, with its client center. Runs in the page. */
const paintedNodes = pattern => {
  const viz = window.__viz;
  const surface = document
    .querySelector("#viz svg, #viz canvas")
    .getBoundingClientRect();
  const out = [];
  const walk = (node, x, y, k) => {
    const t = node.transform || {};
    const s = t.scale ?? 1;
    const nx = x + (t.x ?? 0) * k,
      ny = y + (t.y ?? 0) * k,
      nk = k * s;
    if (new RegExp(pattern).test(`${node.key}`))
      out.push({
        key: `${node.key}`,
        type: node.type,
        d: node.d,
        paint: node.paint || {},
        interactive: node.interactive,
        hoverKeys: node.hoverKeys,
        aria: node.aria?.label,
        text: node.lines?.map(l => l.text).join(" "),
        local: [t.x ?? 0, t.y ?? 0],
        at: [
          surface.left + nx + (node.cx ?? 0) * nk,
          surface.top + ny + (node.cy ?? 0) * nk,
        ],
      });
    (node.children || []).forEach(c => walk(c, nx, ny, nk));
  };
  walk(viz._paintedScene.root, 0, 0, 1);
  return out;
};

/** The `x` labels' opacity, by text. Runs in the page. */
const labelOpacity = () => {
  const out = {};
  const walk = (node, inside) => {
    const here = inside || node.key === "radial-labels";
    if (node.type === "text" && here)
      out[node.lines.map(l => l.text).join(" ")] = node.paint?.opacity ?? 1;
    (node.children || []).forEach(c => walk(c, here));
  };
  walk(window.__viz._paintedScene.root);
  return out;
};

/** The visible tooltip's title and rows, or null. Runs in the page. */
const tooltip = () => {
  const t = document.querySelector(".d3plus-tooltip");
  if (!t || getComputedStyle(t).visibility === "hidden") return null;
  return {
    title: t.querySelector(".d3plus-tooltip-title")?.textContent ?? "",
    rows: Array.from(t.querySelectorAll(".d3plus-tooltip-tbody tr")).map(tr =>
      Array.from(tr.querySelectorAll("td")).map(td => td.textContent),
    ),
  };
};

/** Draws a chart into a fresh page, kept as `window.__viz`. */
async function chart(renderer, config, rows = temps, cls = "RadialLine") {
  const opened = await openPage(box);
  await opened.page.evaluate(
    ([rows, renderer, src, cls]) =>
      new Promise(resolve => {
        const viz = new window.d3plus[cls]()
          .select("#viz")
          .renderer(renderer)
          .duration(0)
          .data(rows)
          .config(new Function(`return (${src});`)());
        window.__viz = viz;
        viz.render(resolve);
      }),
    [rows, renderer, config, cls],
  );
  return opened;
}

const probe = (page, pattern) =>
  page.evaluate(
    ([src, p]) => new Function(`return (${src})`)()(p),
    [paintedNodes.toString(), pattern],
  );
const run = (page, fn) =>
  page.evaluate(src => new Function(`return (${src})`)()(), fn.toString());

const base = `{groupBy: "city", x: "month", y: "high"}`;

describe.each(["svg", "canvas"])("RadialLine (%s)", renderer => {
  it("draws a closed line per group over the rings, spokes and labels", async () => {
    const {page, close} = await chart(renderer, base);
    try {
      const out = await page.evaluate(() => {
        const viz = window.__viz;
        return {
          keys: viz._chartScene.map(n => n.key),
          frame: {
            inner: viz.ctx.radial.inner,
            outer: viz.ctx.radial.outer,
            domain: viz.ctx.radial.levels.domain,
          },
        };
      });
      const lines = await probe(page, "^radial-line-");
      const dots = await probe(page, "^radial-point-");
      const labels = await probe(page, "^radial-label-");
      assert.ok(
        [...lines.map(l => l.d), ...dots.flatMap(d => d.local)].every(
          v => !`${v}`.includes("NaN"),
        ),
        "no NaN in the marks",
      );
      const at = key => out.keys.indexOf(key);
      for (const k of [
        "radial-radial-circles",
        "radial-spokes",
        "radial-labels",
        "radial-level-labels",
      ])
        assert.ok(at(k) >= 0 && at(k) < at("radial-line-Oslo"), `${k} beneath`);
      assert.deepStrictEqual(lines.map(l => l.key).sort(), [
        "radial-line-Cairo",
        "radial-line-Oslo",
      ]);
      for (const l of lines) {
        assert.ok(/Z$/.test(l.d), `${l.key} loops back to its start`);
        assert.strictEqual(l.paint.fill, "none");
        assert.strictEqual(l.paint.strokeWidth, 2);
        assert.strictEqual(l.interactive, false, "its dots take the pointer");
      }
      assert.strictEqual(dots.length, 12, "a dot on every point");
      assert.deepStrictEqual(
        labels.map(l => l.text).filter(Boolean).length > 0,
        true,
        "the months are labeled",
      );
      assert.deepStrictEqual(out.frame.domain, [0, 40]);
      assert.strictEqual(out.frame.inner, 0);
      // Jan sits at 12 o'clock and Apr (half way round) at 6 o'clock.
      const jan = (await probe(page, "^radial-point-Cairo-Jan$"))[0].local;
      const apr = (await probe(page, "^radial-point-Cairo-Apr$"))[0].local;
      assert.ok(Math.abs(jan[0]) < 1e-6 && jan[1] < 0, `Jan up: ${jan}`);
      assert.ok(Math.abs(apr[0]) < 1e-6 && apr[1] > 0, `Apr down: ${apr}`);
      const r = Math.hypot(...jan);
      const expected = (19 / 40) * out.frame.outer;
      assert.ok(Math.abs(r - expected) < 1e-6, `radius ${r} ≈ ${expected}`);
    } finally {
      await close();
    }
  });

  it("hovering a dot shows its value and keeps only its month bright", async () => {
    const {page, close} = await chart(renderer, base);
    try {
      const [dot] = await probe(page, "^radial-point-Cairo-Mar$");
      assert.strictEqual(dot.aria, "Cairo, Mar: 24.");
      await page.mouse.move(5, 5);
      await page.mouse.move(dot.at[0], dot.at[1], {steps: 3});
      await page.waitForTimeout(80);
      assert.deepStrictEqual(await run(page, tooltip), {
        title: "Cairo",
        rows: [["Mar", "24"]],
      });
      const opacity = await run(page, labelOpacity);
      for (const m of months)
        assert.strictEqual(opacity[m], m === "Mar" ? 1 : 0.5, m);
      const lines = Object.fromEntries(
        (await probe(page, "^radial-line-")).map(n => [
          n.key,
          n.paint.opacity ?? 1,
        ]),
      );
      assert.strictEqual(lines["radial-line-Cairo"], 1, "its line stays lit");
      assert.strictEqual(lines["radial-line-Oslo"], 0.5, "the other dims");
    } finally {
      await close();
    }
  });

  it("closed(false), counterclockwise, startAngle, and no dots", async () => {
    const {page, close} = await chart(
      renderer,
      `{groupBy: "city", x: "month", y: "high", closed: false,
        direction: "counterclockwise", startAngle: 90,
        shapeConfig: {Circle: {r: 0}}}`,
    );
    try {
      const lines = await probe(page, "^radial-line-");
      assert.strictEqual(lines.length, 2);
      for (const l of lines) {
        assert.ok(!l.d.includes("Z"), `${l.key} stays open`);
        assert.strictEqual(l.interactive, true, "without dots, it answers");
      }
      assert.deepStrictEqual(await probe(page, "^radial-point-"), []);
      // Jan at 3 o'clock; Feb a sixth of a turn counterclockwise, above it.
      const [first, second] = lines
        .find(l => l.key === "radial-line-Cairo")
        .d.match(/-?[\d.]+(e-?\d+)?,-?[\d.]+(e-?\d+)?/g)
        .map(p => p.split(",").map(Number));
      assert.ok(first[0] > 0 && Math.abs(first[1]) < 1e-6, `Jan: ${first}`);
      assert.ok(second[1] < 0, `Feb is above: ${second}`);
    } finally {
      await close();
    }
  });

  it("numbers spread by value over their period, and series labels name the lines", async () => {
    const hours = ["Weekday", "Weekend"].flatMap((day, k) =>
      [0, 6, 12, 18].map(hour => ({day, hour, cars: 10 + hour * (k + 1)})),
    );
    const {page, close} = await chart(
      renderer,
      `{groupBy: "day", x: "hour", y: "cars", xDomain: [0, 24],
        xFormat: h => h + "h", lineLabels: true}`,
      hours,
    );
    try {
      const dot = (await probe(page, "^radial-point-Weekday-6$"))[0].local;
      assert.ok(
        dot[0] > 0 && Math.abs(dot[1]) < 1e-6,
        `6h at 3 o'clock: ${dot}`,
      );
      const texts = (await probe(page, "^radial-label-")).map(l => l.text);
      assert.ok(texts.includes("18h"), `xFormat labels: ${texts}`);
      const labels = await probe(page, "^radial-series-label-");
      assert.ok(labels.length >= 1, "at least one series is named");
      for (const l of labels)
        assert.ok(["Weekday", "Weekend"].includes(l.text));
      const [{d}] = await probe(page, "^radial-line-Weekday$");
      assert.ok(/Z$/.test(d));
      const tip = await run(page, () => {
        const viz = window.__viz;
        const row = viz._filteredData.find(
          r => r.day === "Weekend" && r.hour === 12,
        );
        return viz.schema.tooltipConfig.tbody(row);
      });
      assert.deepStrictEqual(tip, [["12h", "34"]]);
    } finally {
      await close();
    }
  });

  it("draws one panel per facet, each fit to its own values unless shared", async () => {
    const rows = ["North", "South"].flatMap((panel, p) =>
      temps.map(d => ({...d, panel, high: d.high * (p + 1)})),
    );
    for (const [scales, same] of [
      ["independent", false],
      ["shared", true],
    ]) {
      const {page, close} = await chart(
        renderer,
        `{...${base}, facet: "panel", facetConfig: {scales: "${scales}"}}`,
        rows,
      );
      try {
        const lines = await probe(page, "radial-line-");
        assert.strictEqual(lines.length, 4, "two lines per panel");
        const rings = await probe(page, "radial-level-label-");
        const values = new Set(rings.map(r => r.text));
        assert.strictEqual(
          values.has("80"),
          true,
          `${scales}: the larger panel reaches 80`,
        );
        assert.strictEqual(
          rings.filter(r => r.text === "80").length === 2,
          same,
          `${scales}: ${[...values]}`,
        );
      } finally {
        await close();
      }
    }
  });
});

it("keyboard focus reaches the dots and shows their values", async () => {
  const records = await render(
    box,
    async rows => {
      const viz = new window.d3plus.RadialLine()
        .select("#viz")
        .duration(0)
        .data(rows)
        .groupBy("city")
        .x("month")
        .y("high");
      await new Promise(r => viz.render(r));
      const wait = () =>
        new Promise(r => requestAnimationFrame(() => setTimeout(r, 40)));
      const host = document.querySelector("#viz .d3plus-keyboard-nav");
      const record = () => {
        const tip = document.querySelector(".d3plus-tooltip");
        return {
          live: host.querySelector("[aria-live]").textContent,
          rows: tip
            ? Array.from(tip.querySelectorAll(".d3plus-tooltip-tbody tr")).map(
                tr => tr.textContent,
              )
            : [],
        };
      };
      const out = [];
      host.focus();
      await wait();
      out.push(record());
      for (let i = 0; i < 6; i++) {
        host.dispatchEvent(
          new KeyboardEvent("keydown", {key: "ArrowRight", bubbles: true}),
        );
        await wait();
        out.push(record());
      }
      return out;
    },
    temps,
  );
  const dots = records.filter(r => /: \d+\.$/.test(r.live));
  assert.ok(dots.length > 0, `reaches a dot (${records.map(r => r.live)})`);
  for (const r of dots) {
    const [, month, value] = r.live.match(/, (\w+): (\d+)\.$/);
    assert.deepStrictEqual(r.rows, [`${month}${value}`], r.live);
  }
});
