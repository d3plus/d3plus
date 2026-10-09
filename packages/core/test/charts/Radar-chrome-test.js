import assert from "assert";
import {closeBrowser, render} from "../playwright.js";

/**
    Radar chrome in Chromium: rings styled like Plot gridlines / axis line,
    rings that never show a tooltip, and metric labels that fit the chart.
*/

after(closeBrowser);

const box = (w = 600, h = 450, bg = "") =>
  `<div id="viz" style="width:${w}px;height:${h}px;font-family:sans-serif;${bg}"></div>`;

const data = [
  {id: "alpha", axis: "Central", number: 170}, {id: "alpha", axis: "Kirkdale", number: 40},
  {id: "alpha", axis: "Kensington", number: 240}, {id: "alpha", axis: "Everton", number: 90},
  {id: "alpha", axis: "Picton", number: 160}, {id: "alpha", axis: "Riverside", number: 30},
  {id: "beta", axis: "Central", number: 320}, {id: "beta", axis: "Kirkdale", number: 97},
  {id: "beta", axis: "Kensington", number: 40}, {id: "beta", axis: "Everton", number: 110},
  {id: "beta", axis: "Picton", number: 40}, {id: "beta", axis: "Riverside", number: 110},
];

/** Renders a Radar and reports its rings, spokes, labels, and geometry. */
const probe = ([rows, configSrc]) =>
  new Promise((resolve, reject) => {
    try {
      const config = new Function(`return (${configSrc});`)();
      const warnings = [];
      const warn = console.warn;
      console.warn = (...args) => warnings.push(args.join(" "));
      const viz = new window.d3plus.Radar()
        .config({data: rows, groupBy: "id", metric: "axis", value: "number", ...config})
        .duration(0)
        .select("#viz");
      viz.render(() => {
        console.warn = warn;
        const scene = viz._chartScene;
        const rings = scene.find(n => n.key === "radar-radial-circles");
        const spokes = scene.find(n => n.key === "radar-axis-spokes");
        const svg = document.querySelector("#viz svg");
        const sr = svg ? svg.getBoundingClientRect() : {left: 0, top: 0};
        const m = viz._margin;
        const area = {
          left: sr.left + m.left,
          top: sr.top + m.top,
          right: sr.left + viz.schema.width - m.right,
          bottom: sr.top + viz.schema.height - m.bottom,
        };
        const axisLabels = scene.find(n => n.key === "radar-axis-labels");
        const labels = axisLabels.children.map(c => {
          const el = document.getElementById(c.id);
          const r = el.getBoundingClientRect();
          return {text: el.textContent, left: r.left, top: r.top, right: r.right, bottom: r.bottom};
        });
        resolve({
          rings: rings.children.map(c => ({r: c.r, key: c.key, paint: c.paint, interactive: c.interactive, datum: c.datum})),
          ringGroupInteractive: rings.interactive,
          spokes: spokes.children.map(c => ({paint: c.paint, interactive: c.interactive, datum: c.datum})),
          area,
          labels,
          radius: Math.max(...rings.children.map(c => c.r)),
          size: Math.min(viz.schema.width - m.left - m.right, viz.schema.height - m.top - m.bottom),
          warnings,
        });
      });
    } catch (err) {
      reject(err);
    }
  });

it("Radar rings look like Plot gridlines, the outer ring and spokes like its axis (light)", async function () {
  this.timeout(60000);
  const r = await render(box(), probe, [data, "{}"]);
  const outer = r.rings[r.rings.length - 1];
  const inner = r.rings.slice(0, -1);
  assert.strictEqual(outer.key, "radar-ring-outer");
  assert.ok(inner.length >= 3);
  inner.forEach(c => {
    assert.strictEqual(c.paint.stroke, "#e9ecef", "inner rings use the light gridline gray");
    assert.strictEqual(c.paint.strokeWidth, 1);
    assert.strictEqual(c.paint.fill, "none");
  });
  assert.notStrictEqual(outer.paint.stroke, "#e9ecef");
  assert.strictEqual(outer.paint.strokeWidth, 1);
  r.spokes.forEach(s => assert.strictEqual(s.paint.stroke, outer.paint.stroke, "spokes share the axis ink"));
});

it("Radar rings and spokes follow a dark background", async function () {
  this.timeout(60000);
  const light = await render(box(), probe, [data, "{}"]);
  const dark = await render(box(600, 450, "background:rgb(20, 20, 20);"), probe, [data, "{}"]);
  assert.strictEqual(dark.rings[0].paint.stroke, "#343a40", "inner rings use the dark gridline gray");
  const outer = dark.rings[dark.rings.length - 1].paint.stroke;
  assert.notStrictEqual(outer, light.rings[light.rings.length - 1].paint.stroke, "the axis ink flips");
  assert.strictEqual(dark.spokes[0].paint.stroke, outer);
});

it("axisConfig gridConfig / barConfig / shapeConfig override the ring and spoke styles", async function () {
  this.timeout(60000);
  const r = await render(box(), probe, [
    data,
    `{axisConfig: {
      gridConfig: {stroke: "red", "stroke-width": 2, strokeDasharray: "4 2"},
      barConfig: {stroke: "blue", strokeWidth: 3},
      shapeConfig: {stroke: "green"},
    }}`,
  ]);
  const outer = r.rings[r.rings.length - 1];
  r.rings.slice(0, -1).forEach(c => {
    assert.strictEqual(c.paint.stroke, "red");
    assert.strictEqual(c.paint.strokeWidth, 2);
    assert.deepStrictEqual(c.paint.strokeDasharray, [4, 2]);
  });
  assert.strictEqual(outer.paint.stroke, "blue");
  assert.strictEqual(outer.paint.strokeWidth, 3);
  r.spokes.forEach(s => assert.strictEqual(s.paint.stroke, "green"));
  assert.deepStrictEqual(r.warnings, [], "no config warnings");
});

it("rings and spokes are chrome: non-interactive and datum-free", async function () {
  this.timeout(60000);
  const r = await render(box(), probe, [data, "{}"]);
  assert.strictEqual(r.ringGroupInteractive, false);
  r.rings.forEach(c => {
    assert.strictEqual(c.interactive, false);
    assert.strictEqual(c.datum, undefined);
  });
  r.spokes.forEach(s => {
    assert.strictEqual(s.interactive, false);
    assert.strictEqual(s.datum, undefined);
  });
});

/** Hovers the outer ring (where no polygon reaches) and then a polygon. */
const hoverProbe = rows =>
  new Promise((resolve, reject) => {
    try {
      const viz = new window.d3plus.Radar()
        .config({data: rows, groupBy: "id", metric: "axis", value: "number"})
        .duration(0)
        .select("#viz");
      viz.render(() => {
        const svg = document.querySelector("#viz svg.d3plus-render-svg");
        const circles = Array.from(svg.querySelectorAll("circle"));
        const outer = circles.reduce((a, b) => (+b.getAttribute("r") > +a.getAttribute("r") ? b : a));
        const or = outer.getBoundingClientRect();
        const cx = or.left + or.width / 2, cy = or.top + or.height / 2, R = or.width / 2;
        const hover = (x, y) => {
          const el = document.elementFromPoint(x, y);
          el.dispatchEvent(new MouseEvent("mousemove", {clientX: x, clientY: y, bubbles: true}));
          return el;
        };
        const tip = () => {
          const t = document.querySelector(".d3plus-tooltip");
          return t && getComputedStyle(t).visibility !== "hidden" && getComputedStyle(t).display !== "none"
            ? t.querySelector(".d3plus-tooltip-title")?.textContent ?? ""
            : null;
        };
        // Up-left on the outer ring, between the Picton and Everton spokes.
        const a = (210 * Math.PI) / 180;
        const ringEl = hover(cx + R * Math.cos(a), cy + R * Math.sin(a));
        requestAnimationFrame(() => setTimeout(() => {
          const ringTip = tip();
          const ringTag = ringEl.tagName;
          // Inside the beta polygon, near its Central (3 o'clock) vertex.
          const polyEl = hover(cx + R * 0.7, cy);
          requestAnimationFrame(() => setTimeout(() => {
            resolve({ringTag, ringTip, polyTag: polyEl.tagName, polyTip: tip()});
          }, 50));
        }, 50));
      });
    } catch (err) {
      reject(err);
    }
  });

it("hovering a ring shows no tooltip; hovering a polygon still does", async function () {
  this.timeout(60000);
  const r = await render(box(), hoverProbe, data);
  assert.notStrictEqual(r.ringTag.toLowerCase(), "circle", "the ring isn't hit-tested");
  assert.strictEqual(r.ringTip, null, "no tooltip over a ring");
  assert.strictEqual(r.polyTag.toLowerCase(), "path");
  assert.ok(r.polyTip && r.polyTip.includes("beta"), `polygon tooltip: ${r.polyTip}`);
});

const metricData = (names, groups = ["A", "B"]) =>
  groups.flatMap((id, g) => names.map((axis, m) => ({id, axis, number: 10 + ((m * 7 + g * 11) % 25)})));

const assertInside = (r, msg) => {
  assert.ok(r.labels.length > 0, `${msg}: labels rendered`);
  for (const l of r.labels) {
    assert.ok(l.left >= r.area.left - 1 && l.right <= r.area.right + 1, `${msg}: "${l.text}" fits horizontally`);
    assert.ok(l.top >= r.area.top - 1 && l.bottom <= r.area.bottom + 1, `${msg}: "${l.text}" fits vertically`);
  }
};

it("auto outerPadding keeps every metric label inside the chart for 3–12 metrics", async function () {
  this.timeout(120000);
  const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  for (const n of [3, 5, 8, 12]) {
    const r = await render(box(), probe, [metricData(names.slice(0, n)), "{legend: false}"]);
    assertInside(r, `${n} metrics`);
    assert.ok(r.radius >= r.size / 4, `${n} metrics: radius ${r.radius} keeps at least half its maximum`);
  }
});

it("auto outerPadding wraps long labels and keeps them inside the chart", async function () {
  this.timeout(60000);
  const names = [
    "Customer Satisfaction Index", "Revenue", "Net Promoter Score (Trailing 12 Months)", "Churn",
    "Average Handling Time", "Employee Engagement", "Market Share", "Gross Margin Percentage",
  ];
  const r = await render(box(), probe, [metricData(names), "{legend: false, shapeConfig: {Path: {opacity: 0.7}}}"]);
  assertInside(r, "long labels");
  assert.deepStrictEqual(r.warnings, [], "no config warnings");
  assert.ok(r.radius >= r.size / 4 - 0.5, `radius ${r.radius} keeps at least half its maximum`);
  // Short labels leave a much bigger web than the old fixed 100px padding.
  const short = await render(box(), probe, [metricData(["A", "B", "C", "D", "E"]), "{legend: false}"]);
  assert.ok(short.radius > short.size / 2 - 100 + 40, `short labels: radius ${short.radius}`);
});

it("a numeric outerPadding is used as-is", async function () {
  this.timeout(60000);
  const r = await render(box(), probe, [data, "{legend: false, outerPadding: 120}"]);
  assert.ok(Math.abs(r.radius - (r.size / 2 - 120)) < 1e-6, `radius ${r.radius}`);
});
