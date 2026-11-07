import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import {labelsOverlap} from "../../src/charts/features/linkLabelGeometry.ts";
import {textLineBoxes} from "../../src/charts/features/linkLabels.ts";

/**
    Pie and Donut labels outside the ring, in a real browser on both
    renderers: the long tail's labels sit beside the ring with leaders,
    apart from each other and clear of the ring, inside the chart; "inside"
    turns them off and "outside" labels every slice there; they dim with
    their slice on hover, are no focus target, and take the theme's ink.
*/

const spending = [
  {id: "Housing", value: 33.3},
  {id: "Transportation", value: 17},
  {id: "Food", value: 12.9},
  {id: "Personal insurance and pensions", value: 12},
  {id: "Healthcare", value: 8},
  {id: "Entertainment", value: 4.7},
  {id: "Cash contributions", value: 3.4},
  {id: "Apparel and services", value: 2.6},
  {id: "Education", value: 2.2},
  {id: "Miscellaneous", value: 1.4},
  {id: "Personal care", value: 1.2},
  {id: "Alcoholic beverages", value: 0.8},
  {id: "Tobacco", value: 0.4},
  {id: "Reading", value: 0.1},
];

/**
    Draws `type` and resolves with its outside labels (text, fill, datum,
    interactivity, line boxes in the chart's surface), their leaders'
    points and stroke, the ring's center and radius, and its focus targets.
*/
const draw = ([type, config, renderer, hover]) =>
  new Promise(resolve => {
    const viz = new window.d3plus[type]()
      .config({data: [], groupBy: "id", ...config})
      .renderer(renderer)
      .width(600)
      .height(500)
      .duration(0)
      .legend(false)
      .select("#viz");
    viz.render(async () => {
      if (hover) {
        viz.hover(d => d.id === hover);
        for (let i = 0; i < 3; i++)
          await new Promise(r => requestAnimationFrame(() => r()));
      }
      const texts = [];
      const leaders = [];
      const walk = (n, ox, oy, op) => {
        const t = n.transform || {};
        const opacity = op * (n.paint?.opacity ?? 1);
        const key = `${n.key}`;
        if (n.type === "text" && key.startsWith("pie-outside-"))
          texts.push({n, ox, oy, opacity});
        if (n.type === "line" && key.startsWith("pie-outside-"))
          leaders.push({n, ox, oy, opacity});
        (n.children || []).forEach(c =>
          walk(c, ox + (t.x || 0), oy + (t.y || 0), opacity),
        );
      };
      walk(viz._paintedScene.root, 0, 0, 1);
      const center = viz._chartTransform;
      const targets = window.d3plus.focusTargets(
        viz._paintedScene.root.children,
      );
      resolve({
        center: {x: center.x, y: center.y},
        radius: viz.ctx.arcData.outerRadius()(),
        labels: texts.map(({n, ox, oy, opacity}) => ({
          text: n.lines.map(l => l.text).join(" "),
          fill: n.paint.fill,
          id: n.datum?.id,
          interactive: n.interactive,
          ariaHidden: n.aria?.hidden === true,
          opacity,
          ox,
          oy,
          node: JSON.parse(JSON.stringify(n)),
        })),
        leaders: leaders.map(({n, ox, oy, opacity}) => ({
          id: n.datum?.id,
          points: n.points.map(([x, y]) => [x + ox, y + oy]),
          stroke: n.paint.stroke,
          strokeWidth: n.paint.strokeWidth,
          interactive: n.interactive,
          opacity,
        })),
        textTargets: targets.filter(
          t => t.node.type === "text" || t.node.type === "line",
        ).length,
      });
    });
  });

const run = (type, renderer, config = {}, hover) =>
  render('<div id="viz"></div>', draw, [
    type,
    {data: spending, ...config},
    renderer,
    hover,
  ]);

/** Each outside label's line boxes, in the chart's surface. */
const boxesOf = label =>
  textLineBoxes([label.node]).map(b => ({
    ...b,
    x: b.x + label.ox,
    y: b.y + label.oy,
  }));

const luminance = color => {
  const m = color.match(/\d+/g) ?? [];
  const rgb = color.startsWith("#")
    ? [1, 3, 5].map(k => parseInt(color.slice(k, k + 2), 16))
    : m.slice(0, 3).map(Number);
  return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
};

for (const renderer of ["svg", "canvas"]) {
  for (const type of ["Pie", "Donut"]) {
    it(`${type}: the long tail is labelled outside, apart and clear of the ring (${renderer})`, async () => {
      const out = await run(type, renderer);
      const names = out.labels.map(l => l.id);
      assert.ok(out.labels.length >= 6, names.join(", "));
      for (const id of ["Tobacco", "Personal care", "Education"])
        assert.ok(names.includes(id), `${id} in ${names.join(", ")}`);
      assert.ok(!names.includes("Housing"), "big slices keep their label in");
      assert.strictEqual(out.leaders.length, out.labels.length);
      const boxes = out.labels.map(boxesOf);
      for (const [k, label] of out.labels.entries()) {
        assert.strictEqual(label.interactive, false);
        assert.strictEqual(label.ariaHidden, true);
        for (const b of boxes[k]) {
          // Inside the chart.
          assert.ok(
            b.x - b.width / 2 >= -0.5 && b.x + b.width / 2 <= 600.5,
            `${label.text} within the width`,
          );
          assert.ok(
            b.y - b.height / 2 >= -0.5 && b.y + b.height / 2 <= 500.5,
            `${label.text} within the height`,
          );
          // Clear of the ring: every corner beyond its radius.
          for (const [dx, dy] of [
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ]) {
            const x = b.x + (dx * b.width) / 2 - out.center.x;
            const y = b.y + (dy * b.height) / 2 - out.center.y;
            assert.ok(
              Math.hypot(x, y) > out.radius,
              `${label.text} clear of the ring`,
            );
          }
        }
      }
      for (let i = 0; i < boxes.length; i++)
        for (let j = i + 1; j < boxes.length; j++)
          for (const a of boxes[i])
            for (const b of boxes[j])
              assert.ok(
                !labelsOverlap(a, b),
                `${out.labels[i].text} and ${out.labels[j].text} overlap`,
              );
      for (const leader of out.leaders) {
        const [a] = leader.points;
        const r = Math.hypot(a[0] - out.center.x, a[1] - out.center.y);
        assert.ok(Math.abs(r - out.radius) < 0.5, "starts at the ring's edge");
        assert.strictEqual(leader.strokeWidth, 1);
        assert.strictEqual(leader.interactive, false);
      }
      assert.strictEqual(out.textTargets, 0, "no label is a focus target");
    });
  }

  it(`Donut: inside keeps every label in; outside labels every slice there (${renderer})`, async () => {
    const inside = await run("Donut", renderer, {labelPosition: "inside"});
    assert.deepStrictEqual(inside.labels, []);
    assert.deepStrictEqual(inside.leaders, []);
    const outside = await run("Donut", renderer, {
      data: spending.slice(0, 6),
      labelPosition: "outside",
    });
    assert.deepStrictEqual(
      outside.labels.map(l => l.id).sort(),
      spending
        .slice(0, 6)
        .map(d => d.id)
        .sort(),
    );
  });

  it(`Pie: outside labels dim with their slice on hover (${renderer})`, async () => {
    const out = await run("Pie", renderer, {}, "Tobacco");
    const label = id => out.labels.find(l => l.id === id);
    const leader = id => out.leaders.find(l => l.id === id);
    assert.strictEqual(label("Tobacco").opacity, 1, "the hovered slice's");
    assert.ok(
      label("Personal care").opacity < 1,
      `${label("Personal care").opacity}`,
    );
    assert.ok(leader("Personal care").opacity < 1, "its leader dims too");
  });

  it(`Pie: outside labels take the theme's ink (${renderer})`, async () => {
    for (const theme of ["light", "dark"]) {
      const out = await run("Pie", renderer, {theme});
      assert.ok(out.labels.length > 0);
      for (const l of out.labels) {
        const lum = luminance(l.fill);
        assert.ok(
          theme === "dark" ? lum > 0.7 : lum < 0.4,
          `${theme}: ${l.text} in ${l.fill}`,
        );
      }
      for (const l of out.leaders) {
        const lum = luminance(l.stroke);
        assert.ok(
          theme === "dark" ? lum > 0.7 : lum < 0.4,
          `${theme}: leader in ${l.stroke}`,
        );
      }
    }
  });
}
