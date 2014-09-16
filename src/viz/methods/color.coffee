filter = require("../../core/methods/filter.coffee")
scale  = require("../../color/scale.coffee")

module.exports =
  accepted:   [false, Array, Function, Object, String]
  deprecates: "color_var"
  focus:      "#444444"
  heatmap:    ["#282F6B", "#419391", "#AFD5E8", "#EACE3F", "#B35C1E", "#B22200"]
  missing:    "#eeeeee"
  mute:       filter true
  primary:    "#d74b03"
  range:      ["#B22200", "#FFEE8D", "#759143"]
  scale:
    accepted: [Array, Function, "d3plus", "category10", "category20", "category20b", "category20c"]
    process:  (value) ->
      if value instanceof Array
        d3.scale.ordinal().range value
      else if value is "d3plus"
        scale
      else if typeof value is "string"
        d3.scale[value]()
      else
        value
    value:    "d3plus"
  solo:       filter true
  secondary:  "#e5b3bb"
  value:      false
