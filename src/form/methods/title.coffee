decoration = require "../../core/methods/font/decoration.coffee"
family     = require "../../core/methods/font/family.coffee"
transform  = require "../../core/methods/font/transform.coffee"

stringStrip = require "../../string/strip.js"

module.exports =
  accepted: [false, Function, String]
  font:
    align:      "center"
    color:      "#444444"
    decoration: decoration()
    family:     family()
    size:       16
    transform:  transform()
    weight:     400
  link:     false
  process:  (value, vars) ->
    if vars.container.id.indexOf("default") is 0 and value
      id = stringStrip(value).toLowerCase()
      vars.self.container id: id
    value
  value: false
