# Finds closest value in array
module.exports = (arr, value) ->

  if value.constructor is String
    i = arr.indexOf(value)
    return if i > -1 then arr[i] else arr[0]

  closest = arr[0]

  arr.forEach (p) ->
    closest = p if Math.abs(value - p) < Math.abs(value - closest)

  closest
