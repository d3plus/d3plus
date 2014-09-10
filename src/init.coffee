d3plus               = window.d3plus or {}
window.d3plus        = d3plus

d3plus.version       = "1.5.1 - Aqua"
d3plus.repo          = "https://github.com/alexandersimoes/d3plus/"

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
d3plus.object        = {}
d3plus.shape         = {}
d3plus.string        = {}
d3plus.style         = {}
d3plus.tooltip       = {}
d3plus.ui            = {}
d3plus.util          = {}
d3plus.zoom          = {}

stylesheet           = require "./style/sheet.coffee"
message              = require "./general/console.coffee"

if stylesheet "d3plus.css"
  message.warning "d3plus.css has been deprecated, you do not need to load this file.", "https://github.com/alexandersimoes/d3plus/releases/tag/v1.4.0"
