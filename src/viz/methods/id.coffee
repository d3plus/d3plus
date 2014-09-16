filter = require "../../core/methods/filter.coffee"

module.exports =
  accepted:   [Array, String]
  dataFilter: true
  deprecates: ["id_var", "nesting"]
  mute:       filter(true)
  nesting:    ["id"]
  solo:       filter(true)
  value:      "id"
