family     = require "../../core/methods/font/family.coffee"
align      = require "../../core/methods/font/align.coffee"
decoration = require "../../core/methods/font/decoration.coffee"
transform  = require "../../core/methods/font/transform.coffee"

module.exports =
  accepted: [Array, Boolean]
  align:    align("center")
  border:   1
  color:
    primary:
      process: (value, vars) ->
        primary = @value
        unless vars.ui.color.secondary.value
          vars.ui.color.secondary.value = d3.rgb(primary).darker(0.75).toString()
        value
      value: "#ffffff"
    secondary:
      value: false
  display:
    acceped: ["block", "inline-block"]
    value:   "inline-block"
  font:
    align:      "center"
    color:      "#444"
    decoration: decoration()
    family:     family()
    size:       11
    transform:  transform()
    weight:     200
  margin:   5
  padding:  5
  position:
    accepted: ["top", "right", "bottom", "left"]
    value:    "bottom"
  value: false
