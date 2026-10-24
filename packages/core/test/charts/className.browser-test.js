import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import {svgForSave} from "../../src/charts/drawSteps/saveChart.ts";

/**
    `className` adds classes to the element a chart draws on, its root svg or
    (with the Canvas renderer) its canvas, next to the fixed classes; page CSS
    then styles that chart alone.
*/

const data = [
  {id: "alpha", x: "A", y: 7},
  {id: "beta", x: "B", y: 12},
];

const classesOf = el => (el ? el.getAttribute("class") : null);

const draw = async ({data, renderer}) => {
  const style = document.createElement("style");
  style.textContent =
    ".dark-chart { background: rgb(30, 30, 46); } .dark-chart text { fill: rgb(255, 255, 255); }";
  document.head.appendChild(style);
  const els = ["styled", "plain"].map(id => {
    const el = document.createElement("div");
    el.id = id;
    el.style.cssText = "width:400px;height:300px";
    document.body.appendChild(el);
    return el;
  });
  const charts = els.map(el =>
    new window.d3plus.BarChart()
      .select(el)
      .renderer(renderer)
      .duration(0)
      .config({data, groupBy: "id", x: "x", y: "y"}),
  );
  charts[0].className("dark-chart revenue");
  await Promise.all(charts.map(c => new Promise(r => c.render(r))));
  const [styled, plain] = els;
  const snapshot = el => ({
    root: classesOf(el.querySelector("svg.d3plus-viz")),
    canvas: classesOf(el.querySelector("canvas")),
    overlays: classesOf(el.querySelector(".d3plus-render-overlays")),
  });
  const textFill = el => {
    const text = el.querySelector("svg.d3plus-viz text");
    return text ? getComputedStyle(text).fill : null;
  };
  const background = el => {
    const surface = el.querySelector(
      renderer === "canvas" ? "canvas" : "svg.d3plus-viz",
    );
    return getComputedStyle(surface).backgroundColor;
  };
  const backgrounds = {styled: background(styled), plain: background(plain)};
  const first = snapshot(styled);
  const other = snapshot(plain);
  const fills = {styled: textFill(styled), plain: textFill(plain)};
  const markup = charts[0].toSVGString();
  const saved = classesOf(svgForSave(charts[0], false));

  charts[0].className(["light-chart"]);
  const changed = snapshot(styled);
  await new Promise(r => charts[0].render(r));
  const rerendered = snapshot(styled);
  charts[0].className(undefined);
  const cleared = snapshot(styled);

  els.forEach(el => el.remove());
  style.remove();
  return {
    first,
    other,
    fills,
    backgrounds,
    markup: markup.slice(0, markup.indexOf(">") + 1),
    saved,
    changed,
    rerendered,
    cleared,
  };
};

it("adds className to the root svg (svg)", async function () {
  const r = await render("", draw, {data, renderer: "svg"});
  assert.strictEqual(r.first.root, "d3plus-viz dark-chart revenue");
  assert.strictEqual(r.first.overlays, "d3plus-render-overlays");
  assert.strictEqual(
    r.other.root,
    "d3plus-viz",
    "the other chart is untouched",
  );
  assert.strictEqual(r.fills.styled, "rgb(255, 255, 255)");
  assert.notStrictEqual(r.fills.plain, "rgb(255, 255, 255)");
  assert.strictEqual(r.backgrounds.styled, "rgb(30, 30, 46)");
  assert.notStrictEqual(r.backgrounds.plain, "rgb(30, 30, 46)");
  assert.ok(r.markup.includes("dark-chart revenue"), r.markup);
  assert.strictEqual(r.saved, "d3plus-viz dark-chart revenue");
  assert.strictEqual(r.changed.root, "d3plus-viz light-chart");
  assert.strictEqual(r.rerendered.root, "d3plus-viz light-chart");
  assert.strictEqual(r.cleared.root, "d3plus-viz");
});

it("adds className to the canvas (canvas)", async function () {
  const r = await render("", draw, {data, renderer: "canvas"});
  assert.strictEqual(r.first.canvas, "d3plus-render-canvas dark-chart revenue");
  assert.strictEqual(r.first.root, "d3plus-viz", "the svg over the canvas");
  assert.strictEqual(r.first.overlays, "d3plus-render-overlays");
  assert.strictEqual(r.other.canvas, "d3plus-render-canvas");
  assert.strictEqual(r.backgrounds.styled, "rgb(30, 30, 46)");
  assert.notStrictEqual(r.backgrounds.plain, "rgb(30, 30, 46)");
  assert.ok(r.markup.includes("dark-chart revenue"), r.markup);
  assert.strictEqual(r.changed.canvas, "d3plus-render-canvas light-chart");
  assert.strictEqual(r.rerendered.canvas, "d3plus-render-canvas light-chart");
  assert.strictEqual(r.cleared.canvas, "d3plus-render-canvas");
});
