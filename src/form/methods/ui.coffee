family     = require "../../core/methods/font/family.coffee"
align      = require "../../core/methods/font/align.coffee"
decoration = require "../../core/methods/font/decoration.coffee"
transform  = require "../../core/methods/font/transform.coffee"

module.exports =
  border:   1
  color:
    primary:
      process: (value, vars) ->
        primary = @value
        secondary = vars.ui.color.secondary.value
        vars.ui.color.secondary.value = d3.rgb(value).darker(2).toString() if not secondary or secondary is d3.rgb(primary).darker(2).toString()
        value
      value: "#ffffff"
    secondary:
      value: false
  display:
    acceped: ["block", "inline-block"]
    value:   "inline-block"
  font:
    align:      align("center")
    color:      "#444"
    decoration: decoration()
    family:     family()
    size:       11
    transform:  transform()
    weight:     200
  margin:   5
  padding:  5
