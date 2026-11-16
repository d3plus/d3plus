import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    #279: `outlier` rings a Plot's outliers and labels them with their name
    and value, in place of the mark's own label, and notes them in tooltips
    and aria labels, on both backends.
*/

const months = Array.from({length: 12}, (_, i) => i + 1);
const series = ["North", "South"].flatMap((id, s) =>
  months.map(month => ({
    id,
    month,
    value:
      (s ? 60 : 40) +
      (month % 3) +
      (id === "North" && month === 5 ? 25 : 0) +
      (id === "South" && month === 9 ? -25 : 0),
  })),
);

const points = Array.from({length: 24}, (_, k) => ({
  id: `p${k}`,
  group: k % 2 ? "b" : "a",
  x: k,
  y: k === 6 ? 40 : 10 + (k % 4),
}));

const products = ["A", "B", "C", "D", "E", "F"].map((name, k) => ({
  name,
  sales: k === 3 ? 90 : 30 + k,
}));

/**
    Opens a page and renders `kind` with `calls` (`[method, ...args]` pairs,
    applied in order) into a 600×400 #viz, kept as `window.__viz`.
*/
async function chart(kind, calls, renderer) {
  const opened = await openPage(
    '<div id="viz" style="width:600px;height:400px;font-family:sans-serif;"></div>',
  );
  await opened.page.evaluate(
    ([kind, calls, renderer]) =>
      new Promise(resolve => {
        const viz = new window.d3plus[kind]();
        for (const [method, ...args] of JSON.parse(JSON.stringify(calls)))
          viz[method](...args);
        window.__viz = viz;
        window.__surface = renderer === "canvas" ? "canvas" : "svg";
        viz.renderer(renderer).duration(0).select("#viz").render(resolve);
      }),
    [kind, calls, renderer],
  );
  return opened;
}

/** The rings, outlier labels, other labels, and marks the chart painted. */
function scene(page) {
  return page.evaluate(() => {
    const viz = window.__viz;
    const out = {rings: [], labels: [], texts: [], marks: [], aria: []};
    // Group offsets (a facet panel's) compose into each mark's position.
    const walk = (nodes, ox = 0, oy = 0) =>
      nodes.forEach(n => {
        const key = `${n.key}`;
        if (key.includes("outlier-ring-") && !key.includes("outlier-label-"))
          out.rings.push({
            key,
            type: n.type,
            geom:
              n.type === "circle"
                ? [ox + n.cx, oy + n.cy, n.r]
                : [ox + n.x, oy + n.y, n.width, n.height],
            stroke: n.paint.stroke,
            opacity: n.paint.opacity ?? 1,
            inert: n.interactive === false && n.aria.hidden === true,
          });
        else if (key.includes("outlier-label-"))
          out.labels.push({
            text: n.lines.map(l => l.text).join(" "),
            x: ox + (n.transform?.x || 0) + n.x,
            y: oy + (n.transform?.y || 0) + n.y,
          });
        else if (n.type === "text" && n.lines)
          out.texts.push(n.lines.map(l => l.text).join(" "));
        else if (n.shapeType && !key.endsWith("::hit")) {
          const t = n.transform || {};
          out.marks.push({
            key,
            type: n.type,
            circle: n.type === "circle" && [
              ox + (t.x || 0) + n.cx,
              oy + (t.y || 0) + n.cy,
              n.r,
            ],
            rect: n.type === "rect" && [
              ox + (t.x || 0) + n.x,
              oy + (t.y || 0) + n.y,
              n.width,
              n.height,
            ],
            points: (n.interactionPoints || []).map(p => [ox + p.x, oy + p.y]),
          });
          if (n.aria?.label) out.aria.push(n.aria.label);
        }
        if (n.children)
          walk(
            n.children,
            ox + (n.type === "group" ? n.transform?.x || 0 : 0),
            oy + (n.type === "group" ? n.transform?.y || 0 : 0),
          );
      });
    walk([viz._paintedScene.root]);
    const svg =
      window.__surface === "svg" && document.querySelector("#viz svg");
    out.dom = svg
      ? svg.querySelectorAll('[data-key^="outlier-ring-"]').length
      : null;
    out.outliers = viz._plotOutliers?.size;
    return out;
  });
}

/** Client coordinates of a point on the chart's surface. */
function client(page, [x, y]) {
  return page.evaluate(
    ([x, y]) => {
      const surface = document
        .querySelector(`#viz ${window.__surface}`)
        .getBoundingClientRect();
      return [surface.left + x, surface.top + y];
    },
    [x, y],
  );
}

/** Hovers a content-space point and reads the tooltip's rows. */
async function tooltip(page, point) {
  const [x, y] = await client(page, point);
  await page.mouse.move(5, 5);
  await page.mouse.move(x, y, {steps: 3});
  await page.waitForTimeout(80);
  return page.evaluate(() => {
    const tip = document.querySelector(".d3plus-tooltip");
    if (!tip) return null;
    return {
      title: tip.querySelector(".d3plus-tooltip-title")?.textContent,
      rows: Array.from(tip.querySelectorAll("tbody tr")).map(tr =>
        Array.from(tr.querySelectorAll("td")).map(td => td.textContent),
      ),
    };
  });
}

const near = (a, b, tolerance = 0.5) => Math.abs(a - b) <= tolerance;

for (const renderer of ["svg", "canvas"]) {
  it(`outliers ${renderer} — Scatter rings each group's outlier, labels it in place of its own label, and notes it in the tooltip`, async () => {
    const {page, close} = await chart(
      "Scatter",
      [
        ["data", points],
        ["groupBy", ["group", "id"]],
        ["x", "x"],
        ["y", "y"],
        ["outlier", true],
      ],
      renderer,
    );
    try {
      const s = await scene(page);
      assert.strictEqual(s.outliers, 1);
      assert.strictEqual(s.rings.length, 1);
      const [ring] = s.rings;
      assert.strictEqual(ring.type, "circle");
      assert.ok(ring.inert, "rings are inert and hidden from assistive tech");
      if (renderer === "svg") assert.strictEqual(s.dom, 1);
      const mark = s.marks.find(m => m.key.endsWith("_p6"));
      assert.ok(
        near(ring.geom[0], mark.circle[0]),
        `${ring.geom} ${mark.circle}`,
      );
      assert.ok(near(ring.geom[1], mark.circle[1]));
      assert.ok(
        near(ring.geom[2], mark.circle[2] + 2 + 1),
        `ring sits 2px clear of the point, 2px wide: ${ring.geom} ${mark.circle}`,
      );
      assert.deepStrictEqual(
        s.labels.map(l => l.text),
        ["p6: 40"],
      );
      assert.ok(!s.texts.includes("p6"), "the point's own label gives way");
      assert.ok(
        s.aria.some(a => /^p6, .* Outlier\.$/.test(a)),
        JSON.stringify(s.aria.slice(0, 8)),
      );
      const tip = await tooltip(page, mark.circle);
      assert.strictEqual(tip.title, "p6");
      assert.deepStrictEqual(tip.rows.at(-1), ["Outlier"]);
      const other = s.marks.find(m => m.key.endsWith("_p5"));
      const plain = await tooltip(page, other.circle);
      assert.ok(
        !plain.rows.some(r => r[0] === "Outlier"),
        JSON.stringify(plain),
      );
      // Hovering another point dims the ring with its point.
      const dimmed = await scene(page);
      assert.ok(dimmed.rings[0].opacity < 1);
    } finally {
      await close();
    }
  });

  it(`outliers ${renderer} — LinePlot rings each line's spike and dip on the line, and the shared tooltip names them`, async () => {
    const {page, close} = await chart(
      "LinePlot",
      [
        ["data", series],
        ["groupBy", "id"],
        ["x", "month"],
        ["y", "value"],
        ["outlier", true],
      ],
      renderer,
    );
    try {
      const s = await scene(page);
      assert.strictEqual(s.rings.length, 2);
      const north = s.marks.find(m => m.key === "North");
      const south = s.marks.find(m => m.key === "South");
      const [spike] = s.rings.filter(r => r.key.includes("North"));
      const [dip] = s.rings.filter(r => r.key.includes("South"));
      assert.ok(near(spike.geom[0], north.points[4][0]));
      assert.ok(near(spike.geom[1], north.points[4][1]));
      assert.strictEqual(spike.geom[2], 6, "a line point's ring is r 6");
      assert.ok(near(dip.geom[1], south.points[8][1]));
      assert.deepStrictEqual(s.labels.map(l => l.text).sort(), [
        "North: 67",
        "South: 35",
      ]);
      const spikeLabel = s.labels.find(l => l.text.startsWith("North"));
      assert.ok(
        Math.hypot(spikeLabel.x - spike.geom[0], spikeLabel.y - spike.geom[1]) >
          spike.geom[2],
        "the label sits beside the ring",
      );
      assert.ok(s.aria.some(a => /^North.* Outlier: 5\.$/.test(a)));
      const tip = await tooltip(page, north.points[4]);
      assert.ok(
        tip.rows.some(r => r[0].includes("North (Outlier)")),
        JSON.stringify(tip.rows),
      );
      assert.ok(!tip.rows.some(r => r[0].includes("South (Outlier)")));
    } finally {
      await close();
    }
  });

  it(`outliers ${renderer} — BarChart boxes the outlying bar, labels it past its end, and its tooltip says so`, async () => {
    const {page, close} = await chart(
      "BarChart",
      [
        ["data", products],
        ["groupBy", "name"],
        ["x", "name"],
        ["y", "sales"],
        ["outlier", true],
      ],
      renderer,
    );
    try {
      const s = await scene(page);
      assert.strictEqual(s.rings.length, 1);
      const [ring] = s.rings;
      assert.strictEqual(ring.type, "rect");
      const bar = s.marks.find(m => m.key.startsWith("D") && m.rect).rect;
      assert.ok(
        ring.geom[0] < bar[0] && ring.geom[0] + ring.geom[2] > bar[0] + bar[2],
      );
      assert.ok(ring.geom[1] <= bar[1] + 2, "the ring reaches the bar's top");
      assert.deepStrictEqual(
        s.labels.map(l => l.text),
        ["D: 90"],
      );
      const label = s.labels[0];
      assert.ok(
        label.y < ring.geom[1] || label.x > ring.geom[0] + ring.geom[2],
        "the label sits past the bar's end, or beside it",
      );
      const tip = await tooltip(page, [
        bar[0] + bar[2] / 2,
        bar[1] + bar[3] / 2,
      ]);
      assert.deepStrictEqual(tip.rows.at(-1), ["Outlier"]);
    } finally {
      await close();
    }
  });

  it(`outliers ${renderer} — AreaPlot rings the top edge, BoxWhisker keeps its own, and off draws none`, async () => {
    const area = await chart(
      "AreaPlot",
      [
        ["data", series.filter(d => d.id === "North")],
        ["groupBy", "id"],
        ["x", "month"],
        ["y", "value"],
        ["outlier", true],
      ],
      renderer,
    );
    try {
      const s = await scene(area.page);
      assert.strictEqual(s.rings.length, 1);
      const y = await area.page.evaluate(
        () => window.__viz._yFunc(67) + window.__viz._chartTransform.y,
      );
      assert.ok(near(s.rings[0].geom[1], y, 1), "on the area's top edge");
    } finally {
      await area.close();
    }
    const box = await chart(
      "BoxWhisker",
      [
        ["data", points],
        ["groupBy", ["group", "id"]],
        ["x", "group"],
        ["y", "y"],
        ["outlier", true],
      ],
      renderer,
    );
    try {
      assert.strictEqual((await scene(box.page)).rings.length, 0);
    } finally {
      await box.close();
    }
    const off = await chart(
      "Scatter",
      [
        ["data", points],
        ["groupBy", ["group", "id"]],
        ["x", "x"],
        ["y", "y"],
      ],
      renderer,
    );
    try {
      const s = await scene(off.page);
      assert.strictEqual(s.rings.length + s.labels.length, 0);
    } finally {
      await off.close();
    }
  });

  it(`outliers ${renderer} — dark theme rings in light ink; outlierConfig styles them; facets find their own; locales translate`, async () => {
    const dark = await chart(
      "Scatter",
      [
        ["data", points],
        ["groupBy", ["group", "id"]],
        ["x", "x"],
        ["y", "y"],
        ["theme", "dark"],
        ["locale", "es-ES"],
        ["outlier", true],
      ],
      renderer,
    );
    try {
      const s = await dark.page.evaluate(() => window.__viz._theme.text);
      const {rings, marks} = await scene(dark.page);
      assert.strictEqual(rings[0].stroke, s);
      const tip = await tooltip(
        dark.page,
        marks.find(m => m.key.endsWith("_p6")).circle,
      );
      assert.deepStrictEqual(tip.rows.at(-1), ["Valor atípico"]);
    } finally {
      await dark.close();
    }
    const styled = await chart(
      "Scatter",
      [
        ["data", points],
        ["groupBy", ["group", "id"]],
        ["x", "x"],
        ["y", "y"],
        ["outlier", {method: "mad", k: 3}],
        [
          "outlierConfig",
          {stroke: "#e03131", strokeWidth: 4, gap: 0, label: false},
        ],
      ],
      renderer,
    );
    try {
      const s = await scene(styled.page);
      assert.strictEqual(s.rings.length, 1);
      assert.strictEqual(s.rings[0].stroke, "#e03131");
      const mark = s.marks.find(m => m.key.endsWith("_p6"));
      assert.ok(near(s.rings[0].geom[2], mark.circle[2] + 2));
      assert.strictEqual(s.labels.length, 0);
      assert.ok(s.texts.includes("p6"), "with no outlier label, its own stays");
    } finally {
      await styled.close();
    }
    const facets = await chart(
      "Scatter",
      [
        [
          "data",
          points
            .map(d => ({...d, panel: "one"}))
            .concat(points.map(d => ({...d, id: `${d.id}-2`, panel: "two"}))),
        ],
        ["groupBy", ["group", "id"]],
        ["x", "x"],
        ["y", "y"],
        ["facet", "panel"],
        ["outlier", true],
      ],
      renderer,
    );
    try {
      const s = await scene(facets.page);
      assert.strictEqual(s.rings.length, 2, "one in each panel");
      const mark = s.marks.find(m => m.key.endsWith("_p6-2"));
      const tip = await tooltip(facets.page, mark.circle);
      assert.strictEqual(tip.title, "p6-2");
      assert.deepStrictEqual(tip.rows.at(-1), ["Outlier"]);
    } finally {
      await facets.close();
    }
  });
}
