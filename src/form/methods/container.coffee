d3selection = require("../../util/d3selection.coffee")

module.exports =
  accepted: [false, Array, Object, String]
  element:  false
  id:       "default"
  process:  (value) ->
    if value is false
      d3.select("body")
    else if d3selection(value)
      value
    else if value instanceof Array
      d3.select value[0][0]
    else
      d3.select value
  value:    d3.select("body")
