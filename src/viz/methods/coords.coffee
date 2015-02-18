filter  = require("../../core/methods/filter.coffee")
process = require("../../core/methods/process/data.coffee")

module.exports =
  accepted:   [false, Array, Function, Object, String]
  center:     [0,0]
  filetype:
    accepted: ["json"]
    value:    "json"
  fit:
    accepted: ["auto", "height", "width"]
    value:    "auto"
  mute:       filter false
  padding:    20
  process:    process
  projection:
    accepted: ["mercator", "equirectangular"]
    value:    "mercator"
  solo:      filter false
  threshold:
    accepted: [Number]
    value:    0.9
  value:      false
