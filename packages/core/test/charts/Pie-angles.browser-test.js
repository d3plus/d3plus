import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    Pie and Donut `startAngle`/`endAngle` in a real browser, on both
    renderers: the default sweep is unchanged, a half Donut's wedges fill
    exactly the requested angles and the ring fills the chart's width,
    centered, its labels sit inside their wedges,
    hovering a wedge shows its tooltip, and the keyboard focus ring outlines
    a wedge.
*/

const data = [
  {id: "alpha", value: 50},
  {id: "beta", value: 30},
  {id: "gamma", value: 20},
];

/**
    Draws a chart and reads its painted scene: each wedge's arc and the ring's
    center (in page pixels), each label's center, and the chart area.
*/
const draw = ([chart, config, renderer]) =>
  new Promise(resolve => {
    const viz = new window.d3plus[chart]()
      .config(config)
      .renderer(renderer)
      .duration(0)
      .legend(false)
      .select("#viz");
    window.__viz = viz;
    viz.render(() => {
      const host =
        document.querySelector("#viz svg") ||
        document.querySelector("#viz canvas");
      const box = host.getBoundingClientRect();
      const wedges = [];
      const labels = [];
      const walk = (n, x, y) => {
        const t = n.transform || {};
        const nx = x + (t.x || 0),
          ny = y + (t.y || 0);
        if (n.shapeType === "Pie" && n.arc)
          wedges.push({
            id: n.datum.id,
            arc: n.arc,
            cx: box.left + x,
            cy: box.top + y,
          });
        if (n.shapeType === "Label" && n.type === "text") {
          const ls = n.lines || [];
          labels.push({
            text: ls.map(l => l.text).join(" "),
            x: box.left + nx + n.x + (n.width || 0) / 2,
            y: box.top + ny + n.y + (n.height || 0) / 2,
          });
        }
        (n.children || []).forEach(c => walk(c, nx, ny));
      };
      walk(viz._paintedScene.root, 0, 0);
      const m = viz._margin;
      resolve({
        wedges,
        labels,
        area: {
          left: box.left + m.left,
          top: box.top + m.top,
          right: box.left + viz.schema.width - m.right,
          bottom: box.top + viz.schema.height - m.bottom,
        },
      });
    });
  });

async function run(chart, config, renderer, check) {
  const {page, errors, close} = await openPage(
    '<div id="viz" style="width:600px;height:400px;"></div>',
  );
  try {
    const drawn = await page.evaluate(draw, [chart, config, renderer]);
    await check(page, drawn);
    assert.deepStrictEqual(errors, [], "no page errors");
  } finally {
    await close();
  }
}

const near = (a, b, eps, msg) =>
  assert.ok(
    Math.abs(a - b) <= eps,
    `${msg}: ${a} is not within ${eps} of ${b}`,
  );

/** The wedge's centroid, halfway along its angle and its radius, in page pixels. */
const centroid = w => {
  const a = (w.arc.startAngle + w.arc.endAngle) / 2;
  const r = (w.arc.innerRadius + w.arc.outerRadius) / 2;
  return [w.cx + r * Math.sin(a), w.cy - r * Math.cos(a)];
};

/** Whether a page point falls inside the wedge. */
const inside = (w, x, y) => {
  const dx = x - w.cx,
    dy = y - w.cy;
  const r = Math.hypot(dx, dy);
  const lo = Math.min(w.arc.startAngle, w.arc.endAngle);
  const hi = Math.max(w.arc.startAngle, w.arc.endAngle);
  let a = Math.atan2(dx, -dy);
  while (a < lo) a += Math.PI * 2;
  while (a > lo + Math.PI * 2) a -= Math.PI * 2;
  return r >= w.arc.innerRadius && r <= w.arc.outerRadius && a >= lo && a <= hi;
};

const halfDonut = {data, groupBy: "id", startAngle: -90, endAngle: 90};

for (const renderer of ["svg", "canvas"]) {
  it(`Pie ${renderer}: the default sweep is one full turn from 12 o'clock, centered`, async () => {
    await run(
      "Pie",
      {data, groupBy: "id"},
      renderer,
      async (page, {wedges, area}) => {
        const angles = wedges.map(w => [w.arc.startAngle, w.arc.endAngle]);
        const tau = Math.PI * 2;
        const expected = [
          [0, tau * 0.5],
          [tau * 0.5, tau * 0.8],
          [tau * 0.8, tau],
        ];
        angles.forEach((pair, i) =>
          pair.forEach((a, k) =>
            near(a, expected[i][k], 1e-9, `wedge ${i} angle ${k}`),
          ),
        );
        const w = area.right - area.left;
        const h = area.bottom - area.top;
        near(wedges[0].cx, area.left + w / 2, 1e-6, "centered x");
        near(wedges[0].cy, area.top + h / 2, 1e-6, "centered y");
        near(
          wedges[0].arc.outerRadius,
          Math.min(w, h) / 2 - 3,
          1e-6,
          "radius leaves the hover-stroke room",
        );
      },
    );
  });

  it(`Donut ${renderer}: a half donut spans exactly its angles and fills the width, centered`, async () => {
    await run("Donut", halfDonut, renderer, async (page, {wedges, area}) => {
      assert.strictEqual(wedges.length, 3, "three wedges");
      const sorted = [...wedges].sort(
        (a, b) => a.arc.startAngle - b.arc.startAngle,
      );
      near(sorted[0].arc.startAngle, -Math.PI / 2, 1e-9, "starts at 9");
      near(sorted[2].arc.endAngle, Math.PI / 2, 1e-9, "ends at 3");
      const total = wedges.reduce(
        (s, w) => s + (w.arc.endAngle - w.arc.startAngle),
        0,
      );
      near(total, Math.PI, 1e-9, "wedges sum to the span");
      // Each wedge's span includes one pad angle; the rest is split by value.
      const pad = sorted[0].arc.padAngle || 0;
      const shares = sorted.map(
        w => (w.arc.endAngle - w.arc.startAngle - pad) / (Math.PI - 3 * pad),
      );
      [0.5, 0.3, 0.2].forEach((s, i) => near(shares[i], s, 1e-9, `share ${i}`));
      const {cx, cy, arc} = wedges[0];
      const width = area.right - area.left;
      near(arc.outerRadius * 2, width - 6, 0.5, "the ring fills the width");
      near(cx, (area.left + area.right) / 2, 0.5, "centered horizontally");
      near(
        cy - arc.outerRadius / 2,
        (area.top + area.bottom) / 2,
        0.5,
        "the ring's footprint is centered vertically",
      );
      near(
        arc.innerRadius,
        (arc.outerRadius + 3) / 2,
        0.5,
        "the default hole is half the ring",
      );
    });
  });

  it(`Donut ${renderer}: a half donut's labels sit inside their wedges`, async () => {
    await run("Donut", halfDonut, renderer, async (page, {wedges, labels}) => {
      for (const w of wedges) {
        const label = labels.find(l => l.text.startsWith(w.id));
        assert.ok(label, `${w.id} has a label`);
        assert.ok(
          inside(w, label.x, label.y),
          `${w.id}'s label (${label.x}, ${label.y}) is inside its wedge`,
        );
      }
    });
  });

  it(`Donut ${renderer}: hovering a half donut's wedge shows its tooltip`, async () => {
    await run("Donut", halfDonut, renderer, async (page, {wedges}) => {
      const target = wedges.find(w => w.id === "gamma");
      const [x, y] = centroid(target);
      await page.mouse.move(x - 4, y - 4);
      await page.mouse.move(x, y, {steps: 3});
      await page.waitForTimeout(150);
      const {tips, hovered} = await page.evaluate(() => {
        const viz = window.__viz;
        const rows = viz._filteredData || [];
        return {
          tips: Array.from(document.querySelectorAll(".d3plus-tooltip"))
            .filter(el => getComputedStyle(el).opacity !== "0")
            .map(el => el.textContent),
          hovered:
            typeof viz._hover === "function"
              ? rows.filter((d, i) => viz._hover(d, i)).map(d => d.id)
              : [],
        };
      });
      assert.ok(
        tips.some(t => t.includes("gamma")),
        `the tooltip names gamma (got ${JSON.stringify(tips)})`,
      );
      assert.deepStrictEqual(hovered, ["gamma"], "only gamma is hovered");
    });
  });

  it(`Donut ${renderer}: the keyboard focus ring outlines a half donut's wedge`, async () => {
    await run("Donut", halfDonut, renderer, async page => {
      const ring = await page.evaluate(async () => {
        const viz = window.__viz;
        const host = document.querySelector("#viz .d3plus-keyboard-nav");
        host.focus();
        host.dispatchEvent(
          new KeyboardEvent("keydown", {key: "ArrowRight", bubbles: true}),
        );
        await new Promise(r => requestAnimationFrame(() => setTimeout(r, 40)));
        const find = (n, test) =>
          test(n)
            ? n
            : (n.children || []).reduce((f, c) => f || find(c, test), null);
        const root = viz._paintedScene.root;
        const focus = root.children.find(n => n.key === "viz-focus");
        const outline = focus && find(focus, n => n.type === "path");
        const wedges = [];
        const walk = n => {
          if (Array.isArray(n)) return n.forEach(walk);
          if (n.shapeType === "Pie" && n.arc) wedges.push(n.d);
          (n.children || []).forEach(walk);
        };
        walk(viz._paintedScene.root);
        return {
          current: viz._keyboardNav ? viz._keyboardNav.current : null,
          d: outline ? outline.d : null,
          wedges,
        };
      });
      assert.ok(ring.current !== null, "a wedge has keyboard focus");
      assert.ok(ring.d, "draws a path focus ring");
      assert.ok(ring.wedges.includes(ring.d), "the ring is a wedge's outline");
    });
  });

  it(`Pie ${renderer}: a half pie opening upward is centered`, async () => {
    await run(
      "Pie",
      {data, groupBy: "id", startAngle: 90, endAngle: 270},
      renderer,
      async (page, {wedges, area}) => {
        const {cy, cx, arc} = wedges[0];
        near(
          cy + arc.outerRadius / 2,
          (area.top + area.bottom) / 2,
          0.5,
          "the ring's footprint is centered vertically",
        );
        near(cx, (area.left + area.right) / 2, 0.5, "centered horizontally");
        near(arc.innerRadius, 0, 0, "no hole");
        const lo = Math.min(...wedges.map(w => w.arc.startAngle));
        const hi = Math.max(...wedges.map(w => w.arc.endAngle));
        near(lo, Math.PI / 2, 1e-9, "starts at 3");
        near(hi, (Math.PI * 3) / 2, 1e-9, "ends at 9");
      },
    );
  });
}
