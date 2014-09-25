rendering = require "../../core/methods/rendering.coffee"

module.exports =
  accepted: (vars) -> vars.types[vars.type.value].shapes
  interpolate:
    accepted:   ["basis", "basis-open", "cardinal", "cardinal-open", "linear", "monotone", "step", "step-before", "step-after"]
    deprecates: "stack_type"
    value:      "linear"
  rendering: rendering()
  value:     false
