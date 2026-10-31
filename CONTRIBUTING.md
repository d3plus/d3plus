# Contributing

Welcome to the contribution tutorials and guidelines for d3plus :wave: There are two different places where you can contribute to this open source project:

1. Documentation and Examples on d3plus.org
2. Bugs and Features in the Source Code

## Website/Documentation

d3plus.org is an [Astro Starlight](https://starlight.astro.build) site in `packages/site` (its [README](packages/site/README.md) covers running it). Each chart, component, shape, and function has a page, and its examples are live: readers can edit the code, change settings with the controls, and copy it for their framework.

A page is an MDX file under `packages/site/src/content/docs/`, named after its export (`core/charts/treemap.mdx`); the guides are in `src/content/docs/guides/`. An example's code is its own file under `packages/site/src/examples/`, plain JavaScript that declares the chart's `config`, with any data or helpers it needs above it:

```js
const config = {
  data: [
    {id: "alpha", value: 29},
    {id: "beta", value: 10},
  ],
  groupBy: "id",
  sum: "value",
};
```

The page imports it with `?raw` and shows it in a `<Playground>`, under a heading and a sentence or two on what it shows:

```mdx
import Playground from "~/components/Playground/Playground.astro";
import basicExample from "~/examples/core/charts/treemap/basic-example.js?raw";

## Basic example

Each rectangle's area is proportional to its `sum`.

<Playground chart="Treemap" code={basicExample} controls={["sum"]} />
```

`controls` lists the config keys to offer as controls (by default, the example's own simple settings). A function's examples use `<Calls code={…} />` instead, which shows each call's value beneath it; imports go at the top of their code. Every page ends with `<ApiReference name="…" />`, the generated configuration reference.

When writing examples, please try to follow the following guidelines:

- Only include config methods that are pertinent to the example (ie. don't change things like the "legendPosition" because of personal preference).
- If possible, do not use external API links for things like "data" and "topojson". Wherever you can, either use a simple/small inline data Array or reference a static file added to `packages/site/public/data/`.
- Functions are written as plain functions in the example's code; it is shown exactly as written.
- Run `pnpm test:site` before submitting: it builds the site and checks that every example draws without errors, every link works, and every page fits a phone screen.

### Submitting a Pull Request

When you have something ready for review or critique, [submit a pull request](https://github.com/d3plus/d3plus/compare/).

## Source Code

If you are looking to contribute to the core source code of d3plus, start by cloning this monorepo:

```sh
git clone https://github.com/d3plus/d3plus.git
```

### Setting up your Environment

1. Install Node, if not already installed.

> <sub>If on a Mac, we suggest using [Homebrew](http://brew.sh/) to install packages on your machine. Once that's installed, you can install node (which includes npm) by running: `brew install node`</sub>

2. Move into the newly cloned root directory, and install dependencies: `pnpm install`

And that's it! Your environment should be all set up and ready to start coding.

### Workspaces

The codebase is split up into a series of smaller packages/modules, which allows users to install only the dependencies that they need. This repo uses [pnpm workspaces](https://pnpm.io/workspaces) to manage these packages, which lets them share common dependencies and scripts. Each package lives in the `packages/<package_name>` directory, and are released as scoped npm packages (ie. `@d3plus/<package_name>`).

Within each package directory, you will notice the following folder structure:

- :open_file_folder: `dev/`
- :open_file_folder: `src/`
- :open_file_folder: `test/` (optional)
- :page_facing_up: `index.ts` (or `index.tsx`)
- :page_facing_up: `package.json`
- :page_facing_up: `README.md`

All source code is TypeScript, lives in the `src` directory, and adheres to a linting ruleset in the root of the repo (`eslint.config.js`). The easiest way to follow the style guide is by installing a linter directly in your text editor, so that errors will be highlighted as you type. If your Pull Request does not match the project's linting style, it will not be merged. Code is formatted with [Prettier](https://prettier.io) (`.prettierrc`): run `pnpm format` before committing, or let your editor format on save.

### Running the Development Server

To start testing code live in a browser, with auto-compiling and hot reloading, type this into your shell:

```sh
pnpm --filter @d3plus/<package_name> run dev
```

If everything is set up correctly, `http://localhost:4000/` shows an index of every page in the package's `dev` directory, grouped by folder with a one-line description of each. The server also serves a `umd` directory with a compiled bundle (with dependencies) for you to use in your testing (this directory is in the `.gitignore`, and should never get pushed to the repo).

Most packages contain HTML files to copy/modify for testing, but here is the minimum boilerplate HTML that needs to be there (the `<title>` and description feed the index page, which the dev server writes to the gitignored `dev/index.html`):

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>MyTopic</title>
    <meta name="description" content="What this page tests, in one line." />
    <script src="/umd/d3plus-<package_name>.full.js"></script>
  </head>
  <body></body>
  <script>
    console.log(d3plus);
  </script>
</html>
```

The development server will recreate the `umd` directory any time the current package or any of it's dependent packages source files are modified. Once the rebuild has finished, your browser will hot reload (as well as when any `dev` file is changed).

### Code Documentation

All of the code documentation you see in each package's `API.md` file, and the configuration reference and controls on d3plus.org, are generated automatically by [TypeDoc](https://typedoc.org/) from the documentation comments within each source file. To preview the `API.md` files, run:

```sh
pnpm run docs
```

> The release process regenerates and commits these files, so leave them out of pull requests. The site generates its reference when it builds, so nothing needs committing for it: a new public class or function gets a page automatically.

### Tests

Any time you write a new feature for a module, if possible, you should also write an accompanying test. D3plus tests run with [Vitest](https://vitest.dev/): in Node (with [JSDOM](https://github.com/jsdom/jsdom) where a document is needed), or, for `@d3plus/core` tests that need a real layout engine, in Chromium through Vitest's browser mode.

All tests need to be placed in the `test` directory, and the filenames should match up to the components in `src` with a suffix of `-test.js` (`.browser-test.js` for the Chromium ones). To run a package's tests, run:

```sh
pnpm --filter @d3plus/<package_name> test
```

`pnpm test` lints the repo and runs every package's tests. Tests import each package's TypeScript source, so nothing needs to be built first.

Here is an example of what a test file could look like:

```js
import assert from "node:assert";
import {it} from "vitest";
import {useJsdom} from "~test/jsdom.js"; // optional: a fresh JSDOM document for each test

useJsdom();

it("example test title", () => {
  assert.strictEqual(true, true, "the truth test");
});
```

### Submitting a Pull Request

When you have something ready for review or critique, [submit a pull request](https://github.com/d3plus/d3plus/compare/).
