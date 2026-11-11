import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {Alluvial} from "../../index.ts";
import {axisTooltipTarget} from "../../src/components/Axis/axisTooltipTargets.ts";
import {resolveAxisTooltip} from "../../src/charts/features/axisTooltip.ts";
import {
  alluvialTitleBoxes,
  alluvialTitleNodes,
  alluvialTitleStyle,
  alluvialTitleTooltip,
} from "../../src/charts/Alluvial/titles.ts";

useJsdom();

/**
    Alluvial's column titles take `dimensionTitleConfig.titleTooltip`, the
    forms an axis's `titleTooltip` takes: a title drawn cut short shows its whole text, and a title with nothing to
    show stays inert chrome.
*/

const LONG = "A column title far too long to fit above its column";

/** Every node of a scene subtree, the subtree's root first. */
const flat = node => [node, ...(node.children ?? []).flatMap(flat)];

/** Each title's text node and its tooltip target, left to right. */
const titlesOf = nodes =>
  nodes
    .flatMap(flat)
    .filter(n => n.type === "text")
    .map(n => [n, axisTooltipTarget(n)]);

/** Title boxes and nodes for column titles `texts`, 3 columns 200px apart. */
function drawn(texts, config = {}, viz = new Alluvial()) {
  const titles = alluvialTitleBoxes(texts, [0, 200, 400], 20, 420);
  viz.dimensionTitleConfig(config);
  const style = alluvialTitleStyle(viz, titles);
  for (const t of titles) t.height = 16;
  return alluvialTitleNodes(titles, style, "en-US", alluvialTitleTooltip(viz));
}

it("alluvialTitleTooltip reads dimensionTitleConfig, and alluvialTitleStyle keeps it from the TextBox", () => {
  const viz = new Alluvial();
  assert.strictEqual(alluvialTitleTooltip(viz), undefined);
  const note = () => "note";
  viz.dimensionTitleConfig({titleTooltip: note, fontSize: 14});
  assert.strictEqual(alluvialTitleTooltip(viz), note);
  const style = alluvialTitleStyle(viz, []);
  assert.ok(!("titleTooltip" in style), "not a TextBox style");
  assert.strictEqual(style.fontSize, 14, "the rest is");
  assert.strictEqual(viz.dimensionTitleConfig().titleTooltip, note, "kept");
});

it("alluvialTitleNodes: a title drawn cut short shows its whole text, a whole one stays inert", () => {
  const nodes = drawn(["Region", LONG, "Channel"], {maxLines: 1});
  const titles = titlesOf(nodes);
  assert.strictEqual(titles.length, 3);
  const [[, region], [cut, long], [, channel]] = titles;
  assert.ok(!region && !channel, "whole titles are unstamped");
  assert.deepStrictEqual(
    [long.part, long.value, long.text, long.truncated, long.option],
    ["title", LONG, LONG, true, undefined],
  );
  assert.deepStrictEqual(resolveAxisTooltip(long), {title: LONG, body: false});
  assert.notStrictEqual(cut.interactive, false, "it takes the pointer");
  assert.ok(
    titles.every(([n, t]) => t || n.interactive === false),
    "every other title is inert",
  );
  assert.ok(
    nodes
      .flatMap(flat)
      .every(
        n =>
          n.interactionGroup === "axis" &&
          !("datum" in n) &&
          String(n.key).startsWith("alluvial-"),
      ),
    "titles are chrome, with no data",
  );
});

it("alluvialTitleNodes: every title takes an option, a function given its title", () => {
  const seen = [];
  const option = (...args) => (
    seen.push(args),
    args[0] === "Channel" ? false : `About ${args[0]}`
  );
  const titles = titlesOf(
    drawn(["Region", "", "Channel"], {titleTooltip: option}),
  );
  assert.deepStrictEqual(
    titles.map(([n, t]) => [
      t.value,
      t.option === option,
      n.interactive !== false,
    ]),
    [
      ["Region", true, true],
      ["Channel", true, true],
    ],
    "every titled column's, and each takes the pointer",
  );
  assert.deepStrictEqual(resolveAxisTooltip(titles[0][1]), {
    title: false,
    body: "About Region",
  });
  assert.strictEqual(resolveAxisTooltip(titles[1][1]), null, "false hides it");
  assert.deepStrictEqual(seen, [["Region"], ["Channel"]], "the title alone");

  const text = titlesOf(drawn(["Region"], {titleTooltip: "Where"}));
  assert.deepStrictEqual(resolveAxisTooltip(text[0][1]), {
    title: false,
    body: "Where",
  });
  const config = titlesOf(
    drawn(["Region"], {titleTooltip: {body: title => `${title}!`}}),
  );
  assert.strictEqual(resolveAxisTooltip(config[0][1]).config.body(), "Region!");
});

it("alluvialTitleNodes: `false` keeps every title inert, cut or whole", () => {
  const titles = titlesOf(
    drawn(["Region", LONG], {maxLines: 1, titleTooltip: false}),
  );
  assert.strictEqual(titles.length, 2);
  assert.ok(titles.every(([n, t]) => !t && n.interactive === false));
});
