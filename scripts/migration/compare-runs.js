#!/usr/bin/env node
/**
    Compares mocha JSON baselines against a Vitest JSON report, test by test.

      node scripts/migration/compare-runs.js <baselineDir> <vitest.json> [explained.json]

    <baselineDir> holds one `baseline-<package>.json` per package (mocha
    `--reporter json`). <vitest.json> is `vitest run --reporter=json
    --outputFile=…`. Tests are matched by package, test file (relative to the
    package, with `.browser-test.js` read as `-test.js` and `.mjs` as `.js`)
    and full title. [explained.json] maps "<package>|<file>|<full title>" keys
    of baseline tests that were deliberately removed or renamed to the reason,
    or to {"renamed": "<new key>"}.

    Packages with no tests in the Vitest report are listed and skipped.
    Prints every baseline test that did not go passed → passed, every test
    that only exists in the Vitest run, and per-package counts. Exits 1 when
    an unexplained difference remains.
*/
import fs from "node:fs";
import path from "node:path";

const [baselineDir, vitestFile, explainedFile] = process.argv.slice(2);
if (!baselineDir || !vitestFile) {
  console.error("usage: compare-runs.js <baselineDir> <vitest.json> [explained.json]");
  process.exit(2);
}

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const explained = explainedFile ? JSON.parse(fs.readFileSync(explainedFile, "utf8")) : {};

/** Splits an absolute test file path into its package and normalized file. */
function locate(file) {
  const rel = path.relative(root, file).split(path.sep).join("/");
  const docs = rel.match(/^scripts\/docs\/(.*)$/);
  if (docs) return ["docs-scripts", docs[1]];
  const match = rel.match(/^packages\/([^/]+)\/(.*)$/);
  if (!match) return ["?", rel];
  const name = match[2].replace(/\.browser-test\.js$/, "-test.js").replace(/\.mjs$/, ".js");
  return [match[1], name];
}

const key = (pkg, file, title) => `${pkg}|${file}|${title}`;

const baseline = new Map();
for (const name of fs.readdirSync(baselineDir).sort()) {
  const match = name.match(/^baseline-(.+)\.json$/);
  if (!match) continue;
  const report = JSON.parse(fs.readFileSync(path.join(baselineDir, name), "utf8"));
  const pending = new Set(report.pending.map(t => `${t.file}|${t.fullTitle}`));
  for (const t of report.tests) {
    const [pkg, file] = locate(t.file);
    const status = t.err && Object.keys(t.err).length
      ? "failed"
      : pending.has(`${t.file}|${t.fullTitle}`) ? "pending" : "passed";
    baseline.set(key(pkg, file, t.fullTitle), status);
  }
}

const current = new Map();
const vitest = JSON.parse(fs.readFileSync(vitestFile, "utf8"));
for (const result of vitest.testResults) {
  const [pkg, file] = locate(result.name);
  for (const t of result.assertionResults) {
    const title = [...t.ancestorTitles, t.title].join(" ");
    const status = t.status === "passed" ? "passed" : t.status === "failed" ? "failed" : "pending";
    const k = key(pkg, file, title);
    // A title registered twice (e.g. by a loop) keeps its worst status.
    if (current.get(k) !== "failed") current.set(k, status);
  }
}

const counts = {};
const count = (pkg, field) => {
  counts[pkg] ??= {baseline: 0, vitest: 0, same: 0, explained: 0, problems: 0};
  counts[pkg][field]++;
};

const ran = new Set([...current.keys()].map(k => k.split("|")[0]));
const problems = [];
const matched = new Set();
for (const [k, before] of baseline) {
  const pkg = k.split("|")[0];
  if (!ran.has(pkg)) continue;
  count(pkg, "baseline");
  let target = k;
  const reason = explained[k];
  if (reason && typeof reason === "object" && reason.renamed) target = reason.renamed;
  else if (reason) {
    count(pkg, "explained");
    continue;
  }
  const after = current.get(target);
  if (after) matched.add(target);
  if (before === "passed" && after === "passed") count(pkg, target === k ? "same" : "explained");
  else {
    count(pkg, "problems");
    problems.push(`${before} → ${after ?? "missing"}: ${k}`);
  }
}
for (const [k, status] of current) {
  const pkg = k.split("|")[0];
  count(pkg, "vitest");
  if (!matched.has(k)) {
    count(pkg, "problems");
    problems.push(`new (${status}): ${k}`);
  }
}

console.log("package        baseline  vitest  passed→passed  explained  problems");
for (const pkg of Object.keys(counts).sort()) {
  const c = counts[pkg];
  console.log(
    `${pkg.padEnd(14)} ${String(c.baseline).padStart(8)} ${String(c.vitest).padStart(7)} ` +
      `${String(c.same).padStart(14)} ${String(c.explained).padStart(10)} ${String(c.problems).padStart(9)}`,
  );
}
const notRun = [...new Set([...baseline.keys()].map(k => k.split("|")[0]))].filter(p => !ran.has(p));
if (notRun.length) console.log(`\nnot in this Vitest run: ${notRun.join(", ")}`);
if (problems.length) {
  console.log(`\n${problems.length} difference(s):`);
  for (const line of problems) console.log(`  ${line}`);
  process.exit(1);
}
console.log("\nEvery baseline test passed → passed (or is explained).");
