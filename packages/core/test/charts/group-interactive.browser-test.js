import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    A scene group's `interactive: false` covers everything inside it, with a
    real pointer on both backends: the pointer passes through the group's
    contents (a child that sets `interactive: true` included) to the mark
    beneath, and nodes outside the group still catch it. Gantt's time axis is
    such a group: its tick labels and tick lines show no tooltip, fire no
    handler and leave the cursor alone, and a task bar still gets its hover
    and click.
*/

const rect = (key, x, y, extra = {}) => ({
  type: "rect",
  key,
  x,
  y,
  width: 40,
  height: 40,
  datum: {id: key},
  paint: {fill: "#c33"},
  ...extra,
});

const scene = {
  width: 300,
  height: 200,
  root: {
    type: "group",
    key: "root",
    children: [
      {
        type: "rect",
        key: "under",
        x: 40,
        y: 40,
        width: 220,
        height: 120,
        datum: {id: "under"},
        paint: {fill: "#ddd"},
      },
      {
        type: "group",
        key: "chrome",
        interactive: false,
        children: [
          rect("chrome-plain", 60, 60),
          rect("chrome-optin", 60, 110, {interactive: true}),
          {
            type: "group",
            key: "chrome-nested",
            interactive: true,
            transform: {x: 120, y: 60},
            children: [rect("chrome-deep", 0, 0, {interactive: true})],
          },
          // Over nothing: no mark beneath it.
          rect("chrome-float", 0, 0, {width: 30, height: 30}),
        ],
      },
      rect("mark", 200, 60, {paint: {fill: "#36c"}}),
    ],
  },
};

/** Runs in the page: mounts a bare renderer, draws `scene`, and logs each event's pick. */
const mount = ([backend, scene]) => {
  const {CanvasRenderer, SvgRenderer} = window.d3plus;
  const renderer = new (backend === "svg" ? SvgRenderer : CanvasRenderer)();
  renderer.mount({
    container: document.querySelector("#host"),
    width: scene.width,
    height: scene.height,
  });
  renderer.drawScene(scene);
  window.__renderer = renderer;
  window.__events = [];
  renderer.on(e =>
    window.__events.push(`${e.type}:${e.pick ? e.pick.node.key : "-"}`),
  );
  const surface = document.querySelector("#host svg, #host canvas");
  const box = surface.getBoundingClientRect();
  return [box.left, box.top];
};

/** Runs in the page: the distinct events since the last read, in order, and the renderer's own pick. */
const read = point => {
  const events = [...new Set(window.__events)];
  window.__events.length = 0;
  const pick = window.__renderer.pick(point);
  return {events, pick: pick ? pick.node.key : null};
};

for (const backend of ["svg", "canvas"]) {
  it(`${backend}: the pointer passes through everything inside a group with interactive: false`, async () => {
    const {page, errors, close} = await openPage(
      '<div id="host" style="position:relative;width:300px;height:200px"></div>',
    );
    try {
      const [left, top] = await page.evaluate(mount, [backend, scene]);
      const hover = async (x, y) => {
        await page.mouse.move(left + x, top + y);
        await page.waitForTimeout(30);
        return page.evaluate(read, [x, y]);
      };
      const click = async (x, y) => {
        await page.mouse.click(left + x, top + y);
        return (await page.evaluate(read, [x, y])).events.filter(e =>
          e.startsWith("click"),
        );
      };
      await page.mouse.move(left + 290, top + 190);
      await page.evaluate(read, [290, 190]);

      // A child of the inert group, over the mark beneath it.
      assert.deepStrictEqual(await hover(80, 80), {
        events: ["mouseenter:under", "mousemove:under"],
        pick: "under",
      });
      assert.deepStrictEqual(await click(80, 80), ["click:under"]);
      // A child that sets `interactive: true`, then one in a nested group
      // that does: neither opts back in, and the mark stays hovered.
      assert.deepStrictEqual(await hover(80, 130), {
        events: ["mousemove:under"],
        pick: "under",
      });
      assert.deepStrictEqual(await click(80, 130), ["click:under"]);
      assert.deepStrictEqual(await hover(140, 80), {
        events: ["mousemove:under"],
        pick: "under",
      });
      // A node painted after the group still catches the pointer.
      assert.deepStrictEqual(await hover(220, 80), {
        events: ["mouseleave:-", "mouseenter:mark", "mousemove:mark"],
        pick: "mark",
      });
      assert.deepStrictEqual(await click(220, 80), ["click:mark"]);
      // A child with nothing beneath it picks nothing.
      assert.deepStrictEqual(await hover(15, 15), {
        events: ["mouseleave:-", "mousemove:-"],
        pick: null,
      });
      assert.deepStrictEqual(await click(15, 15), ["click:-"]);
      assert.deepStrictEqual(errors, []);
    } finally {
      await close();
    }
  });
}

const tasks = [
  {
    task: "Plan",
    phase: "Discovery",
    start: "2024-03-04",
    end: "2024-03-08",
    progress: 1,
  },
  {
    task: "Design",
    phase: "Build",
    start: "2024-03-11",
    end: "2024-03-22",
    progress: 0.6,
  },
  {
    task: "Ship",
    phase: "Launch",
    start: "2024-03-25",
    end: "2024-04-05",
  },
];

const gantt = {data: tasks, groupBy: "task", color: "phase", legend: false};

/**
    Runs in the page: draws the Gantt, recording every `mouseenter`,
    `mousemove` and `click.shape` it fires, and resolves with where the chart
    and its axis and "Design" bar sit. On SVG it also reads, off the DOM, the
    client points of a tick label, a tick line, and a gridline crossing the
    "Design" bar.
*/
const draw = ([config, renderer]) =>
  new Promise(resolve => {
    window.__fired = [];
    const record = type => d =>
      window.__fired.push(`${type}:${d && d.task ? d.task : "axis"}`);
    const viz = new window.d3plus.Gantt()
      .config(config)
      .renderer(renderer)
      .duration(0)
      .on("mouseenter", record("mouseenter"))
      .on("mousemove", record("mousemove"))
      .on("click.shape", record("click"))
      .select("#viz");
    window.__viz = viz;
    viz.render(() => {
      const surface = document.querySelector("#viz svg, #viz canvas");
      const origin = surface.getBoundingClientRect();
      const at = {};
      const walk = (n, x, y) => {
        const t = n.transform || {};
        const nx = x + (t.x || 0);
        const ny = y + (t.y || 0);
        if (n.key === "gantt-axis") at.axis = [nx, ny];
        if (n.key === "gantt-task-Design")
          at.design = [nx + n.x, ny + n.y, n.width, n.height];
        (n.children || []).forEach(c => walk(c, nx, ny));
      };
      walk(viz._paintedScene.root, 0, 0);
      const layout = [origin.left, origin.top, ...at.axis, ...at.design];
      const axis = document.querySelector('#viz svg g[data-key="gantt-axis"]');
      if (!axis) return resolve({layout});
      const box = el => el.getBoundingClientRect();
      const leaves = [...axis.querySelectorAll("path, text")];
      const label = box(leaves.find(el => el.tagName === "text"));
      // A major tick: a short vertical line above the rows.
      const tick = box(
        leaves.find(
          el =>
            el.tagName === "path" &&
            el.getAttribute("data-key").endsWith("::hit") &&
            box(el).height >= 6 &&
            box(el).height < 30,
        ),
      );
      const bar = box(
        document.querySelector('#viz svg rect[data-key="gantt-task-Design"]'),
      );
      const grid = box(
        leaves.find(
          el =>
            box(el).height > 100 &&
            box(el).left > bar.left + 8 &&
            box(el).left < bar.right - 8,
        ),
      );
      resolve({
        layout,
        axisPointerEvents: axis.getAttribute("pointer-events"),
        points: {
          label: [label.left + label.width / 2, label.top + label.height / 2],
          tick: [tick.left + tick.width / 2, tick.top + 2],
          bar: [grid.left + grid.width / 2, bar.top + bar.height / 2],
        },
      });
    });
  });

/** Runs in the page: what the pointer's position shows and fired since the last read. */
const state = () => {
  const fired = [...new Set(window.__fired)];
  window.__fired.length = 0;
  return {
    fired,
    tooltip: [...document.querySelectorAll(".d3plus-tooltip")]
      .filter(el => getComputedStyle(el).opacity !== "0")
      .map(el => el.textContent)
      .join(" "),
    cursor: getComputedStyle(document.querySelector("#viz svg, #viz canvas"))
      .cursor,
  };
};

const body = '<div id="viz" style="width:800px;height:400px"></div>';

/** The SVG render's layout and the client points of its axis parts, read once. */
let measured;
const measure = () =>
  (measured ??= (async () => {
    const {page, close} = await openPage(body);
    try {
      return await page.evaluate(draw, [gantt, "svg"]);
    } finally {
      await close();
    }
  })());

for (const renderer of ["svg", "canvas"]) {
  it(`Gantt [${renderer}]: the time axis is inert, and a task bar still gets hover and click`, async () => {
    const reference = await measure();
    assert.strictEqual(reference.axisPointerEvents, "none");
    const {label, tick, bar} = reference.points;
    const {page, errors, close} = await openPage(body);
    try {
      const {layout} = await page.evaluate(draw, [gantt, renderer]);
      // Both backends lay the chart out alike, so the SVG render's points
      // sit on the same axis parts here.
      assert.strictEqual(layout.length, reference.layout.length);
      layout.forEach((v, i) =>
        assert.ok(
          Math.abs(v - reference.layout[i]) < 0.5,
          `layout[${i}]: ${v} vs ${reference.layout[i]}`,
        ),
      );
      const hover = async ([x, y]) => {
        await page.mouse.move(1, 1);
        await page.waitForTimeout(60);
        await page.evaluate(state);
        await page.mouse.move(x, y - 1);
        await page.mouse.move(x, y);
        await page.waitForTimeout(150);
        return page.evaluate(state);
      };
      const click = async ([x, y]) => {
        await page.mouse.click(x, y);
        return (await page.evaluate(state)).fired.filter(e =>
          e.startsWith("click"),
        );
      };
      const idle = {fired: [], tooltip: "", cursor: "auto"};

      assert.deepStrictEqual(await hover(label), idle, "over a tick label");
      assert.deepStrictEqual(await click(label), [], "clicking a tick label");
      assert.deepStrictEqual(await hover(tick), idle, "over a tick line");
      assert.deepStrictEqual(await click(tick), [], "clicking a tick line");

      const over = await hover(bar);
      assert.deepStrictEqual(over.fired, [
        "mouseenter:Design",
        "mousemove:Design",
      ]);
      assert.ok(
        /Design/.test(over.tooltip),
        `names the task (${over.tooltip})`,
      );
      assert.strictEqual(over.cursor, "pointer");
      assert.deepStrictEqual(await click(bar), ["click:Design"]);
      assert.deepStrictEqual(errors, []);
    } finally {
      await close();
    }
  });
}
