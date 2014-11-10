filter = require "../../core/methods/filter.coffee"

module.exports =
  accepted:   [Array, String]
  dataFilter: true
  deprecates: ["id_var", "nesting"]
  grouping:
    accepted: [Boolean]
    value:    true
  mute:       filter(true)
  nesting:    ["id"]
  solo:       filter(true)
  value:      "id"
