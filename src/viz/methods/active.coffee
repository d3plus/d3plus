filter = require "../../core/methods/filter.coffee"

module.exports =
  accepted:   [false, Array, Function, Number, Object, String]
  deprecates: "active_var"
  mute:       filter true
  solo:       filter true
  spotlight:
    accepted:   [Boolean]
    deprecates: "spotlight"
    value:      false
  value:      false
