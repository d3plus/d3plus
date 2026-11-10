import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {
  bar,
  chart,
  hover,
  label,
  nodePoint,
  tickLabel,
  title,
  tooltip,
} from "./axis-tooltip-page.js";

/**
    #441 / #167: an axis's `titleTooltip` and `tickTooltip` show the chart's
    tooltip when the real pointer rests on the axis's title or a tick label,
    on both backends; a label drawn cut short shows its whole text by default.
*/

const LONG = "A rather long category name that will not fit";
const LONG_TITLE =
  "A very long y axis title that goes on and on and on and on and on and on and on and on and on and on and on";

const data = `[
  {id: "alpha", x: ${JSON.stringify(LONG)}, y: 4},
  {id: "beta", x: "Bee", y: 6},
  {id: "gamma", x: "Sea", y: 2},
]`;

/** A BarChart source (`lib => viz`) with `extra` config. */
const bars = (extra = "") => `lib => new lib.BarChart().config({
  data: ${data}, groupBy: "id", x: "x", y: "y", legend: false, ${extra}
})`;

// Draws the long category cut short, and the long title on one cut line.
const cut = `xConfig: {maxSize: 40, labelRotation: false, CUTX},
  yConfig: {title: ${JSON.stringify(LONG_TITLE)}, titleConfig: {maxLines: 1}, CUTY}`;
const cutBars = (x = "", y = "") =>
  bars(cut.replace("CUTX", x).replace("CUTY", y));

/** Just the tooltip's text. */
const text = async page => {
  const tip = await tooltip(page);
  return tip && {title: tip.title, body: tip.body, rows: tip.rows};
};

/** Hovers the first node matching `match` and returns the tooltip's text. */
async function over(page, match) {
  const point = await nodePoint(page, match);
  assert.ok(point, `a node matches ${match}`);
  await hover(page, point);
  return text(page);
}

/** Moves the pointer off the chart. */
async function leave(page) {
  await page.mouse.move(700, 500, {steps: 3});
  await page.waitForTimeout(120);
}

/** Runs `run(page)` on a chart built from `src`. */
async function withChart(src, renderer, run) {
  const {page, errors, close} = await chart(src, renderer);
  try {
    await run(page);
    assert.deepStrictEqual(errors, [], "no page errors");
  } finally {
    await close();
  }
}

for (const renderer of ["svg", "canvas"]) {
  it(`axis tooltip (${renderer}): a title's string is the tooltip's text`, () =>
    withChart(
      bars(
        `xConfig: {title: "GDP per capita", titleTooltip: "Constant 2015 US$"}, yConfig: {title: "Life"}`,
      ),
      renderer,
      async page => {
        assert.deepStrictEqual(await over(page, title), {
          title: "",
          body: "Constant 2015 US$",
          rows: [],
        });
        // The axis's ticks and the other axis's title have none.
        assert.strictEqual(await over(page, label("Bee")), null);
        assert.strictEqual(await over(page, label("Life")), null);
      },
    ));

  it(`axis tooltip (${renderer}): a title's function receives the title`, () =>
    withChart(
      bars(
        `yConfig: {title: "Life expectancy", titleTooltip: function (title) { window.__args = Array.from(arguments); window.__self = this === window.__viz; return "About " + title.toLowerCase(); }}`,
      ),
      renderer,
      async page => {
        assert.deepStrictEqual(await over(page, title), {
          title: "",
          body: "About life expectancy",
          rows: [],
        });
        assert.deepStrictEqual(
          await page.evaluate(() => [window.__args, window.__self]),
          [["Life expectancy"], true],
        );
      },
    ));

  it(`axis tooltip (${renderer}): a title's tooltip config lays over the chart's tooltipConfig`, () =>
    withChart(
      bars(
        `tooltipConfig: {background: "rgb(0, 0, 128)", footer: "chart footer"},
         xConfig: {title: "GDP", titleTooltip: {
           title: t => t + " per capita",
           body: t => "About " + t,
           tbody: [["Unit", t => "US$ (" + t + ")"]]
         }},
         yConfig: {title: "Life", titleTooltip: {background: "rgb(128, 0, 0)", body: "Years"}}`,
      ),
      renderer,
      async page => {
        await hover(page, await nodePoint(page, label("GDP")));
        assert.deepStrictEqual(await tooltip(page), {
          title: "GDP per capita",
          body: "About GDP",
          rows: [["Unit", "US$ (GDP)"]],
          background: "rgb(0, 0, 128)",
        });
        await hover(page, await nodePoint(page, label("Life")));
        assert.deepStrictEqual(await tooltip(page), {
          title: "",
          body: "Years",
          rows: [],
          background: "rgb(128, 0, 0)",
        });
      },
    ));

  it(`axis tooltip (${renderer}): a tick's function receives its value and index`, () =>
    withChart(
      bars(
        `xConfig: {tickTooltip: function (value, index) { (window.__calls = window.__calls || []).push([value, index, this === window.__viz]); return value === "Bee" ? "The second letter" : undefined; }},
         yConfig: {tickTooltip: (value, index) => value === 4 ? "Four, tick " + index : ""}`,
      ),
      renderer,
      async page => {
        assert.deepStrictEqual(await over(page, label("Bee")), {
          title: "",
          body: "The second letter",
          rows: [],
        });
        // A tick the function returns nothing for shows no tooltip.
        assert.strictEqual(await over(page, label("Sea")), null);
        const calls = await page.evaluate(() => window.__calls);
        assert.deepStrictEqual(calls.at(0), ["Bee", 1, true]);
        assert.deepStrictEqual(calls.at(-1), ["Sea", 2, true]);
        // A value axis's ticks are numbers, counted in the axis's own order.
        assert.deepStrictEqual(await over(page, label("4")), {
          title: "",
          body: "Four, tick 2",
          rows: [],
        });
        assert.strictEqual(await over(page, label("5")), null);
      },
    ));

  it(`axis tooltip (${renderer}): a tick's tooltip config receives the tick`, () =>
    withChart(
      bars(
        `xConfig: {tickTooltip: {
           title: value => "Category " + value,
           tbody: [["Index", (value, index) => index]]
         }}`,
      ),
      renderer,
      async page => {
        assert.deepStrictEqual(await over(page, label("Sea")), {
          title: "Category Sea",
          body: "",
          rows: [["Index", "2"]],
        });
        assert.deepStrictEqual(await over(page, label("Bee")), {
          title: "Category Bee",
          body: "",
          rows: [["Index", "1"]],
        });
      },
    ));

  it(`axis tooltip (${renderer}): a cut label shows its whole text, a whole label nothing`, () =>
    withChart(cutBars(), renderer, async page => {
      assert.deepStrictEqual(await over(page, label("A rather long")), {
        title: LONG,
        body: "",
        rows: [],
      });
      assert.strictEqual(await over(page, label("Bee")), null);
      assert.strictEqual(await over(page, label("4")), null);
      assert.deepStrictEqual(await over(page, title), {
        title: LONG_TITLE,
        body: "",
        rows: [],
      });
    }));

  it(`axis tooltip (${renderer}): a cut label's whole text heads what its option gives`, () =>
    withChart(
      cutBars(
        `tickTooltip: value => value.length + " letters"`,
        `titleTooltip: "Years"`,
      ),
      renderer,
      async page => {
        assert.deepStrictEqual(await over(page, label("A rather long")), {
          title: LONG,
          body: `${LONG.length} letters`,
          rows: [],
        });
        assert.deepStrictEqual(await over(page, label("Bee")), {
          title: "",
          body: "3 letters",
          rows: [],
        });
        assert.deepStrictEqual(await over(page, label("A very long")), {
          title: LONG_TITLE,
          body: "Years",
          rows: [],
        });
      },
    ));

  it(`axis tooltip (${renderer}): false turns each off, cut labels included`, () =>
    withChart(
      cutBars(`tickTooltip: false`, `titleTooltip: false`),
      renderer,
      async page => {
        assert.strictEqual(await over(page, label("A rather long")), null);
        assert.strictEqual(await over(page, label("A very long")), null);
        // The bars keep their tooltips.
        assert.strictEqual((await over(page, bar("beta"))).title, "beta");
      },
    ));

  it(`axis tooltip (${renderer}): false on one option leaves the other`, () =>
    withChart(
      cutBars(`titleTooltip: false, title: "Category"`, `tickTooltip: false`),
      renderer,
      async page => {
        assert.strictEqual(await over(page, label("Category")), null);
        assert.strictEqual(
          (await over(page, label("A rather long"))).title,
          LONG,
        );
        assert.strictEqual(
          (await over(page, label("A very long"))).title,
          LONG_TITLE,
        );
      },
    ));

  it(`axis tooltip (${renderer}): moving between a bar and a tick label swaps tooltips`, () =>
    withChart(
      bars(
        `tooltipConfig: {background: "rgb(0, 0, 128)"},
         xConfig: {tickTooltip: {background: "rgb(128, 0, 0)", title: false, body: value => "About " + value}}`,
      ),
      renderer,
      async page => {
        const mark = await nodePoint(page, bar("beta"));
        const tick = await nodePoint(page, label("Bee"));
        await hover(page, mark);
        const first = await tooltip(page);
        assert.strictEqual(first.title, "beta");
        assert.strictEqual(first.background, "rgb(0, 0, 128)");
        assert.ok(first.rows.length, "the bar's tooltip lists its values");

        await hover(page, tick);
        assert.deepStrictEqual(await tooltip(page), {
          title: "",
          body: "About Bee",
          rows: [],
          background: "rgb(128, 0, 0)",
        });

        // The bar's tooltip comes back as it was: nothing of the axis's stays.
        await hover(page, mark);
        assert.deepStrictEqual(await tooltip(page), first);

        await hover(page, tick);
        assert.strictEqual((await tooltip(page)).body, "About Bee");
        await leave(page);
        assert.strictEqual(await tooltip(page), null);
      },
    ));

  it(`axis tooltip (${renderer}): nothing is left after the pointer leaves a label`, () =>
    withChart(
      cutBars(`title: "Category", titleTooltip: "The bars"`),
      renderer,
      async page => {
        for (const match of [
          label("Category"),
          label("A rather long"),
          title,
        ]) {
          assert.ok(await over(page, match), "shown");
          await leave(page);
          assert.strictEqual(await tooltip(page), null, "hidden off the chart");
        }
        // Onto a label with no tooltip, and onto the plot, where the nearest
        // bar's tooltip takes over.
        assert.ok(await over(page, label("A rather long")));
        assert.strictEqual(await over(page, label("Sea")), null);
        assert.ok(await over(page, label("A rather long")));
        const gamma = await nodePoint(page, bar("gamma"));
        await hover(page, [gamma[0], gamma[1] - 150]);
        assert.strictEqual((await tooltip(page)).title, "gamma");
        await leave(page);
        assert.strictEqual(await tooltip(page), null);
      },
    ));

  it(`axis tooltip (${renderer}): a click or tap on a label keeps its tooltip`, () =>
    withChart(
      bars(`xConfig: {tickTooltip: value => "About " + value}`),
      renderer,
      async page => {
        const tick = await nodePoint(page, label("Bee"));
        await hover(page, tick);
        await page.mouse.click(tick[0], tick[1]);
        await page.waitForTimeout(120);
        assert.strictEqual((await tooltip(page)).body, "About Bee");
        await leave(page);
        assert.strictEqual(await tooltip(page), null);

        // A tap: the touch, then the mouse events a browser follows it with.
        await page.evaluate(([x, y]) => {
          const target = document.elementFromPoint(x, y);
          const fire = (Type, type) =>
            target.dispatchEvent(
              new Type(type, {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: x,
                clientY: y,
              }),
            );
          fire(UIEvent, "touchstart");
          fire(MouseEvent, "mousemove");
          fire(MouseEvent, "mousedown");
          fire(MouseEvent, "mouseup");
          fire(MouseEvent, "click");
        }, tick);
        await page.waitForTimeout(120);
        assert.strictEqual((await tooltip(page)).body, "About Bee");
        // A touch anywhere else puts it away.
        await page.evaluate(() =>
          document.body.dispatchEvent(
            new UIEvent("touchstart", {bubbles: true, view: window}),
          ),
        );
        await page.waitForTimeout(120);
        assert.strictEqual(await tooltip(page), null);
      },
    ));

  it(`axis tooltip (${renderer}): a chart with tooltips off shows only what an axis option gives`, () =>
    withChart(
      cutBars(`title: "Category", titleTooltip: "The bars"`).replace(
        "legend: false,",
        "legend: false, tooltip: false,",
      ),
      renderer,
      async page => {
        assert.strictEqual(await over(page, label("A rather long")), null);
        assert.strictEqual(await over(page, label("A very long")), null);
        assert.strictEqual(await over(page, bar("beta")), null);
        assert.deepStrictEqual(await over(page, label("Category")), {
          title: "",
          body: "The bars",
          rows: [],
        });
      },
    ));

  it(`axis tooltip (${renderer}): the second x and y axes`, () =>
    withChart(
      `lib => new lib.LinePlot().config({
        data: [
          {id: "a", x: 1, y: 10, top: 100, right: 5},
          {id: "a", x: 2, y: 20, top: 200, right: 7},
          {id: "a", x: 3, y: 15, top: 300, right: 9},
        ],
        groupBy: "id", x: "x", y: "y", x2: "top", y2: "right", legend: false,
        xConfig: {title: "Bottom", titleTooltip: "x"},
        yConfig: {title: "Left", titleTooltip: "y"},
        x2Config: {title: "Top", titleTooltip: "x2", tickTooltip: value => "top " + value},
        y2Config: {title: "Right", titleTooltip: "y2", tickTooltip: value => "right " + value},
      })`,
      renderer,
      async page => {
        // Each title shows its own axis's text, though all four share a scene key.
        for (const [name, body] of [
          ["Bottom", "x"],
          ["Left", "y"],
          ["Top", "x2"],
          ["Right", "y2"],
        ])
          assert.strictEqual((await over(page, label(name))).body, body, name);
        assert.strictEqual((await over(page, label("200"))).body, "top 200");
        assert.strictEqual((await over(page, label("7"))).body, "right 7");
      },
    ));

  it(`axis tooltip (${renderer}): alongside a shared tooltip and the axis guides`, () =>
    withChart(
      `lib => new lib.LinePlot().config({
        data: [
          {id: "a", x: 1, y: 10}, {id: "a", x: 2, y: 20}, {id: "a", x: 3, y: 15},
          {id: "b", x: 1, y: 12}, {id: "b", x: 2, y: 14}, {id: "b", x: 3, y: 30},
        ],
        groupBy: "id", x: "x", y: "y", legend: false,
        tooltipShared: true, axisHover: true,
        xConfig: {title: "Step", titleTooltip: "Steps taken", tickTooltip: value => "Step " + value},
      })`,
      renderer,
      async page => {
        const shared = async () => {
          const tick = await nodePoint(page, label("2"));
          await hover(page, [tick[0], tick[1] - 150]);
          return tooltip(page);
        };
        const first = await shared();
        assert.ok(
          first && first.rows.length,
          "the shared tooltip shows over the plot",
        );

        assert.strictEqual((await over(page, label("2"))).body, "Step 2");
        assert.strictEqual(
          await page.evaluate(() => !!window.__viz._axisHoverState),
          false,
          "no guides while over a label",
        );
        assert.deepStrictEqual(
          await shared(),
          first,
          "the shared tooltip returns",
        );

        assert.strictEqual((await over(page, title)).body, "Steps taken");
        await leave(page);
        assert.strictEqual(await tooltip(page), null);
      },
    ));

  it(`axis tooltip (${renderer}): a Matrix's row and column labels`, () =>
    withChart(
      `lib => new lib.Matrix().config({
        data: [
          {id: "a", row: "North", column: "Apples", value: 1},
          {id: "b", row: "North", column: "Pears", value: 2},
          {id: "c", row: "South", column: "Apples", value: 3},
          {id: "d", row: "South", column: "Pears", value: 4},
        ],
        groupBy: ["row", "column"], row: "row", column: "column",
        legend: false, colorScale: "value", colorScalePosition: false,
        rowConfig: {tickTooltip: value => "Region: " + value},
        columnConfig: {tickTooltip: value => "Fruit: " + value},
      })`,
      renderer,
      async page => {
        assert.strictEqual(
          (await over(page, label("South"))).body,
          "Region: South",
        );
        assert.strictEqual(
          (await over(page, label("Pears"))).body,
          "Fruit: Pears",
        );
        await leave(page);
        assert.strictEqual(await tooltip(page), null);
      },
    ));

  it(`axis tooltip (${renderer}): a Priestley's time axis`, () =>
    withChart(
      `lib => new lib.Priestley().config({
        data: [
          {id: "a", start: "2004", end: "2007"},
          {id: "b", start: "2005", end: "2010"},
          {id: "c", start: "2008", end: "2012"},
        ],
        groupBy: "id", start: "start", end: "end", legend: false,
        axisConfig: {
          title: "Years",
          titleTooltip: "When each ran",
          tickTooltip: value => "Year " + new Date(value).getFullYear(),
        },
      })`,
      renderer,
      async page => {
        assert.strictEqual(
          (await over(page, label("Years"))).body,
          "When each ran",
        );
        assert.strictEqual((await over(page, label("2008"))).body, "Year 2008");
        await leave(page);
        assert.strictEqual(await tooltip(page), null);
      },
    ));

  it(`axis tooltip (${renderer}): a color scale's axis`, () =>
    withChart(
      `lib => new lib.Treemap().config({
        data: [
          {id: "a", value: 10, score: 0},
          {id: "b", value: 20, score: 50},
          {id: "c", value: 30, score: 100},
        ],
        groupBy: "id", sum: "value", colorScale: "score",
        colorScaleConfig: {
          scale: "linear",
          axisConfig: {tickTooltip: value => "Score " + value},
        },
      })`,
      renderer,
      async page => {
        assert.strictEqual(
          (await over(page, tickLabel("50"))).body,
          "Score 50",
        );
        await leave(page);
        assert.strictEqual(await tooltip(page), null);
      },
    ));
}
