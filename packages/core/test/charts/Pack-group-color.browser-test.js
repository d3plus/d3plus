import {it} from "vitest";
import {color} from "d3-color";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    A Pack's group circles are painted from their group's row: each takes its
    group's color at `packOpacity`, and `packOpacity` and `shapeConfig`
    accessors receive the row. The outermost circle, holding every group, is
    painted the neutral tone Treemap gives its group headers under a
    colorScale (between the chart's background and its ink, so it follows a
    dark theme), and so is every group while a colorScale colors the leaves.
*/

const places = [
  {region: "East", country: "A", city: "a1", value: 30},
  {region: "East", country: "A", city: "a2", value: 20},
  {region: "East", country: "B", city: "b1", value: 25},
  {region: "East", country: "B", city: "b2", value: 15},
  {region: "West", country: "C", city: "c1", value: 22},
  {region: "West", country: "C", city: "c2", value: 12},
  {region: "West", country: "D", city: "d1", value: 18},
  {region: "West", country: "D", city: "d2", value: 9},
];

/**
    Renders a three-level Pack of `places` at depth 1, configured by
    `config`, and returns its painted circles: the outermost, each group (by
    the region of the leaves inside it) and each leaf (by country), with
    their fill, stroke and opacity, plus the scale's color for each leaf's
    value (with a colorScale) and `neutral`: the group-header fill of a
    Treemap drawn with a colorScale in the same theme.
*/
async function paint(config, renderer) {
  const {page, close} = await openPage(
    '<div id="viz" style="width:600px;height:400px;font-family:sans-serif;"></div>' +
      '<div id="tm" style="width:400px;height:300px;"></div>',
  );
  try {
    return await page.evaluate(
      ([places, config, renderer]) =>
        new Promise(resolve => {
          const viz = new window.d3plus.Pack()
            .data(JSON.parse(JSON.stringify(places)))
            .groupBy(["region", "country", "city"])
            .depth(1)
            .sum("value")
            .legend(false)
            .config(config.colorScale ? {colorScale: config.colorScale} : {})
            .renderer(renderer)
            .duration(0)
            .select("#viz");
          if (config.theme) viz.theme(config.theme);
          if (config.strokeWidth)
            viz.shapeConfig({strokeWidth: config.strokeWidth});
          if (config.topStroke) viz.shapeConfig({stroke: config.topStroke});
          if (config.packOpacity)
            viz.packOpacity(d => (d.region === "East" ? 0.4 : 0.1));
          if (config.stroke)
            viz.shapeConfig({
              Circle: {
                stroke: d => (d.region === "West" ? "#ff0000" : "#000000"),
              },
            });
          viz.render(() => {
            const nodes = [];
            const walk = list =>
              list.forEach(n => {
                if (n.type === "circle" && n.shapeType === "Pack")
                  nodes.push(n);
                if (n.children) walk(n.children);
              });
            walk([viz._paintedScene.root]);
            const inside = (a, b) =>
              a !== b &&
              b.r < a.r &&
              Math.hypot(a.cx - b.cx, a.cy - b.cy) < a.r;
            const leaves = nodes.filter(n => !nodes.some(m => inside(n, m)));
            const look = n => ({
              fill: n.paint.fill,
              stroke: n.paint.stroke,
              opacity: n.paint.opacity ?? 1,
            });
            const root = nodes.reduce((a, b) => (b.r > a.r ? b : a));
            const groups = {};
            for (const n of nodes) {
              if (n === root || leaves.includes(n)) continue;
              const regions = new Set(
                leaves.filter(m => inside(n, m)).map(m => m.datum.region),
              );
              groups[[...regions].join()] = look(n);
            }
            const scale = viz._colorScaleClass?._colorScale;
            const out = {
              root: look(root),
              groups,
              leaves: Object.fromEntries(
                leaves.map(n => [n.datum.country, look(n)]),
              ),
              scaled: scale
                ? Object.fromEntries(
                    leaves.map(n => [n.datum.country, scale(n.datum.value)]),
                  )
                : null,
            };
            const treemap = new window.d3plus.Treemap()
              .data(JSON.parse(JSON.stringify(places)))
              .groupBy(["region", "country"])
              .sum("value")
              .colorScale("value")
              .renderer(renderer)
              .duration(0)
              .select("#tm");
            if (config.theme) treemap.theme(config.theme);
            treemap.render(() => {
              const header = treemap._chartScene.find(n =>
                `${n.key}`.startsWith("treemap-group-"),
              );
              out.neutral = header.paint.fill;
              resolve(out);
            });
          });
        }),
      [places, config, renderer],
    );
  } finally {
    await close();
  }
}

for (const renderer of ["svg", "canvas"]) {
  it(`Pack (${renderer}): a group circle takes its group's color at packOpacity, the outermost is neutral`, async () => {
    const s = await paint({}, renderer);
    assert.deepStrictEqual(Object.keys(s.groups).sort(), ["East", "West"]);
    for (const [region, countries] of [
      ["East", ["A", "B"]],
      ["West", ["C", "D"]],
    ]) {
      const group = s.groups[region];
      for (const c of countries) {
        assert.strictEqual(
          group.fill,
          s.leaves[c].fill,
          `${region}'s circle takes the color of its leaf ${c}`,
        );
        assert.strictEqual(s.leaves[c].opacity, 1, "leaves stay opaque");
      }
      assert.strictEqual(group.opacity, 0.25, "at the default packOpacity");
    }
    assert.notStrictEqual(s.groups.East.fill, s.groups.West.fill);
    assert.strictEqual(s.root.fill, s.neutral, "the outermost is neutral");
    assert.strictEqual(s.root.opacity, 0.25);
  });

  it(`Pack (${renderer}): packOpacity and shapeConfig accessors receive a group circle's row`, async () => {
    const s = await paint({packOpacity: true, stroke: true}, renderer);
    assert.strictEqual(s.groups.East.opacity, 0.4);
    assert.strictEqual(s.groups.West.opacity, 0.1);
    assert.strictEqual(s.groups.West.stroke, "#ff0000");
    assert.strictEqual(s.groups.East.stroke, "#000000");
    assert.strictEqual(s.leaves.C.stroke, "#ff0000", "leaves read their rows");
    assert.strictEqual(s.leaves.A.opacity, 1, "leaves stay opaque");
  });

  it(`Pack (${renderer}): with a colorScale, group circles are neutral and leaves take the scale's colors`, async () => {
    const s = await paint({colorScale: "value"}, renderer);
    assert.ok(s.scaled, "the chart draws a colorScale");
    assert.deepStrictEqual(Object.keys(s.scaled).sort(), ["A", "B", "C", "D"]);
    for (const [country, color] of Object.entries(s.scaled))
      assert.strictEqual(
        s.leaves[country].fill,
        color,
        `${country} is on the scale`,
      );
    assert.strictEqual(s.groups.East.fill, s.neutral, "groups are neutral");
    assert.strictEqual(s.groups.West.fill, s.neutral);
    assert.strictEqual(s.groups.East.opacity, 0.25, "at packOpacity");
    assert.strictEqual(s.root.fill, s.neutral, "the outermost is neutral");
  });

  it(`Pack (${renderer}): the neutral tone follows a dark theme`, async () => {
    const light = await paint({colorScale: "value", theme: "light"}, renderer);
    const dark = await paint({colorScale: "value", theme: "dark"}, renderer);
    assert.notStrictEqual(dark.neutral, light.neutral);
    assert.strictEqual(dark.root.fill, dark.neutral);
    assert.strictEqual(dark.groups.East.fill, dark.neutral);
    assert.strictEqual(light.root.fill, light.neutral);
  });

  it(`Pack (${renderer}): a neutral circle's default stroke is its fill a shade darker`, async () => {
    for (const theme of ["light", "dark"]) {
      const s = await paint(
        {colorScale: "value", strokeWidth: 2, theme},
        renderer,
      );
      const darker = color(s.neutral).darker(0.25).toString();
      assert.strictEqual(s.root.stroke, darker, `${theme}: the outermost`);
      assert.strictEqual(s.groups.East.stroke, darker, `${theme}: a group`);
      assert.strictEqual(
        s.leaves.A.stroke,
        color(s.leaves.A.fill).darker(0.25).toString(),
        `${theme}: a leaf's stroke follows its own fill`,
      );
    }
    const plain = await paint({strokeWidth: 2}, renderer);
    assert.strictEqual(
      plain.root.stroke,
      color(plain.neutral).darker(0.25).toString(),
      "without a colorScale too",
    );
  });

  it(`Pack (${renderer}): a user's stroke wins over a neutral circle's`, async () => {
    const circle = await paint(
      {colorScale: "value", strokeWidth: 2, stroke: true},
      renderer,
    );
    // A neutral circle's accessors receive its nest entry, with no region.
    assert.strictEqual(circle.root.stroke, "#000000");
    assert.strictEqual(circle.groups.West.stroke, "#000000");
    assert.strictEqual(circle.leaves.C.stroke, "#ff0000");
    const top = await paint(
      {colorScale: "value", strokeWidth: 2, topStroke: "#123456"},
      renderer,
    );
    assert.strictEqual(top.root.stroke, "#123456");
    assert.strictEqual(top.groups.East.stroke, "#123456");
  });
}
