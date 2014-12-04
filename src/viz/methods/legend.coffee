family = require "../../core/methods/font/family.coffee"

module.exports =
  accepted: [Boolean]
  align:    "middle"
  font:
    align:  "middle"
    color:  "#444444"
    family: family()
    size:   10
    weight: 200
  gradient:
    height: 10
  order:
    accepted: ["color", "id", "size", "text"]
    sort:
      accepted: ["asc", "desc"]
      value:    "asc"
    value: "color"
  size:  [8,30]
  text:
    accepted: [false, Function, String]
    value:    false
  value: true
