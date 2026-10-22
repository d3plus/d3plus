import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    PolarArea renders in Chromium on both backends: stacked wedges on a sqrt
    radius scale, one wedge per row without a metric, the linear scale and
    inner radius, value rings and their labels, category labels (horizontal,
    or along the spokes when crowded), the legend rule, the tooltip rows,
    hover dimming, Canvas painting + picking, and small multiples.
*/

const months = ["Jan", "Feb", "Mar", "Apr"];
const causes = {Disease: [100, 400, 900, 25], Wounds: [0, 50, 100, 75]};
const rose = Object.keys(causes).flatMap(cause =>
  months.map((month, m) => ({cause, month, deaths: causes[cause][m]})),
);

it(
  "PolarArea stacks each metric's groups outward on an area-true scale",
  {timeout: 180000},
  async function () {
    const out = await render(
      "<div id='viz' style='width:600px;height:500px'></div>",
      async rows => {
        const viz = new window.d3plus.PolarArea()
          .select("#viz")
          .duration(0)
          .data(rows)
          .groupBy("cause")
          .metric("month")
          .value("deaths");
        await new Promise(r => viz.render(r));
        const scene = viz._chartScene;
        const wedges = scene.filter(n => n.type === "path" && n.datum);
        const svg = document.querySelector("#viz svg");
        const tbody = viz.schema.tooltipConfig.tbody[0];
        const jan = rows[0];
        return {
          keys: scene.map(n => n.key),
          wedges: wedges.map(w => ({
            key: w.key,
            arc: w.arc,
            cause: w.datum.cause,
            month: w.datum.month,
          })),
          frame: viz.ctx.polar,
          texts: [...svg.querySelectorAll("text")].map(t => t.textContent),
          aria: wedges.map(w => w.aria.label),
          nan: [...svg.querySelectorAll("*")].filter(n =>
            [...n.attributes].some(a => a.value.includes("NaN")),
          ).length,
          rowLabel: tbody[0](jan, 0),
          rowValue: tbody[1](jan, 0),
          transform: viz._chartTransform,
          margin: viz._margin,
          width: viz.schema.width,
          height: viz.schema.height,
        };
      },
      rose,
    );
    assert.ok(out.keys.includes("polararea-radial-circles"), "value rings");
    assert.ok(out.keys.includes("polararea-labels"), "category labels");
    assert.ok(out.keys.includes("polararea-level-labels"), "ring labels");
    assert.ok(
      out.keys.indexOf("polararea-level-labels") <
        out.keys.indexOf(out.wedges[0].key),
      "ring labels lie beneath the wedges, as Radar's do",
    );
    // Zero-valued Wounds in January has no extent and is left out.
    assert.strictEqual(out.wedges.length, 7);
    const find = (cause, month) =>
      out.wedges.find(w => w.cause === cause && w.month === month);
    const step = (Math.PI * 2) / 4;
    const marA = find("Disease", "Mar");
    assert.ok(
      Math.abs(marA.arc.startAngle - 2 * step) < 1e-9,
      "Mar is the third slot",
    );
    assert.ok(Math.abs(marA.arc.endAngle - 3 * step) < 1e-9);
    const marB = find("Wounds", "Mar");
    assert.strictEqual(
      marB.arc.innerRadius,
      marA.arc.outerRadius,
      "Wounds stacks on Disease",
    );
    const {outer} = out.frame;
    const [, hi] = out.frame.levels.domain;
    const expected = v => outer * Math.sqrt(v / hi);
    assert.ok(
      Math.abs(marA.arc.outerRadius - expected(900)) < 1e-6,
      "sqrt radius for 900",
    );
    assert.ok(
      Math.abs(marB.arc.outerRadius - expected(1000)) < 1e-6,
      "cumulative 1000",
    );
    assert.strictEqual(out.frame.inner, 0);
    for (const m of months) assert.ok(out.texts.includes(m), `labels ${m}`);
    assert.ok(out.texts.includes("1k"), "ring value label");
    assert.ok(
      out.texts.includes("Disease") && out.texts.includes("Wounds"),
      "a stacked rose keeps its legend",
    );
    assert.ok(
      out.aria.includes("Disease, Mar, 900."),
      "aria label names the group, metric, and value",
    );
    assert.strictEqual(out.nan, 0, "no NaN attributes");
    assert.strictEqual(
      out.rowLabel,
      "Jan",
      "tooltip row is labeled by the metric",
    );
    assert.strictEqual(out.rowValue, "100");
    const cx =
      out.margin.left + (out.width - out.margin.left - out.margin.right) / 2;
    assert.strictEqual(out.transform.x, cx, "centered in the chart area");
  },
);

it(
  "PolarArea gives each row its own slice without a metric, with no legend",
  {timeout: 180000},
  async function () {
    const out = await render(
      "<div id='viz' style='width:500px;height:400px'></div>",
      async () => {
        const rows = [
          {id: "N", value: 10},
          {id: "E", value: 40},
          {id: "S", value: 90},
          {id: "W", value: 0},
        ];
        const viz = new window.d3plus.PolarArea()
          .select("#viz")
          .duration(0)
          .data(rows);
        await new Promise(r => viz.render(r));
        const wedges = viz._chartScene.filter(
          n => n.type === "path" && n.datum,
        );
        const tbody = viz.schema.tooltipConfig.tbody[0];
        return {
          keys: wedges.map(w => w.key),
          texts: [...document.querySelectorAll("#viz svg text")].map(
            t => t.textContent,
          ),
          legend: viz.schema.legend({}, viz._filteredData),
          rowLabel: tbody[0](rows[0], 0),
          aria: wedges[0].aria.label,
          slots: viz.ctx.polar.slots.map(s => s.key),
        };
      },
    );
    assert.deepStrictEqual(out.keys, [
      "polararea-N-N",
      "polararea-E-E",
      "polararea-S-S",
    ]);
    assert.deepStrictEqual(
      out.slots,
      ["N", "E", "S", "W"],
      "a zero row keeps its slot",
    );
    for (const t of ["N", "E", "S", "W"])
      assert.ok(out.texts.includes(t), `labels ${t}`);
    assert.strictEqual(
      out.legend,
      false,
      "the category labels name every wedge",
    );
    assert.strictEqual(out.rowLabel, "Value");
    assert.strictEqual(out.aria, "N, 10.");
  },
);

it(
  "PolarArea takes a linear scale, an inner radius, padding, and explicit levels",
  {timeout: 180000},
  async function () {
    const out = await render(
      "<div id='viz' style='width:500px;height:400px'></div>",
      async () => {
        const viz = new window.d3plus.PolarArea()
          .select("#viz")
          .duration(0)
          .data([
            {id: "a", value: 5},
            {id: "b", value: 10},
            {id: "c", value: 20},
          ])
          .radialScale("linear")
          .innerRadius(40)
          .padPixel(4)
          .startAngle(90)
          .levels([0, 10, 20, 30])
          .levelFormat(d => `${d}%`);
        await new Promise(r => viz.render(r));
        const wedges = viz._chartScene.filter(
          n => n.type === "path" && n.datum,
        );
        const rings = viz._chartScene.find(
          n => n.key === "polararea-radial-circles",
        ).children;
        return {
          arcs: wedges.map(w => w.arc),
          frame: viz.ctx.polar,
          rings: rings.map(r => r.r),
          texts: [...document.querySelectorAll("#viz svg text")].map(
            t => t.textContent,
          ),
        };
      },
    );
    const {outer, inner} = out.frame;
    assert.strictEqual(inner, 40);
    assert.ok(
      out.arcs.every(a => a.innerRadius === 40),
      "wedges start at the inner radius",
    );
    const r = v => 40 + (v / 30) * (outer - 40);
    out.arcs.forEach((a, i) =>
      assert.ok(
        Math.abs(a.outerRadius - r([5, 10, 20][i])) < 1e-6,
        "linear radius",
      ),
    );
    assert.ok(
      Math.abs(out.arcs[0].startAngle - Math.PI / 2) < 1e-9,
      "startAngle rotates the first slot",
    );
    assert.ok(
      out.arcs.every(a => a.padAngle > 0),
      "padPixel becomes a pad angle",
    );
    assert.ok(
      Math.abs(out.rings[0] - 40) < 1e-6,
      "the zero ring sits on the inner radius",
    );
    for (const t of ["0%", "10%", "20%", "30%"])
      assert.ok(out.texts.includes(t), `ring label ${t}`);
  },
);

it(
  "PolarArea turns crowded category labels along their spokes",
  {timeout: 180000},
  async function () {
    const out = await render(
      "<div id='viz' style='width:420px;height:380px'></div>",
      async () => {
        const rows = Array.from({length: 48}, (_v, i) => ({
          id: `Category ${i}`,
          value: 10 + (i % 7),
        }));
        const viz = new window.d3plus.PolarArea()
          .select("#viz")
          .duration(0)
          .data(rows);
        await new Promise(r => viz.render(r));
        const labels = viz._chartScene.find(n => n.key === "polararea-labels");
        return {
          count: labels.children.length,
          rotated: labels.children.filter(
            c => c.transform && c.transform.rotate,
          ).length,
          interactive: labels.children.every(c => c.interactive === false),
        };
      },
    );
    assert.strictEqual(out.count, 48);
    assert.ok(
      out.rotated > 40,
      `labels run along their spokes (${out.rotated})`,
    );
    assert.ok(out.interactive, "category labels never take the pointer");
  },
);

it(
  "PolarArea dims the other groups on hover, not the chrome",
  {timeout: 180000},
  async function () {
    const out = await render(
      "<div id='viz' style='width:500px;height:400px'></div>",
      async rows => {
        const viz = new window.d3plus.PolarArea()
          .select("#viz")
          .duration(0)
          .data(rows)
          .groupBy("cause")
          .metric("month")
          .value("deaths");
        await new Promise(r => viz.render(r));
        viz.hover(d => d.cause === "Disease");
        await new Promise(r => setTimeout(r, 50));
        const opacity = key => {
          const el = document.querySelector(`#viz [data-key='${key}']`);
          return el ? Number(el.getAttribute("opacity") ?? 1) : null;
        };
        return {
          disease: opacity("polararea-Disease-Mar"),
          wounds: opacity("polararea-Wounds-Mar"),
          rings: opacity("polararea-radial-circles"),
          labels: opacity("polararea-labels"),
        };
      },
      rose,
    );
    assert.strictEqual(out.disease, 1, "hovered group stays opaque");
    assert.strictEqual(out.wounds, 0.5, "other group dims");
    assert.ok(out.rings === null || out.rings === 1, "rings never dim");
    assert.ok(
      out.labels === null || out.labels === 1,
      "category labels never dim",
    );
  },
);

it(
  "PolarArea paints and picks on Canvas",
  {timeout: 180000},
  async function () {
    const out = await render(
      "<div id='viz' style='width:500px;height:400px'></div>",
      async rows => {
        const viz = new window.d3plus.PolarArea()
          .select("#viz")
          .duration(0)
          .renderer("canvas")
          .data(rows)
          .groupBy("cause")
          .metric("month")
          .value("deaths")
          .on("click", d => (window.__clicked = d && d.data ? d.data : d));
        await new Promise(r => viz.render(r));
        const canvas = document.querySelector(
          "#viz canvas.d3plus-render-canvas",
        );
        if (!canvas) return {hasCanvas: false};
        const wedge = viz._chartScene.find(
          n =>
            n.type === "path" &&
            n.datum &&
            n.datum.cause === "Disease" &&
            n.datum.month === "Mar",
        );
        const mid = (wedge.arc.startAngle + wedge.arc.endAngle) / 2;
        const r = (wedge.arc.innerRadius + wedge.arc.outerRadius) / 2;
        const x = viz._chartTransform.x + r * Math.sin(mid);
        const y = viz._chartTransform.y - r * Math.cos(mid);
        const rect = canvas.getBoundingClientRect();
        window.__clicked = undefined;
        canvas.dispatchEvent(
          new MouseEvent("click", {
            clientX: rect.left + x,
            clientY: rect.top + y,
            bubbles: true,
          }),
        );
        const px = canvas
          .getContext("2d")
          .getImageData(0, 0, canvas.width, canvas.height).data;
        const colors = new Set();
        for (let i = 0; i < px.length; i += 4)
          if (
            px[i + 3] > 250 &&
            !(px[i] > 245 && px[i + 1] > 245 && px[i + 2] > 245)
          )
            colors.add(`${px[i] >> 4}_${px[i + 1] >> 4}_${px[i + 2] >> 4}`);
        return {
          hasCanvas: true,
          colors: colors.size,
          clicked:
            window.__clicked &&
            `${window.__clicked.cause}-${window.__clicked.month}`,
        };
      },
      rose,
    );
    assert.ok(out.hasCanvas, "a <canvas> is mounted");
    assert.strictEqual(
      out.clicked,
      "Disease-Mar",
      "clicking a wedge picks its row",
    );
    assert.ok(
      out.colors >= 3,
      `canvas paints the wedges (${out.colors} colors)`,
    );
  },
);

it("PolarArea draws one panel per facet", {timeout: 180000}, async function () {
  const out = await render(
    "<div id='viz' style='width:900px;height:400px'></div>",
    async rows => {
      const data = ["East", "West"].flatMap(region =>
        rows.map(d => ({...d, region})),
      );
      const viz = new window.d3plus.PolarArea()
        .select("#viz")
        .duration(0)
        .data(data)
        .groupBy("cause")
        .metric("month")
        .value("deaths")
        .facet("region");
      await new Promise(r => viz.render(r));
      const all = [];
      const walk = nodes =>
        nodes.forEach(n => {
          all.push(n);
          if (n.children) walk(n.children);
        });
      walk(viz._chartScene);
      return {
        wedges: all.filter(n => n.type === "path" && n.datum && n.arc).length,
        labels: all.filter(n => `${n.key}`.endsWith("polararea-labels")).length,
        texts: [...document.querySelectorAll("#viz svg text")].map(
          t => t.textContent,
        ),
      };
    },
    rose,
  );
  assert.strictEqual(out.wedges, 14, "seven wedges in each panel");
  assert.strictEqual(out.labels, 2, "each panel labels its categories");
  assert.ok(
    out.texts.includes("East") && out.texts.includes("West"),
    "panel titles",
  );
});
