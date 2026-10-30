import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";
import {render} from "~test/browser/render.js";

/**
    Gantt renders in Chromium on both backends: one labeled row per task,
    milestones as diamonds at their date, dependency arrows from each
    predecessor's end to its dependent's start, progress filling its share
    of each bar, the "today" line at its date, theme-aware labels and
    arrows on a dark background, keyboard focus walking the tasks, a real
    pointer's tooltip (with progress, translated), `click.shape`, phases
    drilled into with `groupBy`, weekends hidden with `rangeBreaks`, and the
    table view.
*/

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
    dependencies: ["Plan"],
  },
  {
    task: "Review",
    phase: "Build",
    start: "2024-03-22",
    end: "2024-03-22",
    dependencies: ["Design"],
  },
  {
    task: "Ship",
    phase: "Launch",
    start: "2024-03-25",
    end: "2024-04-05",
    progress: "25%",
    dependencies: "Review",
  },
];

/**
    Runs in the page: draws a Gantt from `config`, then reads the painted
    scene: every node with its absolute offset, keyed by scene key.
*/
const draw = ({config, renderer, html = true}) =>
  new Promise(resolve => {
    const viz = new window.d3plus.Gantt()
      .config(config)
      .renderer(renderer)
      .duration(0)
      .select("#viz");
    window.__viz = viz;
    viz.render(() => {
      const nodes = {};
      const walk = (n, x, y) => {
        const t = n.transform || {};
        const nx = x + (t.x || 0),
          ny = y + (t.y || 0);
        nodes[n.key] = {
          type: n.type,
          x: nx,
          y: ny,
          box:
            n.type === "rect"
              ? {x: nx + n.x, y: ny + n.y, w: n.width, h: n.height}
              : null,
          d: n.d,
          points: n.points
            ? n.points.map(([px, py]) => [px + nx, py + ny])
            : null,
          lines: n.lines ? n.lines.map(l => l.text) : null,
          lineY: n.lines && n.lines.length ? ny + n.lines[0].y : null,
          paint: n.paint || {},
          interactive: n.interactive,
          datum: n.datum ? n.datum.task : null,
        };
        (n.children || []).forEach(c => walk(c, nx, ny));
      };
      walk(viz._paintedScene.root, 0, 0);
      const layout = viz.ctx.gantt;
      const chart = viz._chartTransform || {x: 0, y: 0};
      const xAt = v => {
        const [y, m, d] = v.split("-").map(Number);
        return chart.x + layout.x(new Date(y, m - 1, d));
      };
      resolve({
        nodes,
        xs: Object.fromEntries(
          [
            "2024-03-04",
            "2024-03-08",
            "2024-03-11",
            "2024-03-15",
            "2024-03-22",
            "2024-03-25",
          ].map(d => [d, xAt(d)]),
        ),
        svgText: html
          ? [...document.querySelectorAll("#viz svg text")].map(
              t => t.textContent,
            )
          : [],
        background: getComputedStyle(document.body).backgroundColor,
      });
    });
  });

const base = {
  data: tasks,
  groupBy: "task",
  color: "phase",
  legend: false,
};

const near = (a, b, message, tolerance = 0.6) =>
  assert.ok(Math.abs(a - b) <= tolerance, `${message}: ${a} vs ${b}`);

for (const renderer of ["svg", "canvas"]) {
  it(`Gantt [${renderer}]: one labeled row per task, top down`, async () => {
    const {nodes, svgText} = await render(
      '<div id="viz" style="width:800px;height:400px"></div>',
      draw,
      {config: base, renderer},
    );
    const labels = ["Plan", "Design", "Review", "Ship"].map(
      t => nodes[`gantt-label-task-${t}`],
    );
    assert.deepStrictEqual(
      labels.map(l => l.lines[0]),
      ["Plan", "Design", "Review", "Ship"],
    );
    assert.ok(
      labels.every((l, i) => !i || l.y > labels[i - 1].y),
      "rows run top down",
    );
    assert.ok(labels.every(l => l.interactive === false));
    const bars = ["Plan", "Design", "Ship"].map(t => nodes[`gantt-task-${t}`]);
    bars.forEach((b, i) => near(b.y, labels[[0, 1, 3][i]].lineY, "same row"));
    assert.ok(
      bars.every(b => b.box.x > labels[0].x),
      "bars sit right of the labels",
    );
    if (renderer === "svg")
      ["Plan", "Design", "Review", "Ship"].forEach(t =>
        assert.ok(svgText.includes(t), `paints ${t}`),
      );
  });

  it(`Gantt [${renderer}]: milestones, dependencies, progress, and today line up with the axis`, async () => {
    const {nodes, xs} = await render(
      '<div id="viz" style="width:800px;height:400px"></div>',
      draw,
      {config: {...base, today: "2024-03-15"}, renderer},
    );
    // The milestone diamond is centered on its date.
    const review = nodes["gantt-milestone-Review"];
    near(review.x, xs["2024-03-22"], "milestone x");
    assert.strictEqual(review.datum, "Review");
    const r = Number(/^M[-\d.]+,(-?[\d.]+)/.exec(review.d)[1]) * -1;
    assert.ok(r > 0, "diamond has a size");

    // Plan → Design: from Plan's end to Design's start.
    const dep = nodes["gantt-dependency-Plan-Design"];
    near(dep.points[0][0], xs["2024-03-08"], "leaves the predecessor's end");
    near(
      dep.points[0][1],
      nodes["gantt-task-Plan"].y,
      "on the predecessor's row",
    );
    const arrow = nodes["gantt-dependency-Plan-Design-arrow"];
    const [tipX, tipY] = /^M(-?[\d.]+),(-?[\d.]+)/
      .exec(arrow.d)
      .slice(1)
      .map(Number);
    near(
      tipX + arrow.x,
      xs["2024-03-11"],
      "arrow tip at the dependent's start",
    );
    near(
      tipY + arrow.y,
      nodes["gantt-task-Design"].y,
      "on the dependent's row",
    );
    assert.strictEqual(dep.interactive, false);
    assert.strictEqual(arrow.interactive, false);
    // Design → Review ends at the diamond's left tip.
    const toReview = nodes["gantt-dependency-Design-Review-arrow"];
    near(
      Number(/^M(-?[\d.]+)/.exec(toReview.d)[1]) + toReview.x,
      review.x - r,
      "into the diamond's tip",
    );

    // Progress fills its share of the bar.
    const design = nodes["gantt-task-Design"],
      done = nodes["gantt-task-Design-progress"];
    near(done.box.w, design.box.w * 0.6, "progress width");
    near(done.box.x, design.box.x, "progress starts at the bar's start");
    assert.strictEqual(done.interactive, false);
    near(
      nodes["gantt-task-Ship-progress"].box.w,
      nodes["gantt-task-Ship"].box.w * 0.25,
      "percent strings",
    );
    assert.ok(
      !nodes["gantt-task-Plan-progress"] ||
        nodes["gantt-task-Plan-progress"].box.w > 0,
    );

    // The today line.
    const today = nodes["gantt-today-line"];
    near(today.points[0][0], xs["2024-03-15"], "today x");
    assert.deepStrictEqual(nodes["gantt-today-label"].lines, ["Today"]);
  });

  it(`Gantt [${renderer}]: labels and arrows follow a dark theme`, async () => {
    const read = theme =>
      render('<div id="viz" style="width:800px;height:400px"></div>', draw, {
        config: {...base, theme},
        renderer,
      });
    const l = await read("light");
    const d = await read("dark");
    const lum = c => {
      const m = /(\d+),\s*(\d+),\s*(\d+)/.exec(c) || [];
      if (m.length) return (+m[1] + +m[2] + +m[3]) / 3;
      const hex = c.replace("#", "");
      return (
        (parseInt(hex.slice(0, 2), 16) +
          parseInt(hex.slice(2, 4), 16) +
          parseInt(hex.slice(4, 6), 16)) /
        3
      );
    };
    const label = n => n.nodes["gantt-label-task-Plan"].paint.fill;
    const stroke = n => n.nodes["gantt-dependency-Plan-Design"].paint.stroke;
    assert.ok(lum(label(l)) < 128, `dark labels on light (${label(l)})`);
    assert.ok(lum(label(d)) > 128, `light labels on dark (${label(d)})`);
    assert.ok(
      lum(stroke(l)) < 128 && lum(stroke(d)) > 128,
      "arrows follow the ink",
    );
    // The remaining part of a bar mixes toward the background.
    const rest = n => lum(n.nodes["gantt-task-Design"].paint.fill);
    assert.ok(rest(d) < rest(l), "the paler shade darkens on dark");
  });

  it(`Gantt [${renderer}]: keyboard focus walks the tasks, skipping decoration`, async () => {
    const out = await render(
      '<div id="viz" style="width:800px;height:400px"></div>',
      async ({config, renderer}) => {
        const viz = new window.d3plus.Gantt()
          .config(config)
          .renderer(renderer)
          .duration(0)
          .select("#viz");
        await new Promise(r => viz.render(r));
        const host = document.querySelector("#viz .d3plus-keyboard-nav");
        const wait = () =>
          new Promise(r => requestAnimationFrame(() => setTimeout(r, 40)));
        const live = () => host.querySelector("[aria-live]").textContent;
        host.focus();
        await wait();
        const seen = [live()];
        for (let i = 0; i < 4; i++) {
          host.dispatchEvent(
            new KeyboardEvent("keydown", {key: "ArrowDown", bubbles: true}),
          );
          await wait();
          seen.push(live());
        }
        return seen;
      },
      {config: {...base, today: "2024-03-15"}, renderer},
    );
    assert.deepStrictEqual(
      out.map(s => s.split(",")[0]),
      ["Plan", "Design", "Review", "Ship", "Ship"],
    );
    assert.ok(/Progress 60%/.test(out[1]), `announces progress (${out[1]})`);
  });

  it(`Gantt [${renderer}]: hovering a task shows its tooltip, and clicking fires click.shape`, async () => {
    const {page, errors, close} = await openPage(
      '<div id="viz" style="width:800px;height:400px"></div>',
    );
    try {
      const point = await page.evaluate(
        ([config, renderer]) =>
          new Promise(resolve => {
            window.__clicks = [];
            const viz = new window.d3plus.Gantt()
              .config(config)
              .renderer(renderer)
              .duration(0)
              .on("click.shape", d => window.__clicks.push(d.task))
              .select("#viz");
            viz.render(() => {
              const host =
                document.querySelector("#viz svg") ||
                document.querySelector("#viz canvas");
              const box = host.getBoundingClientRect();
              const chart = viz._chartTransform;
              const mark = viz.ctx.gantt;
              const design = viz._chartScene.find(
                n => n.key === "gantt-task-Design",
              );
              resolve([
                box.left + chart.x + design.transform.x + design.width * 0.8,
                box.top + chart.y + design.transform.y,
                mark.column,
              ]);
            });
          }),
        [{...base, locale: renderer === "svg" ? "en-US" : "es-ES"}, renderer],
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
      assert.ok(/Design/.test(tip), `names the task (${tip})`);
      if (renderer === "svg") {
        for (const s of [
          "Start",
          "End",
          "Duration",
          "11 days",
          "Progress",
          "60%",
        ])
          assert.ok(tip.includes(s), `tooltip has ${s} (${tip})`);
      } else {
        for (const s of [
          "Inicio",
          "Fin",
          "Duración",
          "11 días",
          "Progreso",
          "60%",
        ])
          assert.ok(tip.includes(s), `es-ES tooltip has ${s} (${tip})`);
      }
      await page.mouse.click(point[0], point[1]);
      assert.deepStrictEqual(await page.evaluate(() => window.__clicks), [
        "Design",
      ]);
      assert.deepStrictEqual(errors, []);
    } finally {
      await close();
    }
  });
}

it("Gantt: groups draw header rows with brackets, and groupBy drills into a phase", async () => {
  const out = await render(
    '<div id="viz" style="width:800px;height:400px"></div>',
    () =>
      new Promise(resolve => {
        const data = [
          {
            phase: "Build",
            task: "Design",
            start: "2024-03-11",
            end: "2024-03-22",
          },
          {
            phase: "Build",
            task: "Code",
            start: "2024-03-18",
            end: "2024-03-29",
          },
          {
            phase: "Launch",
            task: "Ship",
            start: "2024-04-01",
            end: "2024-04-05",
          },
        ];
        const viz = new window.d3plus.Gantt()
          .data(data)
          .groupBy(["phase", "task"])
          .depth(0)
          .duration(0)
          .select("#viz");
        viz.render(() => {
          const phases = viz.ctx.gantt.rows.map(r => r.key);
          const bar = viz._chartScene.find(n => n.key === "gantt-task-Build");
          viz
            .on("click.shape")
            .call(viz, bar.datum, 0, undefined, new MouseEvent("click"));
          const wait = () =>
            new Promise(r => {
              const check = () =>
                viz._drawDepth === 1 ? r() : setTimeout(check, 20);
              check();
            });
          wait().then(() => {
            const drilled = viz.ctx.gantt.rows.map(r => r.key);
            viz
              .group("phase")
              .depth(1)
              .render(() => {
                const grouped = viz.ctx.gantt.rows.map(r => r.key);
                const bracket = viz._chartScene.find(
                  n => n.key === "gantt-group-Build",
                );
                resolve({
                  phases,
                  drilled,
                  grouped,
                  bracket: !!bracket,
                  inert: bracket.interactive,
                });
              });
          });
        });
      }),
  );
  assert.deepStrictEqual(out.phases, ["task-Build", "task-Launch"]);
  assert.deepStrictEqual(out.drilled, ["task-Design", "task-Code"]);
  // Still drilled into Build, now under its header row.
  assert.deepStrictEqual(out.grouped, [
    "group-Build",
    "task-Design",
    "task-Code",
  ]);
  assert.ok(out.bracket);
  assert.strictEqual(out.inert, false);
});

it("Gantt: rangeBreaks hide weekends and the bars still meet their arrows", async () => {
  const out = await render(
    '<div id="viz" style="width:800px;height:300px"></div>',
    () =>
      new Promise(resolve => {
        const viz = new window.d3plus.Gantt()
          .data([
            {task: "A", start: "2024-03-04", end: "2024-03-08"},
            {
              task: "B",
              start: "2024-03-11",
              end: "2024-03-15",
              dependencies: "A",
            },
          ])
          .groupBy("task")
          .axisConfig({rangeBreaks: "weekends"})
          .duration(0)
          .select("#viz");
        viz.render(() => {
          const {x} = viz.ctx.gantt;
          const thursday = x(new Date(2024, 2, 7)),
            friday = x(new Date(2024, 2, 8)),
            saturday = x(new Date(2024, 2, 9)),
            monday = x(new Date(2024, 2, 11));
          const line = viz._chartScene.find(
            n => n.key === "gantt-dependency-A-B",
          );
          const a = viz._chartScene.find(n => n.key === "gantt-task-A");
          resolve({
            thursday,
            friday,
            saturday,
            monday,
            start: line.points[0][0],
            aEnd: a.transform.x + a.width,
          });
        });
      }),
  );
  const day = out.friday - out.thursday;
  assert.ok(
    Math.abs(out.monday - out.friday - day) < 20,
    `the weekend takes no more than a break (${out.monday - out.friday}px vs a ${day}px day)`,
  );
  assert.ok(out.saturday >= out.friday + day - 1 && out.saturday <= out.monday);
  assert.ok(Math.abs(out.start - out.aEnd) < 0.01);
});

it("Gantt: the table view lists the tasks", async () => {
  const out = await render(
    '<div id="viz" style="width:800px;height:300px"></div>',
    () =>
      new Promise(resolve => {
        new window.d3plus.Gantt()
          .data([
            {task: "A", start: "2024-03-04", end: "2024-03-08", progress: 0.5},
            {task: "B", start: "2024-03-11", end: "2024-03-15"},
          ])
          .groupBy("task")
          .duration(0)
          .select("#viz")
          .render(() => {
            document
              .querySelector(
                ".d3plus-top-left-controls-item .table-view-toggle",
              )
              .click();
            resolve({
              rows: document.querySelectorAll(
                ".d3plus-table-view-table tbody tr",
              ).length,
              headers: [
                ...document.querySelectorAll(
                  ".d3plus-table-view-table thead th",
                ),
              ].map(th => th.textContent),
            });
          });
      }),
  );
  assert.strictEqual(out.rows, 2);
  assert.ok(out.headers.some(h => /task/i.test(h)));
});
