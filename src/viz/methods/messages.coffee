decoration = require "../../core/methods/font/decoration.coffee"
family     = require "../../core/methods/font/family.coffee"
transform  = require "../../core/methods/font/transform.coffee"

module.exports =
  accepted: [Boolean, String]
  background:
    accepted: [false, String]
    value: false
  branding:
    accepted: [Boolean]
    image:
      dark: "http://d3plus.org/assets/img/icon-transparent-invert.png"
      light: "http://d3plus.org/assets/img/icon-transparent.png"
    value:    false
  font:
    color:      "#444"
    decoration: decoration()
    family:     family()
    size:       16
    transform:  transform()
    weight:     200
  padding:  5
  style:
    accepted: [false, "small", "large"]
    value:    false
  value:    true
