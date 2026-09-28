import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

after(async () => {
  await closeBrowser();
});

/**
    End-to-end coverage for issue #166's drill-down morph, driven through the
    real production path in a real browser: a routed pointer click (not a
    direct call to `viz.schema.on["click.shape"]`) so `_lastScenePick.node`
    gets armed the same way a genuine click does, all the way through to the
    next draw's resolved `enterFrom`/`exitTo`.
*/
it("a routed click on a Treemap cell arms and resolves the forward and backward drill-down morph", async function () {
  this.timeout(60000);
  const result = await render(
    "<div id='viz' style='width:400px;height:300px'></div>",
    async () => {
      const chart = new window.d3plus.Treemap()
        .select("#viz")
        .data([
          {group: "A", sub: "A1", value: 10},
          {group: "A", sub: "A2", value: 20},
          {group: "B", sub: "B1", value: 30},
        ])
        .groupBy(["group", "sub"])
        .sum("value")
        .depth(0)
        .width(400).height(300).duration(0);
      await new Promise(resolve => chart.render(resolve));

      // _resolvedEnterFrom/_resolvedExitTo are one-shot: _drawSceneToTarget
      // clears them right after passing them to drawScene, so they're gone
      // by the time an `await` lets this test read them back. Spy on
      // drawScene to capture what each draw actually resolved and used.
      const capturedOpts = [];
      const origDrawScene = chart._sceneRenderer.drawScene.bind(chart._sceneRenderer);
      chart._sceneRenderer.drawScene = (scene, opts) => {
        capturedOpts.push(opts);
        return origDrawScene(scene, opts);
      };

      const groupACell = chart._chartScene.find(
        n => n.type === "rect" && n.datum && chart.schema.groupBy[0](n.datum, n.index ?? 0) === "A",
      );
      const bodyRectBefore = chart._bodyRect;

      // Route a real click through the same path a pointer click takes —
      // populates _lastScenePick.node before clickShape fires, exactly like
      // a genuine SvgRenderer/CanvasRenderer pick would.
      const beforeDrillDraws = capturedOpts.length;
      chart._routeSceneEvent({
        type: "click",
        point: [groupACell.x + 1, groupACell.y + 1],
        pick: {node: groupACell, datum: groupACell.datum, index: groupACell.index},
        nativeEvent: {stopPropagation() {}},
      });
      // clickShape's .render() has no callback — wait a tick for it to settle.
      await new Promise(resolve => window.setTimeout(resolve, 50));
      // The click can trigger more than one draw (e.g. a coalesced hover-clear
      // repaint alongside the real drill-down draw) — find the one that
      // actually carries the resolved box, not just the last one.
      const drillDraw = capturedOpts.slice(beforeDrillDraws).find(o => o.enterFrom);

      const afterDrill = {
        drawDepth: chart._drawDepth,
        historyLength: chart._history.length,
        historyEntry: chart._history[0],
        pendingEnterOrigin: chart._pendingEnterOrigin,
        resolvedEnterFrom: drillDraw?.enterFrom,
      };

      // Now click "Back" — a real HTML <button> in the shared top-left
      // controls panel now (backControl.ts), not an SVG scene node routed
      // through _routeSceneEvent — click it the same way a user would.
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

      // A repaint that bypasses runVizPipeline entirely (a zoom/pan tick, a
      // coalesced hover repaint, Rings' click-to-recenter all call
      // _drawSceneToTarget directly) must never inherit the prior click's
      // resolved box — confirms _resolvedEnterFrom/_resolvedExitTo are
      // cleared right after use, not left around for the next draw.
      chart._drawSceneToTarget();
      const unrelatedRepaint = capturedOpts[capturedOpts.length - 1];

      return {
        groupACell: groupACell && {x: groupACell.x, y: groupACell.y, width: groupACell.width, height: groupACell.height},
        bodyRectBefore, afterDrill, afterBack, unrelatedRepaint,
      };
    },
  );
  if (result.errors && result.errors.length) throw new Error(result.errors.join("; "));

  assert.ok(result.groupACell, "group A's rect is in the rendered chart scene");
  assert.ok(result.bodyRectBefore, "chart body rect captured after the first draw");

  assert.strictEqual(result.afterDrill.drawDepth, 1, "drilled down one level");
  assert.strictEqual(result.afterDrill.historyLength, 1, "one history entry pushed");
  assert.strictEqual(result.afterDrill.historyEntry.groupId, "A", "history entry remembers the clicked group's id");
  assert.strictEqual(result.afterDrill.historyEntry.groupDepth, 0, "history entry remembers the depth the id was read at");
  assert.strictEqual(result.afterDrill.pendingEnterOrigin, undefined, "pending origin consumed by the next draw (one-shot)");
  assert.ok(result.afterDrill.resolvedEnterFrom, "the drill-down draw resolved an enterFrom box");
  // The back button's first appearance (armed by this same drill-down)
  // claims TOP margin only, so the body rect's width is unchanged between
  // the pre-click and post-click frames — the resolved enterFrom's width
  // should closely match the clicked cell's actual width (height may shift
  // slightly with the new top margin, so only width is checked tightly).
  assert.ok(
    Math.abs(result.afterDrill.resolvedEnterFrom.width - result.groupACell.width) < 1,
    `resolved enterFrom.width (${result.afterDrill.resolvedEnterFrom.width}) closely matches the clicked cell's width (${result.groupACell.width})`,
  );
  assert.ok(result.afterDrill.resolvedEnterFrom.height > 0, "resolved enterFrom has positive height");

  assert.strictEqual(result.afterBack.drawDepth, 0, "back click returns to the shallower depth");
  assert.strictEqual(result.afterBack.historyLength, 0, "history entry popped");
  assert.strictEqual(result.afterBack.pendingExitReunion, undefined, "pending reunion consumed by the next draw (one-shot)");
  assert.ok(result.afterBack.resolvedExitTo, "the drill-up draw resolved an exitTo box (group A's cell reappeared)");

  assert.strictEqual(result.unrelatedRepaint.enterFrom, undefined, "an unrelated repaint never inherits a stale enterFrom");
  assert.strictEqual(result.unrelatedRepaint.exitTo, undefined, "an unrelated repaint never inherits a stale exitTo");
});
