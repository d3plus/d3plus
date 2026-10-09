import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    Regression guard for a same-tick `_renderTiles` race: `.config({...})`
    applying `tileUrl` alongside `projection` in one batch — exactly what a
    React/Vue/Svelte wrapper's `applyConfig` does on every prop change, and
    what `.tileUrl(x).projection(y).render()` does directly — fires
    `_renderTiles` twice before either transition's next animation frame:
    once synchronously from the `tileUrl` setter (against the projection's
    stale, not-yet-refit scale/translate), and once from the real `render()`
    pipeline (correctly fit). The first call's `images.exit()` schedules the
    correct-key tiles for a fade-out-then-remove; the second call's join
    re-matches those same elements by key as an "update", but without
    `images.interrupt()` (see `Geomap/index.ts`) the queued removal fires
    anyway, deleting the tiles it had just revived — and a version of the fix
    that interrupts too broadly (the merged update+enter selection, not just
    the update selection) leaves freshly entered tiles' own fade-in
    transition cancelled before it starts, stuck at `opacity: 0`.
*/
after(async () => {
  await closeBrowser();
});

it("a config change that fires two _renderTiles calls in one tick doesn't lose or hide tiles", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const viz = new window.d3plus.Geomap()
          .select("#s")
          .projection("geoMercator")
          .duration(0);
        viz.render(() => {
          // Same tick: `.config({...})` applies `projection` (recreating an
          // unfit projection instance) and `tileUrl` in one batch, then
          // `.render()` runs immediately after — no animation frame in
          // between, reproducing the race exactly as a framework wrapper's
          // `applyConfig` + `render()` call does on every prop change.
          viz.config({
            projection: "geoMercator",
            tileUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
          });
          viz.render(() => {
            window.setTimeout(() => {
              const tiles = [...document.querySelectorAll("image.d3plus-geomap-tile")];
              resolve({
                count: tiles.length,
                opacities: tiles.map(t => window.getComputedStyle(t).opacity),
                hrefs: tiles.map(t => t.getAttribute("xlink:href") || t.getAttribute("href")),
              });
            }, 300);
          });
        });
      }),
  );

  assert.ok(out.count > 0, "the new view's tiles are present");
  assert.ok(
    out.opacities.every(o => o === "1"),
    `every tile is fully visible, not stuck fading in (got ${JSON.stringify(out.opacities)})`,
  );
  assert.ok(
    out.hrefs.every(h => h.includes("World_Street_Map")),
    "tiles reflect the new tileUrl, not a stale or mixed set",
  );
});
