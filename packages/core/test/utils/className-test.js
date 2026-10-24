import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {
  applyClassName,
  classNames,
  rendererSurfaces,
  setUserClasses,
  withRootClasses,
} from "../../src/utils/className.ts";
import {vizClassNameTargets} from "../../src/charts/viz/vizClassName.ts";
import {BarChart, Legend, TextBox, Tooltip} from "../../index.ts";

useJsdom();

it("classNames splits strings and arrays into distinct classes", () => {
  assert.deepStrictEqual(classNames("revenue-chart  dark"), [
    "revenue-chart",
    "dark",
  ]);
  assert.deepStrictEqual(classNames(["a b", "c", "a"]), ["a", "b", "c"]);
  assert.deepStrictEqual(classNames(" "), []);
  for (const empty of [undefined, null, false, 3, {}])
    assert.deepStrictEqual(classNames(empty), []);
});

it("setUserClasses replaces the classes it added and keeps the rest", () => {
  const el = document.createElement("div");
  el.setAttribute("class", "fixed page");
  setUserClasses(el, "a b", ["fixed"]);
  assert.strictEqual(el.getAttribute("class"), "fixed page a b");
  setUserClasses(el, ["b", "c"], ["fixed"]);
  assert.strictEqual(el.getAttribute("class"), "fixed page b c");
  setUserClasses(el, "fixed", ["fixed"]);
  setUserClasses(el, undefined, ["fixed"]);
  assert.strictEqual(
    el.getAttribute("class"),
    "fixed page",
    "a fixed class the user also named stays",
  );
});

it("applyClassName tags every element an instance reports", () => {
  const a = document.createElement("div");
  const b = document.createElement("div");
  b.className = "keep";
  const host = {
    schema: {className: "x"},
    _classNameTargets: () => [{el: a}, {el: b, keep: ["keep"]}],
  };
  applyClassName(host);
  assert.strictEqual(a.className, "x");
  assert.strictEqual(b.className, "keep x");
});

it("withRootClasses adds classes to the root element's markup", () => {
  assert.strictEqual(
    withRootClasses('<svg class="d3plus-render-svg" width="2"><g></g></svg>', [
      "dark",
      "d3plus-render-svg",
    ]),
    '<svg class="d3plus-render-svg dark" width="2"><g></g></svg>',
  );
  assert.strictEqual(
    withRootClasses('<svg width="2"><g class="x"></g></svg>', 'a"b'),
    '<svg class="a&quot;b" width="2"><g class="x"></g></svg>',
  );
  assert.strictEqual(withRootClasses("<svg></svg>", undefined), "<svg></svg>");
  assert.strictEqual(withRootClasses("", "a"), "");
});

it("vizClassNameTargets picks the root svg, or the canvas", () => {
  const container = document.createElement("div");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "d3plus-viz");
  const inner = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const canvas = document.createElement("canvas");
  const overlays = document.createElement("div");
  svg.appendChild(inner);
  container.append(svg, canvas, overlays);
  const svgTargets = vizClassNameTargets(
    svg,
    {elements: () => [inner, overlays]},
    "svg",
  );
  assert.deepStrictEqual(
    svgTargets.map(t => t.el),
    [svg],
  );
  assert.deepStrictEqual(svgTargets[0].keep, ["d3plus-viz"]);
  const canvasTargets = vizClassNameTargets(
    svg,
    {elements: () => [canvas, overlays]},
    "canvas",
  );
  assert.deepStrictEqual(
    canvasTargets.map(t => t.el),
    [canvas],
    "the root svg stacked over the canvas and the overlay layer stay plain",
  );
  assert.deepStrictEqual(
    vizClassNameTargets(container, undefined, "svg"),
    [],
    "the page's own container never takes the classes",
  );
});

it("rendererSurfaces leaves out the overlay layer", () => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const overlays = document.createElement("div");
  assert.deepStrictEqual(rendererSurfaces({elements: () => [svg, overlays]}), [
    svg,
  ]);
  assert.deepStrictEqual(rendererSurfaces(undefined), []);
  assert.deepStrictEqual(rendererSurfaces({}), []);
});

it("className is a getter/setter on every chart and component", () => {
  for (const instance of [
    new BarChart(),
    new Legend(),
    new TextBox(),
    new Tooltip(),
  ]) {
    assert.strictEqual(instance.className(), undefined);
    assert.strictEqual(instance.className("a b"), instance);
    assert.strictEqual(instance.className(), "a b");
    instance.config({className: ["c"]});
    assert.deepStrictEqual(instance.config().className, ["c"]);
  }
});

it("a standalone component's svg takes its classes", async () => {
  const div = document.createElement("div");
  document.body.appendChild(div);
  const legend = new Legend()
    .select(div)
    .data([{id: "a"}, {id: "b"}])
    .className("key dark");
  await new Promise(cb => legend.render(cb));
  const svg = div.querySelector("svg.d3plus-render-svg");
  assert.strictEqual(svg.getAttribute("class"), "d3plus-render-svg key dark");
  legend.className("light");
  assert.strictEqual(
    svg.getAttribute("class"),
    "d3plus-render-svg light",
    "setting it again replaces the classes at once",
  );
});

it("tooltips take their className beside the fixed d3plus-tooltip class", () => {
  const tip = new Tooltip()
    .className("dark-tip")
    .data([{id: "a", title: "A"}])
    .render();
  const el = document.querySelector(`[id^="d3plus-tooltip-${tip._uuid}-"]`);
  assert.strictEqual(el.getAttribute("class"), "d3plus-tooltip dark-tip");
  tip.className("light-tip").render();
  assert.strictEqual(el.getAttribute("class"), "d3plus-tooltip light-tip");
  tip.className(undefined).render();
  assert.strictEqual(el.getAttribute("class"), "d3plus-tooltip");
});
