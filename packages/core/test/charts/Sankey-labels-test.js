import assert from "node:assert";
import {it} from "vitest";

import {useJsdom} from "~test/jsdom.js";
import {Sankey} from "../../index.ts";
import {applySankeyLayout, runStages, sankeyDef} from "../../internal.ts";

useJsdom();

const links = [
  {source: "alpha", target: "beta", value: 10},
  {source: "alpha", target: "gamma", value: 10},
  {source: "beta", target: "delta", value: 10},
  {source: "gamma", target: "delta", value: 10},
  {source: "thin", target: "gamma", value: 0.05},
];

/** Lays out a 600×400 Sankey and returns its emitted nodes and text labels. */
function draw(configure = viz => viz) {
  const viz = configure(new Sankey().links(links).value("value"))
    .width(600)
    .height(400);
  viz._preDraw();
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  viz._padding = {top: 0, right: 0, bottom: 0, left: 0};
  const {shapeData} = runStages({viz}, [applySankeyLayout]);
  const scene = sankeyDef.emit({viz});
  const nodes = Object.fromEntries(shapeData.map(d => [d.id, d]));
  const labels = Object.fromEntries(
    scene
      .filter(n => n.type === "text")
      .map(n => [n.lines.map(l => l.text).join(" "), n]),
  );
  return {nodes, labels};
}

/** A label's anchor point (start or end of its first line) and baseline. */
const anchor = label => ({
  x: label.transform.x + label.lines[0].x,
  y: label.transform.y + label.lines[0].y,
});

it("labels each node to its right, except in the last column", () => {
  const {nodes, labels} = draw();
  for (const id of ["alpha", "beta", "gamma"]) {
    const label = labels[id];
    assert.ok(label, `${id} has a label`);
    assert.strictEqual(label.font.anchor, "start");
    assert.ok(anchor(label).x > nodes[id].x1, `${id}'s label follows its node`);
  }
  const delta = labels.delta;
  assert.ok(delta, "delta has a label");
  assert.strictEqual(delta.font.anchor, "end");
  assert.ok(anchor(delta).x < nodes.delta.x0, "delta's label precedes it");
});

it("centers each label on its node", () => {
  const {nodes, labels} = draw();
  for (const id of ["alpha", "beta", "delta"]) {
    const label = labels[id];
    const middle = (nodes[id].y0 + nodes[id].y1) / 2;
    const baseline = anchor(label).y;
    assert.ok(
      baseline > middle && baseline - middle < label.font.size,
      `${id}'s baseline sits just below its middle`,
    );
  }
});

it("hides a label without enough vertical space", () => {
  const {nodes, labels} = draw(viz => viz.nodePadding(2));
  assert.ok(nodes.thin.y1 - nodes.thin.y0 < 2, "thin is a sliver");
  assert.strictEqual(labels.thin, undefined);
  assert.ok(labels.gamma, "its neighbor keeps its label");
});

it("takes its text from label() and shapeConfig", () => {
  const custom = draw(viz => viz.label(d => `Node ${d.id}`)).labels;
  assert.ok(custom["Node alpha"]);

  const perShape = draw(viz =>
    viz.shapeConfig({Rect: {label: d => (d.id === "beta" ? false : d.id)}}),
  ).labels;
  assert.strictEqual(perShape.beta, undefined);
  assert.ok(perShape.alpha);

  const off = draw(viz => viz.shapeConfig({Rect: {label: false}})).labels;
  assert.deepStrictEqual(Object.keys(off), []);
});

it("takes its style from shapeConfig.labelConfig", () => {
  const {labels} = draw(viz =>
    viz.shapeConfig({labelConfig: {fontColor: "red", fontSize: 16}}),
  );
  assert.strictEqual(labels.alpha.font.size, 16);
  assert.strictEqual(labels.alpha.paint.fill, "red");
});
