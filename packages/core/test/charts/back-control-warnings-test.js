import assert from "assert";
import {closeBrowser, render} from "../playwright.js";

/**
    Back restores the drill-down view (depth + filter) without passing its
    history entry's own bookkeeping keys through `config()`, so drilling in
    and out logs no unknown-property warnings.
*/

after(async () => {
  await closeBrowser();
});

for (const chartType of ["Treemap", "Pie"]) {
  it(`${chartType} — drilling down and clicking Back logs no config warnings`, async function () {
    this.timeout(60000);
    const result = await render(
      "<div id='viz' style='width:400px;height:300px'></div>",
      async type => {
        const warnings = [];
        const origWarn = window.console.warn;
        window.console.warn = (...args) => {
          warnings.push(args.join(" "));
          origWarn.apply(window.console, args);
        };
        const chart = new window.d3plus[type]()
          .select("#viz")
          .data([
            {group: "A", sub: "A1", value: 10},
            {group: "A", sub: "A2", value: 20},
            {group: "B", sub: "B1", value: 30},
          ])
          .groupBy(["group", "sub"])
          .depth(0)
          .width(400)
          .height(300)
          .duration(0);
        if (type === "Treemap") chart.sum("value");
        else chart.value("value");
        await new Promise(resolve => chart.render(resolve));

        const node = chart._chartScene
          .flatMap(function walk(n) {
            return [n, ...(n.children || []).flatMap(walk)];
          })
          .find(
            n =>
              n.datum &&
              chart.schema.groupBy[0](n.datum, n.index ?? 0) === "A" &&
              n.type !== "text",
          );
        chart._routeSceneEvent({
          type: "click",
          point: [node.x ?? 0, node.y ?? 0],
          pick: {node, datum: node.datum, index: node.index},
          nativeEvent: {stopPropagation() {}},
        });
        await new Promise(resolve => window.setTimeout(resolve, 50));
        const drilled = {
          depth: chart._drawDepth,
          history: chart._history.length,
        };

        document.querySelector("#viz .back-control").click();
        await new Promise(resolve => window.setTimeout(resolve, 50));
        window.console.warn = origWarn;

        return {
          drilled,
          back: {
            depth: chart._drawDepth,
            history: chart._history.length,
            filter: chart.schema.filter,
          },
          warnings,
        };
      },
      chartType,
    );

    assert.deepStrictEqual(
      result.drilled,
      {depth: 1, history: 1},
      "the click drilled one level down",
    );
    assert.strictEqual(result.back.depth, 0, "Back returned to the top level");
    assert.strictEqual(result.back.history, 0, "Back popped the history entry");
    assert.deepStrictEqual(
      result.warnings,
      [],
      `no warnings were logged (got ${JSON.stringify(result.warnings)})`,
    );
  });
}
