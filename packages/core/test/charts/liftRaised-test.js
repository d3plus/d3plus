import {it} from "vitest";
import assert from "assert";
import {
  isClipWrapper,
  liftRaised,
  RAISE_Z,
  RAISED_KEY_SUFFIX,
} from "../../src/charts/viz/liftRaised.ts";
import {isBreakMask} from "../../src/charts/Plot/plotBreaks.ts";
import {applyInteractionOpacity} from "../../src/charts/viz/interactionOpacity.ts";

/**
    `liftRaised`: a raised mark inside a Plot's clip groups moves to a raised
    copy of their chain, placed right after it, so it paints in front of the
    labels and runs beside the groups while the rest stay put.
*/

const rect = (key, z) => ({
  type: "rect",
  key,
  x: 0,
  y: 0,
  width: 5,
  height: 5,
  ...(z === undefined ? {} : {z}),
});
const text = key => ({type: "text", key, lines: []});
const clip = {type: "path", d: "M0,0L1,0L1,1Z"};

/** A plot's content: x and y masks around a domain clip around `marks`, then labels. */
const content = (marks, prefix = "") => [
  {
    type: "group",
    key: `${prefix}plot-break-mask-x`,
    children: [
      {
        type: "group",
        key: `${prefix}plot-break-mask-y`,
        clip,
        children: [
          rect(`${prefix}background`),
          {
            type: "group",
            key: `${prefix}plot-domain-clip-0`,
            z: 2,
            children: marks,
          },
        ],
      },
    ],
  },
  text(`${prefix}a_0`),
  text(`${prefix}b_0`),
];

it("isBreakMask and isClipWrapper find the clip groups, also under a panel prefix", () => {
  const group = key => ({type: "group", key, children: []});
  for (const key of [
    "plot-break-mask-x",
    "plot-break-mask-y-1",
    "facet-a/plot-break-mask-y",
  ]) {
    assert.ok(isBreakMask(group(key)), key);
    assert.ok(isClipWrapper(group(key)), key);
  }
  assert.ok(isClipWrapper(group("facet-a/plot-domain-clip-3")));
  for (const key of [
    "plot-break-masks",
    "plot-break-mask-x~raised",
    "plot-zoom-content",
  ])
    assert.ok(!isClipWrapper(group(key)), key);
  assert.ok(!isBreakMask(rect("plot-break-mask-x")), "only groups");
});

it("liftRaised leaves a scene with nothing raised as it is", () => {
  const nodes = content([rect("a"), rect("b")]);
  assert.strictEqual(liftRaised(nodes), nodes);
});

it("liftRaised moves a raised mark to a raised copy of its clip groups", () => {
  const out = liftRaised(content([rect("a"), rect("b", RAISE_Z)]));
  assert.deepStrictEqual(
    out.map(n => n.key),
    [
      "plot-break-mask-x",
      `plot-break-mask-x${RAISED_KEY_SUFFIX}`,
      "a_0",
      "b_0",
    ],
    "the copy right after its group, before the labels",
  );
  const [rest, copy] = out;
  assert.strictEqual(copy.z, RAISE_Z, "the copy is raised");
  assert.strictEqual(rest.z, undefined, "the group itself isn't");
  const inner = copy.children[0];
  assert.strictEqual(inner.key, "plot-break-mask-y");
  assert.strictEqual(inner.clip, clip, "the copy keeps the clips");
  assert.deepStrictEqual(
    inner.children.map(n => n.key),
    ["plot-domain-clip-0"],
    "only the chain to the raised mark",
  );
  assert.deepStrictEqual(
    inner.children[0].children.map(n => n.key),
    ["b"],
  );
  const restInner = rest.children[0];
  assert.deepStrictEqual(
    restInner.children.map(n => n.key),
    ["background", "plot-domain-clip-0"],
  );
  assert.deepStrictEqual(
    restInner.children[1].children.map(n => n.key),
    ["a"],
    "the other marks stay",
  );
  assert.strictEqual(restInner.children[1].z, 2, "and keep their run's z");
});

it("liftRaised reaches clip groups inside other groups, such as a facet panel", () => {
  const panel = {
    type: "group",
    key: "facet-a",
    children: content([rect("facet-a/a", RAISE_Z)], "facet-a/"),
  };
  const [out] = liftRaised([panel]);
  assert.notStrictEqual(out, panel);
  assert.deepStrictEqual(
    out.children.map(n => n.key),
    [
      "facet-a/plot-break-mask-x",
      `facet-a/plot-break-mask-x${RAISED_KEY_SUFFIX}`,
      "facet-a/a_0",
      "facet-a/b_0",
    ],
  );
});

it("applyInteractionOpacity lifts a hovered, active or highlighted mark out of its clip groups", () => {
  const mark = (key, country) => ({
    ...rect(key),
    datum: {__d3plus__: true, data: {country}},
  });
  for (const state of ["_hover", "_active", "_highlight"]) {
    const viz = {
      [state]: d => d.country === "Brazil",
      schema: {shapeConfig: {}},
    };
    const out = applyInteractionOpacity(
      content([mark("b", "Brazil"), mark("c", "Chile")]),
      viz,
    );
    const copy = out.find(n => n.key.endsWith(RAISED_KEY_SUFFIX));
    assert.ok(copy, `${state}: lifted`);
    assert.deepStrictEqual(
      copy.children[0].children[0].children.map(n => n.key),
      ["b"],
      state,
    );
  }
});
