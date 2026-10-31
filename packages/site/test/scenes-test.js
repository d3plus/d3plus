import {describe, it} from "vitest";
import assert from "node:assert/strict";

import * as core from "@d3plus/core";

import {DWELL, SCENES, nextScene} from "../src/components/Hero/scenes.ts";

describe("hero scenes", () => {
  it("each scene is a @d3plus/core chart, set only through its own methods", () => {
    for (const {chart, config} of SCENES) {
      assert.equal(typeof core[chart], "function", `${chart} is exported`);
      const instance = new core[chart]();
      for (const key of Object.keys(config))
        assert.equal(typeof instance[key], "function", `${chart}.${key}()`);
    }
  });

  it("turns off the chart chrome in every scene", () => {
    for (const {chart, config} of SCENES)
      for (const key of [
        "legend",
        "tooltip",
        "zoom",
        "saveControl",
        "search",
        "tableView",
      ])
        assert.equal(config[key], false, `${chart} ${key}`);
  });

  it("shows each chart once per loop", () => {
    const charts = SCENES.map(d => d.chart);
    assert.equal(new Set(charts).size, charts.length);
    assert.ok(DWELL > 0);
  });

  it("nextScene steps through every scene and wraps to the first", () => {
    assert.equal(nextScene(0), 1);
    assert.equal(nextScene(SCENES.length - 1), 0);
    const seen = new Set([0]);
    for (let i = nextScene(0); i !== 0; i = nextScene(i)) seen.add(i);
    assert.equal(seen.size, SCENES.length);
  });
});
