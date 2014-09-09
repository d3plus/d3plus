###*
# @class d3plus
###
d3plus        = window.d3plus or {}
window.d3plus = d3plus

###*
# The current version of **D3plus** you are using. Returns a string in [semantic versioning](http://semver.org/) format.
# @property d3plus.version
# @for d3plus
# @type String
# @static
###
d3plus.version = "1.5.0 - Aqua"

###*
# The URL for the repo, used internally for certain error messages.
# @property d3plus.repo
# @for d3plus
# @type String
# @static
###
d3plus.repo = "https://github.com/alexandersimoes/d3plus/"

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
  distances:   require "./util/distances.coffee"
  offset:      require "./util/offset.coffee"
  uniques:     require "./util/uniques.coffee"

d3plus.array         = {}
d3plus.color         = {}
d3plus.data          = {}
d3plus.draw          = {}
d3plus.font          = {}
d3plus.geom          = {}
d3plus.locale        = {}
d3plus.method        = {}
d3plus.network       = {}
d3plus.number        = {}
d3plus.shape         = {}
d3plus.string        = {}
d3plus.style         = {}
d3plus.tooltip       = {}
d3plus.ui            = {}
d3plus.zoom          = {}

# Flash a console message if they are loading the old, unneeded stylesheet!
stylesheet = require "./style/sheet.coffee"
message    = require "./general/console.coffee"
if stylesheet "d3plus.css"
  message.warning "d3plus.css has been deprecated, you do not need to load this file.", d3plus.repo+"releases/tag/v1.4.0"
