filter = require "../../../core/methods/filter.coffee"

module.exports = (axis) ->
  accepted:   [Array, Boolean, Function, Object, String]
  dataFilter: true
  deprecates: [axis + "axis", axis + "axis_val", axis + "axis_var"]
  domain:
    accepted: [false, Array]
    value:    false
  lines: []
  mute:  filter(true)
  range: false
  reset: ["range"]
  scale:
    accepted:   ["linear", "log", "continuous", "share"]
    deprecates: ["layout", "unique_axis", axis + "axis_scale"]
    process:    (value, vars) ->
      for scale in ["log", "continuous", "share"]
        if scale is value
          vars.axes[scale] = axis
        else vars.axes[scale] = false if vars.axes[scale] is axis
      vars.axes.opposite = (if axis is "x" then "y" else "x") if value is "continuous"
      value
    value: "linear"
  solo:    filter(true)
  stacked:
    accepted: [Boolean]
    process:  (value, vars) ->
      if not value and vars.axes.stacked is axis
        vars.axes.stacked = false
      else vars.axes.stacked = axis if value
      value
    value: false
  value:    false
  zerofill:
    accepted: [Boolean]
    value:    false
