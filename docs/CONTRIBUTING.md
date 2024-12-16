# Contributing

If you are looking to contribute to the examples on d3plus.org, start by cloning this repo:

```sh
git clone https://github.com/d3plus/d3plus.git
```

## Setting up your Environment

1. Install Node, if not already installed.
> <sub>If on a Mac, we suggest using [Homebrew](http://brew.sh/) to install packages on your machine. Once that's installed, you can install node (which includes npm) by running: `brew install node`</sub>
2. Move into this directory, and install dependencies:
```sh
cd docs
npm ci
```

And that's it! Your environment should be all set up and ready to start coding.

## Running the Development Server

To start testing code live in a browser, with auto-compiling and hot reloading, type this into your shell:

```sh
npm run dev
```

When the site is ready, a browser window will automatically be opened.

## Writing Examples

All examples currently live in the `charts/` directory, grouped by their chart type (Bar Chart, Line Plot, etc), and they follow the following foremat:

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

## Submitting a Pull Request

When you have something ready for review or critique, [submit a pull request](https://github.com/d3plus/d3plus/compare/).
