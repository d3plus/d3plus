import assert from "assert";
import {default as studentTQuantile, studentTCdf} from "../es/src/studentTQuantile.js";

const close = (actual, expected, tol, msg) =>
  assert.ok(Math.abs(actual - expected) < tol, `${msg}: ${actual} vs ${expected}`);

it("studentTQuantile", () => {
  close(studentTQuantile(0.975, 1), 12.7062, 1e-3, "df=1");
  close(studentTQuantile(0.975, 5), 2.5706, 1e-3, "df=5");
  close(studentTQuantile(0.975, 30), 2.0423, 1e-3, "df=30");
  close(studentTQuantile(0.975, 1e6), 1.96, 1e-2, "large df approaches normal");
  close(studentTQuantile(0.95, 10), 1.8125, 1e-3, "one-sided 95%, df=10");
  close(studentTQuantile(0.025, 5), -2.5706, 1e-3, "lower tail is symmetric");
  assert.strictEqual(studentTQuantile(0.5, 7), 0, "median is zero");
  assert.ok(Number.isNaN(studentTQuantile(0, 5)), "p=0 is NaN");
  assert.ok(Number.isNaN(studentTQuantile(1, 5)), "p=1 is NaN");
  assert.ok(Number.isNaN(studentTQuantile(0.9, 0)), "df=0 is NaN");
});

it("studentTCdf", () => {
  close(studentTCdf(0, 4), 0.5, 1e-12, "zero is the median");
  close(studentTCdf(2.5706, 5), 0.975, 1e-4, "upper tail");
  close(studentTCdf(-2.5706, 5), 0.025, 1e-4, "lower tail");
  close(studentTCdf(1, 1), 0.75, 1e-9, "Cauchy (df=1) at 1");
});
