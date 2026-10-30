import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    Nearest-point hover (`hoverDistance`) in a real browser, on both
    renderers, with a real pointer: near a small scatter point its tooltip
    and hover show and a click clicks it; farther than the distance nothing
    does; moving between points follows the closer one; `hoverDistance(0)`
    keeps exact hit-testing; a zoomed plot and a Network's nodes resolve
    too; and a BarChart is unchanged.
*/

const scatter = [
  {id: "alpha", x: 10, y: 20},
  {id: "beta", x: 20, y: 60},
  {id: "gamma", x: 30, y: 40},
  {id: "delta", x: 70, y: 30},
  {id: "epsilon", x: 90, y: 80},
];

const scatterConfig = {
  data: scatter,
  groupBy: "id",
  x: "x",
  y: "y",
  shapeConfig: {Circle: {r: 3}},
};

const network = {
  nodes: [
    {id: "alpha", x: 0, y: 0},
    {id: "beta", x: 100, y: 0},
    {id: "gamma", x: 50, y: 80},
  ],
  links: [
    {source: "alpha", target: "beta"},
    {source: "beta", target: "gamma"},
  ],
  size: () => 1,
  sizeMax: 6,
  sizeMin: 6,
};

/**
    Draws `chart` from `config` and reports each point mark's client
    position by id, read off the painted scene the way hover does.
*/
const draw = ([chart, config, renderer]) =>
  new Promise(resolve => {
    window.__log = [];
    const viz = new window.d3plus[chart]()
      .config(JSON.parse(JSON.stringify(config)))
      .renderer(renderer)
      .width(600)
      .height(400)
      .duration(0)
      .legend(false)
      .select("#viz");
    if (config.size) viz.size(() => 1);
    if (!config.ownClick) viz.on("click.shape", d => window.__log.push(d.id));
    window.__viz = viz;
    window.__points = () => {
      const host =
        document.querySelector("#viz svg") ||
        document.querySelector("#viz canvas");
      const box = host.getBoundingClientRect();
      const out = {};
      window.d3plus
        .focusTargets(viz._paintedScene.root.children)
        .filter(t => t.node.type === "circle")
        .forEach(t => {
          const row = t.node.datum.data || t.node.datum;
          out[row.id] = [
            box.left + t.center[0],
            box.top + t.center[1],
            box.top + t.box.y,
          ];
        });
      return out;
    };
    viz.render(() => resolve(window.__points()));
  });

/** The visible tooltip's text, and the ids the chart hovers. */
const state = () => {
  const tips = Array.from(document.querySelectorAll(".d3plus-tooltip"))
    .filter(el => getComputedStyle(el).opacity !== "0")
    .map(el => el.textContent);
  const viz = window.__viz;
  const rows = viz._filteredData || [];
  const hovered =
    typeof viz._hover === "function"
      ? rows.filter((d, i) => viz._hover(d, i)).map(d => d.id)
      : [];
  return {tips, hovered};
};

async function run(chart, config, renderer, check) {
  const {page, errors, close} = await openPage(
    '<div id="viz" style="width:600px;height:400px;"></div>',
  );
  try {
    const points = await page.evaluate(draw, [chart, config, renderer]);
    await check(page, points);
    assert.deepStrictEqual(errors, [], "no page errors");
  } finally {
    await close();
  }
}

/** Moves the pointer to `[x + dx, y + dy]` and returns the hover state there. */
async function hoverAt(page, [x, y], dx, dy) {
  await page.mouse.move(x + dx, y + dy, {steps: 2});
  await page.waitForTimeout(120);
  return page.evaluate(state);
}

/**
    Where the visible tooltip's arrow points, in client pixels: the tip of
    its rotated square (its bottom corner, or its top one when the tooltip
    flips below), plus the tooltip's 5px offset from what it points at.
*/
const arrowTip = () => {
  const tip = Array.from(document.querySelectorAll(".d3plus-tooltip"))
    .filter(el => getComputedStyle(el).opacity !== "0")
    .map(el => el.querySelector(".d3plus-tooltip-arrow"))[0];
  if (!tip) return null;
  const r = tip.getBoundingClientRect();
  const flipped = tip.style.transform.includes("225");
  return [r.left + r.width / 2, flipped ? r.top - 5 : r.bottom + 5];
};

/** Asserts the tooltip's arrow points within 2px of `[x, y]`. */
function pointsAt(tip, [x, y], what) {
  assert.ok(tip, `a tooltip (${what})`);
  assert.ok(
    Math.abs(tip[0] - x) <= 2 && Math.abs(tip[1] - y) <= 2,
    `the arrow points at ${what} ([${x}, ${y}], got [${tip}])`,
  );
}

/** Asserts the tooltip and hover show `id` alone. */
function showsOnly({tips, hovered}, id) {
  assert.ok(
    tips.some(t => t.includes(id)),
    `the tooltip names ${id} (got ${JSON.stringify(tips)})`,
  );
  assert.deepStrictEqual(hovered, [id], `only ${id} is hovered`);
}

/** Asserts nothing is hovered and no tooltip shows. */
function showsNothing({tips, hovered}) {
  assert.deepStrictEqual(tips, [], "no tooltip");
  assert.deepStrictEqual(hovered, [], "nothing hovered");
}

for (const renderer of ["svg", "canvas"]) {
  it(`Plot ${renderer}: 10px from a point hovers it, 40px away nothing`, async () => {
    await run("Plot", scatterConfig, renderer, async (page, points) => {
      showsOnly(await hoverAt(page, points.epsilon, -10, 0), "epsilon");
      assert.strictEqual(
        await page.evaluate(() => window.__viz._lastScenePick.d.id),
        "epsilon",
      );
      showsNothing(await hoverAt(page, points.epsilon, -40, 0));
      showsOnly(await hoverAt(page, points.epsilon, -10, 0), "epsilon");
      await page.mouse.move(700, 500, {steps: 2});
      await page.waitForTimeout(120);
      showsNothing(await page.evaluate(state));
    });
  });

  it(`Plot ${renderer}: moving between two points follows the closer one`, async () => {
    await run("Plot", scatterConfig, renderer, async (page, points) => {
      const [ax, ay] = points.alpha,
        [gx, gy] = points.gamma;
      const at = f => [ax + (gx - ax) * f, ay + (gy - ay) * f];
      // Partway from alpha toward gamma, 12px from each in turn.
      const toward = Math.hypot(gx - ax, gy - ay);
      const step = 12 / toward;
      showsOnly(await hoverAt(page, at(step), 0, 0), "alpha");
      showsOnly(await hoverAt(page, at(1 - step), 0, 0), "gamma");
      showsOnly(await hoverAt(page, at(step), 0, 0), "alpha");
    });
  });

  it(`Plot ${renderer}: a click near a point clicks it`, async () => {
    await run("Plot", scatterConfig, renderer, async (page, points) => {
      const [x, y] = points.delta;
      await page.mouse.move(x, y + 12, {steps: 2});
      await page.mouse.click(x, y + 12);
      assert.deepStrictEqual(await page.evaluate(() => window.__log), [
        "delta",
      ]);
      await page.mouse.click(x, y + 45);
      assert.deepStrictEqual(
        await page.evaluate(() => window.__log),
        ["delta"],
        "a click out of reach clicks nothing",
      );
    });
  });

  it(`Plot ${renderer}: hoverDistance(0) keeps exact hit-testing`, async () => {
    await run(
      "Plot",
      {...scatterConfig, hoverDistance: 0},
      renderer,
      async (page, points) => {
        showsNothing(await hoverAt(page, points.epsilon, -10, 0));
        showsOnly(await hoverAt(page, points.epsilon, 0, 0), "epsilon");
      },
    );
  });

  it(`Plot ${renderer}: a zoomed plot resolves points where they paint`, async () => {
    await run(
      "Plot",
      {...scatterConfig, zoom: true},
      renderer,
      async (page, before) => {
        const moved = await page.evaluate(
          () =>
            new Promise(resolve => {
              const viz = window.__viz;
              const surface = viz._zoomEventTarget.node();
              const box = surface.getBoundingClientRect();
              surface.dispatchEvent(
                new WheelEvent("wheel", {
                  bubbles: true,
                  cancelable: true,
                  view: window,
                  ctrlKey: true,
                  deltaY: -300,
                  clientX: box.x + box.width / 2,
                  clientY: box.y + box.height / 2,
                }),
              );
              setTimeout(() => resolve(window.__points()), 400);
            }),
        );
        assert.ok(moved.gamma, "gamma is still in view");
        assert.ok(
          Math.hypot(
            moved.gamma[0] - before.gamma[0],
            moved.gamma[1] - before.gamma[1],
          ) > 20,
          "the zoom moved gamma",
        );
        showsOnly(await hoverAt(page, moved.gamma, 0, 11), "gamma");
        showsNothing(await hoverAt(page, before.gamma, 0, 11));
      },
    );
  });

  it(`Network ${renderer}: hovering near a node hovers it`, async () => {
    await run("Network", network, renderer, async (page, points) => {
      const [x, y] = points.gamma;
      await page.mouse.move(x - 50, y - 60, {steps: 2});
      await page.mouse.move(x, y - 15, {steps: 2});
      await page.waitForTimeout(120);
      const {tips} = await page.evaluate(state);
      assert.ok(
        tips.some(t => t.includes("gamma")),
        `the tooltip names gamma (got ${JSON.stringify(tips)})`,
      );
      await page.mouse.click(x, y - 15);
      assert.deepStrictEqual(await page.evaluate(() => window.__log), [
        "gamma",
      ]);
    });
  });

  it(`Network ${renderer}: a click near a node focuses it`, async () => {
    await run(
      "Network",
      {...network, ownClick: true},
      renderer,
      async (page, points) => {
        const [x, y] = points.gamma;
        const focus = () => page.evaluate(() => window.__viz._focus ?? null);
        await page.mouse.move(x, y - 15, {steps: 2});
        await page.mouse.click(x, y - 15);
        await page.waitForTimeout(700);
        assert.strictEqual(await focus(), "gamma");
        // The Canvas renderer's surface takes every click, so only SVG
        // reaches the Network's background (which clears the focus).
        if (renderer !== "svg") return;
        const after = await page.evaluate(() => window.__points());
        const [ax, ay] = after.alpha;
        // Far below the alpha–beta link, away from every node.
        await page.mouse.move(ax + 60, ay + 120, {steps: 2});
        await page.mouse.click(ax + 60, ay + 120);
        await page.waitForTimeout(700);
        assert.strictEqual(await focus(), null);
      },
    );
  });

  it(`Plot ${renderer}: small multiples resolve within the hovered panel`, async () => {
    const data = ["A", "B"].flatMap(panel =>
      scatter.map(d => ({...d, panel, id: `${d.id}-${panel}`})),
    );
    await run(
      "Plot",
      {...scatterConfig, data, facet: "panel"},
      renderer,
      async (page, points) => {
        showsOnly(await hoverAt(page, points["gamma-B"], 8, 8), "gamma-B");
        showsOnly(await hoverAt(page, points["gamma-A"], 8, 8), "gamma-A");
        showsNothing(await hoverAt(page, points["gamma-A"], 40, 40));
      },
    );
  });

  it(`Beeswarm ${renderer}: hovering beside the outermost circle hovers it`, async () => {
    const data = Array.from({length: 60}, (_, i) => ({
      id: `r${i}`,
      value: (i * 37) % 50,
      group: i % 2 ? "A" : "B",
    }));
    await run(
      "Beeswarm",
      {data, groupBy: "id", x: "value", y: "group"},
      renderer,
      async (page, points) => {
        const [id, at] = Object.entries(points).sort(
          (a, b) => a[1][0] - b[1][0],
        )[0];
        showsOnly(await hoverAt(page, at, -8, 0), id);
      },
    );
  });

  it(`Geomap ${renderer}: hovering near a coordinate point hovers it`, async () => {
    const config = {
      data: [
        {id: "alpha", point: [0, 0]},
        {id: "beta", point: [40, 20]},
        {id: "gamma", point: [-40, 30]},
      ],
      groupBy: "id",
      tiles: false,
      ocean: "transparent",
    };
    await run("Geomap", config, renderer, async (page, points) => {
      // Geomap keeps hover dimming off (`hoverOpacity: 1`), so read the
      // tooltip and the mark the pointer resolved to.
      const picked = () =>
        page.evaluate(() => window.__viz._lastScenePick?.d.id ?? null);
      const near = await hoverAt(page, points.beta, 0, 12);
      assert.ok(
        near.tips.some(t => t.includes("beta")),
        `the tooltip names beta (got ${JSON.stringify(near.tips)})`,
      );
      assert.strictEqual(await picked(), "beta");
      const far = await hoverAt(page, points.beta, 0, 60);
      assert.ok(!far.tips.some(t => t.includes("beta")), "no beta tooltip");
      assert.notStrictEqual(await picked(), "beta");
    });
  });

  it(`Plot ${renderer}: a point's tooltip points at its top edge, not the cursor`, async () => {
    await run("Plot", scatterConfig, renderer, async (page, points) => {
      const [gx, , gTop] = points.gamma;
      const tips = [];
      for (const [dx, dy] of [
        [10, 0],
        [-6, 9],
        [0, -12],
        [0, 0],
      ]) {
        showsOnly(await hoverAt(page, points.gamma, dx, dy), "gamma");
        const tip = await page.evaluate(arrowTip);
        pointsAt(tip, [gx, gTop], `gamma's top (${dx}, ${dy})`);
        tips.push(tip);
      }
      const rect = () =>
        page.evaluate(() => {
          const el = Array.from(
            document.querySelectorAll(".d3plus-tooltip"),
          ).find(t => getComputedStyle(t).opacity !== "0");
          const r = el.getBoundingClientRect();
          return [r.left, r.top];
        });
      const still = await rect();
      await hoverAt(page, points.gamma, 8, 8);
      assert.deepStrictEqual(await rect(), still, "the tooltip holds still");
      const [dx, , dTop] = points.delta;
      showsOnly(await hoverAt(page, points.delta, -9, 4), "delta");
      pointsAt(await page.evaluate(arrowTip), [dx, dTop], "delta's top");
      assert.notDeepStrictEqual(await rect(), still, "switching moves it");
    });
  });

  it(`Plot ${renderer}: hoverDistance(0) tooltips follow the cursor`, async () => {
    await run(
      "Plot",
      {...scatterConfig, hoverDistance: 0, shapeConfig: {Circle: {r: 12}}},
      renderer,
      async (page, points) => {
        for (const dx of [-6, 6]) {
          const [x] = points.gamma;
          showsOnly(await hoverAt(page, points.gamma, dx, 0), "gamma");
          const tip = await page.evaluate(arrowTip);
          assert.ok(
            Math.abs(tip[0] - (x + dx)) <= 2,
            `the arrow follows the cursor (${x + dx}, got ${tip[0]})`,
          );
        }
      },
    );
  });

  it(`Network ${renderer}: a node's tooltip points at its top edge`, async () => {
    await run("Network", network, renderer, async (page, points) => {
      const [x, , top] = points.gamma;
      await hoverAt(page, points.gamma, 12, -10);
      pointsAt(await page.evaluate(arrowTip), [x, top], "gamma's top");
    });
  });

  it(`Treemap ${renderer}: a tile's tooltip follows the cursor`, async () => {
    const config = {
      data: [
        {id: "a", value: 60},
        {id: "b", value: 40},
      ],
      groupBy: "id",
      sum: "value",
    };
    await run("Treemap", config, renderer, async page => {
      const at = await page.evaluate(() => {
        const host =
          document.querySelector("#viz svg") ||
          document.querySelector("#viz canvas");
        const box = host.getBoundingClientRect();
        const tile = window.d3plus
          .focusTargets(window.__viz._paintedScene.root.children)
          .find(t => t.node.type === "rect");
        return [box.left + tile.center[0], box.top + tile.center[1]];
      });
      const tips = [];
      for (const [dx, dy] of [
        [-20, 0],
        [20, 30],
      ]) {
        await hoverAt(page, at, dx, dy);
        tips.push(await page.evaluate(arrowTip));
        pointsAt(tips[tips.length - 1], [at[0] + dx, at[1] + dy], "the cursor");
      }
    });
  });

  it(`BarChart ${renderer}: bars keep exact hit-testing`, async () => {
    const config = {
      data: [
        {id: "a", x: "Q1", y: 10},
        {id: "b", x: "Q1", y: 4},
      ],
      groupBy: "id",
      x: "x",
      y: "y",
      stacked: true,
      tooltipShared: false,
    };
    await run("BarChart", config, renderer, async page => {
      const top = await page.evaluate(() => {
        const viz = window.__viz;
        const host =
          document.querySelector("#viz svg") ||
          document.querySelector("#viz canvas");
        const box = host.getBoundingClientRect();
        const bar = window.d3plus
          .focusTargets(viz._paintedScene.root.children)
          .filter(t => t.node.shapeType === "Bar")
          .sort((a, b) => a.box.y - b.box.y)[0];
        const points = window.d3plus.pointMarkTargets(
          viz._paintedScene.root.children,
          node => viz._pointMark(node),
        );
        return {
          at: [box.left + bar.center[0], box.top + bar.box.y],
          points: points.length,
          id: bar.node.datum.data.id,
        };
      });
      assert.strictEqual(top.points, 0, "bars aren't point marks");
      showsNothing(await hoverAt(page, top.at, 0, -10));
      showsOnly(await hoverAt(page, top.at, 0, 10), top.id);
      assert.strictEqual(
        await page.evaluate(() => {
          const viz = window.__viz;
          return viz._lastScenePick
            ? window.d3plus.pointTooltipAnchor(viz, viz._lastScenePick.node)
            : "no pick";
        }),
        undefined,
        "a bar's tooltip isn't anchored to it",
      );
    });
  });
}
