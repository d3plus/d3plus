family = require "../../core/methods/font/family.coffee"

module.exports =
  accepted: [Boolean]
  align:    "middle"
  filters:
    accepted: [Boolean]
    value:    false
  font:
    align:  "middle"
    color:  "#444444"
    family: family()
    size:   [8, 14]
    weight: 200
  gradient:
    height: 10
  icons:
    accepted: [Boolean]
    value:    true
  labels:
    accepted: [Boolean]
    value:    true
  order:
    accepted: ["color", "id", "size", "text"]
    sort:
      accepted: ["asc", "desc"]
      value:    "asc"
    value: "color"
  size:  [8, 30]
  tooltip:
    accepted: [Boolean]
    value:    true
  text:
    accepted: [false, Function, String]
    value:    false
  value: true
