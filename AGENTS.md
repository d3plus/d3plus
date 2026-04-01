# AGENTS.md — d3plus

Guidelines for AI agents working in this repository.

## Project Overview

d3plus is a JavaScript data visualization library that extends D3.js. It is organized as an **npm monorepo** with workspaces under `packages/`. Each package is independently publishable under the `@d3plus/` npm scope.

### Packages

| Package | Purpose |
|---|---|
| `@d3plus/color` | Color utilities and defaults |
| `@d3plus/core` | All chart types, components, and shapes |
| `@d3plus/data` | Data manipulation and filtering |
| `@d3plus/dom` | DOM utilities |
| `@d3plus/export` | SVG/image export |
| `@d3plus/format` | Number and date formatting |
| `@d3plus/locales` | Translation dictionaries |
| `@d3plus/math` | Math utilities |
| `@d3plus/react` | React component wrappers |
| `@d3plus/text` | Text measurement and wrapping |
| `@d3plus/docs` | Storybook documentation site |

## Architecture

### BaseClass Pattern

All visualization classes inherit from `BaseClass` (in `packages/core/src/utils/BaseClass.js`). It provides:

- A **chainable (fluent) API** — public setter methods return `this`
- **Auto-configuration** — methods are auto-discovered at construction to set defaults
- **Deep config merging** via `config()` — pass an object to set many properties at once
- **`RESET` token** — pass `RESET` as a value to restore a property to its default
- Locale and event management built in

When adding a new property to a class, add a corresponding getter/setter method that returns `this` when called as a setter and returns the stored value when called with no arguments.

### Package Anatomy

Every package follows the same layout:

```
packages/<name>/
  index.js          # Re-exports everything from src/
  src/              # Source files (ES modules)
  es/               # Build output: transpiled ES modules (gitignored, generated)
  umd/              # Build output: UMD bundles (gitignored, generated)
  test/             # Mocha tests (*-test.js)
  dev/              # Dev HTML pages (gitignored)
  package.json
```

### Build Outputs

Each package produces four UMD bundles plus the `es/` ESM tree:

- `umd/<name>.js` — standalone (peers are external)
- `umd/<name>.full.js` — all dependencies inlined
- `umd/<name>.min.js` — minified standalone
- `umd/<name>.full.min.js` — minified full

## Development Workflow

### Setup

```bash
npm ci            # Install all workspace dependencies
```

### Development Server

Run from the repo root, targeting the package you want to work on:

```bash
npm run dev -w @d3plus/color   # live-server on :4000 + Rollup watch
npm run dev -w @d3plus/react   # Vite on :4000
npm run dev -w @d3plus/docs    # Storybook on :4000
```

The `scripts/dev.js` watcher automatically rebuilds ESM and UMD outputs when source files change.

### Building

```bash
# Build ESM for all packages (run before testing)
npm run build:esm --workspaces --if-present

# Build a single package's ESM
npm run build:esm -w @d3plus/core

# Build a single package's UMD
npm run build:umd -w @d3plus/core
```

### Testing

```bash
# Test all packages (pretest builds ESM first)
npm test

# Test a single package
npm test -w @d3plus/color
```

Each package's test script runs ESLint on `index.js` and `src/**/*.js`, then Mocha on `test/**/*-test.js`. Tests use JSDOM for DOM emulation.

### Documentation

```bash
npm run docs      # Generates markdown docs from JSDoc comments
```

## Code Conventions

- **File format:** ES modules (`type: "module"` everywhere). Use named exports.
- **Private properties:** prefixed with `_` (e.g., `this._color`).
- **Getter/setter methods:** same method name handles both — no argument → return stored value, argument passed → store and `return this`.
- **No TypeScript.** All source is plain `.js`.
- **Formatting:** Prettier with `arrowParens: "avoid"` and `bracketSpacing: false`. Run Prettier before committing.
- **Linting:** ESLint flat config (`eslint.config.js` at root). Fix lint errors before committing.
- **JSDoc:** Add JSDoc comments to all public methods. The `npm run docs` script generates markdown from them.

## Adding a New Chart Type

1. Create `packages/core/src/charts/MyChart.js` — extend an existing chart class or `Plot`.
2. Export it from `packages/core/src/charts/index.js`.
3. Export it from `packages/core/index.js`.
4. Add a Storybook story in `packages/docs/charts/`.
5. Add a Mocha test in `packages/core/test/`.

## Common Pitfalls

- **Always build ESM before running tests.** Tests import from `es/` which is generated output. The root `pretest` script does this automatically, but if running a single package's tests in isolation, run `npm run build:esm -w @d3plus/<pkg>` first.
- **`es/` and `umd/` are gitignored.** Do not commit build output.
- **`dev/` is gitignored.** Do not commit development HTML pages.
- **Releases require `GITHUB_TOKEN`.** The `scripts/release.js` script calls the GitHub Releases API. Do not run `npm run release` without it set.
- **Circular dependency warnings from Rollup are suppressed** in the build config. Don't introduce new circular dependencies between packages.
- **Polyfills are injected at the top of UMD bundles** via `scripts/utils/polyfills.js`. Browser compatibility shims don't need to be added to source files.

## Running a Release

Releases are automated. Do not run this unless you are the maintainer and have confirmed all tests pass:

```bash
GITHUB_TOKEN=<token> node scripts/release.js
```

The script bumps the version, publishes all packages to npm with `--access=public`, commits, tags, and creates a GitHub release.
