import {describe, it} from "vitest";
import assert from "node:assert/strict";

import {
  columnKind,
  firstSentence,
  nodeClasses,
  onPath,
  TIP_WIDTH,
  tipStyle,
} from "../src/components/ChartChooser/view.ts";

describe("onPath", () => {
  it("is whether a key is the target or one of its ancestors", () => {
    assert.equal(onPath("root/time", "root/time/trend/LinePlot"), true);
    assert.equal(
      onPath("root/time/trend/LinePlot", "root/time/trend/LinePlot"),
      true,
    );
    assert.equal(onPath("root/tim", "root/time"), false);
    assert.equal(onPath("root", null), false);
  });
});

describe("nodeClasses", () => {
  const flags = {idle: false, selected: "root/a/B", active: null};
  it("marks a node lit, dim, or idle, and on the selected or hovered path", () => {
    assert.equal(
      nodeClasses("root/a", {lit: true}, flags),
      "is-lit is-selected ",
    );
    assert.equal(nodeClasses("root/c", {lit: false}, flags), "is-dim  ");
    assert.equal(
      nodeClasses("root/c", undefined, {
        idle: true,
        selected: null,
        active: "root/c",
      }),
      "is-idle  is-active",
    );
  });
});

describe("tipStyle", () => {
  it("floats a dendrogram leaf's tip to its left", () => {
    assert.deepEqual(
      tipStyle({x: 500, y: 40, width: 700, outline: false}, true),
      {
        top: "40px",
        left: `${500 - TIP_WIDTH - 12}px`,
        transform: "translateY(-50%)",
      },
    );
  });
  it("floats other tips beneath their node, inside the tree", () => {
    assert.deepEqual(
      tipStyle({x: 300, y: 40, width: 400, outline: true}, true),
      {
        top: "56px",
        left: `${400 - TIP_WIDTH}px`,
      },
    );
    assert.deepEqual(
      tipStyle({x: 10, y: 0, width: 200, outline: false}, false),
      {
        top: "16px",
        left: "0px",
      },
    );
  });
});

describe("columnKind", () => {
  it("is a column's type, or geo for places", () => {
    assert.equal(columnKind({type: "number"}), "number");
    assert.equal(columnKind({type: "category", geo: "iso3"}), "geo");
    assert.equal(columnKind({type: "number", coord: "lat"}), "geo");
  });
});

describe("firstSentence", () => {
  it("is the first sentence, without links or code marks", () => {
    assert.equal(
      firstSentence("Draws a [Pie](#Pie) with a `hole`. More text. Even more."),
      "Draws a Pie with a hole.",
    );
    assert.equal(firstSentence("v1.2 is the version"), "v1.2 is the version");
  });
});
