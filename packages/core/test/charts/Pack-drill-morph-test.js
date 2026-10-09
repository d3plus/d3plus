import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

after(async () => {
  await closeBrowser();
});

/**
    Pack overrides `chartBodyRect` (its body is a diameter-sized square
    centered in the chart area via packOffsetX/Y, not the full chart area
    `runChartDraw`'s default assumes) — this locks that the drill-down morph
    still resolves correctly against it, not just against the default.
*/
it("a routed click on a Pack circle arms and resolves the forward drill-down morph", async function () {
  this.timeout(60000);
  const result = await render(
    "<div id='viz' style='width:400px;height:300px'></div>",
    async () => {
      const chart = new window.d3plus.Pack()
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

      const groupACircle = chart._chartScene.find(
        n => n.type === "circle" && n.datum && chart.schema.groupBy[0](n.datum, n.index ?? 0) === "A",
      );
      const bodyRectBefore = chart._bodyRect;

      chart._routeSceneEvent({
        type: "click",
        point: [groupACircle.cx, groupACircle.cy],
        pick: {node: groupACircle, datum: groupACircle.datum, index: groupACircle.index},
        nativeEvent: {stopPropagation() {}},
      });
      await new Promise(resolve => window.setTimeout(resolve, 50));
      // The click can trigger more than one draw (e.g. a coalesced hover-clear
      // repaint alongside the real drill-down draw) — find the one that
      // actually carries the resolved box, not just the last one.
      const drillDraw = capturedOpts.find(o => o.enterFrom);

      return {
        groupACircle: {cx: groupACircle.cx, cy: groupACircle.cy, r: groupACircle.r},
        bodyRectBefore,
        bodyRectAfter: chart._bodyRect,
        drawDepth: chart._drawDepth,
        historyEntry: chart._history[0],
        resolvedEnterFrom: drillDraw?.enterFrom,
      };
    },
  );

  assert.ok(result.bodyRectBefore, "Pack's chartBodyRect override produced a body rect");
  assert.ok(result.bodyRectBefore.width > 0 && result.bodyRectBefore.height > 0, "body rect is the diameter-sized square, not zero");
  assert.strictEqual(result.drawDepth, 1, "drilled down one level");
  assert.strictEqual(result.historyEntry.groupId, "A", "history entry remembers the clicked group's id");
  assert.ok(result.resolvedEnterFrom, "the drill-down draw resolved an enterFrom box");
  // Pack's diameter is Math.min(width, height): the back button's first
  // appearance (armed by this same click) claims top margin, shrinking
  // height and — since Pack is a square — rescaling BOTH dimensions of the
  // diameter, unlike Treemap where only height changes. So the resolved box
  // isn't pixel-equal to the clicked circle's own bounding box; it's that
  // box's FRACTION of the old diameter, reapplied to the new (smaller)
  // diameter — assert that scaling relationship directly, not frame-invariance.
  const clickedWidth = result.groupACircle.r * 2;
  const expectedWidth = (clickedWidth / result.bodyRectBefore.width) * result.bodyRectAfter.width;
  assert.ok(
    Math.abs(result.resolvedEnterFrom.width - expectedWidth) < 1,
    `resolved enterFrom.width (${result.resolvedEnterFrom.width}) matches the clicked circle's fraction of the OLD diameter, reapplied to the NEW diameter (${expectedWidth})`,
  );
});
