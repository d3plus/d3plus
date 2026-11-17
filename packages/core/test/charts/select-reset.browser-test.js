import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A viewer's zoom reset (the button or a double-click) and turning a
    select tool off (its button again, or brush mode taking over) clear a
    box or lasso selection, while `zoomReset()` from code and switching
    between box and lasso keep it.
*/

const box = "<div id='viz' style='width:600px;height:400px'></div>";

const grid = [];
for (let i = 0; i < 4; i++)
  for (let j = 0; j < 3; j++)
    grid.push({id: `p${i}-${j}`, x: i, y: j, value: i + j + 1});

for (const renderer of ["svg", "canvas"])
  it(`[${renderer}] a viewer's reset or turning a tool off clears the selection; code and tool switches keep it`, async () => {
    const r = await render(
      box,
      async ([data, renderer]) => {
        const events = [];
        const chart = new window.d3plus.Plot()
          .select("#viz")
          .renderer(renderer)
          .duration(0)
          .data(data)
          .groupBy("id")
          .x("x")
          .y("y")
          .legend(false)
          .selectMode("box")
          .zoomDoubleClick("reset")
          .on("select", rows => events.push(rows.length));
        await new Promise(r => chart.render(r));
        const button = cls =>
          document.querySelector(`#viz .d3plus-zoom-control .${cls}`);
        const pick = () => chart.selection([data[0], data[1]]);
        const count = () => chart.selection().length;
        const out = {};
        pick();
        button("select-lasso").click();
        out.switched = count();
        button("select-lasso").click();
        out.toolOff = count();
        button("select-box").click();
        pick();
        button("zoom-brush").click();
        out.brush = count();
        button("zoom-brush").click();
        pick();
        chart.zoomReset();
        out.codeReset = count();
        button("zoom-reset").click();
        out.buttonReset = count();
        pick();
        const surface = chart._zoomEventTarget.node();
        surface.dispatchEvent(
          new MouseEvent("dblclick", {bubbles: true, cancelable: true}),
        );
        out.dblclick = count();
        out.events = events;
        return out;
      },
      [grid, renderer],
    );
    assert.strictEqual(r.switched, 2, "switching box to lasso keeps it");
    assert.strictEqual(r.toolOff, 0, "turning the lasso off clears it");
    assert.strictEqual(r.brush, 0, "brush mode turning the tool off clears it");
    assert.strictEqual(r.codeReset, 2, "zoomReset() from code keeps it");
    assert.strictEqual(r.buttonReset, 0, "the reset button clears it");
    assert.strictEqual(r.dblclick, 0, "a double-click reset clears it");
    assert.deepStrictEqual(
      r.events,
      [0, 0, 0, 0],
      "each clear fires select with no rows",
    );
  });
