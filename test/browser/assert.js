import {expect} from "vitest";

/**
 * The subset of Node's `assert` that browser tests use, over Vitest's
 * `expect` with the same semantics: `strictEqual` compares with `Object.is`
 * and `deepStrictEqual` also compares prototypes and `undefined` properties.
 */
function assert(value, message) {
  expect(value, message).toBeTruthy();
}

assert.ok = assert;

assert.strictEqual = (actual, expected, message) => {
  expect(actual, message).toBe(expected);
};

assert.notStrictEqual = (actual, expected, message) => {
  expect(actual, message).not.toBe(expected);
};

assert.deepStrictEqual = (actual, expected, message) => {
  expect(actual, message).toStrictEqual(expected);
};

assert.notDeepStrictEqual = (actual, expected, message) => {
  expect(actual, message).not.toStrictEqual(expected);
};

assert.match = (string, regexp, message) => {
  expect(string, message).toMatch(regexp);
};

assert.doesNotMatch = (string, regexp, message) => {
  expect(string, message).not.toMatch(regexp);
};

export default assert;
