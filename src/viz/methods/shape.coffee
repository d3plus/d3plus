rendering = require "../../core/methods/rendering.coffee"

module.exports =
  accepted:    ["circle", "donut", "line", "square", "area", "coordinates"]
  interpolate:
    accepted:   ["basis", "basis-open", "cardinal", "cardinal-open", "linear", "monotone", "step", "step-before", "step-after"]
    deprecates: "stack_type"
    value:      "linear"
  rendering: rendering("auto")
  value:       false
