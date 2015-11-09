align      = require "../../../core/methods/font/align.coffee"
decoration = require "../../../core/methods/font/decoration.coffee"
family     = require "../../../core/methods/font/family.coffee"
filter     = require "../../../core/methods/filter.coffee"
position   = require "../../../core/methods/font/position.coffee"
rendering  = require "../../../core/methods/rendering.coffee"
transform  = require "../../../core/methods/font/transform.coffee"

orientMap =
  x:  "bottom"
  x2: "top"
  y:  "left"
  y2: "right"

module.exports = (axis) ->
  accepted:   [Array, Boolean, Function, Object, String]
  affixes:
    accepted: [Boolean]
    separator:
      accepted: [Boolean, Array]
      value:    true
    value:    false
  axis:
    accepted: [Boolean]
    color:     "#444"
    font:
      color:      false
      decoration: decoration(false)
      family:     family("")
      size:       false
      transform:  transform(false)
      weight:     false
    rendering: rendering()
    value: true
  dataFilter: true
  deprecates: [axis + "axis", axis + "axis_val", axis + "axis_var"]
  domain:
    accepted: [false, Array]
    value:    false
  grid:
    accepted:  [Boolean]
    color:     "#ccc"
    rendering: rendering()
    value:     true
  label:
    accepted: [Boolean, String]
    fetch: (vars) ->
      if @value is true
        return vars.format.value(vars[axis].value, {key: axis, vars: vars})
      @value
    font:
      color:      "#444"
      decoration: decoration()
      family:     family()
      size:       12
      transform:  transform()
      weight:     200
    padding: 3
    value:   true
  lines:
    accept:    [false, Array, Number, Object]
    dasharray:
      accepted: [Array, String]
      process: (value) ->
        if value instanceof Array
          value = value.filter (d) -> !isNaN(d)
          value = if value.length then value.join(", ") else "none"
        value
      value: "10, 10"
    color:     "#888"
    font:
      align: align("right")
      color:      "#444"
      background:
        accepted: [Boolean]
        value:    true
      decoration: decoration()
      family:     family()
      padding:
        accepted: [Number]
        value:    10
      position:   position("middle")
      size:       12
      transform:  transform()
      weight:     200
    process:   Array
    rendering: rendering()
    width:     1
    value:     []
  mouse:
    accept:    [Boolean]
    dasharray:
      accepted: [Array, String]
      process: (value) ->
        if value instanceof Array
          value = value.filter (d) -> !isNaN(d)
          value = if value.length then value.join(", ") else "none"
        value
      value: "none"
    rendering: rendering()
    width:     2
    value:     true
  mute:  filter(true)
  orient:
    accepted: ["top", "right", "bottom", "left"]
    value:    orientMap[axis]
  padding:
    accepted: [Number]
    value: 0.1
  persist:
    position:
      accepted: [Boolean]
      value: false
    size:
      accepted: [Boolean]
      value: true
  range:
    accepted: [false, Array]
    value:    false
  scale:
    accepted:   ["linear", "log", "discrete", "share"]
    deprecates: ["layout", "unique_axis", axis + "axis_scale"]
    process:    (value, vars) ->
      for scale in ["log", "discrete", "share"]
        if scale is value
          vars.axes[scale] = axis
        else vars.axes[scale] = false if vars.axes[scale] is axis
      vars.axes.opposite = (if axis.indexOf("x") is 0 then "y" else "x") if value is "discrete"
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
  ticks:
    accepted: [false, Array]
    color:     "#ccc"
    font:
      color:      "#666"
      decoration: decoration()
      family:     family()
      size:       10
      transform:  transform()
      weight:     200
    labels:
      accepted: [Boolean, Array]
      value:    true
    rendering: rendering()
    size:      10
    width:     1
    value:     false
  value:    false
  zerofill:
    accepted: [Boolean]
    value:    false
