import {it} from "vitest";
import assert from "assert";
import {scaleLinear, scalePoint} from "d3-scale";
import {useJsdom} from "~test/jsdom.js";
import {Tick} from "../../index.ts";
import tickBuffer from "../../src/charts/plotBuffers/Tick.ts";

useJsdom();

/**
    Tick: a short bar centered on each point, `length` long and `thickness`
    thick, running along x (`orient: "horizontal"`) or y, with a hover target
    at least 8px across its thin side.
*/

const draw = config => {
  const tick = new Tick()
    .data([{id: "a", x: 10, y: 20}])
    .renderMode("compute")
    .config(config)
    .render();
  const rects = tick.toScene().children.filter(n => n.type === "rect");
  const hit = rects.find(n => n.key.endsWith("::hit"));
  return [rects.find(n => n !== hit), hit];
};

it("Tick: a horizontal tick is length wide and thickness tall, centered on its point", () => {
  const [mark, hit] = draw({});
  assert.strictEqual(mark.shapeType, "Tick");
  assert.deepStrictEqual(
    [mark.x, mark.y, mark.width, mark.height],
    [-10, -1, 20, 2],
  );
  assert.deepStrictEqual([mark.transform.x, mark.transform.y], [10, 20]);
  assert.ok(hit.key.endsWith("::hit"));
  assert.deepStrictEqual([hit.width, hit.height], [20, 8]);
});

it("Tick: vertical ticks, and length and thickness accessors", () => {
  const [mark] = draw({
    orient: "vertical",
    length: 30,
    thickness: d => d.x / 5,
  });
  assert.deepStrictEqual([mark.width, mark.height], [2, 30]);
  const config = new Tick().config({length: 12}).config();
  assert.strictEqual(config.length(), 12);
});

it("tickBuffer: pads a discrete axis and a few pixels past the outer ticks", () => {
  const x = scalePoint().domain(["A", "B"]).range([0, 100]);
  // A Plot's y domain runs top-down.
  const y = scaleLinear().domain([10, 0]).range([0, 100]);
  const [bx, by] = tickBuffer.call(
    {schema: {discrete: "x"}},
    {
      data: [
        {x: "A", y: 0},
        {x: "B", y: 10},
      ],
      x,
      y,
      config: {},
    },
  );
  assert.ok(bx.padding() > 0, "the point scale is padded");
  const [hi, lo] = by.domain();
  assert.ok(lo < 0 && hi > 10, `${lo}, ${hi}`);
});
