/* global requestAnimationFrame, setTimeout */
import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    DotPlot in a real browser, on SVG and Canvas: one dot per row swept into
    Wilkinson stacks (each at the mean of its values, piled from the
    baseline one diameter apart), category rows, groups ordered within each
    stack, centered stacks, vertical rows, `per`, and a hovered dot's
    tooltip and highlight.
*/

/** Draws a DotPlot and reads its dots from the scene. */
const probe = ([renderer, config, hover]) =>
  new Promise(resolve => {
    let s = 11;
    const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const regions = ["Africa", "Americas", "Asia"];
    const rows = Array.from({length: 90}, (_, i) => {
      let v = 0;
      for (let k = 0; k < 4; k++) v += rand();
      return {
        name: `n${i}`,
        region: regions[i % 3],
        value: Math.round(v * 250) / 10,
        count: (i % 4) * 5 + 3,
      };
    });
    const el = document.createElement("div");
    document.body.appendChild(el);
    const walk = (nodes, out = []) => {
      for (const n of nodes || []) {
        if (n.type === "group") walk(n.children, out);
        else out.push(n);
      }
      return out;
    };
    const viz = new window.d3plus.DotPlot()
      .select(el)
      .renderer(renderer)
      .detectVisible(false)
      .duration(0)
      .width(700)
      .height(400)
      .data(config.rows === "first12" ? rows.slice(0, 12) : rows)
      .config({...config, rows: undefined});
    viz.render(async () => {
      const dots = walk(viz._chartScene)
        .filter(
          n =>
            n.type === "circle" &&
            n.shapeType === "Circle" &&
            n.datum &&
            !String(n.key).endsWith("::hit"),
        )
        .map(n => {
          let d = n.datum;
          while (d && d.__d3plus__ && d.data) d = d.data;
          return {
            key: String(n.key),
            x: n.transform.x,
            y: n.transform.y,
            r: n.r,
            fill: n.paint && n.paint.fill,
            row: rows.indexOf(d),
            d,
          };
        });
      const axis = config.y === "value" ? viz._yAxis : viz._xAxis;
      const out = {
        dots: dots.map(({d, ...dot}) => ({
          ...dot,
          value: d.value,
          region: d.region,
          name: d.name,
        })),
        pixels: Object.fromEntries(
          dots.map(dot => [dot.key, axis._getPosition(dot.d.value)]),
        ),
        swarm: viz._swarm,
        lanes:
          config.y === "region" || config.x === "region"
            ? Object.fromEntries(
                regions.map(r => [
                  r,
                  (config.y === "region"
                    ? viz._yAxis
                    : viz._xAxis
                  )._getPosition(r),
                ]),
              )
            : null,
        laneTicks:
          config.y === "region"
            ? viz._yAxis.schema.ticks
            : config.x === "region"
              ? viz._xAxis.schema.ticks
              : null,
        yRange: viz._yAxis.range(),
        xRange: viz._xAxis.range(),
        missing: viz.schema.colorDefaults.missing,
      };
      if (hover) {
        const target = dots[Math.floor(dots.length / 2)];
        const surface = el.querySelector(
          renderer === "canvas" ? "canvas" : "svg",
        );
        const box = surface.getBoundingClientRect();
        const clientX = box.left + viz._chartTransform.x + target.x;
        const clientY = box.top + viz._chartTransform.y + target.y;
        const hit = document.elementFromPoint(clientX, clientY) || surface;
        hit.dispatchEvent(
          new MouseEvent("mousemove", {clientX, clientY, bubbles: true}),
        );
        await new Promise(r => requestAnimationFrame(() => setTimeout(r, 80)));
        const tip = document.querySelector(".d3plus-tooltip");
        out.tooltip = tip ? tip.innerText.replace(/\s+/g, " ").trim() : null;
        out.hoveredName = target.d.name;
        // The hover highlight: the dots its function picks.
        const hoverFn = viz._hover;
        out.hovered = walk(viz._chartScene)
          .filter(
            n => n.type === "circle" && n.shapeType === "Circle" && n.datum,
          )
          .filter(
            (n, i) => typeof hoverFn === "function" && hoverFn(n.datum, i),
          )
          .map(n => {
            let d = n.datum;
            while (d && d.__d3plus__ && d.data) d = d.data;
            return d.name;
          });
      }
      resolve(out);
    });
  });

/** Dots grouped into stacks by their position along the value axis. */
function stacksOf(dots, along = "x") {
  const stacks = new Map();
  for (const d of dots) {
    const k = d[along].toFixed(3);
    if (!stacks.has(k)) stacks.set(k, []);
    stacks.get(k).push(d);
  }
  return [...stacks.values()];
}

const near = (a, b, msg, tol = 0.01) =>
  assert.ok(Math.abs(a - b) < tol, `${msg}: ${a} ≈ ${b}`);

for (const renderer of ["svg", "canvas"]) {
  it(`DotPlot stacks one dot per row up from the baseline, each stack at its mean (${renderer})`, async function () {
    const out = await render("", probe, [renderer, {x: "value"}]);
    assert.strictEqual(out.dots.length, 90, "one dot per row");
    assert.strictEqual(
      new Set(out.dots.map(d => d.key)).size,
      90,
      "every dot has its own key",
    );
    assert.deepStrictEqual(out.swarm, {axis: "x", cross: "y", lanes: false});
    const r = out.dots[0].r;
    assert.ok(
      out.dots.every(d => d.r === r),
      "one dot size",
    );
    assert.ok(r > 1 && r <= 10, `auto radius ${r}`);
    assert.ok(
      out.dots.every(d => d.fill !== out.missing),
      "ungrouped dots take a palette color",
    );
    const bottom = Math.max(...out.yRange);
    const top = Math.min(...out.yRange);
    const stacks = stacksOf(out.dots);
    assert.ok(stacks.length > 5, `${stacks.length} stacks`);
    const pair = stacks
      .find(st => st.length > 1)
      .map(d => d.y)
      .sort((a, b) => b - a);
    const step = pair[0] - pair[1];
    assert.ok(step >= 2 * r, "dots don't overlap");
    for (const stack of stacks) {
      const ys = stack.map(d => d.y).sort((a, b) => b - a);
      near(bottom - ys[0], step / 2, "the first dot sits half a step up");
      for (let k = 1; k < ys.length; k++)
        near(ys[k - 1] - ys[k], step, "dots one step apart");
      const mean =
        stack.reduce((sum, d) => sum + out.pixels[d.key], 0) / stack.length;
      near(stack[0].x, mean, "the stack sits at the mean of its values");
    }
    const tallest = Math.max(...stacks.map(st => st.length));
    assert.ok(tallest * step <= bottom - top + 0.01, "the tallest stack fits");
    assert.ok(
      (tallest + 1) * step > bottom - top || step >= 19.99,
      "and the dots are as large as fit",
    );
  });

  it(`DotPlot stacks each category on its own row, labeled on the axis (${renderer})`, async function () {
    const out = await render("", probe, [
      renderer,
      {x: "value", y: "region", groupBy: ["region", "name"]},
    ]);
    assert.deepStrictEqual(out.swarm, {axis: "x", cross: "y", lanes: true});
    assert.ok(
      !(Array.isArray(out.laneTicks) && out.laneTicks.length === 0),
      "the category axis keeps its labels",
    );
    const centers = Object.values(out.lanes).sort((a, b) => a - b);
    const band = centers[1] - centers[0];
    for (const dot of out.dots) {
      const center = out.lanes[dot.region];
      assert.ok(
        dot.y + dot.r <= center + band * 0.45 + 0.5 &&
          dot.y - dot.r >= center - band * 0.45 - 0.5,
        `${dot.name} stays in its row's band`,
      );
    }
    for (const lane of Object.keys(out.lanes)) {
      const lowest = Math.max(
        ...out.dots.filter(d => d.region === lane).map(d => d.y),
      );
      near(
        lowest + out.dots[0].r,
        out.lanes[lane] + band * 0.45,
        `${lane} piles up from its row's baseline`,
        1.1,
      );
    }
  });

  it(`DotPlot lists groups in the same order in every stack (${renderer})`, async function () {
    const out = await render("", probe, [
      renderer,
      {x: "value", groupBy: "region"},
    ]);
    const order = ["Africa", "Americas", "Asia"];
    let mixed = 0;
    for (const stack of stacksOf(out.dots)) {
      const ranks = stack
        .sort((a, b) => b.y - a.y)
        .map(d => order.indexOf(d.region));
      if (new Set(ranks).size > 1) mixed++;
      ranks.forEach((rank, k) =>
        assert.ok(k === 0 || rank >= ranks[k - 1], "grouped bottom to top"),
      );
    }
    assert.ok(mixed > 3, `${mixed} stacks hold several groups`);
    const fills = new Set(out.dots.map(d => d.fill));
    assert.strictEqual(fills.size, 3, "one color per group");
  });

  it(`DotPlot centers stacks, and runs vertically (${renderer})`, async function () {
    const centered = await render("", probe, [
      renderer,
      {
        x: "value",
        y: "region",
        groupBy: ["region", "name"],
        stackDirection: "center",
      },
    ]);
    for (const stack of stacksOf(centered.dots)) {
      const lane = centered.lanes[stack[0].region];
      const mid = stack.reduce((sum, d) => sum + d.y, 0) / stack.length;
      if (stack.every(d => d.region === stack[0].region))
        near(mid, lane, "a centered stack straddles its row's center");
    }

    const vertical = await render("", probe, [
      renderer,
      {x: "region", y: "value", groupBy: ["region", "name"]},
    ]);
    assert.deepStrictEqual(vertical.swarm, {
      axis: "y",
      cross: "x",
      lanes: true,
    });
    const r = vertical.dots[0].r;
    for (const stack of stacksOf(vertical.dots, "y")) {
      const lane = vertical.lanes[stack[0].region];
      const xs = stack.map(d => d.x).sort((a, b) => a - b);
      assert.ok(xs[0] < lane, "stacks start left of the row's center");
      for (let k = 1; k < xs.length; k++)
        assert.ok(xs[k] - xs[k - 1] >= 2 * r, "and grow to the right");
    }
  });

  it(`DotPlot draws one dot per \`per\` units, and its tooltip names the row (${renderer})`, async function () {
    const out = await render("", probe, [
      renderer,
      {
        rows: "first12",
        x: "value",
        groupBy: "name",
        value: "count",
        per: 5,
      },
      true,
    ]);
    const expected = [3, 8, 13, 18, 3, 8, 13, 18, 3, 8, 13, 18]
      .map(c => Math.round(c / 5))
      .reduce((a, b) => a + b, 0);
    assert.strictEqual(
      out.dots.length,
      expected,
      "round(count / 5) dots per row",
    );
    assert.strictEqual(new Set(out.dots.map(d => d.key)).size, expected);
    const name = out.hoveredName;
    assert.ok(out.tooltip, "a tooltip shows");
    assert.ok(out.tooltip.includes(name), `names the row: ${out.tooltip}`);
    assert.ok(out.tooltip.includes("count"), "lists the row's value");
    assert.ok(out.tooltip.includes("Each Dot 5"), "and what a dot stands for");
    assert.ok(
      out.hovered.length > 0 && out.hovered.every(n => n === name),
      `only the row's dots stay bright: ${[...new Set(out.hovered)]}`,
    );
  });
}

it("DotPlot fixes the dot size with dotRadius, and the stack width with binWidth", async function () {
  const fixed = await render("", probe, ["svg", {x: "value", dotRadius: 3}]);
  assert.ok(
    fixed.dots.every(d => d.r === 2.5),
    "3px dots, less the gap",
  );
  const binned = await render("", probe, ["svg", {x: "value", binWidth: 2}]);
  const stacks = stacksOf(binned.dots);
  const pxPerUnit =
    Math.abs(
      binned.pixels[binned.dots[0].key] -
        binned.pixels[
          binned.dots.find(d => d.value !== binned.dots[0].value).key
        ],
    ) /
    Math.abs(
      binned.dots[0].value -
        binned.dots.find(d => d.value !== binned.dots[0].value).value,
    );
  for (const stack of stacks) {
    const values = stack.map(d => d.value);
    assert.ok(
      Math.max(...values) - Math.min(...values) < 2,
      "a stack spans less than one bin width",
    );
    assert.ok(stack[0].r * 2 <= 2 * pxPerUnit + 0.01, "dots fit their bins");
  }
});

it("DotPlot keeps its category labels when groupBy names the categories", async function () {
  const out = await render("", probe, [
    "svg",
    {x: "value", y: "region", groupBy: "region"},
  ]);
  assert.strictEqual(out.dots.length, 90, "rows sharing a group stay apart");
  assert.ok(
    !(Array.isArray(out.laneTicks) && out.laneTicks.length === 0),
    "a lane's dots don't stand in for its tick label",
  );
});
