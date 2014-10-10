comparator = require "./comparator.coffee"
fetchSort  = require "../core/fetch/sort.coffee"

# Sorts an array of objects
module.exports = (arr, keys, sort, colors, vars, depth) ->

  if not arr or arr.length <= 1 or not keys
    arr or []
  else

    if vars
      for d in arr
        d.d3plus.sortKeys = fetchSort(vars, d, keys, colors, depth)

    arr.sort (a, b) -> comparator a, b, keys, sort, colors, vars, depth
