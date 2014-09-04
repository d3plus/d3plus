fetchValue = require "../fetch/value.js"
# Groups data into groups to use with D3 layouts. Helps prevent key name mismatches (parent, child, value, etc).
module.exports = (vars, data) ->

  groupedData = d3.nest()

  vars.id.nesting.forEach (n, i) ->
    if i < vars.depth.value
      groupedData.key (d) ->
        return fetchValue vars, d.d3plus, n

  strippedData = []
  for d in data

    val = if vars.size.value then fetchValue vars, d, vars.size.value else 1

    if val and typeof val is "number" and val > 0

      delete d.d3plus.r
      delete d.d3plus.x
      delete d.d3plus.y

      strippedData.push
        d3plus: d
        id: d[vars.id.value]
        value: val

  groupedData.entries(strippedData)
