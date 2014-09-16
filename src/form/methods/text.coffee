filter = require "../../core/methods/filter.coffee"

module.exports =
  accepted:   [Array, Boolean, Function, Object, String]
  nesting:    true
  mute:       filter(true)
  solo:       filter(true)
  secondary:
    accepted: [Array, Boolean, Function, Object, String]
    nesting:  true
    value:    false
  value: false
