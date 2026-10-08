import assert from "assert";
import it from "../jsdom.js";
import {
  INTERNAL_KEY_PREFIX, SHARE_KEY, isInternalKey, shareOf, stampShare, summedShare,
} from "../../es/src/charts/features/shareKey.js";

it("shareKey — SHARE_KEY is an internal key", () => {
  assert.strictEqual(SHARE_KEY, "__d3plusShare");
  assert.ok(SHARE_KEY.startsWith(INTERNAL_KEY_PREFIX));
});

it("stampShare — a row without a share field gets both keys", () => {
  const row = {id: "a"};
  stampShare(row, 0.25);
  assert.deepStrictEqual(row, {id: "a", __d3plusShare: 0.25, share: 0.25});
});

it("stampShare — a row with its own share field keeps it", () => {
  const row = {id: "a", share: 12};
  stampShare(row, 0.25);
  assert.strictEqual(row.share, 12);
  assert.strictEqual(row.__d3plusShare, 0.25);
  stampShare(row, 0.5);
  assert.strictEqual(row.share, 12, "a restamp still leaves it alone");
  assert.strictEqual(row.__d3plusShare, 0.5);
});

it("stampShare — a restamp updates the share d3plus wrote", () => {
  const row = {id: "a"};
  stampShare(row, 0.25);
  stampShare(row, 0.75);
  assert.strictEqual(row.share, 0.75);
  assert.strictEqual(row.__d3plusShare, 0.75);
});

it("stampShare — a falsy share field (0, null) is still the user's", () => {
  const zero = {share: 0};
  const empty = {share: null};
  stampShare(zero, 0.4);
  stampShare(empty, 0.4);
  assert.strictEqual(zero.share, 0);
  assert.strictEqual(empty.share, null);
});

it("shareOf — reads d3plus's share, never a share field", () => {
  assert.strictEqual(shareOf({__d3plusShare: 0.3, share: 9}), 0.3);
  assert.deepStrictEqual(shareOf({__d3plusShare: [0.1, 0.2]}), [0.1, 0.2]);
  assert.strictEqual(shareOf({share: 9}), undefined);
  assert.strictEqual(shareOf(undefined), undefined);
});

it("summedShare — sums a merged row's member shares", () => {
  assert.strictEqual(summedShare({__d3plusShare: 0.3}), 0.3);
  assert.strictEqual(summedShare({__d3plusShare: [0.25, 0.5]}), 0.75);
  assert.ok(Number.isNaN(summedShare({share: 0.3})));
  assert.ok(Number.isNaN(summedShare(undefined)));
});

it("isInternalKey — matches only keys d3plus writes for itself", () => {
  for (const key of ["__d3plusShare", "__d3plus__", "__d3plusShape__"]) assert.ok(isInternalKey(key), key);
  for (const key of ["share", "id", "_d3plus", "d3plusShare"]) assert.ok(!isInternalKey(key), key);
});
