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
      assert.ok(r.texts.includes(share), `${name}: draws ${share}`);
    assert.ok(r.shareTop > r.alphaTop, `${name}: share sits below the name`);
    assert.ok(
      r.aria.some(a => a.includes("alpha") && a.includes("50%")),
      `${name}: slice aria-label includes the share`,
    );
  }
});
