import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";

import {Network} from "../../index.ts";
import {
  emitLinkLabels,
  LINK_LABEL_DEFAULTS,
  makeLinkDatum,
  linkLabelSettings,
  linkLabelText,
  textLineBoxes,
} from "../../internal.ts";
import {
  backgroundInk,
  chartBackground,
} from "../../src/charts/viz/backgroundInk.ts";

useJsdom();

/**
    The chart side of link labels: reading `linkLabelConfig`, turning a
    `linkLabel` value into text, and emitting each label that fits as an
    inert group (a background pad and the text) at its link's middle.
*/

it("linkLabelSettings — the defaults, overrides, and the rest as TextBox config", () => {
  const viz = new Network();
  assert.deepStrictEqual(linkLabelSettings(viz), {
    rotate: "along",
    fontSize: LINK_LABEL_DEFAULTS.fontSize,
    padding: LINK_LABEL_DEFAULTS.padding,
    backgroundOpacity: LINK_LABEL_DEFAULTS.backgroundOpacity,
    minRadius: LINK_LABEL_DEFAULTS.minRadius,
    text: {},
  });
  assert.strictEqual(LINK_LABEL_DEFAULTS.minRadius, 2);
  assert.strictEqual(
    viz.linkLabelConfig().minRadius,
    2,
    "the accessor's default",
  );
  viz.linkLabelConfig({
    rotate: "horizontal",
    fontSize: 14,
    padding: 0,
    backgroundOpacity: 3,
    minRadius: 1.25,
    fontWeight: 700,
  });
  assert.deepStrictEqual(linkLabelSettings(viz), {
    rotate: "horizontal",
    fontSize: 14,
    padding: 0,
    backgroundOpacity: 1,
    minRadius: 1.25,
    text: {fontWeight: 700},
  });
  viz.linkLabelConfig({
    rotate: "sideways",
    fontSize: -1,
    padding: "x",
    minRadius: -2,
  });
  const bad = linkLabelSettings(viz);
  assert.deepStrictEqual(
    [bad.rotate, bad.fontSize, bad.padding, bad.minRadius],
    [
      "along",
      LINK_LABEL_DEFAULTS.fontSize,
      LINK_LABEL_DEFAULTS.padding,
      LINK_LABEL_DEFAULTS.minRadius,
    ],
  );
  viz.linkLabelConfig({minRadius: 0});
  assert.strictEqual(linkLabelSettings(viz).minRadius, 0, "0 follows any bend");
});

it("linkLabelText — abbreviated numbers, strings as given, nothing else", () => {
  assert.strictEqual(linkLabelText(12), "12");
  assert.strictEqual(linkLabelText(1250000), "1.25M");
  assert.strictEqual(linkLabelText("rail"), "rail");
  assert.strictEqual(linkLabelText("  "), "");
  assert.strictEqual(linkLabelText(NaN), "");
  assert.strictEqual(linkLabelText(null), "");
  assert.strictEqual(linkLabelText(undefined), "");
  assert.strictEqual(linkLabelText({}), "");
});

/** Three links laid out along the x axis, and the chart drawing them. */
const setup = (config = {}) => {
  const links = [
    {source: "a", target: "b", w: 5, name: "left"},
    {source: "b", target: "c", w: 9, name: "right"},
    {source: "a", target: "c", w: 1, name: "under"},
  ];
  const viz = new Network().links(links).linkLabel("name").config(config);
  const end = id => ({data: {id}, i: 0, id});
  const link = i => ({
    datum: makeLinkDatum(
      links[i],
      end(links[i].source),
      end(links[i].target),
      i,
    ),
  });
  const requests = [
    {key: "l0", link: link(0), i: 0, anchor: {x: 50, y: 0, angle: 0}},
    {
      key: "l1",
      link: link(1),
      i: 1,
      anchor: {x: 150, y: 0, angle: Math.PI},
      priority: 9,
    },
    {key: "l2", link: link(2), i: 2, anchor: {x: 50, y: 1, angle: 0}},
    {key: "none", link: link(0), i: 0, anchor: null},
  ];
  return {viz, links, requests};
};

it("emitLinkLabels — nothing without linkLabel or links", () => {
  const {viz, requests} = setup();
  assert.deepStrictEqual(emitLinkLabels(viz, [], {}), []);
  viz.linkLabel(false);
  assert.deepStrictEqual(emitLinkLabels(viz, requests, {}), []);
});

it("emitLinkLabels — an inert group per label that fits, carrying its link", () => {
  const {viz, requests} = setup();
  const groups = emitLinkLabels(viz, requests, {});
  // "under" sits on "left" and has the lower priority, so it's hidden.
  assert.deepStrictEqual(
    groups.map(g => g.key),
    ["l1-label-group", "l0-label-group"],
    "higher priority first",
  );
  const [right, left] = groups;
  assert.strictEqual(right.type, "group");
  assert.strictEqual(right.interactive, false);
  assert.strictEqual(right.datum, requests[1].link.datum);
  assert.deepStrictEqual(right.transform, {x: 150, y: 0}, "upright: level");
  assert.deepStrictEqual(left.transform, {x: 50, y: 0});
  const [pad, text] = right.children;
  assert.strictEqual(pad.type, "rect");
  assert.strictEqual(pad.interactive, false);
  assert.strictEqual(
    pad.paint.fillOpacity,
    LINK_LABEL_DEFAULTS.backgroundOpacity,
  );
  near0(pad.x + pad.width / 2);
  near0(pad.y + pad.height / 2);
  assert.strictEqual(text.type, "text");
  assert.strictEqual(text.interactive, false);
  assert.strictEqual(text.datum, undefined, "dims with its group only");
  assert.strictEqual(text.lines.map(l => l.text).join(" "), "right");
  assert.strictEqual(text.font.size, LINK_LABEL_DEFAULTS.fontSize);
});

it("emitLinkLabels — rotates with the link, or stays level when horizontal", () => {
  const {viz, requests} = setup();
  const req = [
    {key: "d", link: requests[0].link, i: 0, anchor: {x: 0, y: 0, angle: 2}},
  ];
  const along = emitLinkLabels(viz, req, {})[0];
  assert.ok(
    Math.abs(along.transform.rotate - ((2 - Math.PI) * 180) / Math.PI) < 1e-4,
  );
  viz.linkLabelConfig({rotate: "horizontal"});
  assert.strictEqual(
    emitLinkLabels(viz, req, {})[0].transform.rotate,
    undefined,
  );
});

it("emitLinkLabels — hides a label over a node", () => {
  const {viz, requests} = setup();
  const groups = emitLinkLabels(viz, requests.slice(0, 2), {
    circles: [{x: 150, y: 0, r: 4}],
  });
  assert.deepStrictEqual(
    groups.map(g => g.key),
    ["l0-label-group"],
  );
  const boxed = emitLinkLabels(viz, requests.slice(0, 2), {
    boxes: [{x: 40, y: -2, width: 4, height: 4}],
  });
  assert.deepStrictEqual(
    boxed.map(g => g.key),
    ["l1-label-group"],
  );
});

it("emitLinkLabels — the pad takes the chart's background, the text its ink or fontColor", () => {
  const {viz, requests} = setup();
  const [group] = emitLinkLabels(viz, requests.slice(0, 1), {});
  const [pad, text] = group.children;
  assert.strictEqual(pad.paint.fill, chartBackground(viz));
  assert.strictEqual(text.paint.fill, backgroundInk(viz));
  viz.linkLabelConfig({fontColor: "#123456"});
  const [, custom] = emitLinkLabels(viz, requests.slice(0, 1), {})[0].children;
  assert.strictEqual(custom.paint.fill, "#123456");
});

/** Asserts a number is (about) zero. */
function near0(n) {
  assert.ok(Math.abs(n) < 1e-9, `${n} ≈ 0`);
}

it("textLineBoxes — each line's glyph box, rotated with its node", () => {
  const text = (anchor, transform, lines) => ({
    type: "text",
    key: "t",
    x: 0,
    y: 0,
    lines,
    font: {size: 10, anchor},
    transform,
  });
  const [start] = textLineBoxes([
    text("start", {x: 100, y: 50}, [{text: "ab", x: 0, y: 8, width: 20}]),
  ]);
  assert.deepStrictEqual(start, {
    x: 110,
    y: 55,
    width: 20,
    height: 10,
    angle: 0,
  });
  const [end] = textLineBoxes([
    text("end", {x: 0, y: 0}, [{text: "ab", x: 30, y: 8, width: 20}]),
  ]);
  assert.strictEqual(end.x, 20);
  const [middle] = textLineBoxes([
    {
      type: "group",
      key: "g",
      children: [text("middle", {}, [{text: "ab", x: 5, y: 8, width: 20}])],
    },
  ]);
  assert.strictEqual(middle.x, 5, "inside a group");
  // Rotated 90° about the node origin (0, 0): the line's center (10, 5)
  // swings to (-5, 10).
  const [turned] = textLineBoxes([
    text("start", {x: 0, y: 0, rotate: 90, rotateAnchor: [0, 0]}, [
      {text: "ab", x: 0, y: 8, width: 20},
    ]),
  ]);
  assert.ok(Math.abs(turned.x + 5) < 1e-9 && Math.abs(turned.y - 10) < 1e-9);
  assert.strictEqual(turned.angle, 90);
  const [measured] = textLineBoxes([
    text("start", {}, [{text: "abc", x: 0, y: 8, width: 0}]),
  ]);
  assert.ok(measured.width > 0, "an unmeasured line is measured");
  // Right-to-left start text extends left from its x.
  const [rtl] = textLineBoxes([
    {
      ...text("start", {x: 0, y: 0}, [{text: "ab", x: 30, y: 8, width: 20}]),
      font: {size: 10, anchor: "start", dir: "rtl"},
    },
  ]);
  assert.strictEqual(rtl.x, 20);
  assert.deepStrictEqual(
    textLineBoxes([text("start", {}, [{text: "", x: 0, y: 0, width: 5}])]),
    [],
  );
  assert.deepStrictEqual(textLineBoxes([{type: "rect", key: "r"}]), []);
});

it("emitLinkLabels — hides a label over another label's box", () => {
  const {viz, requests} = setup();
  const groups = emitLinkLabels(viz, requests.slice(0, 2), {
    labels: [{x: 150, y: 0, width: 10, height: 10, angle: 45}],
  });
  assert.deepStrictEqual(
    groups.map(g => g.key),
    ["l0-label-group"],
  );
});
