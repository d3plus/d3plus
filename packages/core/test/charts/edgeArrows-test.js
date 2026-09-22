import assert from "assert";

import {arrowEnds, arrowPathD, arrowSizeFor, straightArrowTip} from "../../es/src/charts/features/edgeArrows.js";
import {render, closeBrowser} from "../playwright.js";

after(async () => {
  await closeBrowser();
});

const box = "<div id='viz' style='width:420px;height:420px'></div>";

it("arrowEnds normalizes every accepted value", () => {
  assert.deepStrictEqual(arrowEnds(false, {}, 0), {source: false, target: false});
  assert.deepStrictEqual(arrowEnds(true, {}, 0), {source: false, target: true});
  assert.deepStrictEqual(arrowEnds("target", {}, 0), {source: false, target: true});
  assert.deepStrictEqual(arrowEnds("source", {}, 0), {source: true, target: false});
  assert.deepStrictEqual(arrowEnds("both", {}, 0), {source: true, target: true});
  assert.deepStrictEqual(arrowEnds(d => d.dir, {dir: "both"}, 0), {source: true, target: true});
  assert.deepStrictEqual(arrowEnds(d => d.dir, {dir: false}, 0), {source: false, target: false});
});

it("arrowPathD builds a closed triangle with the tip at (x,y)", () => {
  const d = arrowPathD(10, 20, 0, 6); // pointing +x
  assert.ok(d.startsWith("M10,20"), "starts at the tip");
  assert.ok(d.trim().endsWith("Z"), "closed path");
  const pts = d.replace(/[MLZ]/g, " ").trim().split(/\s+/).filter(Boolean);
  assert.strictEqual(pts.length, 3, "three points");
  // Base sits behind the tip along −x at distance `size` (10 − 6 = 4).
  assert.ok(d.includes("4,"), "base offset back from tip by size");
});

it("arrowSizeFor honors a number, an accessor, and the stroke-width fallback", () => {
  assert.strictEqual(arrowSizeFor(12, {}, 0, 1), 12);
  assert.strictEqual(arrowSizeFor(d => d.s, {s: 9}, 0, 1), 9);
  assert.strictEqual(arrowSizeFor(undefined, {}, 0, 4), 12); // max(6, 4*3)
  assert.strictEqual(arrowSizeFor(undefined, {}, 0, 1), 6); // max(6, 3)
});

it("straightArrowTip insets the tip to the node boundary and points at the target", () => {
  const tip = straightArrowTip(0, 0, 10, 0, 2, 1); // toward (10,0), r=2, gap=1
  assert.strictEqual(Math.round(tip.angle * 1000) / 1000, 0, "points along +x");
  assert.strictEqual(tip.x, 7, "inset by r + gap");
  assert.strictEqual(tip.y, 0);
});

it("Network draws arrow triangles at the selected ends, and none when off", async function () {
  this.timeout(60000);
  const r = await render(box, async () => {
    const count = arrows => new Promise(res => {
      document.querySelector("#viz").innerHTML = "";
      const viz = new window.d3plus.Network().select("#viz").arrows(arrows)
        .nodes([{id: "a"}, {id: "b"}, {id: "c"}])
        .links([{source: "a", target: "b"}, {source: "a", target: "c"}, {source: "b", target: "c"}])
        .width(420).height(420).duration(0);
      viz.render(() => {
        const paths = Array.from(document.querySelectorAll("#viz svg path"));
        res(paths.filter(p => (p.getAttribute("d") || "").trim().endsWith("Z")).length);
      });
    });
    return {off: await count(false), target: await count("target"), both: await count("both")};
  });
  assert.strictEqual(r.off, 0, "no arrows by default");
  assert.strictEqual(r.target, 3, "one arrow per link at the target end");
  assert.strictEqual(r.both, 6, "two arrows per link");
});

it("Sankey draws an arrow triangle per link end", async function () {
  this.timeout(60000);
  const r = await render(box, async () => {
    const count = arrows => new Promise(res => {
      document.querySelector("#viz").innerHTML = "";
      const viz = new window.d3plus.Sankey().select("#viz").arrows(arrows)
        .links([{source: "a", target: "b", value: 4}, {source: "b", target: "c", value: 2}])
        .width(420).height(420).duration(0);
      viz.render(() => {
        const paths = Array.from(document.querySelectorAll("#viz svg path"));
        res(paths.filter(p => (p.getAttribute("d") || "").trim().endsWith("Z")).length);
      });
    });
    return {off: await count(false), both: await count("both")};
  });
  assert.strictEqual(r.off, 0, "no arrows by default");
  assert.strictEqual(r.both, 4, "2 links × 2 ends");
});
