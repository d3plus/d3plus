import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A Plot whose chrome (title, timeline, axes) needs more room than its
    container gives it plots in no space rather than in a negative one: no
    painted rect gets a negative width or height, which SVG rejects.
*/

const probe = ({kind, width, height}) =>
  new Promise(resolve => {
    const years = [2020, 2021, 2022];
    const data = years.flatMap(year => ["A", "B", "C"].map((id, i) => ({id, year, x: i, y: 10 + i * year % 7})));
    const viz = new window.d3plus[kind]()
      .data(data)
      .groupBy("id")
      .x("x")
      .y("y")
      .time("year")
      .title("A title long enough to wrap onto a second line in a narrow chart")
      .width(width)
      .height(height)
      .duration(0)
      .select("#viz");
    viz.render(() => {
      const negative = [];
      const walk = node => {
        if (node.type === "rect" && (node.width < 0 || node.height < 0))
          negative.push({key: node.key, width: node.width, height: node.height});
        (node.children || []).forEach(walk);
      };
      walk(viz._paintedScene.root);
      resolve({negative, rects: document.querySelectorAll("#viz rect").length});
    });
  });

for (const kind of ["BarChart", "LinePlot"])
  it(`${kind} too short for its chrome paints no negative rect sizes`, async () => {
    const {negative, rects} = await render('<div id="viz"></div>', probe, {kind, width: 300, height: 120});
    assert.ok(rects > 0, "the chart still draws");
    assert.deepStrictEqual(negative, []);
  });
