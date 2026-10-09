import assert from "assert";

import it from "./jsdom.js";
import {SvgRenderer} from "../es/index.js";

function scene(children) {
  return {width: 200, height: 100, root: {type: "group", key: "root", children}};
}

function mounted() {
  const renderer = new SvgRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});
  return renderer;
}

const byKey = key => document.querySelector(`svg.d3plus-render-svg [data-key="${key}"]`);

it("SvgRenderer creates, updates and releases group clip paths", () => {
  const renderer = mounted();
  assert.strictEqual(renderer.target().width, 200, "target() exposes the mount target");
  const clipped = clip => scene([
    {type: "group", key: "g", clip, children: [{type: "rect", key: "r", x: 0, y: 0, width: 10, height: 10}]},
  ]);

  renderer.drawScene(clipped({type: "rect", x: 1, y: 2, width: 30, height: 40}));
  const ref = byKey("g").getAttribute("clip-path");
  const id = ref.match(/#([^)]+)/)[1];
  const clipRect = document.getElementById(id).firstElementChild;
  assert.strictEqual(clipRect.tagName.toLowerCase(), "rect", "rect clip shape");
  assert.strictEqual(clipRect.getAttribute("width"), "30", "rect clip width");

  renderer.drawScene(clipped({type: "path", d: "M0,0H5V5Z"}));
  assert.strictEqual(byKey("g").getAttribute("clip-path"), ref, "clip id is reused across draws");
  const clipPath = document.getElementById(id).firstElementChild;
  assert.strictEqual(clipPath.getAttribute("d"), "M0,0H5V5Z", "clip shape replaced with a path");

  renderer.drawScene(clipped(undefined));
  assert.strictEqual(byKey("g").getAttribute("clip-path"), null, "clip removed from the group");
  assert.strictEqual(document.getElementById(id), null, "clipPath element removed");

  renderer.drawScene(clipped({type: "rect", x: 0, y: 0, width: 5, height: 5}));
  const id2 = byKey("g").getAttribute("clip-path").match(/#([^)]+)/)[1];
  renderer.drawScene(scene([]));
  assert.strictEqual(document.getElementById(id2), null, "exiting group releases its clipPath");
  renderer.destroy();
});

it("SvgRenderer draws lines, areas, images and transforms", () => {
  const renderer = mounted();
  renderer.drawScene(scene([
    {type: "line", key: "ln", points: [[0, 0], [10, 10], [20, 0]], curve: "monotoneX", paint: {stroke: "red"}},
    {type: "area", key: "ar", topline: [[0, 10], [20, 10]], baseline: [[0, 20], [20, 20]], paint: {fill: "blue"}},
    {type: "image", key: "img", x: 1, y: 2, width: 30, height: 40, href: "data:,", preserveAspectRatio: "none"},
    {type: "rect", key: "rot", x: 0, y: 0, width: 5, height: 5, transform: {rotate: 45}},
    {type: "rect", key: "anchor", x: 0, y: 0, width: 5, height: 5, transform: {rotate: 90, rotateAnchor: [2, 3]}},
    {type: "rect", key: "scaled", x: 0, y: 0, width: 5, height: 5, rx: 2, transform: {scale: 2}},
  ]));
  assert.match(byKey("ln").getAttribute("d"), /^M0,0/, "line path drawn");
  assert.match(byKey("ar").getAttribute("d"), /^M0,10/, "area path drawn");
  const img = byKey("img");
  assert.strictEqual(img.getAttribute("href"), "data:,", "image href set");
  assert.strictEqual(img.getAttribute("preserveAspectRatio"), "none", "image aspect ratio set");
  assert.strictEqual(byKey("rot").getAttribute("transform"), "rotate(45)", "plain rotation");
  assert.strictEqual(byKey("anchor").getAttribute("transform"), "rotate(90,2,3)", "anchored rotation");
  assert.strictEqual(byKey("scaled").getAttribute("transform"), "scale(2)", "scale only");
  assert.strictEqual(byKey("scaled").getAttribute("rx"), "2", "rect corner radius");
  renderer.destroy();
});

it("SvgRenderer renders styled text runs and switches lines between plain and styled", () => {
  const renderer = mounted();
  const text = lines => scene([{type: "text", key: "t", x: 0, y: 0, font: {size: 12}, lines}]);
  renderer.drawScene(text([{text: "ab", x: 0, y: 10, width: 20, runs: [
    {text: "a", style: {weight: 700}},
    {text: "b", style: {style: "italic", weight: 400}},
    {text: "c", style: {}},
  ]}]));
  let spans = byKey("t").querySelectorAll("tspan tspan");
  assert.strictEqual(spans.length, 3, "one tspan per run");
  assert.strictEqual(spans[0].getAttribute("style"), "font-weight: 700", "weight run style");
  assert.strictEqual(spans[1].getAttribute("style"), "font-weight: 400; font-style: italic", "combined run style");
  assert.strictEqual(spans[2].getAttribute("style"), null, "unstyled run has no style");

  renderer.drawScene(text([{text: "plain", x: 0, y: 10, width: 20}]));
  assert.strictEqual(byKey("t").querySelectorAll("tspan tspan").length, 0, "run tspans removed");
  assert.strictEqual(byKey("t").textContent, "plain", "plain text restored");

  renderer.drawScene(text([{text: "x", x: 0, y: 10, width: 20, runs: [{text: "x", style: {weight: 700}}]}]));
  spans = byKey("t").querySelectorAll("tspan tspan");
  assert.strictEqual(spans.length, 1, "styled again after plain");
  assert.strictEqual(byKey("t").textContent, "x", "stray plain text dropped");
  renderer.destroy();
});

it("SvgRenderer dispatches pointer events with hover enter/leave", () => {
  const renderer = mounted();
  renderer.drawScene(scene([
    {type: "rect", key: "a", x: 0, y: 0, width: 10, height: 10},
    {type: "rect", key: "b", x: 20, y: 0, width: 10, height: 10},
    {type: "rect", key: "inert", x: 40, y: 0, width: 10, height: 10, interactive: false},
  ]));
  const events = [];
  const off = renderer.on(e => events.push(`${e.type}:${e.pick ? e.pick.node.key : "-"}`));
  const fire = (el, type) => el.dispatchEvent(new MouseEvent(type, {bubbles: true, clientX: 1, clientY: 1}));
  const svg = document.querySelector("svg.d3plus-render-svg");
  fire(byKey("a"), "mousemove");
  fire(byKey("a"), "mousemove");
  fire(byKey("b"), "mousemove");
  fire(byKey("inert"), "mousemove");
  fire(byKey("b"), "click");
  fire(byKey("b"), "dblclick");
  fire(byKey("a"), "contextmenu");
  fire(svg, "mouseleave");
  window.dispatchEvent(new window.Event("resize"));
  assert.deepStrictEqual(events, [
    "mouseenter:a", "mousemove:a",
    "mousemove:a",
    "mouseleave:-", "mouseenter:b", "mousemove:b",
    "mouseleave:-", "mousemove:-",
    "click:b", "dblclick:b", "contextmenu:a",
    "mouseleave:-",
  ]);
  off();
  fire(byKey("a"), "click");
  assert.strictEqual(events.length, 12, "unsubscribed handler no longer called");
  renderer.destroy();
  assert.strictEqual(renderer.toSVGString(), "", "no markup after destroy");
});

it("SvgRenderer resolves finished immediately without a duration and after one with it", async() => {
  const renderer = mounted();
  let ended = 0;
  await renderer.drawScene(scene([{type: "rect", key: "a", x: 0, y: 0, width: 5, height: 5}]),
    {onEnd: () => ended++}).finished;
  assert.strictEqual(ended, 1, "onEnd called for an instant draw");
  await renderer.drawScene(scene([{type: "rect", key: "a", x: 0, y: 0, width: 50, height: 50}]),
    {duration: 20, onEnd: () => ended++}).finished;
  assert.strictEqual(ended, 2, "onEnd called after the transition");
  renderer.destroy();
});
