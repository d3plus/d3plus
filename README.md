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
* [Examples](http://d3plus.org/examples/)
* [Documentation](https://github.com/alexandersimoes/d3plus/wiki)
* [Google Group](https://groups.google.com/forum/#!forum/d3plus)
* [Issues](https://github.com/alexandersimoes/d3plus/issues?state=open)
* [Help with the Localization](https://docs.google.com/spreadsheets/d/1JPFkLTDqnF3azUU2ssWs_M918Rr1mXIR-Flh8ccjYlo/edit#gid=0)

### Environment Setup

Download the latest versions of D3plus (directory includes all dependencies):

> <http://d3plus.org/d3plus.zip>

Note that because we will be running these files locally, our browser will raise errors when trying to do AJAX requests. The best way around this is to run a local server, if you have python installed this can be accomplished on the command line via:

```js
python -m SimpleHTTPServer 8888 &
```

or for Python 3+

```js
python -m http.server 8888 &
```

Once this is running, go to <http://localhost:8888/>.

Another alternative is using [MAMP](http://www.mamp.info/) (on OSX) or [WampServer](http://www.wampserver.com/) (on Windows), which will install a local version of the Apache web server.

### Creating a Visualization

To initialize a **D3plus** visualization, you must first create a container element in the page body:

```html
<div id="viz"></div>
```

Then, you must initialize the visualization:

```js
var visualization = d3plus.viz()
```

Finally, given we have a "data" variable as an array of objects, we pass both that "data" and our container element (using standard [D3 Selection Methods](https://github.com/mbostock/d3/wiki/Selections#selecting-elements)) to the visualization:

```js
visualization
	.data(data)
	.container("#viz")
```

And that's it! All you have to do now is invoke the [Draw](https://github.com/alexandersimoes/d3plus/wiki/Visualizations#draw) method to draw the visualization on the page.

```js
visualization.draw()
```

### Changing Variables
Given you followed the tutorial above to create a **D3plus** visualization, your page should look, well, fairly empty and broken.

That is because there are some specific methods you should invoke on your visualization that will tell it a little more about your data and what you would like to display. For example, if you want to display a [Tree Map](https://github.com/alexandersimoes/d3plus/wiki/Tree-Map) and your data is keyed with an id of "person", you would call the following methods:

```js
visualization
	.type("tree_map")
	.id("person")
	.draw()
```

Once you set the [methods](https://github.com/alexandersimoes/d3plus/wiki/Visualizations#available-methods) you need to change, you just need to invoke the [Draw](https://github.com/alexandersimoes/d3plus/wiki/Visualizations#draw) method again to display your changes.
