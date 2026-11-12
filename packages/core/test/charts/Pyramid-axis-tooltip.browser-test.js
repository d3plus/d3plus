import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {
  bar,
  chart,
  hover,
  label,
  nodePoint,
  tooltip,
} from "./axis-tooltip-page.js";

/**
    Axis tooltips on a Pyramid's category labels, with the real pointer on
    SVG and Canvas: the labels in the center gutter take `yConfig.tickTooltip`
    as the category axis's tick labels do beside the chart, a label with no
    tooltip lets the pointer through, and the bars on either side still hover
    and click.
*/

const LONG =
  "An age band with a name that is far too long for the room a category axis gives its labels, however many lines it wraps onto, because it goes on and on and on and on and on and on";

/** A Pyramid source (`lib => viz`) with `extra` config; `top` names the top row. */
const pyramid = (
  extra = "",
  top = "20-29",
) => `lib => new lib.Pyramid().config({
  data: ["0-9", "10-19", ${JSON.stringify(top)}].flatMap((age, i) => [
    {age, sex: "Women", region: "North", pop: 10 + i},
    {age, sex: "Men", region: "North", pop: 12 - i},
    {age, sex: "Women", region: "South", pop: 8 + i},
    {age, sex: "Men", region: "South", pop: 9 + i},
  ]),
  groupBy: "sex", y: "age", x: "pop", legend: false, tooltipShared: false,
  ${extra}
}).on("click.shape", d => (window.__clicks ||= []).push(d.sex))`;

/** `tickTooltip` reporting a category and its index. */
const PLACE = `(value, index) => value + " #" + index`;

/** The matcher for the category label, with a tooltip, drawing `text` (in the panel keyed `panel`). */
const tick = (text, panel = "") =>
  `(node, drawn) => !!node.axisTooltip && node.axisTooltip.part === "tick" && drawn === ${JSON.stringify(text)} && String(node.key).includes(${JSON.stringify(panel)})`;

/** The matcher for a category label drawn cut short. */
const cutTick = `node => !!node.axisTooltip && node.axisTooltip.part === "tick" && node.axisTooltip.truncated`;

/** The tooltip's title and body, or `null` when none shows. */
const text = async page => {
  const tip = await tooltip(page);
  return tip && {title: tip.title, body: tip.body};
};

/** The client point of the first node matching `match`. */
async function point(page, match) {
  const at = await nodePoint(page, match);
  assert.ok(at, `a node matches ${match}`);
  return at;
}

/** Hovers the first node matching `match` and returns the tooltip's text. */
async function over(page, match) {
  await hover(page, await point(page, match));
  return text(page);
}

/** Clicks `at` and waits for the repaint. */
async function click(page, at) {
  await page.mouse.click(at[0], at[1]);
  await page.waitForTimeout(120);
}

/** The sides `click.shape` has reported. */
const clicks = page => page.evaluate(() => window.__clicks ?? []);

/** Runs `run(page)` on a chart built from `src`, 700 wide and `height` tall. */
async function withChart(src, renderer, run, height = 400) {
  const {page, errors, close} = await chart(src, renderer, [700, height]);
  try {
    await run(page);
    assert.deepStrictEqual(errors, [], "no page errors");
  } finally {
    await close();
  }
}

for (const renderer of ["svg", "canvas"]) {
  for (const position of ["center", "left"])
    it(`Pyramid axis tooltip (${renderer}): the category labels take yConfig.tickTooltip (${position})`, () =>
      withChart(
        pyramid(
          `categoryPosition: "${position}", yConfig: {tickTooltip: ${PLACE}},`,
        ),
        renderer,
        async page => {
          // Index 0 is the bottom row: the first category in the data.
          for (const [name, index] of [
            ["0-9", 0],
            ["10-19", 1],
            ["20-29", 2],
          ])
            assert.deepStrictEqual(
              await over(page, tick(name)),
              {title: "", body: `${name} #${index}`},
              name,
            );
          const rows = await page.evaluate(() => {
            const flat = n => [n, ...(n.children || []).flatMap(flat)];
            return flat(window.__viz._paintedScene.root)
              .filter(n => n.type === "text" && n.axisTooltip)
              .sort((a, b) => a.transform.y - b.transform.y)
              .map(n => n.axisTooltip.value);
          });
          assert.deepStrictEqual(
            rows,
            ["20-29", "10-19", "0-9"],
            "top row to bottom row",
          );

          // A label is no shape, and the bars on both sides stay marks.
          await click(page, await point(page, tick("10-19")));
          assert.deepStrictEqual(await clicks(page), [], "a label is no shape");
          for (const side of ["Women", "Men"]) {
            const mark = await point(page, bar(side));
            await hover(page, mark);
            const tip = await tooltip(page);
            assert.ok(tip && tip.title === side, `${side}'s bar: its tooltip`);
            await click(page, mark);
          }
          assert.deepStrictEqual(await clicks(page), ["Women", "Men"]);
          assert.deepStrictEqual(
            await over(page, tick("0-9")),
            {title: "", body: "0-9 #0"},
            "a label again, after a bar",
          );
        },
      ));

  it(`Pyramid axis tooltip (${renderer}): text, a tooltip config, and the label's formatted text`, async () => {
    await withChart(
      pyramid(`yConfig: {tickTooltip: "An age band"},`),
      renderer,
      async page =>
        assert.deepStrictEqual(await over(page, tick("10-19")), {
          title: "",
          body: "An age band",
        }),
    );
    await withChart(
      pyramid(
        `yConfig: {
          tickFormat: d => "Ages " + d,
          tickTooltip: {title: value => "Band " + value, body: (value, index) => "Row " + index},
        },`,
      ),
      renderer,
      async page =>
        assert.deepStrictEqual(
          await over(page, tick("Ages 20-29")),
          {title: "Band 20-29", body: "Row 2"},
          "accessors get the category, not the text drawn for it",
        ),
    );
  });

  it(`Pyramid axis tooltip (${renderer}): false, and a function returning false, show nothing`, async () => {
    await withChart(
      pyramid(
        `yConfig: {tickTooltip: value => (value === "10-19" ? false : "Ages " + value)},`,
      ),
      renderer,
      async page => {
        assert.deepStrictEqual(await over(page, tick("0-9")), {
          title: "",
          body: "Ages 0-9",
        });
        assert.strictEqual(await over(page, tick("10-19")), null, "false");
        await click(page, await point(page, tick("10-19")));
        assert.deepStrictEqual(await clicks(page), [], "and still no shape");
      },
    );
    await withChart(
      pyramid(`yConfig: {tickTooltip: false},`),
      renderer,
      async page => {
        assert.strictEqual(
          await nodePoint(page, tick("10-19")),
          null,
          "no label has a tooltip",
        );
        const at = await point(page, label("10-19"));
        await hover(page, at);
        assert.strictEqual(await text(page), null);
        await click(page, at);
        assert.deepStrictEqual(await clicks(page), []);
      },
    );
  });

  it(`Pyramid axis tooltip (${renderer}): a label with no tooltip is inert, and so are the side titles`, () =>
    withChart(
      pyramid(`yConfig: {titleTooltip: "Age bands"},`),
      renderer,
      async page => {
        assert.strictEqual(await nodePoint(page, tick("10-19")), null);
        for (const name of ["10-19", "Women", "Men"]) {
          const at = await point(page, label(name));
          await hover(page, at);
          assert.strictEqual(await text(page), null, name);
          await click(page, at);
        }
        assert.deepStrictEqual(await clicks(page), []);
      },
    ));

  it(`Pyramid axis tooltip (${renderer}): a category label cut short beside the chart shows its whole text`, () =>
    withChart(
      pyramid(`categoryPosition: "left",`, LONG),
      renderer,
      async page => {
        assert.deepStrictEqual(await over(page, cutTick), {
          title: LONG,
          body: "",
        });
        assert.strictEqual(
          await nodePoint(page, tick("10-19")),
          null,
          "a whole label has none",
        );
      },
      200,
    ));

  it(`Pyramid axis tooltip (${renderer}): a label shows its own tooltip over the shared row tooltip`, () =>
    withChart(
      pyramid(`tooltipShared: true, yConfig: {tickTooltip: ${PLACE}},`),
      renderer,
      async page => {
        const at = await point(page, tick("10-19"));
        // The gutter beside the label, in the same row.
        const beside = [at[0], at[1] + 14];
        await hover(page, beside);
        const shared = await tooltip(page);
        assert.ok(shared && shared.rows.length, "the row's shared tooltip");
        assert.deepStrictEqual(await over(page, tick("10-19")), {
          title: "",
          body: "10-19 #1",
        });
        await hover(page, beside);
        assert.deepStrictEqual(
          await tooltip(page),
          shared,
          "the shared tooltip again, off the label",
        );
      },
    ));

  it(`Pyramid axis tooltip (${renderer}): every small-multiples panel`, () =>
    withChart(
      pyramid(`facet: "region", yConfig: {tickTooltip: ${PLACE}},`),
      renderer,
      async page => {
        for (const panel of ["facet-North/", "facet-South/"])
          for (const [name, index] of [
            ["0-9", 0],
            ["20-29", 2],
          ])
            assert.deepStrictEqual(
              await over(page, tick(name, panel)),
              {title: "", body: `${name} #${index}`},
              `${panel}${name}`,
            );
        const [north, south] = [
          await point(page, tick("0-9", "facet-North/")),
          await point(page, tick("0-9", "facet-South/")),
        ];
        assert.ok(
          Math.abs(north[0] - south[0]) + Math.abs(north[1] - south[1]) > 50,
          "each panel draws its own labels",
        );
        await click(page, south);
        assert.deepStrictEqual(await clicks(page), [], "a label is no shape");
      },
    ));
}
