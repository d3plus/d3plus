decoration = require "../../core/methods/font/decoration.coffee"
family     = require "../../core/methods/font/family.coffee"
transform  = require "../../core/methods/font/transform.coffee"

module.exports =
  font:
    color:      "#444444"
    decoration: decoration()
    family:     family()
    transform:  transform()
    weight:     200
  hover:
    color:      "#444444"
    decoration: decoration()
    family:     family()
    transform:  transform()
    weight:     200
