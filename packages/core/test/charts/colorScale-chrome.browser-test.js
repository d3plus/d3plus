import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {
  chart,
  hover,
  label,
  nodePoint,
  tickLabel,
  title,
  tooltip,
} from "./axis-tooltip-page.js";

/**
    #441 / #167: a color scale's bar, a bucketAxis bar's segments, and its end
    labels are chrome on every chart (no tooltip, no pointer cursor, no shape
    events, no dimming), while its axis labels keep their axis tooltips at
    every position and its swatches and hover mark keep working.
*/

const DATA = `[
  {id: "a", value: 10, score: 0},
  {id: "b", value: 20, score: 50},
  {id: "c", value: 30, score: 100},
  {id: "d", value: 15, score: 20},
  {id: "e", value: 25, score: 75},
]`;

// What the recorded handlers keep of a datum `d`.
const record = `d && typeof d === "object" ? {id: d.id, bucket: !!d._isColorScaleBucket} : d`;

/**
    A Treemap source (`lib => viz`) colored by score, with `extra` config,
    recording every `mouseenter.shape` and `click.shape` it fires.
*/
const treemap = (extra = "") => `lib => new lib.Treemap().config({
  data: ${DATA},
  groupBy: "id", sum: "value", colorScale: "score", legend: false,
  ${extra}
})
  .on("mouseenter.shape", d => (window.__events ||= []).push(["mouseenter.shape", ${record}]))
  .on("click.shape", d => (window.__events ||= []).push(["click.shape", ${record}]))`;

/**
    The shape events the chart has fired, as `[name, record]`, leaving out a
    tile's (the pointer crosses tiles on its way on and off the scale).
*/
const events = page =>
  page.evaluate(() =>
    (window.__events ?? []).filter(
      ([, d]) => !(d && !d.bucket && ["a", "b", "c", "d", "e"].includes(d.id)),
    ),
  );

/** The painted opacity of each Treemap tile, by id. */
const tiles = page =>
  page.evaluate(() => {
    const out = {};
    const walk = node => {
      const m = /^treemap-([a-e])$/.exec(String(node.key));
      if (node.type === "rect" && m) out[m[1]] = node.paint?.opacity ?? 1;
      (node.children || []).forEach(walk);
    };
    walk(window.__viz._paintedScene.root);
    return out;
  });

const UNDIMMED = {a: 1, b: 1, c: 1, d: 1, e: 1};

/** Whether the chart asks for the pointer cursor. */
const pointer = page =>
  page.evaluate(() => window.__viz._select.node().style.cursor === "pointer");

/** Moves the pointer off the chart. */
async function leave(page) {
  await page.mouse.move(790, 590, {steps: 3});
  await page.waitForTimeout(120);
}

/** Runs `run(page)` on a 700×450 chart built from `src`. */
async function withChart(src, renderer, run) {
  const {page, errors, close} = await chart(src, renderer, [700, 450]);
  try {
    await run(page);
    assert.deepStrictEqual(errors, [], "no page errors");
  } finally {
    await close();
  }
}

/** The matcher for a color scale bar's rect keyed `key` (the bar is 0, a bucketAxis bar's segments 0…n). */
const segment = key =>
  `node => node.type === "rect" && node.key === ${JSON.stringify(key)}`;

/**
    Asserts each node matching one of `matches` is chrome: hovering it shows
    no tooltip, asks for no pointer cursor, dims no tile and fires no shape
    event; clicking it fires none; and nothing is left dimmed once the pointer
    leaves.
*/
async function assertChrome(page, matches) {
  for (const match of matches) {
    const at = await nodePoint(page, match);
    assert.ok(at, `${match} is drawn`);
    await hover(page, at);
    assert.strictEqual(await tooltip(page), null, `${match}: tooltip`);
    assert.strictEqual(await pointer(page), false, `${match}: cursor`);
    assert.deepStrictEqual(await tiles(page), UNDIMMED, `${match}: tiles`);
    await page.mouse.click(at[0], at[1]);
    await page.waitForTimeout(120);
    assert.strictEqual(await tooltip(page), null, `${match}: clicked`);
    await leave(page);
    assert.deepStrictEqual(await tiles(page), UNDIMMED, `${match}: left`);
  }
  assert.deepStrictEqual(await events(page), [], "no shape events");
}

/** The text of the first tick label on the color scale that carries an axis tooltip. */
const firstTick = page =>
  page.evaluate(() => {
    let found = null;
    const walk = (node, inScale) => {
      const here = inScale || node.key === "viz-colorScale";
      if (!found && here && node.axisTooltip?.part === "tick")
        found = node.lines.map(l => l.text).join(" ");
      (node.children || []).forEach(c => walk(c, here));
    };
    walk(window.__viz._paintedScene.root, false);
    return found;
  });

const FORMS = {
  gradient: `scale: "linear"`,
  bucketAxis: `scale: "jenks", bucketAxis: true`,
};

// A tick label too long for a 60px axis at any position, so it is drawn cut.
const LONG = v =>
  `"A very long label for the value " + ${v} + " that goes on and on".repeat(8)`;

for (const renderer of ["svg", "canvas"]) {
  it(`color scale chrome (${renderer}): a gradient's bar`, () =>
    withChart(
      treemap(
        `colorScalePosition: "bottom", colorScaleConfig: {scale: "linear"}`,
      ),
      renderer,
      page => assertChrome(page, [segment(0)]),
    ));

  it(`color scale chrome (${renderer}): a bucketAxis bar's segments`, () =>
    withChart(
      treemap(
        `colorScalePosition: "bottom", colorScaleConfig: {${FORMS.bucketAxis}}`,
      ),
      renderer,
      page => assertChrome(page, [0, 1, 2, 3, 4].map(segment)),
    ));

  it(`color scale chrome (${renderer}): a gradient's end labels`, () =>
    withChart(
      treemap(
        `colorScalePosition: "bottom", colorScaleConfig: {scale: "linear", labelMin: "Low", labelMax: "High"}`,
      ),
      renderer,
      page => assertChrome(page, [label("Low"), label("High")]),
    ));

  for (const position of ["top", "bottom", "left", "right"])
    for (const [form, config] of Object.entries(FORMS)) {
      it(`color scale chrome (${renderer}): a ${form} scale's axis tooltips at ${position}`, () =>
        withChart(
          treemap(
            `colorScalePosition: "${position}", colorScaleConfig: {${config}, axisConfig: {title: "Score", titleTooltip: "The score", tickTooltip: v => "Score " + v}}`,
          ),
          renderer,
          async page => {
            const tick = await firstTick(page);
            assert.ok(tick, "a tick label carries the tooltip");
            const at = await nodePoint(page, tickLabel(tick));
            await hover(page, at);
            const tip = await tooltip(page);
            assert.ok(tip, `the ${tick} tick shows a tooltip`);
            assert.match(tip.body, /^Score \d+$/);
            assert.strictEqual(await pointer(page), false, "tick cursor");
            await leave(page);
            assert.strictEqual(await tooltip(page), null, "tick left");

            await hover(page, await nodePoint(page, title));
            assert.strictEqual((await tooltip(page))?.body, "The score");
            await leave(page);
            assert.strictEqual(await tooltip(page), null, "title left");
            assert.deepStrictEqual(await events(page), [], "no shape events");
          },
        ));

      // A horizontal bucketAxis thins its labels to the ones that fit whole,
      // so it never draws one cut.
      if (form === "bucketAxis" && ["top", "bottom"].includes(position))
        continue;
      it(`color scale chrome (${renderer}): a ${form} scale's cut labels at ${position}`, () =>
        withChart(
          treemap(
            `colorScalePosition: "${position}", colorScaleConfig: {${config}, axisConfig: {tickFormat: v => ${LONG("v")}, maxSize: 60}}`,
          ),
          renderer,
          async page => {
            const cut = await page.evaluate(() => {
              let found = null;
              const walk = node => {
                if (!found && node.axisTooltip?.truncated)
                  found = node.lines.map(l => l.text).join(" ");
                (node.children || []).forEach(walk);
              };
              walk(window.__viz._paintedScene.root);
              return found;
            });
            assert.ok(cut, "a tick label is drawn cut short");
            await hover(page, await nodePoint(page, tickLabel(cut)));
            const tip = await tooltip(page);
            assert.ok(tip, "the cut label shows a tooltip");
            assert.match(
              tip.title,
              /^A very long label for the value \d+ that goes on and on/,
            );
            await leave(page);
            assert.strictEqual(await tooltip(page), null);
          },
        ));
    }

  it(`color scale chrome (${renderer}): the zoom buttons above a top scale still take the pointer`, () =>
    withChart(
      treemap(
        `colorScalePosition: "top", colorScaleConfig: {scale: "linear", axisConfig: {title: "Score", titleTooltip: "The score"}}`,
      ),
      renderer,
      async page => {
        const hit = await page.evaluate(() =>
          [...document.querySelectorAll("#viz button.zoom-control")].map(b => {
            const r = b.getBoundingClientRect();
            const el = document.elementFromPoint(
              r.left + r.width / 2,
              r.top + r.height / 2,
            );
            return el?.closest("button") === b;
          }),
        );
        assert.deepStrictEqual(hit, [true, true, true, true]);
      },
    ));

  it(`color scale kept (${renderer}): a swatch shows its bucket and highlights it`, () =>
    withChart(treemap(`colorScalePosition: "bottom"`), renderer, async page => {
      const at = await nodePoint(page, segment("0 - 19"));
      assert.ok(at, "the first swatch is drawn");
      await hover(page, at);
      const tip = await tooltip(page);
      assert.strictEqual(tip?.title, "0 - 19");
      assert.strictEqual(await pointer(page), true);
      assert.strictEqual(
        await page.evaluate(() => window.__viz._hoverBucket),
        true,
      );
      assert.deepStrictEqual(
        await tiles(page),
        {a: 1, b: 0.5, c: 0.5, d: 0.5, e: 0.5},
        "the tiles outside the bucket dim",
      );
      await page.mouse.click(at[0], at[1]);
      await page.waitForTimeout(120);
      const clicked = (await events(page)).filter(
        ([name]) => name === "click.shape",
      );
      assert.deepStrictEqual(clicked, [
        ["click.shape", {id: "0 - 19", bucket: true}],
      ]);
      await leave(page);
      assert.strictEqual(await tooltip(page), null);
      assert.deepStrictEqual(await tiles(page), UNDIMMED);
    }));

  for (const [form, config] of Object.entries(FORMS))
    it(`color scale kept (${renderer}): a ${form} scale marks the hovered tile's value`, () =>
      withChart(
        treemap(`colorScalePosition: "bottom", colorScaleConfig: {${config}}`),
        renderer,
        async page => {
          await hover(page, await nodePoint(page, segment("treemap-b")));
          assert.ok(await tooltip(page), "the tile shows its tooltip");
          assert.strictEqual(
            await page.evaluate(() => window.__viz._colorScaleClass.hover()),
            50,
          );
          assert.deepStrictEqual(
            await tiles(page),
            {a: 0.5, b: 1, c: 0.5, d: 0.5, e: 0.5},
            "the other tiles dim",
          );
          await leave(page);
          assert.ok(
            !(await page.evaluate(() => window.__viz._colorScaleClass.hover())),
            "the mark clears",
          );
          assert.deepStrictEqual(await tiles(page), UNDIMMED);
        },
      ));
}

/** The tiles' opacities, whether the hover is a bucket's, and the hover mark. */
const bucketState = page =>
  tiles(page).then(async opacity => ({
    opacity,
    ...(await page.evaluate(() => ({
      bucket: window.__viz._hoverBucket,
      mark: window.__viz._colorScaleClass.hover() || false,
    }))),
  }));

// The "20 - 49" bucket lit: only tile d (score 20) stays bright.
const LIT_D = {
  opacity: {a: 0.5, b: 0.5, c: 0.5, d: 1, e: 0.5},
  bucket: true,
  mark: false,
};

/** The first text node on the color scale whose stamp is cut short, as drawn. */
const cutLabel = (page, part) =>
  page.evaluate(part => {
    let found = null;
    const walk = node => {
      if (
        !found &&
        node.axisTooltip?.part === part &&
        node.axisTooltip.truncated
      )
        found = node.lines.map(l => l.text).join(" ");
      (node.children || []).forEach(walk);
    };
    walk(window.__viz._paintedScene.root);
    return found;
  }, part);

// A title too long for one line of the scale, so it is drawn cut.
const LONG_TITLE =
  "The average score of each region over the whole of the reporting period "
    .repeat(4)
    .trim();

for (const renderer of ["svg", "canvas"])
  for (const position of ["bottom", "right"]) {
    it(`swatch tooltips (${renderer}, ${position}): a label shows tickTooltip with its bucket's value and index, and lights its bucket`, () =>
      withChart(
        treemap(
          `colorScalePosition: "${position}", colorScaleConfig: {axisConfig: {title: "Score", titleTooltip: "The score", tickTooltip: (v, i) => "Bucket " + i + " from " + v}}`,
        ),
        renderer,
        async page => {
          await hover(page, await nodePoint(page, label("20 - 49")));
          assert.strictEqual((await tooltip(page))?.body, "Bucket 1 from 20");
          assert.strictEqual(await pointer(page), false, "label cursor");
          assert.deepStrictEqual(await bucketState(page), LIT_D, "lit");
          await leave(page);
          assert.strictEqual(await tooltip(page), null, "label left");
          assert.deepStrictEqual(await tiles(page), UNDIMMED, "label left");

          await hover(page, await nodePoint(page, label("Score")));
          assert.strictEqual((await tooltip(page))?.body, "The score");
          await leave(page);
          assert.strictEqual(await tooltip(page), null, "title left");
          assert.deepStrictEqual(await events(page), [], "no shape events");
        },
      ));

    it(`swatch tooltips (${renderer}, ${position}): from a label onto its swatch, the bucket stays lit`, () =>
      withChart(
        treemap(
          `colorScalePosition: "${position}", colorScaleConfig: {axisConfig: {tickTooltip: v => "Score " + v}}`,
        ),
        renderer,
        async page => {
          await hover(page, await nodePoint(page, label("20 - 49")));
          assert.deepStrictEqual(
            await bucketState(page),
            LIT_D,
            "on the label",
          );
          await hover(page, await nodePoint(page, segment("20 - 49")));
          assert.strictEqual((await tooltip(page))?.title, "20 - 49");
          assert.deepStrictEqual(
            await bucketState(page),
            LIT_D,
            "on the swatch",
          );
          await leave(page);
          assert.strictEqual(await tooltip(page), null);
          assert.deepStrictEqual(await tiles(page), UNDIMMED);
        },
      ));

    it(`swatch tooltips (${renderer}, ${position}): the swatch keeps its bucket's tooltip and highlight`, () =>
      withChart(
        treemap(
          `colorScalePosition: "${position}", colorScaleConfig: {axisConfig: {tickTooltip: v => "Score " + v}}`,
        ),
        renderer,
        async page => {
          await hover(page, await nodePoint(page, segment("0 - 19")));
          assert.strictEqual((await tooltip(page))?.title, "0 - 19");
          assert.strictEqual(await pointer(page), true);
          assert.deepStrictEqual(
            await tiles(page),
            {a: 1, b: 0.5, c: 0.5, d: 0.5, e: 0.5},
            "the tiles outside the bucket dim",
          );
          await leave(page);
          assert.deepStrictEqual(await tiles(page), UNDIMMED);
        },
      ));

    it(`swatch tooltips (${renderer}, ${position}): a cut title shows its whole text`, () =>
      withChart(
        treemap(
          `colorScalePosition: "${position}", colorScaleConfig: {axisConfig: {title: ${JSON.stringify(LONG_TITLE)}, titleConfig: {maxLines: 1}}}`,
        ),
        renderer,
        async page => {
          const cut = await cutLabel(page, "title");
          assert.ok(cut, "the title is drawn cut short");
          await hover(page, await nodePoint(page, label(cut)));
          assert.strictEqual((await tooltip(page))?.title, LONG_TITLE);
          await leave(page);
          assert.strictEqual(await tooltip(page), null);
          assert.deepStrictEqual(await events(page), [], "no shape events");
        },
      ));
  }

for (const renderer of ["svg", "canvas"]) {
  it(`swatch tooltips (${renderer}): a function returning false, or false, shows nothing`, () =>
    withChart(
      treemap(
        `colorScalePosition: "bottom", colorScaleConfig: {axisConfig: {title: "Score", titleTooltip: false, tickTooltip: (v, i) => i === 1 ? false : "Score " + v}}`,
      ),
      renderer,
      async page => {
        await hover(page, await nodePoint(page, label("50 - 74")));
        assert.strictEqual((await tooltip(page))?.body, "Score 50");
        assert.deepStrictEqual(
          await tiles(page),
          {a: 0.5, b: 1, c: 0.5, d: 0.5, e: 0.5},
          "a label with a tooltip lights its bucket",
        );
        for (const name of ["20 - 49", "Score"]) {
          await hover(page, await nodePoint(page, label(name)));
          assert.strictEqual(await tooltip(page), null, name);
          assert.strictEqual(await pointer(page), false, `${name}, cursor`);
          assert.deepStrictEqual(
            await tiles(page),
            UNDIMMED,
            `${name} lights nothing`,
          );
        }
        await leave(page);
        assert.deepStrictEqual(await events(page), [], "no shape events");
      },
    ));

  it(`swatch tooltips (${renderer}): an untouched title is chrome`, () =>
    withChart(
      treemap(
        `colorScalePosition: "bottom", colorScaleConfig: {axisConfig: {title: "Score"}}`,
      ),
      renderer,
      async page => {
        const at = await nodePoint(page, label("Score"));
        await hover(page, at);
        assert.strictEqual(await tooltip(page), null);
        assert.strictEqual(await pointer(page), false);
        assert.deepStrictEqual(await tiles(page), UNDIMMED);
        await page.mouse.click(at[0], at[1]);
        await page.waitForTimeout(120);
        await leave(page);
        assert.deepStrictEqual(await events(page), [], "no shape events");
      },
    ));
}
