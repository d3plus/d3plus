d3selection = require("../../util/d3selection.coffee")

module.exports =
  accepted: [false, Array, Object, String]
  id:       "default"
  process:  (value, vars) ->
    return false if value is false

    if vars.container.id is "default"
      vars.self.container id: "d3plus_" + +new Date()

    if d3selection(value)
      value.append("div")
    else if value instanceof Array
      d3.select(value[0][0]).append("div")
    else
      @selector = value
      d3.select(value).append("div")
  value:    false
