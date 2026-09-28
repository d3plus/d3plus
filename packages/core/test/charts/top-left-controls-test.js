import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    `topLeftControlsFeature` merges independent contributor functions
    (currently just `backContribution`) into a single top-left `htmlOverlay`
    panel — the left-hand mirror of the zoom-controls panel. This renders in
    a real browser and asserts: the panel/button only appear with drill-down
    history, back claims zero layout margin (unlike the old margin-claiming
    `backFeature`), a click pops history, and a centered title avoids
    overlapping the panel when both it and the zoom controls are showing.
*/
after(async () => {
  await closeBrowser();
});

it("back renders as a button in the shared top-left panel only with drill-down history", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="a" style="width:400px;height:300px;"></div><div id="b" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const data = [{id: "A", value: 10}, {id: "B", value: 20}];
        const noHistory = new window.d3plus.Treemap()
          .select("#a")
          .data(data)
          .groupBy("id")
          .sum("value")
          .duration(0);
        const withHistory = new window.d3plus.Treemap()
          .select("#b")
          .data(data)
          .groupBy("id")
          .sum("value")
          .duration(0);
        withHistory._history = [{depth: 0}];
        noHistory.render(() =>
          withHistory.render(() => {
            resolve({
              noHistoryPanel: document.querySelectorAll("#a .d3plus-top-left-controls .back-control").length,
              withHistoryPanel: document.querySelectorAll("#b .d3plus-top-left-controls .back-control").length,
              marginTopEqual: noHistory._margin.top === withHistory._margin.top,
            });
          }),
        );
      }),
  );

  assert.strictEqual(out.noHistoryPanel, 0, "no back button without history");
  assert.strictEqual(out.withHistoryPanel, 1, "back button present with history");
  assert.ok(out.marginTopEqual, "back claims zero margin — history doesn't change margin.top");
});

it("clicking the back button pops history and re-renders", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const viz = new window.d3plus.Treemap()
          .select("#s")
          .data([{id: "A", value: 10}, {id: "B", value: 20}])
          .groupBy("id")
          .sum("value")
          .duration(0);
        viz._history = [{depth: 0}];
        viz.render(() => {
          document.querySelector("#s .back-control").click();
          window.setTimeout(() => resolve({historyLength: viz._history.length}), 50);
        });
      }),
  );

  assert.strictEqual(out.historyLength, 0, "history popped after clicking back");
});

it("a centered title avoids overlapping the top-left controls panel", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const viz = new window.d3plus.Treemap()
          .select("#s")
          .title("A Reasonably Long Title For This Chart")
          .data([{id: "A", value: 10}, {id: "B", value: 20}])
          .groupBy("id")
          .sum("value")
          .zoom(true)
          .duration(0);
        viz._history = [{depth: 0}];
        viz.render(() => {
          const backRect = document.querySelector("#s .back-control").getBoundingClientRect();
          const titleRect = document.querySelector('#s [data-key="viz-title"]').getBoundingClientRect();
          const overlaps = !(
            titleRect.left >= backRect.right ||
            titleRect.right <= backRect.left ||
            titleRect.top >= backRect.bottom ||
            titleRect.bottom <= backRect.top
          );
          resolve({overlaps});
        });
      }),
  );

  assert.ok(!out.overlaps, "title text doesn't overlap the back button");
});
