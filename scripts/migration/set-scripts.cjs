// node scripts/migration/set-scripts.cjs <pkg> [project…]
const fs = require("node:fs");
const [pkg, ...extra] = process.argv.slice(2);
const projects = extra.length ? extra : [pkg];
const file = `packages/${pkg}/package.json`;
const json = JSON.parse(fs.readFileSync(file, "utf8"));
const run = `vitest run --config ../../vitest.config.ts ${projects.map(p => `--project ${p}`).join(" ")}`;
const include = fs.existsSync(`packages/${pkg}/internal.ts`) ? `{*.ts,src/**}` : fs.existsSync(`packages/${pkg}/index.tsx`) ? "{index.tsx,src/**}" : "{index.ts,src/**}";
json.scripts.test = run;
json.scripts["test:coverage"] = `${run} --coverage --coverage.include='packages/${pkg}/${include}' --coverage.reportsDirectory=packages/${pkg}/coverage`;
fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
