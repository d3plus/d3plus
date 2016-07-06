fetchValue = require "./value.coffee"
fetchColor = require "./color.coffee"
fetchText  = require "./text.js"

module.exports = (vars, d, keys, colors, depth) ->

  keys   = [keys] unless keys instanceof Array
  colors = [colors] unless colors instanceof Array
  if vars
    if depth is undefined
      depth = vars.id.value
    else if typeof depth isnt "number"
      depth  = vars.id.nesting.indexOf(depth)

  obj = {}

  for key in keys

    if vars
      if colors.indexOf(key) >= 0
        value = fetchColor vars, d, depth
      else if key is vars.text.value
        value = fetchText vars, d, depth
      else if d3.keys(d).length is 3 and d["d3plus"] and d["key"] and d["values"]
        value = fetchValue vars, d.values.map((dd) -> dd.d3plus), key, depth
      else
        value = fetchValue vars, d, key, depth
    else
      value = d[key]

    if [vars.data.keys[key], vars.attrs.keys[key]].indexOf("number") >= 0
      agg = vars.order.agg.value or vars.aggs.value[key] or "sum"
      agg = d3[agg] if agg.constructor is String
      value = [value] if !(value instanceof Array)
      value = agg value
    else
      value = value[0] if value instanceof Array
      value = if typeof value is "string" then value.toLowerCase() else value

    obj[key] = value

  obj
