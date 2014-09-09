# Updates an array, either overwriting it with a new array, removing an entry
module.exports = (arr, x) ->
  arr = [] unless arr instanceof Array

  # If the user has passed an array, just use that.
  if x instanceof Array
    arr = x

  # Otherwise remove it if it is present.
  else if arr.indexOf(x) >= 0
    arr.splice arr.indexOf(x), 1

  # Else, add it!
  else
    arr.push x
  arr
