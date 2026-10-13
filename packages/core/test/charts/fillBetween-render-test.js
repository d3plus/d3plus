import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    #283 in a real browser: LinePlot's `fillBetween` on both backends, and
    with the pairs it accepts.
*/

after(closeBrowser);

/** Page-side helpers, installed before each probe. */
const helpers = () => {
  window.__draw = (Chart, configure, size = [800, 500]) =>
    new Promise(resolve => {
      const el = document.createElement("div");
      el.style.cssText = `width:${size[0]}px;height:${size[1]}px`;
      document.body.appendChild(el);
      const viz = new window.d3plus[Chart]().select(el).detectVisible(false).duration(0).width(size[0]).height(size[1]);
      configure(viz);
      viz.render(() => resolve({el, viz}));
    });
  window.__flat = nodes => nodes.flatMap(n => [n, ...(n.children ? window.__flat(n.children) : [])]);
  window.__nan = el =>
    Array.from(el.querySelectorAll("*")).filter(n => Array.from(n.attributes).some(a => a.value.includes("NaN"))).length;
};

const run = (fn, arg) => render("", new Function("arg", `return (${helpers})(), (${fn})(arg);`), arg);

it("LinePlot fillBetween fills between two lines, clipped at each crossing, on both backends", async function () {
  this.timeout(120000);
  const out = await run(async () => {
    const data = [];
    for (let t = 0; t < 12; t++) {
      data.push({name: "High", t, v: 10 + 4 * Math.sin(t / 2)});
      data.push({name: "Low", t, v: 10 + 4 * Math.cos(t / 2)});
    }
    const result = {};
    for (const renderer of ["svg", "canvas"]) {
      const {el, viz} = await window.__draw("LinePlot", v =>
        v.data(data).groupBy("name").x("t").y("v").fillBetween(true).renderer(renderer),
      );
      const nodes = window.__flat(viz._chartScene);
      const clips = nodes.filter(n => /^fill-between-.*::clip$/.test(`${n.key}`));
      const lines = nodes.filter(n => n.type === "path" && n.shapeType === "Line" && ["High", "Low"].includes(n.key));
      result[renderer] = {
        clips: clips.map(n => n.key),
        clipped: clips.every(n => n.clip && n.clip.type === "path"),
        fills: clips.map(n => n.children[0].paint.fill),
        lines: lines.map(n => n.paint.stroke),
        inert: clips.every(n => n.interactive === false && n.children.every(c => c.interactive === false)),
        domClips: el.querySelectorAll("[clip-path]").length,
        nan: window.__nan(el),
      };
    }
    return result;
  });
  for (const renderer of ["svg", "canvas"]) {
    const r = out[renderer];
    assert.deepStrictEqual(r.clips, ["fill-between-High-Low-High::clip", "fill-between-High-Low-Low::clip"], renderer);
    assert.ok(r.clipped, `${renderer}: each copy is clipped to one side`);
    assert.deepStrictEqual(r.fills, r.lines, `${renderer}: each region in its higher series' color`);
    assert.ok(r.inert, `${renderer}: the fill leaves the pointer to the lines`);
    assert.strictEqual(r.nan, 0);
  }
  assert.ok(out.svg.domClips >= 2, "SVG clips the fills");
});

it("LinePlot fillBetween: named pairs, a missing series, and off", async function () {
  this.timeout(120000);
  const out = await run(async () => {
    const data = [];
    ["a", "b", "c", "d"].forEach((id, s) => {
      for (let t = 0; t < 8; t++) data.push({id, t, v: 10 + s * 5 + Math.sin(t + s)});
    });
    const groups = async fillBetween => {
      const {el, viz} = await window.__draw("LinePlot", v => v.data(data).groupBy("id").x("t").y("v").fillBetween(fillBetween));
      const keys = window.__flat(viz._chartScene).filter(n => /^fill-between-.*::clip$/.test(`${n.key}`)).map(n => n.key);
      return {keys, nan: window.__nan(el)};
    };
    return {
      pairs: await groups([["a", "b"], ["c", "d"]]),
      missing: await groups(["a", "zzz"]),
      off: await groups(false),
    };
  });
  assert.deepStrictEqual(out.pairs.keys, [
    "fill-between-a-b-a::clip", "fill-between-a-b-b::clip",
    "fill-between-c-d-c::clip", "fill-between-c-d-d::clip",
  ], "each pair fills between its own lines");
  assert.deepStrictEqual(out.missing.keys, [], "a pair naming a missing series is ignored");
  assert.deepStrictEqual(out.off.keys, [], "false draws nothing");
  assert.strictEqual(out.pairs.nan, 0);
});
