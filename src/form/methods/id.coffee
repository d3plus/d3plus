filter = require "../../core/methods/filter.coffee"

module.exports =
  accepted:   [Array, String]
  dataFilter: true
  mute:       filter(true)
  nesting:    ["value"]
  solo:       filter(true)
  value:      "value"
