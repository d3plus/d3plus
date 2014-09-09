# Finds closest numeric value in array
module.exports = (arr, value) ->

  closest = arr[0]

  arr.forEach (p) ->
    closest = p if Math.abs(value - p) < Math.abs(value - closest)

  closest
