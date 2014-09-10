colorSort  = require("../color/sort.coffee")
fetchValue = require("../core/fetch/value.js")
fetchColor = require("../core/fetch/color.js")
fetchText  = require("../core/fetch/text.js")

# Sorts an array of objects
module.exports = (arr, keys, sort, colors, vars, depth) ->

  comparator = (a, b) ->

    retVal = 0
    i = 0

    while i < keys.length

      k = keys[i]

      if vars
        a = (if k is vars.text.value then fetchText(vars, a, depth) else fetchValue(vars, a, k, depth))
        b = (if k is vars.text.value then fetchText(vars, b, depth) else fetchValue(vars, b, k, depth))
      else
        a = a[k]
        b = b[k]

      if vars and colors.indexOf(k) >= 0
        a = fetchColor(vars, a, depth)
        b = fetchColor(vars, b, depth)
        retVal = colorSort(a, b)
      else
        a = (if a instanceof Array then a = a[0] else (if typeof a is "string" then a = a.toLowerCase() else a))
        b = (if b instanceof Array then b = b[0] else (if typeof b is "string" then b = b.toLowerCase() else b))
        retVal = (if a < b then -1 else 1)

      break if retVal isnt 0 or i is keys.length - 1
      i++

    (if sort is "asc" then retVal else -retVal)

  return arr or [] if not arr or arr.length <= 1 or not keys

  sort = "asc" unless sort
  keys = [keys] unless keys instanceof Array
  colors = [colors] unless colors instanceof Array
  depth = vars.id.nesting.indexOf(depth) if vars and depth isnt undefined and typeof depth isnt "number"

  arr.sort comparator
