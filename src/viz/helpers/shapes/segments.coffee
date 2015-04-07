fetchValue = require "../../../core/fetch/value.coffee"

module.exports = (vars, d, segment) ->
  ret = vars[segment].value
  if ret
    if segment of d.d3plus then d.d3plus[segment] else fetchValue vars, d, ret
  else
    d.d3plus[segment]
