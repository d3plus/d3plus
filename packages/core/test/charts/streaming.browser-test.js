import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {withPage} from "~test/browser/page.js";

/**
    Streaming on both renderers: `append` adds rows and redraws once a frame,
    and each line and area slides along by key (kept points move, new ones
    grow out of the end, dropped ones fold into the start) instead of
    morphing; an append that lands mid-tween picks up from the frame drawn;
    and `.data(rows).render()` keeps every mark that stays.
*/

const html = "<div id='viz' style='width:600px;height:300px'></div>";

/** Draws a chart of two series, `n` seconds each, and settles its first draw. */
async function setUp(page, renderer, chart = "LinePlot", n = 8) {
  await page.evaluate(
    ([renderer, chart, n]) => {
      const t0 = Date.UTC(2026, 0, 1);
      window.row = (i, id) => ({
        id,
        x: new Date(t0 + i * 1000),
        y: 20 + Math.sin(i / 2 + id.length) * 10,
      });
      const rows = [];
      for (let i = 0; i < n; i++)
        rows.push(window.row(i, "a"), window.row(i, "bb"));
      window.next = n;
      window.viz = new window.d3plus[chart]()
        .data(rows)
        .groupBy("id")
        .xConfig({scale: "time"})
        .legend(false)
        .renderer(renderer)
        .width(600)
        .height(300)
        .duration(400)
        .select("#viz");
      window.viz.render();
    },
    [renderer, chart, n],
  );
  await page.clock.runFor(1000);
  // The canvas paints each frame's interpolated scene; keep the latest.
  await page.evaluate(() => {
    const r = window.viz._sceneRenderer;
    window.frame = null;
    if (r.kind !== "canvas") return;
    const paint = r._paint.bind(r);
    r._paint = frame => {
      window.frame = frame;
      return paint(frame);
    };
  });
}

/** The keyed points series `key` draws now (mid-tween, or at rest). */
const drawnSeries = (page, key) =>
  page.evaluate(key => {
    const flat = nodes =>
      nodes.flatMap(n => [n, ...(n.children ? flat(n.children) : [])]);
    const r = window.viz._sceneRenderer;
    const scene = r.kind === "canvas" ? (window.frame ?? r._scene) : null;
    if (scene) {
      const node = flat([scene.root]).find(
        n => n.type === "path" && n.key === key && n.series,
      );
      return node ? node.series : null;
    }
    const el = document.querySelector(
      `svg.d3plus-render-svg path[data-key="${key}"]`,
    );
    return el?.__d3plusSeries__ ?? null;
  }, key);

/** Appends the next second of both series, keeping `keep` rows. */
const appendNext = (page, keep) =>
  page.evaluate(keep => {
    const i = window.next++;
    window.viz.append([window.row(i, "a"), window.row(i, "bb")], {
      window: keep,
    });
  }, keep);

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer}: append slides each line along by key`, async () => {
    await withPage(
      html,
      async page => {
        await setUp(page, renderer);
        const before = await drawnSeries(page, "a");
        assert.strictEqual(before.keys.length, 8);
        const svgLine = await page.evaluate(() => {
          window.lineEl = document.querySelector(
            'svg.d3plus-render-svg path[data-key="a"]',
          );
          return !!window.lineEl;
        });

        await appendNext(page, 16);
        await page.clock.runFor(150);
        const mid = await drawnSeries(page, "a");
        assert.strictEqual(
          mid.keys.length,
          9,
          "the old first and the new last",
        );
        assert.strictEqual(mid.keys[0], before.keys[0]);
        assert.deepStrictEqual(mid.keys.slice(1, 8), before.keys.slice(1));
        assert.ok(
          mid.top[1][0] < before.top[1][0],
          "a kept point slides left with the axis",
        );

        await page.clock.runFor(600);
        const after = await drawnSeries(page, "a");
        assert.deepStrictEqual(after.keys, [
          ...before.keys.slice(1),
          before.keys[7] + 1000,
        ]);
        if (svgLine)
          assert.ok(
            await page.evaluate(
              () =>
                window.lineEl ===
                document.querySelector(
                  'svg.d3plus-render-svg path[data-key="a"]',
                ),
            ),
            "the same element draws the line",
          );
      },
      {clock: true},
    );
  });

  it(`${renderer}: an append mid-tween picks up from the frame drawn`, async () => {
    await withPage(
      html,
      async page => {
        await setUp(page, renderer);
        await appendNext(page, 16);
        await page.clock.runFor(150);
        const mid = await drawnSeries(page, "a");
        await appendNext(page, 16);
        await page.clock.runFor(50);
        const resumed = await drawnSeries(page, "a");
        assert.strictEqual(
          resumed.keys.length,
          10,
          "still folding the first, still growing the ninth, and growing the tenth",
        );
        const near = (a, b) => Math.abs(a - b) < 20;
        assert.ok(
          near(resumed.top[2][0], mid.top[2][0]),
          `a kept point continues from where it was (${resumed.top[2][0]} vs ${mid.top[2][0]})`,
        );
        await page.clock.runFor(800);
        const end = await drawnSeries(page, "a");
        assert.strictEqual(end.keys.length, 8);
      },
      {clock: true},
    );
  });

  it(`${renderer}: an area slides its top and base along by key`, async () => {
    await withPage(
      html,
      async page => {
        await setUp(page, renderer, "AreaPlot");
        await appendNext(page, 16);
        await page.clock.runFor(150);
        const mid = await drawnSeries(page, "a");
        assert.strictEqual(mid.keys.length, 9);
        assert.strictEqual(mid.base.length, 9);
      },
      {clock: true},
    );
  });

  it(`${renderer}: appends before the next frame share one redraw`, async () => {
    await withPage(
      html,
      async page => {
        await setUp(page, renderer);
        const draws = await page.evaluate(() => {
          let draws = 0;
          const render = window.viz.render.bind(window.viz);
          window.viz.render = (...args) => {
            draws++;
            return render(...args);
          };
          window.drawCount = () => draws;
          for (let i = 0; i < 3; i++) {
            const k = window.next++;
            window.viz.append([window.row(k, "a"), window.row(k, "bb")], {
              window: "5 seconds",
            });
          }
          return {draws, rows: window.viz._data.length};
        });
        assert.strictEqual(draws.draws, 0);
        assert.strictEqual(draws.rows, 12, "six seconds of two series");
        await page.clock.runFor(50);
        assert.strictEqual(
          await page.evaluate(() => window.drawCount()),
          1,
          "one redraw",
        );
        await page.clock.runFor(800);
        assert.strictEqual((await drawnSeries(page, "a")).keys.length, 6);
      },
      {clock: true},
    );
  });
}

it("svg: redrawing with new rows keeps every mark that stays", async () => {
  await withPage(
    html,
    async page => {
      await setUp(page, "svg", "LinePlot");
      await page.evaluate(() => {
        const keyed = () =>
          new Map(
            [
              ...document.querySelectorAll("svg.d3plus-render-svg [data-key]"),
            ].map(e => [e.getAttribute("data-key"), e]),
          );
        window.before = keyed();
        const rows = window.viz._data.slice(2);
        rows.push(window.row(8, "a"), window.row(8, "bb"));
        window.viz.data(rows).render();
        window.keyed = keyed;
      });
      await page.clock.runFor(1000);
      const {replaced, kept} = await page.evaluate(() => {
        const after = window.keyed();
        let kept = 0;
        const replaced = [];
        for (const [k, e] of after)
          if (window.before.get(k) === e) kept++;
          else if (window.before.has(k)) replaced.push(k);
        return {replaced, kept};
      });
      assert.deepStrictEqual(replaced, []);
      assert.ok(kept > 10, `${kept} marks kept their elements`);
    },
    {clock: true},
  );
});
