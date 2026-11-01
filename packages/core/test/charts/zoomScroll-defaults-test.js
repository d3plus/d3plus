import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {ArcDiagram, Geomap, Network, Plot, Treemap} from "../../index.ts";

useJsdom();

/** Every chart, Geomap and Network included, leaves page scrolling alone by default. */

it('zoomScroll: every chart defaults to "modifier", and its own setting wins', () => {
  for (const Chart of [ArcDiagram, Geomap, Network, Plot, Treemap])
    assert.strictEqual(new Chart().zoomScroll(), "modifier", Chart.name);
  assert.strictEqual(new Geomap().zoomScroll(true).zoomScroll(), true);
  assert.strictEqual(
    new Network().config({zoomScroll: false}).zoomScroll(),
    false,
  );
});
