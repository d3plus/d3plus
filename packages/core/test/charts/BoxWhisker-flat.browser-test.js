import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Precomputed boxes whose quartiles meet (q1 = median = q3) have no body:
    each draws as a flat rule, its median line in its whiskers' color, at
    every position and whatever its fill, on SVG and Canvas. Hiding a legend
    entry leaves every other box's rule in place, and degenerate statistics
    (a median beside equal quartiles, a box with min = max) draw every mark.
*/

// Each category's x is "name|index"; the tick format shows the name. The
// second fill is dark, so a median contrasting with it would be white.
const categories = [
  {name: "[blank]", colour: "#adb5bd", min: 500, q: 750, max: 1000},
  {name: "Amber", colour: "#1a1b4b", min: 0, q: 420, max: 1500},
  {name: "Red", colour: "#ffd43b", min: 0, q: 80, max: 150},
  {name: "Green", colour: "#ae3ec9", min: 200, q: 600, max: 900},
];
const flatRows = categories.map(({name, colour, min, q, max}, i) => ({
  id: `${name}|${i}`,
  group: `${name}|${i}`,
  colour,
  min,
  q1: q,
  median: q,
  q3: q,
  max,
}));

// Runs in the page: draws a BoxWhisker from `rows` the way the report does,
// optionally hides legend entries, and reports each box part's paint and
// size, whether each median's middle shows dark pixels, and any NaN.
const draw = async ({rows, renderer, theme, hide = 0}) => {
  const el = document.createElement("div");
  document.body.appendChild(el);
  const viz = new window.d3plus.BoxWhisker()
    .select(el)
    .renderer(renderer)
    .detectVisible(false)
    .duration(0)
    .width(560)
    .height(340)
    .zoom(false)
    .search(false)
    .saveControl(false)
    .tableView(false)
    .data(rows)
    .boxMin("min")
    .boxQ1("q1")
    .boxMedian("median")
    .boxQ3("q3")
    .boxMax("max")
    .x("group")
    .color("colour")
    .xConfig({tickFormat: d => d.split("|")[0], title: false})
    .yConfig({title: false})
    .legendFilterInvert(true)
    .tooltip(false)
    .on("mouseenter", () => {})
    .on("mousemove", () => {})
    .on("mouseleave", () => {});
  if (theme) viz.theme(theme);
  await new Promise(r => viz.render(r));

  const scene = () => {
    const parts = {};
    const walk = (list, dx, dy) => {
      for (const n of list || []) {
        const t = n.transform || {};
        const x = dx + (t.x ?? 0);
        const y = dy + (t.y ?? 0);
        if (n.type === "group") walk(n.children, x, y);
        else if (
          typeof n.key === "string" &&
          /-(box|median|whisker-top|whisker-bottom)$/.test(n.key)
        )
          parts[n.key] = {
            fill: n.paint?.fill,
            stroke: n.paint?.stroke,
            width: n.width,
            height: n.height,
            // The node's middle, in the chart's own pixels.
            cx: x + (n.x ?? 0) + (n.width ?? 0) / 2,
            cy: y + (n.y ?? 0) + (n.height ?? 0) / 2,
          };
      }
    };
    walk([viz._paintedScene.root], 0, 0);
    return parts;
  };

  // With legendFilterInvert, a shift-click on a legend entry hides it.
  const entries = viz._legendClass._data || [];
  for (let k = 0; k < hide; k++) {
    const event = new MouseEvent("click", {shiftKey: true});
    viz.schema.on["click.legend"](entries[k], k, undefined, event);
    const id = viz._id(entries[k], k);
    for (let t = 0; t < 100 && `${id}-median` in scene(); t++)
      await new Promise(r => setTimeout(r, 20));
  }
  await new Promise(r => setTimeout(r, 50));

  // The chart's pixels: the canvas itself, or the SVG drawn into one.
  const pixels = document.createElement("canvas");
  pixels.width = 560;
  pixels.height = 340;
  const ctx = pixels.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 560, 340);
  const surface = el.querySelector("canvas");
  if (surface) ctx.drawImage(surface, 0, 0, 560, 340);
  else {
    const svg = el.querySelector("svg");
    const src = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(src)}`;
    await img.decode();
    ctx.drawImage(img, 0, 0, 560, 340);
  }
  // Each median's darkest row across its middle third, as mean luminance.
  const contrast = {};
  const parts = scene();
  for (const [key, p] of Object.entries(parts)) {
    if (!key.endsWith("-median")) continue;
    const span = Math.floor(p.width / 3);
    const x0 = Math.round(p.cx - span / 2);
    let darkest = 255;
    for (let y = Math.floor(p.cy) - 1; y <= Math.floor(p.cy) + 1; y++) {
      const row = ctx.getImageData(x0, y, span, 1).data;
      let lum = 0;
      for (let k = 0; k < row.length; k += 4)
        lum += (row[k] + row[k + 1] + row[k + 2]) / 3;
      darkest = Math.min(darkest, lum / span);
    }
    contrast[key] = Math.round(darkest);
  }
  const nan = [...el.querySelectorAll("*")].filter(n =>
    [...n.attributes].some(a => a.value.includes("NaN")),
  ).length;
  el.remove();
  return {parts, contrast, nan};
};

// Every box drawn: its flat body, its median rule in the whiskers' color at
// the box's full width, and both whiskers.
const assertRules = (out, ids, ink) => {
  for (const id of ids) {
    const box = out.parts[`${id}-box`];
    const median = out.parts[`${id}-median`];
    assert.ok(box, `${id}: box drawn`);
    assert.strictEqual(box.height, 0, `${id}: flat box`);
    assert.ok(median, `${id}: median drawn`);
    assert.strictEqual(median.fill, ink, `${id}: median takes the whisker ink`);
    assert.strictEqual(median.width, box.width, `${id}: median spans the box`);
    assert.ok(out.parts[`${id}-whisker-top`], `${id}: top whisker`);
    assert.ok(out.parts[`${id}-whisker-bottom`], `${id}: bottom whisker`);
  }
  assert.strictEqual(out.nan, 0, "no NaN attributes");
};

const ids = flatRows.map(d => d.id);

for (const renderer of ["svg", "canvas"]) {
  it(`BoxWhisker flat precomputed boxes (${renderer}): every box draws a visible rule`, async function () {
    const out = await render("", draw, {rows: flatRows, renderer});
    assertRules(out, ids, "black");
    // Each rule's middle is dark on the light background, whatever its fill.
    for (const id of ids)
      assert.ok(
        out.contrast[`${id}-median`] < 128,
        `${id}: rule shows (${out.contrast[`${id}-median`]})`,
      );
  });

  it(`BoxWhisker flat precomputed boxes (${renderer}): hiding legend entries keeps every other rule`, async function () {
    const one = await render("", draw, {rows: flatRows, renderer, hide: 1});
    assert.ok(!one.parts[`${ids[0]}-median`], "the hidden box is gone");
    assertRules(one, ids.slice(1), "black");
    for (const id of ids.slice(1))
      assert.ok(one.contrast[`${id}-median`] < 128, `${id}: rule shows`);
    const two = await render("", draw, {rows: flatRows, renderer, hide: 2});
    assertRules(two, ids.slice(2), "black");
    for (const id of ids.slice(2))
      assert.ok(two.contrast[`${id}-median`] < 128, `${id}: rule shows`);
  });

  it(`BoxWhisker flat precomputed boxes (${renderer}): on a dark theme the rules take its text color`, async function () {
    const out = await render("", draw, {
      rows: flatRows,
      renderer,
      theme: "dark",
    });
    const ink = out.parts[`${ids[0]}-median`].fill;
    assert.notStrictEqual(ink, "black", "not the light theme's ink");
    assertRules(out, ids, ink);
  });

  it(`BoxWhisker degenerate precomputed boxes (${renderer}): every mark draws`, async function () {
    const rows = [
      // Equal quartiles with the median outside them.
      {
        id: "a|0",
        group: "a|0",
        colour: "#1a1b4b",
        min: 10,
        q1: 30,
        median: 50,
        q3: 30,
        max: 70,
      },
      // Every statistic equal: no whiskers' length, no body.
      {
        id: "b|1",
        group: "b|1",
        colour: "#1a1b4b",
        min: 40,
        q1: 40,
        median: 40,
        q3: 40,
        max: 40,
      },
      // A flat box at its upper whisker's end.
      {
        id: "c|2",
        group: "c|2",
        colour: "#ae3ec9",
        min: 20,
        q1: 60,
        median: 60,
        q3: 60,
        max: 60,
      },
    ];
    const out = await render("", draw, {rows, renderer});
    for (const id of ["a|0", "b|1", "c|2"]) {
      for (const part of ["box", "median", "whisker-top", "whisker-bottom"])
        assert.ok(out.parts[`${id}-${part}`], `${id}: ${part} drawn`);
      for (const v of Object.values(out.parts[`${id}-median`]))
        if (typeof v === "number")
          assert.ok(Number.isFinite(v), `${id}: finite`);
    }
    // The median beside equal quartiles sits on the box's edge, over its body.
    assert.strictEqual(out.parts["a|0-median"].fill, "white");
    assert.ok(out.parts["a|0-box"].height > 0, "a|0: the box spans 30 to 50");
    assert.strictEqual(out.parts["b|1-median"].fill, "black");
    assert.strictEqual(out.parts["c|2-median"].fill, "black");
    assert.ok(out.contrast["b|1-median"] < 128, "b|1: rule shows");
    assert.ok(out.contrast["c|2-median"] < 128, "c|2: rule shows");
    assert.strictEqual(out.nan, 0, "no NaN attributes");
  });
}
