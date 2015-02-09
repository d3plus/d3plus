family    = require "../../core/methods/font/family.coffee"
transform = require "../../core/methods/font/transform.coffee"

module.exports =
  accepted:   [false, Array, Function, Object, String]
  anchor:     "top center"
  background: "#ffffff"
  children:
    accepted: [Boolean]
    value:    true
  connections:
    accepted: [Boolean]
    value:    true
  curtain:
    color:   "#ffffff"
    opacity: 0.8
  deprecates: "tooltip_info"
  display:
    accepted: [Boolean]
    value:    true
  font:
    color:     "#444"
    family:    family()
    size:      12
    transform: transform()
    weight:    200
  html:
    accepted:   [false, Function, String]
    deprecates: "click_function"
    value:      false
  large: 250
  share:
    accepted: [Boolean]
    value:    true
  size:
    accepted: [Boolean]
    value:    true
  small: 225
  value: false
