###*
 * Finds closest numeric value in array
 ###
d3plus.util.closest = (arr, value) ->

  closest = arr[0]

  arr.forEach (p) ->
    closest = p if Math.abs(value - p) < Math.abs(value - closest)

  closest
