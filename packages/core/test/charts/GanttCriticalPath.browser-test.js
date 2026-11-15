import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";
import {render} from "~test/browser/render.js";

/**
    The Gantt's critical path in Chromium on both backends: tasks off it
    muted, its arrows bold and painted over the rest, the key in the label
    column's corner, a real pointer's tooltip listing Slack and Latest start
    (translated), and a dependency cycle drawing no critical path with one
    console warning however often the chart redraws.
*/

/** Plan → Design → Review → Ship is critical; Copy has a week of slack. */
const tasks = [
  {task: "Plan", start: "2024-03-04", end: "2024-03-08"},
  {
    task: "Design",
    start: "2024-03-08",
    end: "2024-03-20",
    dependencies: "Plan",
  },
  {task: "Copy", start: "2024-03-08", end: "2024-03-13", dependencies: "Plan"},
  {
    task: "Review",
    start: "2024-03-20",
    end: "2024-03-20",
    dependencies: ["Design", "Copy"],
  },
  {
    task: "Ship",
    start: "2024-03-20",
    end: "2024-03-27",
    dependencies: "Review",
  },
];

const base = {
  data: tasks,
  groupBy: "task",
  legend: false,
  criticalPath: true,
};

/**
    Runs in the page: draws a Gantt from `config` (twice when `redraw`),
    then reads the painted scene by key, the painted SVG text, and the
    console warnings.
*/
const draw = ({config, renderer, redraw = false}) =>
  new Promise(resolve => {
    const warnings = [];
    const warn = console.warn;
    console.warn = (...args) => warnings.push(args.join(" "));
    const viz = new window.d3plus.Gantt()
      .config(config)
      .renderer(renderer)
      .duration(0)
      .select("#viz");
    const read = () => {
      console.warn = warn;
      const nodes = {};
      const walk = n => {
        nodes[n.key] = {
          type: n.type,
          paint: n.paint || {},
          lines: n.lines ? n.lines.map(l => l.text) : null,
          aria: n.aria ? n.aria.label : null,
        };
        (n.children || []).forEach(walk);
      };
      walk(viz._paintedScene.root);
      resolve({
        nodes,
        order: Object.keys(nodes),
        svgText: [...document.querySelectorAll("#viz svg text")].map(
          t => t.textContent,
        ),
        warnings,
      });
    };
    viz.render(() => (redraw ? viz.render(read) : read()));
  });

for (const renderer of ["svg", "canvas"]) {
  it(`Gantt [${renderer}]: criticalPath mutes the other tasks and bolds its arrows`, async () => {
    const {nodes, order, svgText, warnings} = await render(
      '<div id="viz" style="width:800px;height:400px"></div>',
      draw,
      {config: base, renderer},
    );
    assert.strictEqual(nodes["gantt-task-Copy"].paint.opacity, 0.35);
    for (const key of [
      "gantt-task-Plan",
      "gantt-task-Design",
      "gantt-milestone-Review",
      "gantt-task-Ship",
    ])
      assert.strictEqual(nodes[key].paint.opacity ?? 1, 1, `${key} is lit`);

    const plain = nodes["gantt-dependency-Plan-Copy"].paint;
    const bold = nodes["gantt-dependency-Plan-Design"].paint;
    assert.ok(
      bold.strokeWidth > plain.strokeWidth,
      "critical arrows are bolder",
    );
    assert.ok(bold.strokeOpacity > plain.strokeOpacity, "and opaque");
    assert.strictEqual(
      nodes["gantt-dependency-Copy-Review"].paint.strokeWidth,
      plain.strokeWidth,
    );
    assert.ok(
      order.indexOf("gantt-dependency-Review-Ship") >
        order.indexOf("gantt-dependency-Copy-Review"),
      "critical arrows paint over the rest",
    );
    assert.match(nodes["gantt-task-Design"].aria, /Critical path\.$/);
    assert.doesNotMatch(nodes["gantt-task-Copy"].aria, /Critical/);

    assert.deepStrictEqual(nodes["gantt-critical-key-label"].lines, [
      "Critical path",
    ]);
    assert.strictEqual(nodes["gantt-critical-key-line"].type, "line");
    if (renderer === "svg") assert.ok(svgText.includes("Critical path"));
    assert.deepStrictEqual(warnings, []);
  });

  it(`Gantt [${renderer}]: the path draws by default, and a schedule without dependencies looks as before`, async () => {
    const {criticalPath, ...defaults} = base;
    assert.strictEqual(criticalPath, true);
    const on = await render(
      '<div id="viz" style="width:800px;height:400px"></div>',
      draw,
      {config: defaults, renderer},
    );
    assert.strictEqual(on.nodes["gantt-task-Copy"].paint.opacity, 0.35);
    assert.ok(on.nodes["gantt-critical-key-label"]);
    const plain = tasks.map(({task, start, end}) => ({task, start, end}));
    const off = await render(
      '<div id="viz" style="width:800px;height:400px"></div>',
      draw,
      {config: {...defaults, data: plain}, renderer},
    );
    assert.ok(!off.nodes["gantt-critical-key-label"], "no key");
    assert.ok(
      Object.values(off.nodes).every(n => (n.paint.opacity ?? 1) === 1),
      "nothing muted",
    );
    assert.deepStrictEqual(off.warnings, []);
  });

  it(`Gantt [${renderer}]: a dependency cycle draws no critical path and warns once`, async () => {
    const cyclic = tasks.map(t =>
      t.task === "Plan" ? {...t, dependencies: "Ship"} : t,
    );
    const {nodes, warnings} = await render(
      '<div id="viz" style="width:800px;height:400px"></div>',
      draw,
      {config: {...base, data: cyclic}, renderer, redraw: true},
    );
    assert.strictEqual(nodes["gantt-task-Copy"].paint.opacity ?? 1, 1);
    assert.ok(!nodes["gantt-critical-key-label"], "no key");
    assert.ok(nodes["gantt-dependency-Ship-Plan"], "the arrows still draw");
    assert.strictEqual(warnings.length, 1, warnings.join("\n"));
    assert.match(warnings[0], /cycle/);
    assert.match(warnings[0], /"Plan"/);
  });

  it(`Gantt [${renderer}]: hovering a task lists its Slack and Latest start`, async () => {
    const {page, errors, close} = await openPage(
      '<div id="viz" style="width:800px;height:400px"></div>',
    );
    try {
      const locale = renderer === "svg" ? "en-US" : "es-ES";
      const point = await page.evaluate(
        ([config, renderer]) =>
          new Promise(resolve => {
            const viz = new window.d3plus.Gantt()
              .config(config)
              .renderer(renderer)
              .duration(0)
              .select("#viz");
            viz.render(() => {
              const host =
                document.querySelector("#viz svg") ||
                document.querySelector("#viz canvas");
              const box = host.getBoundingClientRect();
              const chart = viz._chartTransform;
              const copy = viz._chartScene.find(
                n => n.key === "gantt-task-Copy",
              );
              resolve([
                box.left + chart.x + copy.transform.x + copy.width / 2,
                box.top + chart.y + copy.transform.y,
              ]);
            });
          }),
        [{...base, locale}, renderer],
      );
      await page.mouse.move(point[0] - 5, point[1] - 5);
      await page.mouse.move(point[0], point[1], {steps: 3});
      await page.waitForTimeout(150);
      const tip = await page.evaluate(() =>
        [...document.querySelectorAll(".d3plus-tooltip")]
          .filter(el => getComputedStyle(el).opacity !== "0")
          .map(el => el.textContent)
          .join(" "),
      );
      assert.ok(/Copy/.test(tip), `names the task (${tip})`);
      const expected =
        renderer === "svg"
          ? ["Slack", "7 days", "Latest start", "Mar 15, 2024"]
          : ["Holgura", "7 días", "Inicio más tardío"];
      for (const s of expected)
        assert.ok(tip.includes(s), `tooltip has ${s} (${tip})`);
      assert.deepStrictEqual(errors, []);
    } finally {
      await close();
    }
  });
}

it("Gantt: grouped rows keep their brackets, and drilling into a phase recomputes the path", async () => {
  const phased = tasks.map(t => ({
    ...t,
    phase: t.task === "Ship" ? "Launch" : "Build",
  }));
  const out = await render(
    '<div id="viz" style="width:800px;height:400px"></div>',
    ({config}) =>
      new Promise(resolve => {
        const viz = new window.d3plus.Gantt()
          .config(config)
          .duration(0)
          .select("#viz");
        const muted = () =>
          viz._chartScene
            .filter(n => n.paint && n.paint.opacity === 0.35)
            .map(n => n.key);
        const critical = () => {
          const c = viz.ctx.gantt.critical;
          return c
            ? [...c.tasks].filter(([, t]) => t.critical).map(([id]) => id)
            : null;
        };
        viz.render(() => {
          const grouped = {
            muted: muted(),
            brackets: viz._chartScene
              .filter(n => /^gantt-group-/.test(n.key))
              .map(n => n.paint.fillOpacity),
          };
          let clicked = false;
          viz
            .group(false)
            .groupBy(["phase", "task"])
            .depth(0)
            .render(() => {
              if (clicked) return;
              clicked = true;
              const top = {
                critical: critical(),
                rows: viz.ctx.gantt.rows.length,
              };
              const bar = viz._chartScene.find(
                n => n.key === "gantt-task-Build",
              );
              viz
                .on("click.shape")
                .call(viz, bar.datum, 0, undefined, new MouseEvent("click"));
              const check = () => {
                if (viz._drawDepth !== 1) return setTimeout(check, 20);
                resolve({
                  grouped,
                  top,
                  drilled: {critical: critical(), muted: muted()},
                });
              };
              check();
            });
        });
      }),
    {config: {...base, data: phased, group: "phase"}},
  );
  assert.deepStrictEqual(out.grouped.muted, ["gantt-task-Copy"]);
  assert.deepStrictEqual(out.grouped.brackets, [0.6, 0.6]);
  // At the phase level no dependency joins two drawn rows.
  assert.strictEqual(out.top.rows, 2);
  assert.strictEqual(out.top.critical, null);
  // Inside Build, Ship isn't drawn, so Review ends the path.
  assert.deepStrictEqual(out.drilled.critical, ["Plan", "Design", "Review"]);
  assert.deepStrictEqual(out.drilled.muted, ["gantt-task-Copy"]);
});

it("Gantt: each facet panel finds its own critical path", async () => {
  const phased = tasks.map(t => ({
    ...t,
    phase: ["Plan", "Design", "Copy"].includes(t.task) ? "Build" : "Launch",
  }));
  const out = await render(
    '<div id="viz" style="width:900px;height:500px"></div>',
    ({config}) =>
      new Promise(resolve => {
        const viz = new window.d3plus.Gantt()
          .config(config)
          .duration(0)
          .select("#viz");
        viz.render(() => {
          const keys = [];
          const walk = n => {
            if (n.key) keys.push([`${n.key}`, n.paint ? n.paint.opacity : 1]);
            (n.children || []).forEach(walk);
          };
          viz._chartScene.forEach(walk);
          resolve({
            muted: keys
              .filter(([, o]) => o === 0.35)
              .map(([k]) => k.replace(/^.*gantt-/, "gantt-")),
            keys: keys.filter(([k]) => /critical-key-label$/.test(k)).length,
          });
        });
      }),
    {config: {...base, data: phased, facet: "phase"}},
  );
  // Build: Plan → Design is critical and Copy isn't. Launch: Review → Ship.
  assert.deepStrictEqual(out.muted, ["gantt-task-Copy"]);
  assert.strictEqual(out.keys, 2, "a key per panel");
});
