import {it} from "vitest";
import assert from "assert";
import {Image} from "../../index.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

const data = [
  {id: "a", x: 0, y: 0, width: 100, height: 50, url: "a.png"},
  {id: "b", x: 0, y: 60, width: 100, height: 50, url: "b.png"},
];

/** Each datum's `preserveAspectRatio`, from the scene and the SVG render. */
async function fits(image) {
  const scene = image
    .data(data)
    .toScene()
    .children.map(n => n.preserveAspectRatio);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  document.body.appendChild(svg);
  await new Promise(cb => image.select(svg).duration(0).render(cb));
  const dom = [...svg.querySelectorAll("image")].map(n =>
    n.getAttribute("preserveAspectRatio"),
  );
  svg.remove();
  return {scene, dom};
}

it("Image: preserveAspectRatio is unset by default", async () => {
  const image = new Image();
  assert.strictEqual(image.preserveAspectRatio()(data[0], 0), undefined);
  const {scene, dom} = await fits(image);
  assert.deepStrictEqual(scene, [undefined, undefined], "scene nodes omit it");
  assert.deepStrictEqual(dom, [null, null], "the <image>s omit it");
});

it("Image: preserveAspectRatio takes a constant", async () => {
  const image = new Image().preserveAspectRatio("xMinYMin slice");
  assert.strictEqual(image.preserveAspectRatio()(data[0], 0), "xMinYMin slice");
  const {scene, dom} = await fits(image);
  assert.deepStrictEqual(scene, ["xMinYMin slice", "xMinYMin slice"]);
  assert.deepStrictEqual(dom, ["xMinYMin slice", "xMinYMin slice"]);
});

it("Image: preserveAspectRatio takes a per-datum accessor", async () => {
  const seen = [];
  const image = new Image().preserveAspectRatio((d, i) => {
    seen.push(i);
    return d.id === "a" ? "none" : undefined;
  });
  const {scene, dom} = await fits(image);
  assert.ok(seen.includes(0) && seen.includes(1), "called with each index");
  assert.deepStrictEqual(scene, ["none", undefined]);
  assert.deepStrictEqual(dom, ["none", null]);
});

it("Image: config() sets preserveAspectRatio", () => {
  const image = new Image().config({preserveAspectRatio: "xMaxYMid"});
  assert.strictEqual(image.preserveAspectRatio()(data[0], 0), "xMaxYMid");
  assert.strictEqual(
    image.data(data).toScene().children[0].preserveAspectRatio,
    "xMaxYMid",
  );
});
