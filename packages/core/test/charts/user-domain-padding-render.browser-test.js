import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {probeChart} from "~test/browser/helpers.js";

/**
    Shape padding (the room Plot makes for circles, rects, and boxes at the
    edges of a value axis) never moves an end of the user's domain: data past
    a set `yDomain`/`xDomain`/`y2Domain` end is clipped, not fitted. A
    one-sided domain whose data all sits past its set end still starts the
    axis at that end, running the right way.
*/

const ys = [5, 30, 70, 45, 10, 62, 40];
const DATA = {
  // Points from 5 to 70, past both ends of [20, 60].
  cross: ys.map((y, x) => ({id: `p${x}`, s: "a", x, y, y2: y * 2})),
  // Points from 0.1 to 0.6, all below 20.
  tiny: [0.1, 0.5, 0.3, 0.2, 0.4, 0.6, 0.3].map((y, x) => ({
    id: `p${x}`,
    s: "a",
    x,
    y,
  })),
};

/** Renders `src` over `DATA[set]` and reports each drawn axis's domain, low to high. */
const probe = (src, set, renderer) =>
  probeChart(
    src,
    viz => {
      const out = {};
      for (const axis of ["x", "y", "y2"]) {
        const scale = viz[`_${axis}Axis`]?._d3Scale;
        if (!scale || !scale.invert) continue;
        const d = scale.domain().map(Number);
        out[axis] = axis.startsWith("y") ? d.reverse() : d;
      }
      return out;
    },
    {data: DATA[set], renderer},
  );

const plot = extra =>
  `(lib, data) => new lib.Plot().data(data).groupBy("id").x("x").y("y").legend(false)${extra}`;

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer}: a Plot's circles don't widen a yDomain or xDomain`, async () => {
    const out = await probe(
      plot(".yDomain([20, 60]).xDomain([1, 5])"),
      "cross",
      renderer,
    );
    assert.deepStrictEqual(out.y, [20, 60]);
    assert.deepStrictEqual(out.x, [1, 5]);
  });

  it(`${renderer}: rects, boxes, and line markers keep the yDomain`, async () => {
    const charts = [
      plot(`.shape("Rect").yDomain([20, 60])`),
      `(lib, data) => new lib.BoxWhisker().data(data).groupBy(["s", "id"]).x("s").y("y").legend(false).yDomain([20, 60])`,
      `(lib, data) => new lib.LinePlot().data(data).groupBy("s").x("x").y("y").lineMarkers(true).legend(false).yDomain([20, 60])`,
    ];
    for (const src of charts) {
      const out = await probe(src, "cross", renderer);
      assert.deepStrictEqual(out.y, [20, 60], src);
    }
  });

  it(`${renderer}: a one-sided domain keeps its set end, and padding the open one`, async () => {
    const low = await probe(plot(".yDomain([20])"), "cross", renderer);
    assert.strictEqual(low.y[0], 20);
    assert.ok(low.y[1] > 70, `the top fits the 70 point: ${low.y}`);
    const high = await probe(
      plot(".yDomain([undefined, 40])"),
      "cross",
      renderer,
    );
    assert.strictEqual(high.y[1], 40);
    assert.ok(high.y[0] < 5, `the bottom fits the 5 point: ${high.y}`);
    const base = await probe(plot(".baseline(20)"), "cross", renderer);
    assert.strictEqual(base.y[0], 20);
  });

  it(`${renderer}: a secondary yDomain is kept too`, async () => {
    const out = await probe(
      plot(`.y2("y2").y2Domain([20, 60])`),
      "cross",
      renderer,
    );
    assert.deepStrictEqual(out.y2, [20, 60]);
  });

  it(`${renderer}: a minimum above every value still starts the axis there`, async () => {
    for (const src of [
      plot(".yDomain([20])"),
      `(lib, data) => new lib.LinePlot().data(data).groupBy("s").x("x").y("y").legend(false).yDomain([20])`,
    ]) {
      const out = await probe(src, "tiny", renderer);
      assert.strictEqual(out.y[0], 20, src);
      assert.ok(out.y[1] > 20, `${src}: the axis runs upward: ${out.y}`);
    }
    const two = await probe(plot(".yDomain([20, 60])"), "tiny", renderer);
    assert.deepStrictEqual(two.y, [20, 60]);
  });
}
