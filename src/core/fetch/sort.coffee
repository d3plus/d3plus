fetchValue = require "./value.coffee"
fetchColor = require "./color.coffee"
fetchText  = require "./text.js"

module.exports = (vars, d, keys, colors, depth) ->

  keys   = [keys] unless keys instanceof Array
  colors = [colors] unless colors instanceof Array
  depth  = vars.id.nesting.indexOf(depth) if vars and depth isnt undefined and typeof depth isnt "number"

  obj = {}

  for key in keys

    if vars
      if colors.indexOf(key) >= 0
        value = fetchColor vars, d, depth
      else if key is vars.text.value
        value = fetchText vars, d, depth
      else
        value = fetchValue vars, d, key, depth
    else
      value = d[key]

    value = value[0] if value instanceof Array
    value = if typeof value is "string" then value.toLowerCase() else value

    obj[key] = value

  obj
