filter = require "../../core/methods/filter.coffee"

module.exports =
  accepted:   [false, Function, Number, Object, String]
  dataFilter: true
  deprecates: ["value", "value_var"]
  mute:       filter(true)
  scale:
    accepted:   [Function]
    deprecates: "size_scale"
    value:      d3.scale.sqrt()
  solo:       filter(true)
  threshold:  true
  value:      false
