d3selection = require("../../util/d3selection.coffee")

module.exports =
  accepted: [false, Array, Object, String]
  element:  false
  id:       "default"
  process:  (value) ->
    if value is false
      false
    else if d3selection(value)
      value
    else if value instanceof Array
      d3.select value[0][0]
    else
      @selector = value
      d3.select value
  value:    false
