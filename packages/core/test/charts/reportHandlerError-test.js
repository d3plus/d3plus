import {afterEach, it, vi} from "vitest";
import assert from "assert";
import {reportHandlerError} from "../../src/charts/viz/reportHandlerError.ts";

afterEach(() => {
  vi.restoreAllMocks();
  delete globalThis.reportError;
});

it("reportHandlerError: hands the error to reportError when it exists", () => {
  const reported = [];
  globalThis.reportError = error => reported.push(error);
  const error = new Error("bad handler");
  reportHandlerError(error);
  assert.deepStrictEqual(reported, [error]);
});

it("reportHandlerError: logs with console.error without reportError", () => {
  delete globalThis.reportError;
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  const error = new Error("bad handler");
  reportHandlerError(error);
  assert.deepStrictEqual(spy.mock.calls, [[error]]);
});
