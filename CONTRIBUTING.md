# Contributing

Welcome to the contribution tutorials and guidelines for d3plus :wave: There are two different places where you can contribute to this open source project:

1. Documentation and Examples on d3plus.org
2. Bugs and Features in the Source Code

## Website/Documentation

D3plus users Storybook to build live examples that show the underlying @d3plus/react code and allows users to modify config settings in browser. The Storybook codebase is located in the `docs` folder, and all of the examples currently live in the `docs/charts/` directory, grouped by their chart type (Bar Chart, Line Plot, etc).

Typically, they follow the following basic format:

```jsx
export const NameOfExample = Template.bind({});
NameOfExample.args = {
  // config options go here
};
// The following line is optional, and is what allows UI 
// controls to be present underneath the source code.
NameOfExample.parameters = {controls: {include: [/* method list */]}};
```

When writing examples, please try to follow the following guidelines:
* The name of the Component you create will become the name in the UI, so in this case "NameOfExample" will become "Name Of Example" (more information on Storybook's auto-titles can be found [here](https://storybook.js.org/docs/configure/user-interface/sidebar-and-urls#csf-30-auto-titles)).
* Only include config methods that are pertanent to the example (ie. don't change things like the "legendPosition" because of personal preference). 
* If possible, do not use external API links for things like "data" and "topojson". Wherever you can, either use a simple/small inline data Array or reference a static file added to the `/static/data` directory.
* When using accessor functions in your config, wrap them in the `funcify` helper function, which accepts 2 arguments: the _Function_ itself, and a _String_ representation of that Function. JavaScript does not have an ability to "stringify" Functions, which we need in order to show them in the code snippets, so this helper explicitly sets how they are to be displayed to the user. In most cases, the _String_ representation should just be a copy of your _Function_ surrounded by backticks (``).

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
2. Move into the newly cloned root directory, and install dependencies: `npm ci`

And that's it! Your environment should be all set up and ready to start coding.

### Workspaces

The codebase is split up into a series of smaller packages/modules, which allows users to install only the dependencies that they need. This repo uses [npm workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces) to manage these packages, which lets them share common dependencies and scripts. Each package lives in the `packages/<package_name>` directory, and are released as scoped npm packages (ie. `@d3plus/<package_name>`).

Within each package directory, you will notice the following folder structure:
- :open_file_folder: `dev/`
- :open_file_folder: `src/`
- :open_file_folder: `test/` (optional)
- :page_facing_up: `index.js`
- :page_facing_up: `package.json`
- :page_facing_up: `README.md`
```

All source code lives in the `src` directory, and adheres to a linting ruleset in the root of the repo (`.eslintrc`). The easiest way to follow the style guide is by installing a linter directly in your text editor, so that errors will be highlighted as you type. If your Pull Request does not match the project's linting style, it will not be merged.

### Running the Development Server

To start testing code live in a browser, with auto-compiling and hot reloading, type this into your shell:

```sh
npm run dev -w @d3plus/<package_name>
```

If everything is set up correctly, your default browser will open `http://localhost:4000/` and show the contents of the `dev` directory, including the `build` directory which stores a compiled bundle (with dependencies) for you to use in your testing (this directory is in the `.gitignore`, and should never get pushed to the repo). 

Most packages contain HTML files to copy/modify for testing, but here is the minimum boilerplate HTML that needs to be there:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <script src="/build/d3plus-<package_name>.full.js"></script>
  </head>
  <body>

  </body>
  <script>

    console.log(d3plus);

  </script>
</html>
```

The development server will recreate the `build` directory any time the current package or any of it's dependent packages source files are modified. Once the rebuild has finished, your browser will hot reload (as well as when any `dev` file is changed).

### Code Documentation

All of the code documentation you see in the `README.md` file is generated automatically from the [JSDoc](http://usejsdoc.org/) formatted comments within each source file. To regenerate the documentation at any time, simply run: 

```sh
npm run docs -w @d3plus/<package_name>
```

> This command is run automatically during the release process.

### Tests

Any time you write a new feature for a module, if possible, you should also be write an accompanying test. D3plus let's you write functional tests using [Mocha](https://mochajs.org/) and [JSDOM](https://github.com/jsdom/jsdom).

All tests need to be placed in the `test` directory, and the filenames should match up to the components in `src` with a suffix of `-test.js`. To run all tests, run:

```sh
npm test -w @d3plus/<package_name>
```
> This command will also test build errors and lint all files.

Here is an example of what a test file could look like:

```js
import assert from "assert";
import it from "./jsdom.js"; // optional import, "it" is avaiable globally if not imported

it("example test title", () => {

  assert.strictEqual(true, true, "the truth test");

});

```

### Submitting a Pull Request

When you have something ready for review or critique, [submit a pull request](https://github.com/d3plus/d3plus/compare/).
