family     = require "../../core/methods/font/family.coffee"
decoration = require "../../core/methods/font/decoration.coffee"
transform  = require "../../core/methods/font/transform.coffee"

module.exports =
  accepted: [false, Number, String]
  font:
    align:      "center"
    color:      "#444"
    decoration: decoration()
    family:     family()
    size:       11
    transform:  transform()
    weight:     200
  link:     false
  padding:  0
  position: "bottom"
  value:    false
