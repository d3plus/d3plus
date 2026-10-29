import {afterEach, it, vi} from "vitest";
import assert from "assert";
import {
  effectiveDuration,
  motionReduced,
  prefersReducedMotion,
} from "../../src/charts/viz/reducedMotion.ts";
import configPrep from "../../src/utils/configPrep.ts";

afterEach(() => vi.unstubAllGlobals());

/** Stubs `window.matchMedia` to answer the reduced-motion query with `reduce`. */
function stubMotion(reduce) {
  const queries = [];
  vi.stubGlobal("window", {
    matchMedia: query => {
      queries.push(query);
      return {matches: reduce, media: query};
    },
  });
  return queries;
}

it("prefersReducedMotion: true when the OS asks for reduced motion", () => {
  const queries = stubMotion(true);
  assert.strictEqual(prefersReducedMotion(), true);
  assert.deepStrictEqual(queries, ["(prefers-reduced-motion: reduce)"]);
});

it("prefersReducedMotion: false when the OS allows motion", () => {
  stubMotion(false);
  assert.strictEqual(prefersReducedMotion(), false);
});

it("prefersReducedMotion: false without a window (server-side rendering)", () => {
  vi.stubGlobal("window", undefined);
  assert.strictEqual(prefersReducedMotion(), false);
});

it("prefersReducedMotion: false without matchMedia", () => {
  vi.stubGlobal("window", {});
  assert.strictEqual(prefersReducedMotion(), false);
});

it("prefersReducedMotion: false when matchMedia throws", () => {
  vi.stubGlobal("window", {
    matchMedia: () => {
      throw new Error("unsupported");
    },
  });
  assert.strictEqual(prefersReducedMotion(), false);
});

it("motionReduced: true and false force the setting, auto follows the OS", () => {
  stubMotion(true);
  assert.strictEqual(motionReduced({schema: {reducedMotion: true}}), true);
  assert.strictEqual(motionReduced({schema: {reducedMotion: false}}), false);
  assert.strictEqual(motionReduced({schema: {reducedMotion: "auto"}}), true);
  assert.strictEqual(motionReduced({schema: {}}), true, "unset acts as auto");
  stubMotion(false);
  assert.strictEqual(motionReduced({schema: {reducedMotion: true}}), true);
  assert.strictEqual(motionReduced({schema: {reducedMotion: "auto"}}), false);
});

it("effectiveDuration: auto is 0 when the OS reduces motion, else duration", () => {
  const host = {schema: {duration: 600, reducedMotion: "auto"}};
  stubMotion(true);
  assert.strictEqual(effectiveDuration(host), 0);
  stubMotion(false);
  assert.strictEqual(effectiveDuration(host), 600);
  vi.stubGlobal("window", undefined);
  assert.strictEqual(effectiveDuration(host), 600, "SSR animates");
});

it("effectiveDuration: true is always 0, false always the duration", () => {
  stubMotion(false);
  assert.strictEqual(
    effectiveDuration({schema: {duration: 600, reducedMotion: true}}),
    0,
  );
  stubMotion(true);
  assert.strictEqual(
    effectiveDuration({schema: {duration: 600, reducedMotion: false}}),
    600,
  );
});

it("effectiveDuration: leaves the stored duration untouched", () => {
  stubMotion(true);
  const host = {schema: {duration: 450, reducedMotion: true}};
  assert.strictEqual(effectiveDuration(host), 0);
  assert.strictEqual(host.schema.duration, 450);
});

it("effectiveDuration: an unset duration is 0", () => {
  stubMotion(false);
  assert.strictEqual(effectiveDuration({schema: {reducedMotion: false}}), 0);
});

it("configPrep: passes child components the effective duration", () => {
  stubMotion(false);
  const host = {schema: {duration: 600, reducedMotion: true, shapeConfig: {}}};
  assert.strictEqual(configPrep.bind(host)().duration, 0);
  host.schema.reducedMotion = false;
  assert.strictEqual(configPrep.bind(host)().duration, 600);
});
