/* global globalThis */
import assert from "assert";
import mouseleave from "../../es/src/charts/events/mouseleave.js";

/**
    Leaving a scene node that carries no datum (a plot background, an inset
    backing) fires the global `mouseleave` with an undefined datum. Runs the
    deferred body synchronously so a throw surfaces in the test.
*/
const leave = (viz, d) => {
  const defer = globalThis.setTimeout;
  globalThis.setTimeout = fn => fn();
  try {
    mouseleave.call(viz, d, 0);
  }
  finally {
    globalThis.setTimeout = defer;
  }
};

const fakeViz = ({hoverDatum = null, tooltip = []} = {}) => {
  const calls = {hover: [], cleared: false};
  const viz = {
    _id: d => d.id,
    _hoverDatum: hoverDatum,
    _hover: () => true,
    hover: v => calls.hover.push(v),
    schema: {shapeConfig: {hoverOpacity: 0.5}, tooltip: () => true},
    _select: {style: () => viz._select},
    _tooltipClass: {
      data: v => v === undefined ? tooltip : (tooltip = v, calls.cleared = true, viz._tooltipClass),
      render: () => viz._tooltipClass,
    },
  };
  return {viz, calls};
};

it("mouseleave — no datum, pointer now over a datum", () => {
  const {viz, calls} = fakeViz({hoverDatum: {id: "a"}, tooltip: [{id: "a"}]});
  assert.doesNotThrow(() => leave(viz, undefined));
  assert.deepStrictEqual(calls.hover, [], "the new mark's hover stays");
  assert.strictEqual(calls.cleared, false, "an unrelated tooltip stays up");
});

it("mouseleave — no datum, tooltip showing", () => {
  const {viz, calls} = fakeViz({tooltip: [{id: "a"}]});
  assert.doesNotThrow(() => leave(viz, undefined));
  assert.strictEqual(calls.cleared, false);
});

it("mouseleave — leaving a datum still hides its tooltip", () => {
  const {viz, calls} = fakeViz({tooltip: [{id: "a"}]});
  leave(viz, {id: "a"});
  assert.deepStrictEqual(calls.hover, [false]);
  assert.strictEqual(calls.cleared, true);
});
