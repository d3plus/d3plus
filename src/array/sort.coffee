comparator = require("./comparator.coffee")

# Sorts an array of objects
module.exports = (arr, keys, sort, colors, vars, depth) ->
  if not arr or arr.length <= 1 or not keys
    arr or []
  else
    arr.sort (a,b) -> comparator a, b, keys, sort, colors, vars, depth
