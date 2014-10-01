align      = require "../../core/methods/font/align.coffee"
decoration = require "../../core/methods/font/decoration.coffee"
family     = require "../../core/methods/font/family.coffee"
transform  = require "../../core/methods/font/transform.coffee"

module.exports =
  align:      align()
  color:      "#444444"
  decoration: decoration()
  family:     family()
  secondary:
    align:      align()
    color:      "#444444"
    decoration: decoration()
    family:     family()
    size:       12
    spacing:    0
    transform:  transform()
    weight:     200
  size:       12
  spacing:    0
  transform:  transform()
  weight:     200
