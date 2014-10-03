filter = require "../../core/methods/filter.coffee"

module.exports =
  accepted:   [Array, Boolean, Function, Object, String]
  deprecates: ["name_array", "text_var"]
  nesting:    true
  mute:       filter(true)
  solo:       filter(true)
  value:      false
