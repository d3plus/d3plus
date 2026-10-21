import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

after(async () => {
  await closeBrowser();
});

/**
    Plot family (BarChart here) is paint-driven — no `layoutStage`/`emit`
    split, so `_bodyRect` is set directly in `plotPaintMeasured` from the
    measured axis ranges rather than via `ChartDefinition.chartBodyRect`.
    Locks that the same drill-down morph mechanism resolves correctly there.
*/
it("a routed click on a BarChart bar arms and resolves the forward drill-down morph", async function () {
  this.timeout(60000);
  const result = await render(
    "<div id='viz' style='width:400px;height:300px'></div>",
    async () => {
      const chart = new window.d3plus.BarChart()
        .select("#viz")
        .data([
          {group: "A", sub: "A1", value: 10},
          {group: "A", sub: "A2", value: 20},
          {group: "B", sub: "B1", value: 30},
        ])
        .groupBy(["group", "sub"])
        .x("group")
        .y("value")
        .depth(0)
        .width(400).height(300).duration(0);
      await new Promise(resolve => chart.render(resolve));

      // _resolvedEnterFrom is one-shot: _drawSceneToTarget clears it right
      // after passing it to drawScene, so it's gone by the time this test
      // reads it back. Spy on drawScene to capture what the drill-down draw
      // actually resolved and used.
      const capturedOpts = [];
      const origDrawScene = chart._sceneRenderer.drawScene.bind(chart._sceneRenderer);
      chart._sceneRenderer.drawScene = (scene, opts) => {
        capturedOpts.push(opts);
        return origDrawScene(scene, opts);
      };

      // Plot family nests its bars inside a `plot-zoom-content` group
      // alongside sibling axis groups — _chartScene isn't a flat list the
      // way Treemap/Pack's is, so the search has to recurse into children.
      // A Plot shape's raw scene datum is also the wrapped record
      // {data, i, ...internal fields}, not the plain row — unwrap it the
      // same way Viz._interactionDatum (and resolveDrillMorph) do.
      const findRect = nodes => {
        for (const n of nodes) {
          const row = n.datum && n.datum.data ? n.datum.data : n.datum;
          if (n.type === "rect" && row && chart.schema.groupBy[0](row, n.index ?? 0) === "A") return n;
          if (n.type === "group" && n.children) {
            const found = findRect(n.children);
            if (found) return found;
          }
        }
        return undefined;
      };
      const groupABar = findRect(chart._chartScene);
      const bodyRectBefore = chart._bodyRect;

      chart._routeSceneEvent({
        type: "click",
        point: [groupABar.x + groupABar.width / 2, groupABar.y + 1],
        pick: {node: groupABar, datum: groupABar.datum, index: groupABar.index},
        nativeEvent: {stopPropagation() {}},
      });
      await new Promise(resolve => window.setTimeout(resolve, 50));
      // The click can trigger more than one draw (e.g. a coalesced hover-clear
      // repaint alongside the real drill-down draw) — find the one that
      // actually carries the resolved box, not just the last one.
      const drillDraw = capturedOpts.find(o => o.enterFrom);

      return {
        bodyRectBefore,
        drawDepth: chart._drawDepth,
        historyEntry: chart._history[0],
        pendingEnterOrigin: chart._pendingEnterOrigin,
        resolvedEnterFrom: drillDraw?.enterFrom,
      };
    },
  );

  assert.ok(result.bodyRectBefore, "Plot's plotPaintMeasured set a body rect from the measured axis ranges");
  assert.ok(result.bodyRectBefore.width > 0 && result.bodyRectBefore.height > 0, "body rect has positive size");
  assert.strictEqual(result.drawDepth, 1, "drilled down one level");
  assert.strictEqual(result.historyEntry.groupId, "A", "history entry remembers the clicked group's id");
  assert.strictEqual(result.pendingEnterOrigin, undefined, "pending origin consumed by the next draw (one-shot)");
  assert.ok(result.resolvedEnterFrom, "the drill-down draw resolved an enterFrom box");
  assert.ok(
    result.resolvedEnterFrom.width > 0 && result.resolvedEnterFrom.height > 0,
    "resolved enterFrom has positive size",
  );
});
