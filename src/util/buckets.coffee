# Expands a min/max into a specified number of buckets
module.exports = (arr, n) ->

  buckets = []
  step = 1 / (n - 1) * (arr[1] - arr[0])
  i = arr[0]

  while i <= arr[1]
    buckets.push i
    i = i + step

  buckets[n - 1] = arr[1] if buckets.length < n
  buckets[buckets.length - 1] = arr[1] if buckets[buckets.length - 1] < arr[1]
  buckets
