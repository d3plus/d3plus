import {it} from "vitest";
import assert from "assert";
import {
  radialBarFootprint,
  radialBarLabelRoom,
  radialBarTracks,
} from "../../src/charts/RadialBar/tracks.ts";
import {
  RADIAL_BAR_MIN_LABEL_GAP,
  radialBarSweep,
  radialBarTrackLabels,
} from "../../src/charts/RadialBar/trackLayout.ts";

const close = (a, b, msg) =>
  assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} vs ${b}`);

it("RadialBar tracks: radialBarTracks: equal bands, first outermost, padded on the inside", () => {
  const tracks = radialBarTracks(4, 40, 200, 0.25);
  assert.strictEqual(tracks.length, 4);
  assert.deepStrictEqual(tracks[0], {inner: 170, outer: 200});
  assert.deepStrictEqual(tracks[3], {inner: 50, outer: 80});
  assert.deepStrictEqual(
    radialBarTracks(2, 0, 100, 0),
    [
      {inner: 50, outer: 100},
      {inner: 0, outer: 50},
    ],
    "no padding fills each band",
  );
  close(radialBarTracks(1, 0, 100, 5)[0].inner, 95, "padding is capped");
  assert.deepStrictEqual(radialBarTracks(0, 0, 100, 0), [], "no rows");
  assert.deepStrictEqual(radialBarTracks(3, 100, 100, 0), [], "no ring");
});

it("RadialBar tracks: radialBarLabelRoom: limited by the circle, or the gap under a quarter turn", () => {
  assert.strictEqual(
    radialBarLabelRoom(100, 200, Math.PI / 2, 6),
    194,
    "a quarter-turn gap: up to the radius",
  );
  close(
    radialBarLabelRoom(100, 200, Math.PI / 4, 0),
    100,
    "45°: as far as the far end of the tracks",
  );
  close(
    radialBarLabelRoom(100, 200, Math.PI / 6, 0),
    100 * Math.tan(Math.PI / 6),
    "30°",
  );
  assert.strictEqual(
    radialBarLabelRoom(100, 200, 0, 0),
    0,
    "a full circle leaves no room",
  );
  assert.strictEqual(radialBarLabelRoom(0, 200, Math.PI, 0), 0, "no track");
  assert.strictEqual(
    radialBarLabelRoom(10, 200, Math.PI, 20),
    180,
    "the gap comes off the room",
  );
});

it("RadialBar tracks: radialBarFootprint: the swept arc plus the label strip", () => {
  const full = radialBarFootprint(0, (3 * Math.PI) / 2, 0.5);
  close(full.x0, -1, "the 270° sweep reaches 9 o'clock");
  close(full.x1, 1, "and 3 o'clock");
  close(full.y0, -1, "12 o'clock");
  close(full.y1, 1, "6 o'clock");
  const half = radialBarFootprint(-Math.PI / 2, Math.PI / 2, 0.6);
  close(half.y0, -1, "the top half reaches 12 o'clock");
  close(half.y1, 0.6, "the labels run down from 9 o'clock");
  close(half.x0, -1, "left end");
  close(half.x1, 1, "right end");
  const bare = radialBarFootprint(-Math.PI / 2, Math.PI / 2, 0);
  close(bare.y1, 0, "without labels the center bounds the bottom");
});

it("RadialBar tracks: radialBarSweep: maxAngle in radians, 270 by default, clamped to 1-360", () => {
  const sweep = maxAngle => radialBarSweep({schema: {maxAngle}});
  close(sweep(undefined), (Math.PI * 3) / 2, "default");
  close(sweep(180), Math.PI, "half");
  close(sweep(720), Math.PI * 2, "clamped to a full circle");
  close(sweep(0.5), Math.PI / 180, "at least a degree");
});

it("RadialBar tracks: radialBarTrackLabels: only when the sweep leaves a 30° gap before the start", () => {
  const labeled = maxAngle => radialBarTrackLabels({schema: {maxAngle}});
  close(RADIAL_BAR_MIN_LABEL_GAP, Math.PI / 6, "30°");
  assert.strictEqual(labeled(undefined), true, "the default 270° sweep");
  assert.strictEqual(labeled(330), true, "exactly 30° left");
  assert.strictEqual(labeled(331), false);
  assert.strictEqual(labeled(360), false, "a full circle");
});
