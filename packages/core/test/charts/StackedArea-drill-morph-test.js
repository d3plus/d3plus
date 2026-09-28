import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

after(async () => {
  await closeBrowser();
});

/**
    StackedArea's bands are `path`-type scene nodes stamped `shapeType:
    "Area"` (a pre-serialized SVG "d" string) — the one representation
    Treemap/Pack/BarChart don't exercise, and the one `isFlipEligible`/
    `collapseTo` (render package) special-case to keep them out of the
    generic "any path" exclusion (which protects Sankey Links). Locks that
    both the forward capture (click.shape.ts) and the backward reunion lookup
    (resolveDrillMorph) handle these picks via `nodeRect`'s `pathBounds`
    conversion, not just rect/circle.
*/
it("a routed click on a StackedArea band arms and resolves the forward and backward drill-down morph", async function () {
  this.timeout(60000);
  const result = await render(
    "<div id='viz' style='width:400px;height:300px'></div>",
    async () => {
      const chart = new window.d3plus.StackedArea()
        .select("#viz")
        .data([
          {group: "A", sub: "A1", year: 2020, value: 10},
          {group: "A", sub: "A1", year: 2021, value: 15},
          {group: "A", sub: "A2", year: 2020, value: 5},
          {group: "A", sub: "A2", year: 2021, value: 8},
          {group: "B", sub: "B1", year: 2020, value: 20},
          {group: "B", sub: "B1", year: 2021, value: 25},
        ])
        .groupBy(["group", "sub"])
        .x("year")
        .y("value")
        .depth(0)
        .width(400).height(300).duration(0);
      await new Promise(resolve => chart.render(resolve));

      // _resolvedEnterFrom/_resolvedExitTo are one-shot: _drawSceneToTarget
      // clears them right after passing them to drawScene, so they're gone
      // by the time this test reads them back. Spy on drawScene to capture
      // what each draw actually resolved and used.
      const capturedOpts = [];
      const origDrawScene = chart._sceneRenderer.drawScene.bind(chart._sceneRenderer);
      chart._sceneRenderer.drawScene = (scene, opts) => {
        capturedOpts.push(opts);
        return origDrawScene(scene, opts);
      };

      // StackedArea/AreaPlot bands are `path`-type scene nodes stamped
      // `shapeType: "Area"` (a pre-serialized SVG "d" string) — not the
      // `AreaNode` type (topline/baseline point arrays), which no chart in
      // this codebase currently emits.
      const findArea = nodes => {
        for (const n of nodes) {
          const row = n.datum && n.datum.data ? n.datum.data : n.datum;
          if (n.type === "path" && n.shapeType === "Area" && row && chart.schema.groupBy[0](row, n.index ?? 0) === "A") return n;
          if (n.type === "group" && n.children) {
            const found = findArea(n.children);
            if (found) return found;
          }
        }
        return undefined;
      };
      const groupABand = findArea(chart._chartScene);
      const bodyRectBefore = chart._bodyRect;

      chart._routeSceneEvent({
        type: "click",
        point: [1, 1],
        pick: {node: groupABand, datum: groupABand && groupABand.datum, index: groupABand && groupABand.index},
        nativeEvent: {stopPropagation() {}},
      });
      await new Promise(resolve => window.setTimeout(resolve, 50));
      // The click can trigger more than one draw (e.g. a coalesced hover-clear
      // repaint alongside the real drill-down draw) — find the one that
      // actually carries the resolved box, not just the last one.
      const drillDraw = capturedOpts.find(o => o.enterFrom);

      const afterDrill = {
        drawDepth: chart._drawDepth,
        historyEntry: chart._history[0],
        pendingEnterOrigin: chart._pendingEnterOrigin,
        resolvedEnterFrom: drillDraw?.enterFrom,
      };

      const beforeBackDraws = capturedOpts.length;
      chart._routeSceneEvent({
        type: "click",
        point: [1, 1],
        pick: {node: {type: "rect", x: 0, y: 0, width: 10, height: 10, interactionGroup: "back"}, datum: undefined, index: 0},
        nativeEvent: {},
      });
      await new Promise(resolve => window.setTimeout(resolve, 50));
      const backDraw = capturedOpts.slice(beforeBackDraws).find(o => o.exitTo);

      return {
        foundBand: !!groupABand,
        bodyRectBefore,
        afterDrill,
        afterBack: {
          drawDepth: chart._drawDepth,
          pendingExitReunion: chart._pendingExitReunion,
          resolvedExitTo: backDraw?.exitTo,
        },
      };
    },
  );

  assert.ok(result.foundBand, "group A's area band is in the rendered chart scene");
  assert.ok(result.bodyRectBefore, "Plot's plotPaintMeasured set a body rect");
  assert.strictEqual(result.afterDrill.drawDepth, 1, "drilled down one level");
  assert.strictEqual(result.afterDrill.historyEntry.groupId, "A", "history entry remembers the clicked group's id");
  assert.strictEqual(result.afterDrill.pendingEnterOrigin, undefined, "pending origin consumed (one-shot)");
  assert.ok(result.afterDrill.resolvedEnterFrom, "the drill-down draw resolved an enterFrom box from the clicked area band");
  assert.ok(
    result.afterDrill.resolvedEnterFrom.width > 0 && result.afterDrill.resolvedEnterFrom.height > 0,
    "resolved enterFrom has positive size",
  );

  assert.strictEqual(result.afterBack.drawDepth, 0, "back click returns to the shallower depth");
  assert.strictEqual(result.afterBack.pendingExitReunion, undefined, "pending reunion consumed (one-shot)");
  assert.ok(result.afterBack.resolvedExitTo, "the drill-up draw resolved an exitTo box from group A's reappearing area band");
});
