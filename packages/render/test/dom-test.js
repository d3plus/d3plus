import assert from "assert";

import it from "./jsdom.js";
import {domToScene, SvgRenderer} from "../es/index.js";

const NS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

it("domToScene converts an svg subtree into scene nodes", () => {
  const g = svgEl("g", {transform: "translate(10,20)"});
  g.appendChild(svgEl("rect", {x: "1", y: "2", width: "30", height: "40", fill: "red"}));
  g.appendChild(svgEl("line", {x1: "0", y1: "0", x2: "100", y2: "0", stroke: "#ccc", "stroke-width": "2"}));
  g.appendChild(svgEl("path", {d: "M0,0L5,5", fill: "none", stroke: "blue"}));

  const text = svgEl("text", {x: "5", "font-size": "12px", "text-anchor": "middle", fill: "black"});
  const tspan = svgEl("tspan", {x: "5", y: "8"});
  tspan.textContent = "Hi";
  text.appendChild(tspan);
  g.appendChild(text);

  const scene = domToScene(g);
  assert.strictEqual(scene.type, "group", "root is a group");
  assert.deepStrictEqual(scene.transform, {x: 10, y: 20}, "group transform parsed");

  const rect = scene.children.find(c => c.type === "rect");
  assert.strictEqual(rect.width, 30, "rect width");
  assert.strictEqual(rect.paint.fill, "red", "rect fill from attr");

  const line = scene.children.find(c => c.type === "line");
  assert.deepStrictEqual(line.points, [[0, 0], [100, 0]], "line endpoints");
  assert.strictEqual(line.paint.strokeWidth, 2, "line stroke width");

  const path = scene.children.find(c => c.type === "path");
  assert.strictEqual(path.d, "M0,0L5,5", "path d");

  const txt = scene.children.find(c => c.type === "text");
  assert.strictEqual(txt.font.size, 12, "font-size parsed (px stripped)");
  assert.strictEqual(txt.font.anchor, "middle", "text-anchor");
  assert.strictEqual(txt.lines[0].text, "Hi", "tspan text captured");
});

it("domToScene output re-renders through SvgRenderer", () => {
  const g = svgEl("g");
  g.appendChild(svgEl("rect", {x: "0", y: "0", width: "10", height: "10", fill: "green"}));

  const scene = domToScene(g);
  const r = new SvgRenderer();
  r.mount({container: document.body, width: 50, height: 50});
  r.drawScene({width: 50, height: 50, root: scene});

  const rect = document.querySelector("rect.d3plus-render-rect");
  assert.ok(rect, "snapshot rect re-rendered");
  assert.strictEqual(rect.getAttribute("fill"), "green", "fill preserved through the round trip");
  r.destroy();
});
