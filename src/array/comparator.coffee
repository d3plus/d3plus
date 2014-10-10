colorSort  = require "../color/sort.coffee"

module.exports = (a, b, keys, sort, colors, vars, depth) ->

  sort   = "asc" unless sort
  colors = [colors] unless colors instanceof Array
  keys   = [keys] unless keys instanceof Array
  depth  = vars.id.nesting.indexOf(depth) if vars and depth isnt undefined and typeof depth isnt "number"

  retVal = 0
  i = 0

  while i < keys.length

    k = keys[i]

    a = if vars and a.d3plus and a.d3plus.sortKeys then a.d3plus.sortKeys[k] else a[k]
    b = if vars and b.d3plus and b.d3plus.sortKeys then b.d3plus.sortKeys[k] else b[k]

    if vars and colors.indexOf(k) >= 0
      retVal = colorSort a, b
    else
      retVal = if a < b then -1 else 1

    break if retVal isnt 0 or i is keys.length - 1
    i++

  if sort is "asc" then retVal else -retVal
