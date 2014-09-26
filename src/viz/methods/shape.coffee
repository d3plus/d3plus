rendering = require "../../core/methods/rendering.coffee"

module.exports =
  accepted: (vars) ->
    list = vars.types[vars.type.value].shapes
    list = [list] if list and !(list instanceof Array)
    if list.length then list else ["square"]
  interpolate:
    accepted:   ["basis", "basis-open", "cardinal", "cardinal-open", "linear", "monotone", "step", "step-before", "step-after"]
    deprecates: "stack_type"
    value:      "linear"
  rendering: rendering()
  value:     false
