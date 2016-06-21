family    = require "../../core/methods/font/family.coffee"
transform = require "../../core/methods/font/transform.coffee"

module.exports =
  accepted:   [Boolean, Array, Function, Object, String]
  anchor:     "top center"
  background: "#ffffff"
  children:
    accepted: [Boolean, Number]
    value:    true
  connections:
    accepted: [Boolean]
    value:    true
  curtain:
    color:   "#ffffff"
    opacity: 0.8
  deprecates: "tooltip_info"
  extent:
    accepted: [Boolean]
    value:    true
  font:
    color:     "#444"
    family:    family()
    size:      12
    transform: transform()
    weight:    200
  fullscreen:
    accepted: [Boolean]
    value:    false
  html:
    accepted:   [false, Function, Object, String]
    deprecates: "click_function"
    value:      false
  iqr:
    accepted: [Boolean]
    value:    true
  large: 250
  share:
    accepted: [Boolean]
    value:    true
  size:
    accepted: [Boolean]
    value:    true
  small: 225
  stacked:
    accepted: [Boolean]
    value:    false
  sub:
    accepted: [false, Function, String]
    value:    false
  value: true
