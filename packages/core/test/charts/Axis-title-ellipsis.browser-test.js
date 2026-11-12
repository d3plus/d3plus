import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {probeChart} from "~test/browser/helpers.js";

/**
    An axis title cut short by TextBox's default ellipsis keeps the decimals
    in the text it keeps, drawn by both renderers.
*/

const TITLE = "Ages 0.5 to 4.5 years old, counted in every survey year since";

const src = `lib => new lib.BarChart()
  .data([{id: "a", value: 10}, {id: "b", value: 20}])
  .x("id")
  .y("value")
  .legend(false)
  .xConfig({title: ${JSON.stringify(TITLE)}, titleConfig: {maxLines: 1}})`;

for (const renderer of ["svg", "canvas"]) {
  it(`a cut axis title keeps its decimals (${renderer})`, async () => {
    const out = await probeChart(
      src,
      viz => {
        const texts = [];
        const visit = (node, path = []) => {
          if (node.type === "text" && path.includes("plot-x-axis"))
            texts.push(node.lines.map(l => l.text));
          (node.children || []).forEach(c => visit(c, path.concat(node.key)));
        };
        visit(viz._paintedScene.root);
        const dom = [...document.querySelectorAll("#viz text")].map(
          t => t.textContent,
        );
        return {texts, dom};
      },
      {renderer, html: '<div id="viz" style="width:300px;height:300px"></div>'},
    );
    const title = out.texts.find(lines => lines[0].startsWith("Ages"));
    assert.ok(title, JSON.stringify(out.texts));
    assert.strictEqual(title.length, 1);
    const [text] = title;
    assert.ok(text.endsWith("..."), text);
    assert.ok(text.startsWith("Ages 0.5 to 4.5"), text);
    if (renderer === "svg")
      assert.ok(
        out.dom.some(t => t.startsWith("Ages 0.5 to 4.5")),
        JSON.stringify(out.dom),
      );
  });
}
