# Contributing

If you are looking to contribute to the core source code of d3plus, start by cloning this repo:

```sh
git clone https://github.com/d3plus/d3plus.git
```

## Setting up your Environment

1. Install Node, if not already installed.
> <sub>If on a Mac, we suggest using [Homebrew](http://brew.sh/) to install packages on your machine. Once that's installed, you can install node (which includes npm) by running: `brew install node`</sub>
2. Move into this directory, and install dependencies:
```sh
cd packages/core
npm i
```

And that's it! Your environment should be all set up and ready to start coding.

## Writing Code

All source code lives in the `./src` directory, and adheres to a linting ruleset for syntax (`.eslintrc`). The easiest way to follow the style guide is by installing a linter directly in your text editor, so that errors will be highlighted as you type. If your Pull Request does not match the project's linting style, it will not be merged.

## Running the Development Server

To start testing code live in a browser, with auto-compiling and hot reloading, type this into your shell:

```sh
npm run dev
```

You can then go to `http://localhost:4000/dev/` in a browser to view any of the available test pages, along with making your own new test page. Here is a boilerplate HTML file to get your started:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <script src="/build/@d3plus/core.full.js"></script>
  </head>
  <body>

  </body>
  <script>

  </script>
</html>
```
The development server detects any time a source file is modified, and will rebuild the browser javascript package and reload any open browser connections when a change occurs.

## Code Documentation

All of the code documentation you see in the README file is generated automatically from the [JSDoc](http://usejsdoc.org/) formatted comments within each source file. To regenerate the documentation at any time, simply run:

```sh
npm run docs
```

> This command is run automatically during the release process.

## Tests

Any time you write a new feature for a module, if possible, you should also be write an accompanying test. D3plus let's you write functional tests using [Mocha](https://mochajs.org/) and [JSDOM](https://github.com/jsdom/jsdom).

All tests need to be placed in the `./test` directory, and the filenames should match up to the components in `./src` with a suffix of `-test.js`. To run all tests, run:

```sh
npm test
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

## Submitting a Pull Request

When you have something ready for review or critique, [submit a pull request](https://github.com/d3plus/d3plus/compare/).
