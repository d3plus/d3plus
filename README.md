# D3plus

⚠️  **Version 2 Incoming**  ⚠️

This branch is for version 1, which is not being actively maintained. All development has been focused on version 2, which splits the project into [many small libraries](https://github.com/d3plus/) that are designed to work together.

There will be an announcement when the version 2 modules are feature-complete with everything from version 1, but the water is warm so don't be afraid to jump in.

**[Click here to view the D3plus 2.0 branch](https://github.com/alexandersimoes/d3plus/tree/2.0)**

[![NPM Release](http://img.shields.io/npm/v/d3plus.svg?style=flat-square)](https://www.npmjs.org/package/d3plus)
[![Dependency Status](http://img.shields.io/david/alexandersimoes/d3plus.svg?style=flat-square)](https://david-dm.org/alexandersimoes/d3plus)
[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg?style=flat)](https://gitter.im/d3plus/)

A javascript library that extends the popular [D3.js](http://d3js.org) to enable fast and beautiful visualizations.

### Helpful Links
* [Getting Started](https://d3plus.org/blog/getting-started/2014/06/12/getting-started-1/)
* [Live Examples](https://d3plus.org/examples/)
* [Documentation](https://github.com/alexandersimoes/d3plus/wiki)
* [Bug Reporting](https://github.com/alexandersimoes/d3plus/issues?state=open)
* [Google Group Discussions](https://groups.google.com/forum/#!forum/d3plus)
* [Help with the Localization](https://docs.google.com/spreadsheets/d/1JPFkLTDqnF3azUU2ssWs_M918Rr1mXIR-Flh8ccjYlo/edit#gid=0)

### Development Environment

Clone the repo:
```sh
git clone https://github.com/alexandersimoes/d3plus.git
```

Move into that directory:
```sh
cd d3plus
```

Install the dependencies:
```sh
npm install
```

Run the gulp process:
```sh
gulp
```

Gulp will run a server on your local machine at port 4000, and whenever you change a source file it will re-compile d3plus.js and reload your browser!

Additionally, the gulp process watches for any files in a directory titles "/tests". If you place all of your test .html files in a directory of that name, the gulp process will also detect any file changes and refresh the browser.
