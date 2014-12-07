decoration = require "../../core/methods/font/decoration.coffee"
family     = require "../../core/methods/font/family.coffee"
transform  = require "../../core/methods/font/transform.coffee"

module.exports =
  accepted: [Boolean]
  align:    "middle"
  font:
    decoration: decoration()
    family:     family()
    size:       11
    transform:  transform()
    weight:     200
  padding: 7
  resize:
    accepted: [Boolean]
    value:    true
  text:
    accepted: [false, Function, String]
    value:    false
  segments: 2
  value:    true
