# Expands a min/max into a specified number of buckets
module.exports = (arr, n) ->

  buckets = []
  step = 1 / (n - 1) * (arr[1] - arr[0])

  d3.range arr[0], arr[1]+step, step
