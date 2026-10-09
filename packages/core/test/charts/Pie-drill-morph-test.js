import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

after(async () => {
  await closeBrowser();
});

/**
    Pie/Donut wedges are `path`-type scene nodes stamped `shapeType: "Pie"`
    (a pre-serialized SVG "d" string, `pieEmit.ts`) — a second representation
    (alongside StackedArea's `shapeType: "Area"`) that `isFlipEligible`/
    `collapseTo` (render package) special-case to keep out of the generic
    "any path" exclusion (which protects Sankey Links). Locks that both the
    forward capture (click.shape.ts) and the backward reunion lookup
    (resolveDrillMorph) handle these picks via `nodeRect`'s `pathBounds`
    conversion, exactly like Treemap/Pack/BarChart/StackedArea before it —
    this is the documented "DrillDownOnClick" Pie story config.
*/
it("a routed click on a Pie wedge arms and resolves the forward and backward drill-down morph", async function () {
  this.timeout(60000);
  const result = await render(
    "<div id='viz' style='width:400px;height:300px'></div>",
    async () => {
      const chart = new window.d3plus.Pie()
        .select("#viz")
        .data([
          {category: "Fruit", id: "Apple", value: 30}, {category: "Fruit", id: "Banana", value: 22},
          {category: "Fruit", id: "Cherry", value: 18},
          {category: "Vegetable", id: "Carrot", value: 20}, {category: "Vegetable", id: "Pea", value: 12},
          {category: "Vegetable", id: "Kale", value: 8},
        ])
        .groupBy(["category", "id"])
        .value("value")
        .depth(0)
        .duration(0)
        .width(400).height(300);
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

      const fruitWedge = chart._chartScene.find(
        n => n.type === "path" && n.shapeType === "Pie" && n.datum && chart.schema.groupBy[0](n.datum, n.index ?? 0) === "Fruit",
      );
      const bodyRectBefore = chart._bodyRect;

      chart._routeSceneEvent({
        type: "click",
        point: [1, 1],
        pick: {node: fruitWedge, datum: fruitWedge && fruitWedge.datum, index: fruitWedge && fruitWedge.index},
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
      // The back button is a real HTML <button> in the shared top-left
      // controls panel now (backControl.ts), not an SVG scene node routed
      // through _routeSceneEvent — click it the same way a user would.
      document.querySelector("#viz .back-control").click();
      await new Promise(resolve => window.setTimeout(resolve, 50));
      const backDraw = capturedOpts.slice(beforeBackDraws).find(o => o.exitTo);

      return {
        foundWedge: !!fruitWedge,
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

  assert.ok(result.foundWedge, "the Fruit category's wedge is in the rendered chart scene");
  assert.ok(result.bodyRectBefore, "chart body rect captured after the first draw");

  assert.strictEqual(result.afterDrill.drawDepth, 1, "drilled down one level");
  assert.strictEqual(result.afterDrill.historyEntry.groupId, "Fruit", "history entry remembers the clicked group's id");
  assert.strictEqual(result.afterDrill.historyEntry.groupDepth, 0, "history entry remembers the depth the id was read at");
  assert.strictEqual(result.afterDrill.pendingEnterOrigin, undefined, "pending origin consumed by the next draw (one-shot)");
  assert.ok(result.afterDrill.resolvedEnterFrom, "the drill-down draw resolved an enterFrom box from the clicked wedge");
  assert.ok(
    result.afterDrill.resolvedEnterFrom.width > 0 && result.afterDrill.resolvedEnterFrom.height > 0,
    "resolved enterFrom has positive size",
  );

  assert.strictEqual(result.afterBack.drawDepth, 0, "back click returns to the shallower depth");
  assert.strictEqual(result.afterBack.pendingExitReunion, undefined, "pending reunion consumed by the next draw (one-shot)");
  assert.ok(result.afterBack.resolvedExitTo, "the drill-up draw resolved an exitTo box (the Fruit wedge reappeared)");
});
