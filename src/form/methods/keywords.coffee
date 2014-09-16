filter = require "../../core/methods/filter.coffee"

module.exports =
  accepted: [false, Array, Function, Object, String]
  mute:     filter(true)
  solo:     filter(true)
  value:    "keywords"
