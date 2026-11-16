import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import lesmis from "../../dev/charts/Network/lesmis.json";
import states from "../../dev/charts/Geomap/State.json";
import cities from "../../dev/charts/Geomap/city_coords.json";

/**
    `labelSlide` in Chromium, on SVG and Canvas: a circle label that fits on
    no side of its circle slides along one, so a dense scatter, a map of
    cities and Les Misérables each name more of their circles than with
    `labelSlide: false`, every label clear of the others.
*/

const body = `
  <div id="viz" style="width:618px;height:480px;position:absolute;left:0;top:0;font-family:sans-serif"></div>`;

/** A seeded scatter: 90 points crowded in the middle, 50 spread out. */
const scatter = (() => {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  return Array.from({length: 140}, (_, i) => {
    const dense = i < 90;
    return {
      id: `P${i + 1}`,
      x: dense ? 40 + rand() * 25 : rand() * 100,
      y: dense ? 40 + rand() * 25 : rand() * 100,
    };
  });
})();

/**
    Runs in the page: draws `chart` with and without sliding, and reads each
    draw's labels (`pattern` picks their keys) as boxes.
*/
const draw = async ({chart, config, pattern, renderer}) => {
  const once = async slide => {
    document.querySelector("#viz").innerHTML = "";
    const viz = new window.d3plus[chart]()
      .select("#viz")
      .renderer(renderer)
      .config({duration: 0, legend: false, ...config});
    if (chart === "Network") viz.linkSize(d => d.value);
    // Functions don't cross into the page: the map's accessors are set here.
    if (chart === "Geomap")
      viz.label(d => d.city).point(d => [d.longitude, d.latitude]);
    if (slide !== undefined) viz.labelSlide(slide);
    await new Promise(resolve => viz.render(resolve));
    const flat = list =>
      list.flatMap(n => (n.children ? [n, ...flat(n.children)] : [n]));
    return flat(viz._chartScene || [])
      .filter(n => n.type === "text" && new RegExp(pattern).test(n.key))
      .map(n => ({
        key: n.key,
        x: n.transform?.x ?? n.x,
        y: n.transform?.y ?? n.y,
        width: n.width,
        height: n.height,
      }));
  };
  return {slid: await once(), fixed: await once(false), on: await once(true)};
};

/** The gap between two boxes (negative when they overlap). */
const gap = (a, b) =>
  Math.max(
    b.x - (a.x + a.width),
    a.x - (b.x + b.width),
    b.y - (a.y + a.height),
    a.y - (b.y + b.height),
  );

/** Asserts no label overlaps another. */
function assertApart(labels) {
  labels.forEach((a, i) => {
    for (const b of labels.slice(i + 1))
      assert.ok(gap(a, b) > -0.5, `${a.key} clear of ${b.key}`);
  });
}

const charts = {
  "a dense scatter": {
    chart: "Plot",
    config: {data: scatter, groupBy: "id", x: "x", y: "y"},
    pattern: "^P\\d+_",
  },
  "a map of cities": {
    chart: "Geomap",
    config: {
      data: cities.filter((_, i) => i % 2 === 0),
      groupBy: "slug",
      pointCluster: false,
      projection: "geoAlbersUsa",
      tiles: false,
      topojson: states,
    },
    pattern: "^geomap-label-",
  },
  "Les Misérables": {
    chart: "Network",
    config: {forceLive: false, nodes: lesmis.nodes, links: lesmis.links},
    pattern: "^network-label-",
  },
};

for (const renderer of ["svg", "canvas"])
  for (const [name, spec] of Object.entries(charts))
    it(`[${renderer}] ${name} names more circles with labelSlide`, async () => {
      const {slid, fixed, on} = await render(body, draw, {...spec, renderer});
      assert.ok(slid.length > fixed.length, `${slid.length} > ${fixed.length}`);
      assert.deepStrictEqual(on, slid, "labelSlide defaults to true");
      assertApart(slid);
      assertApart(fixed);
    });
