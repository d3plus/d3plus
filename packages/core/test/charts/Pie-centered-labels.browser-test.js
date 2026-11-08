import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import {bisectorOffset, boxInSector} from "./sectorInside.js";

/**
    A Pie or Donut's straight slice labels, drawn in a real browser on both
    renderers: each label's lines are centered on its slice's bisector and
    stay inside the slice, and on SVG the drawn text sits there too.
*/

const spending = [
  {id: "Rent and utilities", value: 30},
  {id: "Groceries", value: 22},
  {id: "Transportation", value: 17},
  {id: "Dining out", value: 7},
  {id: "Healthcare", value: 6.5},
  {id: "Savings", value: 6},
  {id: "Clothing", value: 5.5},
  {id: "Gifts", value: 5},
];
const few = [
  {id: "Alpha", value: 40},
  {id: "Beta", value: 30},
  {id: "Gamma", value: 20},
  {id: "Delta", value: 10},
];

const charts = {
  pie: ["Pie", {data: spending}],
  donut: ["Donut", {data: few, labelPosition: "inside"}],
  "half pie": ["Pie", {data: few, startAngle: -90, endAngle: 90}],
  "padded pie": ["Pie", {data: few, padAngle: 0.08}],
  "padded donut": ["Donut", {data: few, padPixel: 10, labelPosition: "inside"}],
  "more than half": [
    "Pie",
    {
      data: [
        {id: "Majority", value: 72},
        {id: "Rest", value: 28},
      ],
    },
  ],
  "one slice": ["Donut", {data: [{id: "Everything", value: 1}]}],
};

/**
    Draws each chart and reports, for every straight label, its slice's
    segment, the box around its lines (in the ring's frame), and on SVG the
    box around its drawn text.
*/
const drawLabels = async ({charts, renderer}) => {
  const out = {};
  // One chart at a time, in view: a chart off screen waits to draw.
  for (const [name, [cls, config]] of Object.entries(charts))
    out[name] = await new Promise(resolve => {
      document.body.innerHTML =
        '<div id="viz" style="width:600px;height:500px;"></div>';
      const host = document.querySelector("#viz");
      const viz = new window.d3plus[cls]()
        .config({...config, groupBy: "id", value: "value"})
        .renderer(renderer)
        .duration(0)
        .select("#viz");
      viz.render(() => {
        try {
          const arc = viz.ctx.arcData;
          const slices = viz.ctx.pieData;
          const labels = [];
          const walk = n => {
            (n.children || []).forEach(walk);
            const m = /^pie-label-(\d+)_\d$/.exec(`${n.key}`);
            if (n.type !== "text" || !m) return;
            const d = slices[+m[1]];
            let label = labels.find(l => l.index === d.i);
            if (!label) {
              label = {
                index: d.i,
                text: [],
                arc: {
                  innerRadius: arc.innerRadius()(d, d.i),
                  outerRadius: arc.outerRadius()(d, d.i),
                  startAngle: d.startAngle,
                  endAngle: d.endAngle,
                  padAngle: d.padAngle,
                },
                boxes: [],
                drawn: [],
              };
              labels.push(label);
            }
            label.text.push(n.lines.map(l => l.text).join(" "));
            label.boxes.push(...window.d3plus.textLineBoxes([n]));
          };
          walk(viz._paintedScene.root);
          if (renderer === "svg") {
            // The drawn text, in the ring's frame: a wedge's own frame
            // has its origin at the ring's center.
            const ctm = host
              .querySelector("svg path[aria-label]")
              .getScreenCTM();
            for (const el of host.querySelectorAll("svg text")) {
              const m = /pie-label-(\d+)_\d/.exec(el.id);
              const label = m && labels.find(l => l.index === +m[1]);
              if (!label) continue;
              const r = el.getBoundingClientRect();
              label.drawn.push({
                x: r.left - ctm.e,
                y: r.top - ctm.f,
                width: r.width,
                height: r.height,
                size: parseFloat(getComputedStyle(el).fontSize),
              });
            }
          }
          resolve({labels});
        } catch (e) {
          resolve({error: String(e.stack || e)});
        }
      });
    });
  return out;
};

/** The box around a label's line boxes. */
const around = boxes => {
  const left = Math.min(...boxes.map(b => b.x - b.width / 2));
  const right = Math.max(...boxes.map(b => b.x + b.width / 2));
  const top = Math.min(...boxes.map(b => b.y - b.height / 2));
  const bottom = Math.max(...boxes.map(b => b.y + b.height / 2));
  return {x: left, y: top, width: right - left, height: bottom - top};
};

const centerOf = b => [b.x + b.width / 2, b.y + b.height / 2];

/** The box around boxes given by their corners. */
const union = boxes => {
  const x = Math.min(...boxes.map(b => b.x));
  const y = Math.min(...boxes.map(b => b.y));
  const right = Math.max(...boxes.map(b => b.x + b.width));
  const bottom = Math.max(...boxes.map(b => b.y + b.height));
  return {x, y, width: right - x, height: bottom - y};
};

const near = (a, b, tol, message) =>
  assert.ok(Math.abs(a - b) <= tol, `${message}: ${a} vs ${b} (±${tol})`);

for (const renderer of ["svg", "canvas"])
  it(`Pie labels sit centered on their slice's bisector, inside it (${renderer})`, async () => {
    const out = await render("", drawLabels, {charts, renderer});
    for (const [name, {labels, error}] of Object.entries(out)) {
      assert.ok(!error, `${name}: ${error}`);
      assert.ok(labels.length, `${name}: draws straight labels`);
      for (const label of labels) {
        const box = around(label.boxes);
        const {across, along} = bisectorOffset(label.arc, centerOf(box));
        const what = `${name}, ${label.text.join(" / ")}`;
        assert.ok(across < 1, `${what}: on the bisector (${across} off)`);
        assert.ok(along >= -1, `${what}: on the slice's side of the center`);
        assert.ok(boxInSector(label.arc, box, 0.5), `${what}: inside`);
        if (renderer !== "svg") continue;
        assert.strictEqual(
          label.drawn.length,
          label.text.length,
          `${what}: drawn`,
        );
        // A text element's box runs from its font's ascent to its descent,
        // a little off its glyphs' middle.
        const size = Math.max(...label.drawn.map(d => d.size));
        const drawn = bisectorOffset(label.arc, centerOf(union(label.drawn)));
        assert.ok(
          drawn.across < size * 0.15 + 1,
          `${what}: drawn on the bisector (${drawn.across} off)`,
        );
        near(drawn.along, along, size * 0.2 + 1, `${what}: drawn where placed`);
      }
    }
  });
