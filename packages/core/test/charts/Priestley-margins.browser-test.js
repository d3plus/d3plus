import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";
import {render} from "~test/browser/render.js";

/**
    Priestley's bars, their labels and their hit areas sit over the time axis
    whatever the margins around the chart: in each panel of small multiples,
    beside a legend on the left, and below a title and a legend on top, on
    both backends.
*/

// Both panels span 1900–2000 over the same lanes, so their scales match and,
// drawn in the wrong panel, one panel's bars cover the other's exactly.
const data = [
  {id: "A1", start: 1900, end: 1950, panel: "A"},
  {id: "A2", start: 1940, end: 2000, panel: "A"},
  {id: "B1", start: 1900, end: 1950, panel: "B"},
  {id: "B2", start: 1940, end: 2000, panel: "B"},
];

const layouts = {
  facet: {facet: "panel"},
  "left legend": {legendPosition: "left"},
  "top legend and title": {legendPosition: "top", title: "Eras"},
};

const HTML = "<div id='viz' style='width:900px;height:400px'></div>";

/**
    Runs in the page: draws a Priestley from `config` and reads its painted
    scene: each bar's and label's absolute box, each axis group's absolute
    offset and the top of its tick labels (keyed by panel), and where each bar's start and end fall on the
    axis scale.
*/
const draw = ([config, renderer]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.Priestley()
      .config(config)
      .renderer(renderer)
      .duration(0)
      .select("#viz");
    window.__viz = viz;
    viz.render(() => {
      const bars = [],
        labels = [],
        axes = {};
      // `axis` is the axis group a node sits in, if any.
      const walk = (n, x, y, axis) => {
        const t = n.transform || {};
        const nx = x + (t.x || 0),
          ny = y + (t.y || 0);
        const key = String(n.key);
        const panel = key.includes("/") ? key.split("/")[0] : "";
        if (/(^|\/)priestley-axis$/.test(key))
          axis = axes[panel] = {x: nx, y: ny, labelTop: Infinity};
        else if (axis && n.type === "text")
          axis.labelTop = Math.min(axis.labelTop, ny + (n.y || 0));
        else if (n.type === "rect" && /(^|\/)priestley-[AB]\d-\d+$/.test(key))
          bars.push({
            panel,
            id: n.datum.id,
            x: nx + n.x,
            y: ny + n.y,
            width: n.width,
            height: n.height,
          });
        else if (n.type === "text" && /(^|\/)priestley-label-/.test(key))
          labels.push({panel, x: nx + (n.x || 0), width: n.width});
        (n.children || []).forEach(c => walk(c, nx, ny, axis));
      };
      walk(viz._paintedScene.root, 0, 0);
      const scale = viz.ctx.axis._d3Scale;
      const year = y => new Date(y, 0, 1);
      const host =
        document.querySelector("#viz svg") ||
        document.querySelector("#viz canvas");
      const box = host.getBoundingClientRect();
      resolve({
        bars: bars.map(b => {
          const d = config.data.find(r => r.id === b.id);
          return {
            ...b,
            start: scale(year(d.start)),
            end: scale(year(d.end)),
          };
        }),
        labels,
        axes,
        host: {left: box.left, top: box.top},
      });
    });
  });

for (const renderer of ["svg", "canvas"]) {
  for (const [layout, extra] of Object.entries(layouts)) {
    it(`Priestley [${renderer}, ${layout}]: bars and labels sit over their axis`, async () => {
      const out = await render(HTML, draw, [
        {data, groupBy: "id", ...extra},
        renderer,
      ]);
      const panels = layout === "facet" ? ["facet-A", "facet-B"] : [""];
      assert.deepStrictEqual(Object.keys(out.axes).sort(), panels);
      assert.strictEqual(out.bars.length, 4);
      for (const axis of Object.values(out.axes))
        assert.ok(Number.isFinite(axis.labelTop), "the axis has tick labels");
      for (const bar of out.bars) {
        const axis = out.axes[bar.panel];
        if (layout === "facet")
          assert.strictEqual(bar.panel, `facet-${bar.id[0]}`);
        // A bar is inset by 1px at each end.
        const left = axis.x + bar.start,
          right = axis.x + bar.end;
        assert.ok(
          Math.abs(bar.x - (left + 1)) < 1.5,
          `${bar.id} starts at ${left + 1} (got ${bar.x})`,
        );
        assert.ok(
          Math.abs(bar.x + bar.width - (right - 1)) < 1.5,
          `${bar.id} ends at ${right - 1} (got ${bar.x + bar.width})`,
        );
        assert.ok(
          bar.y >= axis.y,
          `${bar.id} starts below the margin (${bar.y} >= ${axis.y})`,
        );
        assert.ok(
          bar.y + bar.height <= axis.labelTop,
          `${bar.id} ends above the axis labels (${bar.y + bar.height} <= ${axis.labelTop})`,
        );
      }
      assert.strictEqual(out.labels.length, 4);
      for (const label of out.labels) {
        const over = out.bars.some(
          b =>
            b.panel === label.panel &&
            label.x >= b.x &&
            label.x + label.width <= b.x + b.width + 0.5,
        );
        assert.ok(over, `label at ${label.x} sits inside its bar`);
      }
    });
  }

  for (const [layout, extra] of Object.entries(layouts).slice(0, 2)) {
    it(`Priestley [${renderer}, ${layout}]: hovering a bar shows its own tooltip`, async () => {
      const {page, errors, close} = await openPage(HTML);
      try {
        const out = await page.evaluate(draw, [
          {data, groupBy: "id", ...extra},
          renderer,
        ]);
        // Toward the end of A1, which sits clear of where it drew when its
        // margin was ignored.
        const a1 = out.bars.find(b => b.id === "A1");
        const axis = out.axes[a1.panel];
        const x = out.host.left + axis.x + a1.start + (a1.end - a1.start) * 0.9;
        const y = out.host.top + a1.y + a1.height / 2;
        await page.mouse.move(x - 5, y - 5);
        await page.mouse.move(x, y, {steps: 3});
        await page.waitForTimeout(150);
        const tip = await page.evaluate(() =>
          [...document.querySelectorAll(".d3plus-tooltip")]
            .filter(el => getComputedStyle(el).opacity !== "0")
            .map(el => el.textContent)
            .join(" "),
        );
        assert.ok(/A1/.test(tip), `the tooltip names A1 (${tip})`);
        assert.ok(!/B1/.test(tip), `the tooltip is A1's alone (${tip})`);
        assert.deepStrictEqual(errors, []);
      } finally {
        await close();
      }
    });
  }
}
