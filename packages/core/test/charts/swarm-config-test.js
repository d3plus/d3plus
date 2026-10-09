import assert from "assert";
import it from "../jsdom.js";
import {Beeswarm, Plot, RESET} from "../../es/index.js";

it("Plot swarm defaults: auto, with padding 1 and shrink overflow", () => {
  const viz = new Plot();
  assert.strictEqual(viz.swarm(), "auto");
  assert.deepStrictEqual(viz.swarmConfig(), {padding: 1, overflow: "shrink"});
  assert.strictEqual(new Beeswarm().swarm(), true);
});

it("swarmConfig: a nested override keeps its siblings, and every instance gets a fresh bag", () => {
  const viz = new Beeswarm().swarmConfig({overflow: "clamp"});
  assert.deepStrictEqual(viz.swarmConfig(), {padding: 1, overflow: "clamp"});
  assert.deepStrictEqual(
    new Beeswarm().swarmConfig(),
    {padding: 1, overflow: "shrink"},
    "defaults untouched",
  );
});

it("swarmConfig: RESET restores one key or the whole bag", () => {
  const viz = new Beeswarm().config({
    swarmConfig: {padding: 3, overflow: "visible"},
  });
  viz.config({swarmConfig: {padding: RESET}});
  assert.deepStrictEqual(viz.swarmConfig(), {padding: 1, overflow: "visible"});
  viz.config({swarmConfig: RESET});
  assert.deepStrictEqual(viz.swarmConfig(), {padding: 1, overflow: "shrink"});
  viz.config({swarm: false}).config({swarm: RESET});
  assert.strictEqual(viz.swarm(), true, "Beeswarm's own swarm default");
});

it("Beeswarm shapeConfig: Circle labels and trails off, deep-merged over Plot's circle defaults", () => {
  const viz = new Beeswarm();
  const plotCircle = new Plot().shapeConfig().Circle;
  const {Circle} = viz.shapeConfig();
  assert.strictEqual(Circle.label, false);
  assert.strictEqual(Circle.trail, false);
  assert.strictEqual(
    typeof Circle.r,
    "function",
    "Plot's size-scaled radius kept",
  );
  assert.strictEqual(plotCircle.trail, true, "Plot keeps its trails");

  viz.config({shapeConfig: {Circle: {trail: true}}});
  assert.strictEqual(viz.shapeConfig().Circle.trail, true);
  assert.strictEqual(viz.shapeConfig().Circle.label, false, "sibling kept");
  viz.shapeConfig({Circle: {fill: "red"}});
  assert.strictEqual(
    viz.shapeConfig().Circle.trail,
    true,
    "shapeConfig() deep-merges too",
  );
  viz.config({shapeConfig: {Circle: {trail: RESET}}});
  assert.strictEqual(
    viz.shapeConfig().Circle.trail,
    false,
    "RESET restores Beeswarm's default",
  );
});
