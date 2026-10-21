import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

after(async () => {
  await closeBrowser();
});

it("Pie and Donut slice labels show the slice's share percentage", async function () {
  this.timeout(120000);

  const out = await render(
    '<div id="s" style="width:500px;height:500px;"></div>',
    async charts => {
      const data = [
        {id: "alpha", value: 50},
        {id: "beta", value: 30},
        {id: "gamma", value: 20},
      ];
      const results = {};
      for (const name of charts) {
        document.querySelector("#s").innerHTML = "";
        const viz = new window.d3plus[name]().select("#s").duration(0).data(data);
        await new Promise(resolve => viz.render(resolve));
        const texts = [...document.querySelectorAll("#s svg text")].map(t => t.textContent);
        const pos = label => {
          const t = [...document.querySelectorAll("#s svg text")].find(
            el => el.textContent === label,
          );
          return t && t.getBoundingClientRect().top;
        };
        const aria = [...document.querySelectorAll("#s svg path[aria-label]")].map(p =>
          p.getAttribute("aria-label"),
        );
        results[name] = {texts, alphaTop: pos("alpha"), shareTop: pos("50%"), aria};
      }
      return results;
    },
    ["Pie", "Donut"],
  );

  for (const [name, r] of Object.entries(out)) {
    for (const share of ["50%", "30%", "20%"])
      assert.ok(r.texts.includes(share), `${name}: draws ${share} (drew ${JSON.stringify(r.texts)})`);
    assert.ok(r.shareTop > r.alphaTop, `${name}: share sits below the name`);
    assert.ok(
      r.aria.some(a => a.includes("alpha") && a.includes("50%")),
      `${name}: slice aria-label includes the share`,
    );
  }
});

it("Pie and Donut slice labels are the same whatever Math.random returns", async function () {
  this.timeout(120000);

  // Each page load gets a different Math.random stream; the label boxes, and
  // so which slices fit a share line, must not depend on it.
  const draw = seed =>
    render(
      '<div id="s" style="width:600px;height:400px;"></div>',
      async ({charts, seed}) => {
        let state = seed;
        Math.random = () => {
          state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
          return state / 4294967296;
        };
        const data = [
          {id: "alpha", value: 50},
          {id: "beta", value: 30},
          {id: "gamma", value: 20},
        ];
        const results = {};
        for (const name of charts) {
          document.querySelector("#s").innerHTML = "";
          const viz = new window.d3plus[name]().select("#s").duration(0).data(data);
          await new Promise(resolve => viz.render(resolve));
          results[name] = [...document.querySelectorAll("#s svg text")].map(t => {
            const b = t.getBoundingClientRect();
            return `${t.textContent} @ ${Math.round(b.left)},${Math.round(b.top)}`;
          });
        }
        return results;
      },
      {charts: ["Pie", "Donut"], seed},
    );

  const first = await draw(1);
  for (const seed of [2, 3, 4])
    assert.deepStrictEqual(await draw(seed), first, `labels match with Math.random seed ${seed}`);
  for (const [name, labels] of Object.entries(first))
    assert.ok(
      labels.some(l => l.startsWith("20% @")),
      `${name}: draws 20% (drew ${JSON.stringify(labels)})`,
    );
});
