import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {chart, hover, label, nodePoint, tooltip} from "./axis-tooltip-page.js";

/**
    Tooltips on an Alluvial's column titles, with the real pointer on SVG and
    Canvas: a title cut short shows its whole text, `dimensionTitleConfig`'s
    `titleTooltip` gives every title one, a title with nothing to show lets
    the pointer through, and the nodes and bands hover and click as before.
*/

const LONG =
  "A column title that is far too long to fit above its column on one line";

/** An Alluvial source (`lib => viz`) with `extra` config; its middle column is titled `middle`. */
const alluvial = (
  extra = "",
  middle = "Product",
) => `lib => new lib.Alluvial().config({
  data: [
    {region: "West", product: "Chairs", channel: "Online"},
    {region: "West", product: "Chairs", channel: "Store"},
    {region: "West", product: "Tables", channel: "Online"},
    {region: "East", product: "Tables", channel: "Store"},
    {region: "East", product: "Chairs", channel: "Online"},
  ],
  dimensions: [
    {value: "region", title: "Region"},
    {value: "product", title: ${JSON.stringify(middle)}},
    {value: "channel", title: "Channel"},
  ],
  legend: false,
  ${extra}
}).on("click.shape", d => (window.__clicks ||= []).push(lib.alluvialMeta(d).kind))`;

/** The matcher for the title, with a tooltip, whose whole text is `text`. */
const titled = text =>
  `node => !!node.axisTooltip && node.axisTooltip.part === "title" && node.axisTooltip.text === ${JSON.stringify(text)}`;

/** The matcher for the node rect drawn for category `label`. */
const nodeRect = name =>
  `node => node.type === "rect" && String(node.key).startsWith("alluvial-node-") && String(node.key).includes(${JSON.stringify(name)})`;

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

/** What `click.shape` has reported: each clicked mark's kind. */
const clicks = page => page.evaluate(() => window.__clicks ?? []);

/** The client point in the middle of the first band. */
const bandPoint = page =>
  page.evaluate(() => {
    let found = null;
    const walk = (n, x, y) => {
      const t = n.transform || {};
      const nx = x + (t.x || 0),
        ny = y + (t.y || 0);
      if (
        !found &&
        n.type === "path" &&
        String(n.key).startsWith("alluvial-band-")
      ) {
        const nums = n.d.match(/-?[\d.]+(e-?\d+)?/g).map(Number);
        const [xs, sy0] = nums;
        const [ty0, xt, ty1] = [nums[7], nums[8], nums[9]];
        const sy1 = nums[nums.length - 1];
        found = [nx + (xs + xt) / 2, ny + (sy0 + sy1 + ty0 + ty1) / 4];
      }
      (n.children || []).forEach(c => walk(c, nx, ny));
    };
    walk(window.__viz._paintedScene.root, 0, 0);
    const svg = document.querySelector("#viz svg.d3plus-render-svg");
    if (svg) {
      const m = svg.getScreenCTM();
      return [m.a * found[0] + m.e, m.d * found[1] + m.f];
    }
    const r = document.querySelector("#viz canvas").getBoundingClientRect();
    return [r.left + found[0], r.top + found[1]];
  });

/** Runs `run(page)` on a chart built from `src`, 600 by 400. */
async function withChart(src, renderer, run) {
  const {page, errors, close} = await chart(src, renderer, [600, 400]);
  try {
    await run(page);
    assert.deepStrictEqual(errors, [], "no page errors");
  } finally {
    await close();
  }
}

for (const renderer of ["svg", "canvas"]) {
  it(`Alluvial title tooltip (${renderer}): a title cut short shows its whole text, and is no shape`, () =>
    withChart(
      alluvial(`dimensionTitleConfig: {maxLines: 1},`, LONG),
      renderer,
      async page => {
        assert.deepStrictEqual(await over(page, titled(LONG)), {
          title: LONG,
          body: "",
        });
        await click(page, await point(page, titled(LONG)));
        assert.deepStrictEqual(await clicks(page), [], "no shape is clicked");
        for (const plain of ["Region", "Channel"]) {
          assert.strictEqual(await nodePoint(page, titled(plain)), null);
          const at = await point(page, label(plain));
          await hover(page, at);
          assert.strictEqual(await text(page), null, plain);
          await click(page, at);
        }
        assert.deepStrictEqual(await clicks(page), [], "nor a whole title");
      },
    ));

  it(`Alluvial title tooltip (${renderer}): titleTooltip as text, a function of the title, and a tooltip config`, async () => {
    await withChart(
      alluvial(
        `dimensionTitleConfig: {titleTooltip: function (title) { window.__args = Array.from(arguments); return title === "Channel" ? false : "About " + title; }},`,
      ),
      renderer,
      async page => {
        assert.deepStrictEqual(await over(page, titled("Region")), {
          title: "",
          body: "About Region",
        });
        assert.deepStrictEqual(await over(page, titled("Product")), {
          title: "",
          body: "About Product",
        });
        assert.deepStrictEqual(
          await page.evaluate(() => window.__args),
          ["Product"],
          "the title alone",
        );
        assert.strictEqual(
          await over(page, titled("Channel")),
          null,
          "a function returning false",
        );
        await click(page, await point(page, titled("Product")));
        assert.deepStrictEqual(await clicks(page), []);
      },
    );
    await withChart(
      alluvial(`dimensionTitleConfig: {titleTooltip: "A column"},`),
      renderer,
      async page =>
        assert.deepStrictEqual(await over(page, titled("Channel")), {
          title: "",
          body: "A column",
        }),
    );
    await withChart(
      alluvial(
        `dimensionTitleConfig: {titleTooltip: {title: title => "About " + title, body: title => title.length + " letters"}},`,
      ),
      renderer,
      async page =>
        assert.deepStrictEqual(await over(page, titled("Product")), {
          title: "About Product",
          body: "7 letters",
        }),
    );
  });

  it(`Alluvial title tooltip (${renderer}): false keeps a cut title quiet`, () =>
    withChart(
      alluvial(
        `dimensionTitleConfig: {maxLines: 1, titleTooltip: false},`,
        LONG,
      ),
      renderer,
      async page => {
        assert.strictEqual(await nodePoint(page, titled(LONG)), null);
        const at = await point(page, label(LONG.slice(0, 6)));
        await hover(page, at);
        assert.strictEqual(await text(page), null);
        await click(page, at);
        assert.deepStrictEqual(await clicks(page), []);
      },
    ));

  it(`Alluvial title tooltip (${renderer}): the nodes and bands hover and click as before`, () =>
    withChart(
      alluvial(`dimensionTitleConfig: {titleTooltip: "A column"},`),
      renderer,
      async page => {
        const node = await point(page, nodeRect("Chairs"));
        await hover(page, node);
        assert.ok((await tooltip(page))?.title, "a node's tooltip");
        await click(page, node);
        const band = await bandPoint(page);
        await hover(page, band);
        assert.ok((await tooltip(page))?.title, "a band's tooltip");
        await click(page, band);
        assert.deepStrictEqual(await clicks(page), ["node", "band"]);
        assert.deepStrictEqual(await over(page, titled("Region")), {
          title: "",
          body: "A column",
        });
        await hover(page, node);
        const tip = await text(page);
        assert.ok(tip && tip.body !== "A column", "the node's again");
      },
    ));
}
