import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    End-to-end coverage for issue #166's drill-down morph, driven through the
    real production path in a real browser: a routed pointer click (not a
    direct call to `viz.schema.on["click.shape"]`) so `_lastScenePick.node`
    gets armed the same way a genuine click does, all the way through to the
    next draw's resolved `enterFrom` and, after Back, `exitTo`.

    Each case picks its first top-level group's mark out of the chart scene:
    Treemap and Pack cells are rects and circles; Pack overrides
    `chartBodyRect` (a diameter-sized square centered in the chart area);
    the Plot family (BarChart, StackedArea) is paint-driven and sets
    `_bodyRect` in `plotPaintMeasured`, and nests its marks in a
    `plot-zoom-content` group with the row wrapped as `{data, i, …}`; Pie
    wedges and StackedArea bands are `path` nodes stamped `shapeType: "Pie"`
    and `"Area"` (pre-serialized "d" strings) that `isFlipEligible` and
    `collapseTo` keep out of the generic "any path" exclusion protecting
    Sankey links, and that `nodeRect` converts through `pathBounds`.
*/

const nested = [
  {group: "A", sub: "A1", value: 10},
  {group: "A", sub: "A2", value: 20},
  {group: "B", sub: "B1", value: 30},
];

const cases = [
  {
    chart: "Treemap",
    config: {data: nested, groupBy: ["group", "sub"], sum: "value"},
    mark: {type: "rect"},
    point: n => [n.x + 1, n.y + 1],
    group: "A",
  },
  {
    chart: "Pack",
    config: {data: nested, groupBy: ["group", "sub"], sum: "value"},
    mark: {type: "circle"},
    point: n => [n.cx, n.cy],
    group: "A",
  },
  {
    chart: "BarChart",
    config: {data: nested, groupBy: ["group", "sub"], x: "group", y: "value"},
    mark: {type: "rect"},
    point: n => [n.x + n.width / 2, n.y + 1],
    group: "A",
  },
  {
    chart: "StackedArea",
    config: {
      data: [
        {group: "A", sub: "A1", year: 2020, value: 10},
        {group: "A", sub: "A1", year: 2021, value: 15},
        {group: "A", sub: "A2", year: 2020, value: 5},
        {group: "A", sub: "A2", year: 2021, value: 8},
        {group: "B", sub: "B1", year: 2020, value: 20},
        {group: "B", sub: "B1", year: 2021, value: 25},
      ],
      groupBy: ["group", "sub"],
      x: "year",
      y: "value",
    },
    mark: {type: "path", shapeType: "Area"},
    group: "A",
  },
  {
    chart: "Pie",
    config: {
      data: [
        {category: "Fruit", id: "Apple", value: 30}, {category: "Fruit", id: "Banana", value: 22},
        {category: "Fruit", id: "Cherry", value: 18},
        {category: "Vegetable", id: "Carrot", value: 20}, {category: "Vegetable", id: "Pea", value: 12},
        {category: "Vegetable", id: "Kale", value: 8},
      ],
      groupBy: ["category", "id"],
      value: "value",
    },
    mark: {type: "path", shapeType: "Pie"},
    group: "Fruit",
  },
];

/** Drills into the case's group with a routed click, then clicks Back. */
const drill = async ({chart: name, config, mark, group}) => {
  const point = cases.find(c => c.chart === name).point || (() => [1, 1]);
  const chart = new window.d3plus[name]()
    .select("#viz")
    .config(config)
    .depth(0)
    .width(400).height(300).duration(0);
  await new Promise(resolve => chart.render(resolve));

  // _resolvedEnterFrom/_resolvedExitTo are one-shot: _drawSceneToTarget
  // clears them right after passing them to drawScene. Spy on drawScene to
  // capture what each draw actually resolved and used.
  const capturedOpts = [];
  const origDrawScene = chart._sceneRenderer.drawScene.bind(chart._sceneRenderer);
  chart._sceneRenderer.drawScene = (scene, opts) => {
    capturedOpts.push(opts);
    return origDrawScene(scene, opts);
  };

  const find = nodes => {
    for (const n of nodes) {
      const row = n.datum && n.datum.data ? n.datum.data : n.datum;
      if (n.type === mark.type && (!mark.shapeType || n.shapeType === mark.shapeType) &&
        row && chart.schema.groupBy[0](row, n.index ?? 0) === group) return n;
      if (n.type === "group" && n.children) {
        const found = find(n.children);
        if (found) return found;
      }
    }
    return undefined;
  };
  const node = find(chart._chartScene);
  const bodyRectBefore = chart._bodyRect;

  const beforeDrillDraws = capturedOpts.length;
  chart._routeSceneEvent({
    type: "click",
    point: point(node),
    pick: {node, datum: node && node.datum, index: node && node.index},
    nativeEvent: {stopPropagation() {}},
  });
  // clickShape's .render() has no callback — wait for it to settle.
  await new Promise(resolve => window.setTimeout(resolve, 50));
  // The click can trigger more than one draw (e.g. a coalesced hover-clear
  // repaint alongside the drill-down draw): find the one carrying the box.
  const drillDraw = capturedOpts.slice(beforeDrillDraws).find(o => o.enterFrom);

  const afterDrill = {
    drawDepth: chart._drawDepth,
    historyLength: chart._history.length,
    historyEntry: chart._history[0],
    pendingEnterOrigin: chart._pendingEnterOrigin,
    resolvedEnterFrom: drillDraw?.enterFrom,
    bodyRect: chart._bodyRect,
  };

  // The back button is an HTML <button> in the top-left controls panel.
  const beforeBackDraws = capturedOpts.length;
  document.querySelector("#viz .back-control").click();
  await new Promise(resolve => window.setTimeout(resolve, 50));
  const backDraw = capturedOpts.slice(beforeBackDraws).find(o => o.exitTo);

  const afterBack = {
    drawDepth: chart._drawDepth,
    historyLength: chart._history.length,
    pendingExitReunion: chart._pendingExitReunion,
    resolvedExitTo: backDraw?.exitTo,
  };

  // A repaint that bypasses runVizPipeline (a zoom/pan tick, a coalesced
  // hover repaint, Rings' click-to-recenter) never inherits the click's box.
  chart._drawSceneToTarget();
  const unrelatedRepaint = capturedOpts[capturedOpts.length - 1];

  return {
    node: node && {
      x: node.x, y: node.y, width: node.width, height: node.height, r: node.r,
    },
    bodyRectBefore,
    afterDrill,
    afterBack,
    unrelatedRepaint,
  };
};

for (const c of cases) {
  it(`${c.chart}: a routed click arms and resolves the forward and backward drill-down morph`, async function () {
    const result = await render("<div id='viz' style='width:400px;height:300px'></div>", drill, c);

    assert.ok(result.node, `the ${c.group} group's mark is in the rendered chart scene`);
    assert.ok(result.bodyRectBefore, "chart body rect captured after the first draw");
    assert.ok(result.bodyRectBefore.width > 0 && result.bodyRectBefore.height > 0, "body rect has positive size");

    const {afterDrill, afterBack, unrelatedRepaint} = result;
    assert.strictEqual(afterDrill.drawDepth, 1, "drilled down one level");
    assert.strictEqual(afterDrill.historyLength, 1, "one history entry pushed");
    assert.strictEqual(afterDrill.historyEntry.groupId, c.group, "history entry remembers the clicked group's id");
    assert.strictEqual(afterDrill.historyEntry.groupDepth, 0, "history entry remembers the depth the id was read at");
    assert.strictEqual(afterDrill.pendingEnterOrigin, undefined, "pending origin consumed by the next draw (one-shot)");
    assert.ok(afterDrill.resolvedEnterFrom, "the drill-down draw resolved an enterFrom box");
    assert.ok(
      afterDrill.resolvedEnterFrom.width > 0 && afterDrill.resolvedEnterFrom.height > 0,
      "resolved enterFrom has positive size",
    );

    if (c.chart === "Treemap") {
      // The back button's first appearance claims top margin only, so the
      // body rect's width is unchanged and the resolved box's width matches
      // the clicked cell's.
      assert.ok(
        Math.abs(afterDrill.resolvedEnterFrom.width - result.node.width) < 1,
        `resolved enterFrom.width (${afterDrill.resolvedEnterFrom.width}) closely matches the clicked cell's width (${result.node.width})`,
      );
    }
    if (c.chart === "Pack") {
      // Pack's diameter is Math.min(width, height): the back button's top
      // margin shrinks both dimensions, so the resolved box is the clicked
      // circle's fraction of the old diameter, reapplied to the new one.
      const expectedWidth = ((result.node.r * 2) / result.bodyRectBefore.width) * afterDrill.bodyRect.width;
      assert.ok(
        Math.abs(afterDrill.resolvedEnterFrom.width - expectedWidth) < 1,
        `resolved enterFrom.width (${afterDrill.resolvedEnterFrom.width}) matches the clicked circle's fraction of the old diameter, reapplied to the new diameter (${expectedWidth})`,
      );
    }

    assert.strictEqual(afterBack.drawDepth, 0, "back click returns to the shallower depth");
    assert.strictEqual(afterBack.historyLength, 0, "history entry popped");
    assert.strictEqual(afterBack.pendingExitReunion, undefined, "pending reunion consumed by the next draw (one-shot)");
    assert.ok(afterBack.resolvedExitTo, `the drill-up draw resolved an exitTo box (the ${c.group} group's mark reappeared)`);

    assert.strictEqual(unrelatedRepaint.enterFrom, undefined, "an unrelated repaint never inherits a stale enterFrom");
    assert.strictEqual(unrelatedRepaint.exitTo, undefined, "an unrelated repaint never inherits a stale exitTo");
  });
}
