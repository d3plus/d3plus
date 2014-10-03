filter = require "../../core/methods/filter.coffee"

module.exports =
  accepted:   [false, String]
  nesting:    true
  mute:       filter(true)
  solo:       filter(true)
  secondary:
    accepted: [false, String]
    nesting:  true
    value:    false
  value: false
