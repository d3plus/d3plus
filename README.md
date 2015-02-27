[![NPM Release](http://img.shields.io/npm/v/d3plus.svg?style=flat-square)](https://www.npmjs.org/package/d3plus)
[![Dependency Status](http://img.shields.io/david/alexandersimoes/d3plus.svg?style=flat-square)](https://david-dm.org/alexandersimoes/d3plus)
[![Dependency Status](http://img.shields.io/david/dev/alexandersimoes/d3plus.svg?style=flat-square)](https://david-dm.org/alexandersimoes/d3plus#info=devDependencies)
[![NPM Downloads](http://img.shields.io/npm/dm/d3plus.svg?style=flat-square)](https://www.npmjs.org/package/d3plus)
[![License](http://img.shields.io/npm/l/d3plus.svg?style=flat-square)](http://opensource.org/licenses/MIT)

<img src="https://raw.githubusercontent.com/alexandersimoes/d3plus/gh-pages/assets/img/facebook.jpg">

| <a href="http://d3plus.org/examples/basic/32517cfde67270c99092/"><img src="https://gist.githubusercontent.com/davelandry/32517cfde67270c99092/raw/thumbnail.png" width="120px"><br>Bar Charts</a> | <a href="http://d3plus.org/examples/basic/9029130/"><img src="https://gist.githubusercontent.com/davelandry/9029130/raw/thumbnail.png" width="120px"><br>Tree Maps</a> | <a href="http://d3plus.org/examples/basic/9029781/"><img src="https://gist.githubusercontent.com/davelandry/9029781/raw/thumbnail.png" width="120px"><br>Scatter Plots</a> | <a href="http://d3plus.org/examples/basic/9029462/"><img src="https://gist.githubusercontent.com/davelandry/9029462/raw/thumbnail.png" width="120px"><br>Stacked Areas</a> | <a href="http://d3plus.org/examples/basic/9037371/"><img src="https://gist.githubusercontent.com/davelandry/9037371/raw/thumbnail.png" width="120px"><br>Line Plots</a> |
| :-: | :-: | :-: | :-: | :-: |
| <a href="http://d3plus.org/examples/basic/9042919/"><img src="https://gist.githubusercontent.com/davelandry/9042919/raw/thumbnail.png" width="120px"><br>**Networks**</a> | <a href="http://d3plus.org/examples/basic/78018ce8c3787d4e30d9/"><img src="https://gist.githubusercontent.com/davelandry/78018ce8c3787d4e30d9/raw/thumbnail.png" width="120px"><br>**Box Plots**</a> | <a href="http://d3plus.org/examples/basic/33fc382f1f1913682ec1/"><img src="https://gist.githubusercontent.com/davelandry/33fc382f1f1913682ec1/raw/thumbnail.png" width="120px"><br>**Pie Charts**</a> | <a href="http://d3plus.org/examples/basic/9042807/"><img src="https://gist.githubusercontent.com/davelandry/9042807/raw/thumbnail.png" width="120px"><br>**Geo Maps**</a> | <a href="http://d3plus.org/examples/basic/b197f489fb0fc2093fee/"><img src="https://gist.githubusercontent.com/davelandry/b197f489fb0fc2093fee/raw/thumbnail.png" width="120px"><br>**Bubbles**</a> |

A javascript library that extends the popular [D3.js](http://d3js.org) to enable fast and beautiful visualizations.

### Helpful Links
* [Getting Started](http://d3plus.org/blog/getting-started/2014/06/12/getting-started-1/)
* [Live Examples](http://d3plus.org/examples/)
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
