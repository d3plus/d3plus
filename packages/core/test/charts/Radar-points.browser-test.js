import {describe, it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";
import {render} from "~test/browser/render.js";

/**
    #436: a Radar draws a dot on each polygon vertex, colored like its
    polygon and styled by `shapeConfig.Circle`. Hovering a dot shows that
    group's value for its metric, keeps its polygon lit, and keeps only that
    metric's name bright, on SVG and Canvas, in small multiples, and from
    the keyboard.
*/

const data = [
  {id: "A", axis: "Speed", value: 3},
  {id: "A", axis: "Power", value: 5},
  {id: "A", axis: "Range", value: 4},
  {id: "B", axis: "Speed", value: 4},
  {id: "B", axis: "Power", value: 2},
];

const box = "<div id='viz' style='width:600px;height:450px'></div>";

/**
    Every painted node whose key matches `pattern`, with its paint and its
    center in client coordinates (group translations and scales composed).
    Runs in the page.
*/
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
        r: node.r,
        paint: node.paint || {},
        hoverKeys: node.hoverKeys,
        aria: node.aria?.label,
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

/** The metric labels' opacity, by name. Runs in the page. */
const labelOpacity = () => {
  const out = {};
  const walk = (node, inside) => {
    const here = inside || node.key === "radar-axis-labels";
    if (node.type === "text" && here)
      out[node.lines.map(l => l.text).join(" ")] = node.paint?.opacity ?? 1;
    (node.children || []).forEach(c => walk(c, here));
  };
  walk(window.__viz._paintedScene.root);
  return out;
};

/** The visible tooltip's title and body rows, or null. Runs in the page. */
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

/** Draws a Radar into a fresh page, kept as `window.__viz`. */
async function chart(renderer, config = {}) {
  const opened = await openPage(box);
  await opened.page.evaluate(
    ([rows, renderer, src]) =>
      new Promise(resolve => {
        const viz = new window.d3plus.Radar()
          .select("#viz")
          .renderer(renderer)
          .duration(0)
          .data(rows)
          .groupBy("id")
          .metric("axis")
          .value("value")
          .config(new Function(`return (${src});`)());
        window.__viz = viz;
        viz.render(resolve);
      }),
    [data, renderer, config],
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

describe.each(["svg", "canvas"])("Radar points (%s)", renderer => {
  it("draws a dot on every vertex, colored like its polygon", async () => {
    const {page, close} = await chart(renderer, "{}");
    try {
      const dots = await probe(page, "^radar-point-");
      const polys = await probe(page, "^radar-[AB]$");
      assert.deepStrictEqual(dots.map(d => d.key).sort(), [
        "radar-point-A-Power",
        "radar-point-A-Range",
        "radar-point-A-Speed",
        "radar-point-B-Power",
        "radar-point-B-Speed",
      ]);
      const fill = Object.fromEntries(
        polys.map(p => [p.key.slice(-1), p.paint.fill]),
      );
      for (const d of dots) {
        assert.strictEqual(d.type, "circle");
        assert.strictEqual(d.r, 3, `${d.key}: default radius`);
        assert.strictEqual(d.paint.fill, fill[d.key.split("-")[2]], d.key);
      }
      assert.ok(
        !dots.some(d => d.key === "radar-point-B-Range"),
        "no dot for a metric B has no value for",
      );
      const a = dots.find(d => d.key === "radar-point-A-Range");
      assert.deepStrictEqual(a.hoverKeys, {metric: ["Range"]});
      assert.strictEqual(a.aria, "A, Range: 4.");
    } finally {
      await close();
    }
  });

  it("hovering a dot shows its metric's value and keeps only that name bright", async () => {
    const {page, close} = await chart(renderer, "{}");
    try {
      const [dot] = await probe(page, "^radar-point-A-Range$");
      await page.mouse.move(5, 5);
      await page.mouse.move(dot.at[0], dot.at[1], {steps: 3});
      await page.waitForTimeout(80);
      assert.deepStrictEqual(await run(page, tooltip), {
        title: "A",
        rows: [["Range", "4"]],
      });
      assert.deepStrictEqual(await run(page, labelOpacity), {
        Speed: 0.5,
        Power: 0.5,
        Range: 1,
      });
      const opacity = Object.fromEntries(
        (await probe(page, "^radar-(point-)?[AB]")).map(n => [
          n.key,
          n.paint.opacity ?? 1,
        ]),
      );
      assert.strictEqual(opacity["radar-A"], 1, "its polygon stays lit");
      assert.strictEqual(opacity["radar-B"], 0.5, "the other polygon dims");
      assert.strictEqual(opacity["radar-point-B-Speed"], 0.5);
      assert.strictEqual(opacity["radar-point-A-Speed"], 1);

      // Over the polygon body, away from every vertex: the group, every
      // metric it has a value for lit, and no value row.
      const [speed] = await probe(page, "^radar-point-A-Speed$");
      const [power] = await probe(page, "^radar-point-A-Power$");
      const body = [
        (speed.at[0] + power.at[0] + dot.at[0]) / 3,
        (speed.at[1] + power.at[1] + dot.at[1]) / 3,
      ];
      await page.mouse.move(5, 5);
      await page.mouse.move(body[0], body[1], {steps: 3});
      await page.waitForTimeout(80);
      assert.deepStrictEqual(await run(page, tooltip), {title: "A", rows: []});
      assert.ok(
        !(await run(page, () =>
          document
            .querySelector(".d3plus-tooltip")
            .textContent.includes("false"),
        )),
        'no stray "false" in the polygon tooltip',
      );
      assert.deepStrictEqual(await run(page, labelOpacity), {
        Speed: 1,
        Power: 1,
        Range: 1,
      });
    } finally {
      await close();
    }
  });

  it("shapeConfig.Circle styles the dots, and r: 0 hides them", async () => {
    const styled = await chart(
      renderer,
      `{shapeConfig: {Circle: {r: 6, fill: "#123456", strokeWidth: 2}}}`,
    );
    try {
      const dots = await probe(styled.page, "^radar-point-");
      assert.strictEqual(dots.length, 5);
      for (const d of dots) {
        assert.strictEqual(d.r, 6);
        assert.strictEqual(d.paint.fill, "#123456");
        assert.strictEqual(d.paint.strokeWidth, 2);
      }
    } finally {
      await styled.close();
    }
    const some = await chart(
      renderer,
      `{shapeConfig: {Circle: {r: d => (d.axis === "Speed" ? 4 : 0)}}}`,
    );
    try {
      const dots = await probe(some.page, "^radar-point-");
      assert.deepStrictEqual(dots.map(d => d.key).sort(), [
        "radar-point-A-Speed",
        "radar-point-B-Speed",
      ]);
    } finally {
      await some.close();
    }
    const hidden = await chart(renderer, `{shapeConfig: {Circle: {r: 0}}}`);
    try {
      assert.deepStrictEqual(await probe(hidden.page, "^radar-point-"), []);
      assert.strictEqual(
        (await probe(hidden.page, "^radar-[AB]$")).length,
        2,
        "the polygons still draw",
      );
    } finally {
      await hidden.close();
    }
  });
});

describe.each(["svg", "canvas"])("Radar points facet (%s)", renderer => {
  it("each panel draws its own dots, and hovering one shows its value", async () => {
    const opened = await openPage(box);
    const {page, close} = opened;
    try {
      await page.evaluate(
        ([rows, renderer]) =>
          new Promise(resolve => {
            const viz = new window.d3plus.Radar()
              .select("#viz")
              .renderer(renderer)
              .duration(0)
              .data(rows)
              .groupBy("id")
              .metric("axis")
              .value("value")
              .facet("panel");
            window.__viz = viz;
            viz.render(resolve);
          }),
        [
          [
            ...data.map(d => ({...d, panel: "One"})),
            ...data.map(d => ({...d, panel: "Two", value: d.value + 1})),
          ],
          renderer,
        ],
      );
      const dots = await probe(page, "radar-point-");
      assert.strictEqual(dots.length, 10, "five dots per panel");
      const rangeDots = dots.filter(d => d.key.endsWith("radar-point-A-Range"));
      assert.strictEqual(rangeDots.length, 2);
      // The right-hand panel's A Range dot.
      const dot = rangeDots.sort((a, b) => b.at[0] - a.at[0])[0];
      await page.mouse.move(5, 5);
      await page.mouse.move(dot.at[0], dot.at[1], {steps: 3});
      await page.waitForTimeout(80);
      assert.deepStrictEqual(await run(page, tooltip), {
        title: "A",
        rows: [["Range", "5"]],
      });
    } finally {
      await close();
    }
  });
});

it("keyboard focus reaches the dots and shows their values", async () => {
  const records = await render(
    box,
    async rows => {
      const viz = new window.d3plus.Radar()
        .select("#viz")
        .duration(0)
        .data(rows)
        .groupBy("id")
        .metric("axis")
        .value("value");
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
      for (let i = 0; i < 7; i++) {
        host.dispatchEvent(
          new KeyboardEvent("keydown", {key: "ArrowRight", bubbles: true}),
        );
        await wait();
        out.push(record());
      }
      return out;
    },
    data,
  );
  const dots = records.filter(r => /: \d+\.$/.test(r.live));
  assert.ok(dots.length > 0, `reaches a dot (${records.map(r => r.live)})`);
  for (const r of dots) {
    const [, metric, value] = r.live.match(/, (\w+): (\d+)\.$/);
    assert.deepStrictEqual(r.rows, [`${metric}${value}`], r.live);
  }
});
