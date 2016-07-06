###*
# @class d3plus
###
d3plus         = {}

###*
# The current version of **D3plus** you are using. Returns a string in
# [semantic versioning](http://semver.org/) format.
# @property d3plus.version
# @for d3plus
# @type String
# @static
###
d3plus.version = "1.9.7 - Cornflower"

###*
# The URL for the repo, used internally for certain error messages.
# @property d3plus.repo
# @for d3plus
# @type String
# @static
###
d3plus.repo = "https://github.com/alexandersimoes/d3plus/"

###*
# Utilities related to modifying arrays.
# @class d3plus.array
# @for d3plus
# @static
###
d3plus.array =
  comparator: require "./array/comparator.coffee"
  contains:   require "./array/contains.coffee"
  sort:       require "./array/sort.coffee"
  update:     require "./array/update.coffee"

###*
# Utilities related to the client's browser.
# @class d3plus.client
# @for d3plus
# @static
###
d3plus.client =
  css:       require "./client/css.coffee"
  ie:        require "./client/ie.js"
  pointer:   require "./client/pointer.coffee"
  prefix:    require "./client/prefix.coffee"
  rtl:       require "./client/rtl.coffee"
  scroll:    require "./client/scroll.js"
  scrollbar: require "./client/scrollbar.coffee"
  touch:     require "./client/touch.coffee"

###*
# Utilities related to color manipulation.
# @class d3plus.color
# @for d3plus
# @static
###
d3plus.color =
  legible:  require "./color/legible.coffee"
  lighter:  require "./color/lighter.coffee"
  mix:      require "./color/mix.coffee"
  random:   require "./color/random.coffee"
  scale:    require "./color/scale.coffee"
  sort:     require "./color/sort.coffee"
  text:     require "./color/text.coffee"
  validate: require "./color/validate.coffee"

###*
# Utilities related to manipulating data.
# @class d3plus.data
# @for d3plus
# @static
###
d3plus.data =
  bestRegress: require "./data/bestRegress.coffee"
  lof:         require "./data/lof.coffee"
  mad:         require "./data/mad.coffee"

###*
# Utilities related to fonts.
# @class d3plus.font
# @for d3plus
# @static
###
d3plus.font =
  sizes:    require "./font/sizes.coffee"
  validate: require "./font/validate.coffee"

###*
# D3plus Forms
# @class d3plus.form
# @for d3plus
###
d3plus.form = require "./form/form.js"

###*
# Utilities related to geometric algorithms.
# @class d3plus.geom
# @for d3plus
# @static
###
d3plus.geom =
  largestRect: require "./geom/largestRect.coffee"
  offset:      require "./geom/offset.coffee"
  path2poly:   require "./geom/path2poly.coffee"

###*
# Utilities related to network graphs.
# @class d3plus.network
# @for d3plus
# @static
###
d3plus.network =
  cluster:      require "./network/cluster.coffee"
  distance:     require "./network/distance.coffee"
  normalize:    require "./network/normalize.coffee"
  shortestPath: require "./network/shortestPath.coffee"
  smallestGap:  require "./network/smallestGap.coffee"
  subgraph:     require "./network/subgraph.coffee"

###*
# Utilities that process numbers.
# @class d3plus.number
# @for d3plus
# @static
###
d3plus.number =
  format: require "./number/format.coffee"

###*
# D3plus features a set of methods that relate to various object properties. These methods may be used outside of the normal constraints of the visualizations.
# @class d3plus.object
# @for d3plus
# @static
###
d3plus.object =
  merge:    require "./object/merge.coffee"
  validate: require "./object/validate.coffee"

###*
# Utilities that process strings.
# @class d3plus.string
# @for d3plus
# @static
###
d3plus.string =
  format: require "./string/format.js"
  list:   require "./string/list.coffee"
  strip:  require "./string/strip.js"
  title:  require "./string/title.coffee"

###*
# D3plus SVG Textwrapping
# @class d3plus.textwrap
# @for d3plus
###
d3plus.textwrap = require "./textwrap/textwrap.coffee"

###*
# D3plus Tooltips
# @class d3plus.tooltip
# @for d3plus
###
d3plus.tooltip =
  create: require "./tooltip/create.js"
  move:   require "./tooltip/move.coffee"
  remove: require "./tooltip/remove.coffee"

###*
# D3plus features Utilities that can be used to help with some common javascript processes.
# @class d3plus.util
# @for d3plus
# @static
###
d3plus.util =
  buckets:     require "./util/buckets.coffee"
  child:       require "./util/child.coffee"
  closest:     require "./util/closest.coffee"
  copy:        require "./util/copy.coffee"
  d3selection: require "./util/d3selection.coffee"
  dataurl:     require "./util/dataURL.coffee"
  uniques:     require "./util/uniques.coffee"

###*
# D3plus Visualizations
# @class d3plus.viz
# @for d3plus
###
d3plus.viz = require "./viz/viz.coffee"

# Flash a console message if they are loading the old, unneeded stylesheet!
stylesheet = require "./client/css.coffee"
message    = require "./core/console/print.coffee"
if stylesheet "d3plus.css"
  message.warning "d3plus.css has been deprecated, you do not need to load this file.", d3plus.repo+"releases/tag/v1.4.0"

window.d3plus  = d3plus if typeof window isnt "undefined"
module.exports = d3plus
