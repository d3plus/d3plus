import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    An axis hover badge covers the axis's own tick label for the value it
    shows, so none of that label peeks out around it: on a discrete axis
    (a horizontal Dumbbell's countries, a LinePlot's years) and on a value
    axis whose tick the hovered point sits on, on both backends.
*/

const countries = [
  ["Japan", 81, 84],
  ["Italy", 79, 83],
  ["United Kingdom", 77, 80],
  ["India", 62, 67],
];
const life = countries.flatMap(([country, a, b]) => [
  {country, year: "2000", value: a},
  {country, year: "2021", value: b},
]);
const series = ["Alpha", "Beta"].flatMap((id, s) =>
  ["2010", "2011", "2012", "2013"].map((year, k) => ({
    id,
    year,
    value: 10 * (s + 1) + k,
  })),
);
const points = [
  {id: "a", x: 1, y: 40},
  {id: "b", x: 2, y: 60},
  {id: "c", x: 3, y: 80},
];

/** Opens a page and renders `kind` with `calls` (`[method, ...args]` pairs) into a 600×400 #viz. */
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

/** Client coordinates of the first circle whose key matches `pattern`. */
function circlePoint(page, pattern) {
  return page.evaluate(pattern => {
    const viz = window.__viz;
    let found;
    const walk = nodes =>
      nodes.forEach(n => {
        if (
          !found &&
          n.type === "circle" &&
          new RegExp(pattern).test(String(n.key)) &&
          !n.interactionGroup
        )
          found = n;
        if (n.children) walk(n.children);
      });
    walk(viz._chartScene);
    const t = found.transform || {};
    const surface = document
      .querySelector(`#viz ${window.__surface}`)
      .getBoundingClientRect();
    const c = viz._chartTransform || {x: 0, y: 0};
    return [
      surface.left + c.x + (t.x || 0) + found.cx,
      surface.top + c.y + (t.y || 0) + found.cy,
    ];
  }, pattern);
}

/**
    After hovering `point`: each painted badge's box, and the box of the
    tick label reading `label` on that badge's axis, both in surface pixels
    (read from the scene, plus from the SVG DOM on that backend).
*/
async function hoverBoxes(page, point, axis, label) {
  await page.mouse.move(5, 5);
  await page.mouse.move(point[0], point[1], {steps: 3});
  await page.waitForTimeout(80);
  return page.evaluate(
    ([axis, label]) => {
      const viz = window.__viz;
      let badge, text, tick;
      const walk = (nodes, o) =>
        nodes.forEach(n => {
          const t = n.transform || {};
          const p = {x: o.x + (t.x || 0), y: o.y + (t.y || 0), axis: o.axis};
          const key = String(n.key);
          if (key.endsWith(`plot-${axis}-axis`)) p.axis = true;
          if (key.endsWith(`plot-axis-hover-badge-${axis}-box`))
            badge = {
              x: p.x + n.x,
              y: p.y + n.y,
              width: n.width,
              height: n.height,
            };
          if (key.endsWith(`plot-axis-hover-badge-${axis}-text`))
            text = n.lines[0].text;
          if (
            p.axis &&
            n.type === "text" &&
            n.lines.length === 1 &&
            n.lines[0].text === label
          ) {
            const line = n.lines[0];
            const anchor = n.font.anchor;
            const shift =
              anchor === "end"
                ? line.width
                : anchor === "middle"
                  ? line.width / 2
                  : 0;
            tick = {
              x: p.x + n.x + line.x - shift,
              y: p.y + n.y + line.y - n.font.size * 0.8,
              width: line.width,
              height: n.font.size,
            };
          }
          if (n.children) walk(n.children, p);
        });
      walk([viz._paintedScene.root], {x: 0, y: 0, axis: false});
      let dom = null;
      if (window.__surface === "svg") {
        const svg = document.querySelector("#viz svg");
        const origin = svg.getBoundingClientRect();
        const rel = r => ({
          x: r.left - origin.left,
          y: r.top - origin.top,
          width: r.width,
          height: r.height,
        });
        const el = Array.from(
          svg.querySelectorAll(`[data-key$="plot-${axis}-axis"] text`),
        ).find(t => t.textContent === label);
        const box = svg.querySelector(
          `[data-key$="plot-axis-hover-badge-${axis}-box"]`,
        );
        if (el && box)
          dom = {
            badge: rel(box.getBoundingClientRect()),
            tick: rel(el.getBoundingClientRect()),
          };
      }
      return {badge, text, tick, dom};
    },
    [axis, label],
  );
}

/** Asserts `outer` holds `inner` horizontally (and vertically, unless `across` is false), within half a pixel. */
function assertCovers(outer, inner, message, across = true) {
  const e = 0.5;
  assert.ok(
    outer.x <= inner.x + e &&
      outer.x + outer.width >= inner.x + inner.width - e,
    `${message}: badge [${outer.x}, ${outer.x + outer.width}] covers label [${inner.x}, ${inner.x + inner.width}] across`,
  );
  if (across)
    assert.ok(
      outer.y <= inner.y + e &&
        outer.y + outer.height >= inner.y + inner.height - e,
      `${message}: badge [${outer.y}, ${outer.y + outer.height}] covers label [${inner.y}, ${inner.y + inner.height}] down`,
    );
}

/** Asserts the hovered badge covers its tick label, by the scene and (on SVG) the DOM. */
function assertCovered(result, label) {
  assert.ok(result.badge, "a badge is drawn");
  assert.ok(result.tick, `the "${label}" tick label is drawn`);
  assert.strictEqual(result.text, label);
  assertCovers(result.badge, result.tick, "scene");
  if (result.dom) assertCovers(result.dom.badge, result.dom.tick, "svg");
}

/** Each tick label of `axis` in the last paint, by text: its box and opacity, plus (on SVG) its element's opacity. */
function tickLabels(page, axis) {
  return page.evaluate(axis => {
    const viz = window.__viz;
    const out = {};
    const walk = (nodes, o) =>
      nodes.forEach(n => {
        const t = n.transform || {};
        const p = {x: o.x + (t.x || 0), y: o.y + (t.y || 0), axis: o.axis};
        if (String(n.key).endsWith(`plot-${axis}-axis`)) p.axis = true;
        if (p.axis && n.type === "text" && n.datum?.data?.tick) {
          const line = n.lines[0];
          const shift =
            n.font.anchor === "end"
              ? line.width
              : n.font.anchor === "middle"
                ? line.width / 2
                : 0;
          out[line.text] = {
            x: p.x + n.x + line.x - shift,
            y: p.y + n.y + line.y - n.font.size * 0.8,
            width: line.width,
            height: n.font.size,
            opacity: n.paint?.opacity ?? 1,
            coveredBy: n.coveredBy,
          };
        }
        if (n.children) walk(n.children, p);
      });
    walk([viz._paintedScene.root], {x: 0, y: 0, axis: false});
    if (window.__surface === "svg")
      for (const el of document.querySelectorAll(
        `#viz svg [data-key$="plot-${axis}-axis"] text`,
      ))
        if (out[el.textContent])
          out[el.textContent].dom =
            Number(getComputedStyle(el).opacity ?? 1) *
            Number(el.getAttribute("opacity") ?? 1);
    return out;
  }, axis);
}

/** Whether two boxes overlap by more than half a pixel each way. */
const overlaps = (a, b) =>
  Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 0.5 &&
  Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 0.5;

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer}: a horizontal Dumbbell's badge covers the hovered country's label`, async () => {
    const {page, close} = await chart(
      "Dumbbell",
      [
        ["data", life],
        ["groupBy", "year"],
        ["x", "value"],
        ["y", "country"],
      ],
      renderer,
    );
    try {
      const result = await hoverBoxes(
        page,
        await circlePoint(page, "Italy"),
        "y",
        "Italy",
      );
      assertCovered(result, "Italy");
    } finally {
      await close();
    }
  });

  it(`${renderer}: a LinePlot's crosshair badge covers its year label`, async () => {
    const {page, close} = await chart(
      "LinePlot",
      [
        ["data", series],
        ["groupBy", "id"],
        ["x", "year"],
        ["y", "value"],
        ["lineMarkers", true],
      ],
      renderer,
    );
    try {
      const result = await hoverBoxes(
        page,
        await circlePoint(page, "Beta.*2012|2012.*Beta"),
        "x",
        "2012",
      );
      assertCovered(result, "2012");
    } finally {
      await close();
    }
  });

  it(`${renderer}: a value badge covers the tick its point sits on`, async () => {
    const {page, close} = await chart(
      "Plot",
      [
        ["data", points],
        ["groupBy", "id"],
        ["x", "x"],
        ["y", "y"],
      ],
      renderer,
    );
    try {
      const result = await hoverBoxes(
        page,
        await circlePoint(page, "^b$"),
        "y",
        "60",
      );
      assertCovered(result, "60");
    } finally {
      await close();
    }
  });
  it(`${renderer}: a value badge between ticks hides the labels it overlaps, until the pointer leaves`, async () => {
    const {page, close} = await chart(
      "Plot",
      [
        [
          "data",
          [
            {id: "a", x: 0, y: 1},
            {id: "b", x: 2.1, y: 2},
            {id: "c", x: 4, y: 3},
          ],
        ],
        ["groupBy", "id"],
        ["x", "x"],
        ["y", "y"],
        ["xConfig", {ticks: [0, 1, 2, 3, 4]}],
      ],
      renderer,
    );
    try {
      const before = await tickLabels(page, "x");
      assert.ok(before["2"] && before["4"], "the 2 and 4 ticks are labeled");
      assert.ok(
        Object.values(before).every(l => l.opacity !== 0),
        "every label shows before the hover",
      );
      const result = await hoverBoxes(
        page,
        await circlePoint(page, "^b$"),
        "x",
        "2",
      );
      assert.strictEqual(result.text, "2.1");
      const during = await tickLabels(page, "x");
      for (const [text, label] of Object.entries(during)) {
        const over = overlaps(result.badge, label);
        assert.strictEqual(
          label.opacity === 0,
          over,
          `"${text}" is ${over ? "hidden under" : "shown beside"} the badge`,
        );
        if (label.dom !== undefined)
          assert.strictEqual(label.dom === 0, over, `"${text}" in the svg`);
      }
      assert.strictEqual(during["2"].opacity, 0, 'the "2" neighbor hides');
      assert.strictEqual(
        during["2"].coveredBy,
        "plot-axis-hover-badge-x",
        "naming the badge over it",
      );
      assert.notStrictEqual(during["4"].opacity, 0, 'the far "4" shows');
      await page.mouse.move(5, 5);
      await page.waitForTimeout(80);
      const after = await tickLabels(page, "x");
      assert.ok(
        Object.values(after).every(l => l.opacity !== 0),
        "every label shows again after leaving",
      );
      if (after["2"].dom !== undefined) assert.ok(after["2"].dom > 0);
    } finally {
      await close();
    }
  });
}
