import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    #782: hovering a Plot's mark with a real pointer draws a dashed guide from
    its point to each axis and a badge on the axis with its value there, on
    both backends, and clears when the pointer leaves.
*/

const series = [];
["Alpha", "Beta", "Gamma"].forEach((id, s) =>
  [2010, 2011, 2012, 2013].forEach((year, k) =>
    series.push({id, year, value: 10 * (s + 1) + k}),
  ),
);

const points = [
  {id: "a", gdp: 1000, life: 60, pop: 5},
  {id: "b", gdp: 2000, life: 70, pop: 20},
  {id: "c", gdp: 3000, life: 65, pop: 10},
];

/**
    Opens a page and renders `kind` with `calls` (`[method, ...args]` pairs,
    applied in order) into a 600×400 #viz, kept as `window.__viz`.
*/
async function chart(kind, calls, renderer = "svg") {
  const opened = await openPage(
    '<div id="viz" style="width:600px;height:400px;font-family:sans-serif;"></div>',
  );
  await opened.page.evaluate(
    ([kind, calls, renderer]) =>
      new Promise(resolve => {
        const viz = new window.d3plus[kind]();
        // Rebuilt in this realm, so config objects read as plain objects.
        for (const [method, ...args] of JSON.parse(JSON.stringify(calls)))
          viz[method](...args);
        window.__viz = viz;
        // The chart's own surface: the first svg, or the canvas.
        window.__surface = renderer === "canvas" ? "canvas" : "svg";
        viz.renderer(renderer).duration(0).select("#viz").render(resolve);
      }),
    [kind, calls, renderer],
  );
  return opened;
}

/**
    Client coordinates of a mark's point: a node `key`'s circle center, bar
    center, or (with `index`) a Line's interaction point.
*/
function markPoint(page, key, index) {
  return page.evaluate(
    ([key, index]) => {
      const viz = window.__viz;
      let found;
      const walk = nodes =>
        nodes.forEach(n => {
          if (!found && n.key === key && !n.interactionGroup) found = n;
          if (n.children) walk(n.children);
        });
      walk(viz._chartScene);
      const t = found.transform || {};
      let x, y;
      if (index !== undefined) {
        ({x, y} = found.interactionPoints[index]);
      } else if (found.type === "circle") {
        x = (t.x || 0) + found.cx;
        y = (t.y || 0) + found.cy;
      } else {
        x = (t.x || 0) + found.x + found.width / 2;
        y = (t.y || 0) + found.y + found.height / 2;
      }
      const surface = document
        .querySelector(`#viz ${window.__surface}`)
        .getBoundingClientRect();
      const c = viz._chartTransform || {x: 0, y: 0};
      const z = viz._zoomTransform || {};
      const k = z.scale || 1;
      return [
        surface.left + (z.x || 0) + (c.x + x) * k,
        surface.top + (z.y || 0) + (c.y + y) * k,
      ];
    },
    [key, index],
  );
}

/** The axis hover's state and the guides/badges the last paint drew. */
function hovered(page) {
  return page.evaluate(() => {
    const viz = window.__viz;
    const guides = [],
      badges = [];
    const walk = nodes =>
      nodes.forEach(n => {
        const key = `${n.key}`;
        const guide = key.match(/plot-axis-hover-guide-(\w+)$/);
        const badge = key.match(/plot-axis-hover-badge-(\w+)$/);
        if (guide) guides.push(guide[1]);
        if (badge) {
          const [box, text] = n.children;
          badges.push({
            axis: badge[1],
            text: text.lines[0].text,
            fill: box.paint.fill,
            box: [box.x, box.y, box.width, box.height],
            inert: n.interactive === false && box.interactive === false,
          });
        }
        if (n.children) walk(n.children);
      });
    walk([viz._paintedScene.root]);
    const svg =
      window.__surface === "svg" && document.querySelector("#viz svg");
    return {
      state: viz._axisHoverState || null,
      guides,
      badges,
      area: viz._plotArea,
      // The SVG backend's own DOM, by badge.
      dom: svg
        ? Array.from(
            svg.querySelectorAll('[data-key^="plot-axis-hover-badge"] text'),
          ).map(t => t.textContent)
        : null,
      crosshair: !!svg && !!svg.querySelector('[data-key="plot-crosshair"]'),
    };
  });
}

async function hover(page, point) {
  await page.mouse.move(5, 5);
  await page.mouse.move(point[0], point[1], {steps: 3});
  await page.waitForTimeout(80);
  return hovered(page);
}

it("axis hover: a scatter/bubble circle gets a guide and badge on both axes", async () => {
  const {page, close} = await chart("Plot", [
    ["data", points],
    ["groupBy", "id"],
    ["x", "gdp"],
    ["y", "life"],
    ["size", "pop"],
  ]);
  try {
    const result = await hover(page, await markPoint(page, "b"));
    assert.deepStrictEqual(result.guides.sort(), ["x", "y"]);
    assert.deepStrictEqual(
      result.badges.map(b => [b.axis, b.text]),
      [
        ["x", "2k"],
        ["y", "70"],
      ],
    );
    assert.deepStrictEqual(result.dom, ["2k", "70"]);
    assert.ok(
      result.badges.every(b => b.inert),
      "badges are inert chrome",
    );
    const [x, y] = result.badges;
    const a = result.area;
    assert.strictEqual(x.box[1], a.y + a.height, "x badge under the plot");
    assert.strictEqual(y.box[0] + y.box[2], a.x, "y badge left of the plot");
    assert.strictEqual(
      x.fill,
      result.state.color,
      "badges fill with the mark's color",
    );
    assert.ok(!result.crosshair, "a scatter has no crosshair");
  } finally {
    await close();
  }
});

it("axis hover: a discrete-axis LinePlot badges the crosshair and the nearest series", async () => {
  const {page, close} = await chart("LinePlot", [
    ["data", series],
    ["groupBy", "id"],
    ["x", "year"],
    ["y", "value"],
  ]);
  try {
    // Gamma's 2012 point (32), with the shared tooltip listing all three.
    const result = await hover(page, await markPoint(page, "Gamma", 2));
    assert.ok(result.crosshair, "the shared crosshair is the x guide");
    assert.deepStrictEqual(result.guides, ["y"], "one guide, to the y axis");
    assert.deepStrictEqual(
      result.badges.map(b => [b.axis, b.text]),
      [
        ["x", "2012"],
        ["y", "32"],
      ],
    );
    // Toward Alpha's point in the same column, the value badge follows.
    const alpha = await markPoint(page, "Alpha", 2);
    const near = await hover(page, [alpha[0] + 3, alpha[1] + 2]);
    assert.deepStrictEqual(
      near.badges.map(b => [b.axis, b.text]),
      [
        ["x", "2012"],
        ["y", "12"],
      ],
    );
  } finally {
    await close();
  }
});

it("axis hover: a continuous-x LinePlot badges both values", async () => {
  const data = [0, 1, 2, 3, 4].map(t => ({id: "s", t: t * 2.5, v: t * t}));
  const {page, close} = await chart("LinePlot", [
    ["data", data],
    ["groupBy", "id"],
    ["x", "t"],
    ["y", "v"],
  ]);
  try {
    const result = await hover(page, await markPoint(page, "s", 3));
    assert.deepStrictEqual(result.guides, ["y"]);
    assert.deepStrictEqual(
      result.badges.map(b => [b.axis, b.text]),
      [
        ["x", "7.5"],
        ["y", "9"],
      ],
    );
  } finally {
    await close();
  }
});

it("axis hover: a vertical bar is badged on its value axis only", async () => {
  const {page, close} = await chart("BarChart", [
    ["data", series],
    ["groupBy", "id"],
    ["x", "year"],
    ["y", "value"],
  ]);
  try {
    const result = await hover(page, await markPoint(page, "Beta_2011"));
    assert.deepStrictEqual(result.guides, ["y"]);
    assert.deepStrictEqual(
      result.badges.map(b => [b.axis, b.text]),
      [["y", "21"]],
    );
  } finally {
    await close();
  }
});

it("axis hover: a horizontal bar is badged on its x axis only", async () => {
  const {page, close} = await chart("BarChart", [
    ["data", series],
    ["groupBy", "id"],
    ["discrete", "y"],
    ["y", "year"],
    ["x", "value"],
  ]);
  try {
    const result = await hover(page, await markPoint(page, "Gamma_2013"));
    assert.deepStrictEqual(result.guides, ["x"]);
    assert.deepStrictEqual(
      result.badges.map(b => [b.axis, b.text]),
      [["x", "33"]],
    );
  } finally {
    await close();
  }
});

it("axis hover: a stacked bar reads its stack's top", async () => {
  const {page, close} = await chart("BarChart", [
    ["data", series],
    ["groupBy", "id"],
    ["x", "year"],
    ["y", "value"],
    ["stacked", true],
  ]);
  try {
    const result = await hover(page, await markPoint(page, "Beta_2010"));
    // Beta's top is its own value plus every 2010 bar drawn below it.
    const expected = await page.evaluate(() => {
      const bars = [];
      const walk = nodes =>
        nodes.forEach(n => {
          if (n.shapeType === "Bar" && /^\w+_2010$/.test(n.key)) bars.push(n);
          if (n.children) walk(n.children);
        });
      walk(window.__viz._chartScene);
      const beta = bars.find(n => n.key === "Beta_2010");
      return String(
        bars
          .filter(n => n.transform.y >= beta.transform.y)
          .reduce((sum, n) => sum + (n.datum.data || n.datum).value, 0),
      );
    });
    assert.deepStrictEqual(result.guides, ["y"]);
    assert.deepStrictEqual(
      result.badges.map(b => [b.axis, b.text]),
      [["y", expected]],
    );
    assert.notStrictEqual(expected, "20", "Beta isn't the bottom bar");
  } finally {
    await close();
  }
});

it("axis hover: a series on the secondary axis is badged on y2", async () => {
  const data = [
    {id: "alpha", year: 2004, a: 7},
    {id: "alpha", year: 2005, a: 25},
    {id: "alpha", year: 2006, a: 13},
    {id: "beta", year: 2004, b: 300},
    {id: "beta", year: 2005, b: 850},
    {id: "beta", year: 2006, b: 1000},
  ];
  const {page, close} = await chart("LinePlot", [
    ["data", data],
    ["groupBy", "id"],
    ["x", "year"],
    ["y", "a"],
    ["y2", "b"],
    ["tooltipShared", false],
  ]);
  try {
    const result = await hover(page, await markPoint(page, "beta", 1));
    const y2 = result.badges.find(b => b.axis === "y2");
    assert.ok(y2, "badged on y2");
    assert.strictEqual(y2.text, "850");
    assert.ok(!result.badges.some(b => b.axis === "y"));
    assert.strictEqual(y2.box[0], result.area.x + result.area.width);
  } finally {
    await close();
  }
});

it("axis hover: renders on the canvas backend and clears on leaving", async () => {
  const {page, close} = await chart(
    "Plot",
    [
      ["data", points],
      ["groupBy", "id"],
      ["x", "gdp"],
      ["y", "life"],
      ["size", "pop"],
    ],
    "canvas",
  );
  try {
    const result = await hover(page, await markPoint(page, "c"));
    assert.deepStrictEqual(
      result.badges.map(b => [b.axis, b.text]),
      [
        ["x", "3k"],
        ["y", "65"],
      ],
    );
    assert.deepStrictEqual(result.guides.sort(), ["x", "y"]);
    await page.mouse.move(590, 395);
    await page.mouse.move(700, 600);
    await page.waitForTimeout(80);
    const left = await hovered(page);
    assert.strictEqual(left.state, null);
    assert.deepStrictEqual(left.badges, []);
    assert.deepStrictEqual(left.guides, []);
  } finally {
    await close();
  }
});

it("axis hover: clears when the pointer leaves the mark (SVG)", async () => {
  const {page, close} = await chart("Plot", [
    ["data", points],
    ["groupBy", "id"],
    ["x", "gdp"],
    ["y", "life"],
  ]);
  try {
    const [x, y] = await markPoint(page, "a");
    const result = await hover(page, [x, y]);
    assert.strictEqual(result.badges.length, 2);
    // Off the mark, still inside the plot.
    await page.mouse.move(x + 40, y + 40, {steps: 3});
    await page.waitForTimeout(80);
    const off = await hovered(page);
    assert.strictEqual(off.state, null);
    assert.deepStrictEqual(off.dom, []);
  } finally {
    await close();
  }
});

it("axis hover: axisHover(false) draws nothing", async () => {
  const {page, close} = await chart("LinePlot", [
    ["data", series],
    ["groupBy", "id"],
    ["x", "year"],
    ["y", "value"],
    ["axisHover", false],
  ]);
  try {
    const result = await hover(page, await markPoint(page, "Gamma", 2));
    assert.ok(result.crosshair, "the shared tooltip still runs");
    assert.strictEqual(result.state, null);
    assert.deepStrictEqual(result.badges, []);
    assert.deepStrictEqual(result.guides, []);
  } finally {
    await close();
  }
});

it("axis hover: axisHoverConfig styles the guides and badges", async () => {
  const {page, close} = await chart("Plot", [
    ["data", points],
    ["groupBy", "id"],
    ["x", "gdp"],
    ["y", "life"],
    [
      "axisHoverConfig",
      {
        guideConfig: {stroke: "rgb(1, 2, 3)"},
        badgeConfig: {fill: "rgb(4, 5, 6)", fontSize: 20},
      },
    ],
  ]);
  try {
    await hover(page, await markPoint(page, "b"));
    const style = await page.evaluate(() => {
      const svg = document.querySelector("#viz svg");
      const guide = svg.querySelector('[data-key="plot-axis-hover-guide-x"]');
      const box = svg.querySelector('[data-key="plot-axis-hover-badge-x-box"]');
      return [
        guide.getAttribute("stroke"),
        box.getAttribute("fill"),
        Number(box.getAttribute("height")),
      ];
    });
    assert.deepStrictEqual(style, ["rgb(1, 2, 3)", "rgb(4, 5, 6)", 28]);
  } finally {
    await close();
  }
});
