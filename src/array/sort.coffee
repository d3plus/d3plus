comparator = require "./comparator.coffee"
fetchSort  = require "../core/fetch/sort.coffee"

# Sorts an array of objects
module.exports = (arr, keys, sort, colors, vars, depth) ->

  if not arr or arr.length <= 1
    arr or []
  else

    if vars

      keys = vars.order.value or vars.size.value or vars.id.value unless keys
      sort = vars.order.sort.value unless sort
      colors = vars.color.value or [] unless colors

      for d in arr
        d.d3plus = {} unless d.d3plus
        data = if "d3plus" of d and "d3plus" of d.d3plus then d.d3plus else d
        d.d3plus.sortKeys = fetchSort vars, data, keys, colors, depth

    arr.sort (a, b) -> comparator a, b, keys, sort, colors, vars, depth
