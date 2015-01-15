# Updates an array, either overwriting it with a new array, removing an entry
module.exports = (arr, x) ->

  # Return original array if the user has passed `undefined`
  return arr if x is undefined

  # Return an empty array if the user has passed `false`
  return [] if x is false

  # If the user has passed an array, just use that.
  return x if x instanceof Array

  # Create an empty Array if none has been passed
  arr = [] unless arr instanceof Array

  # Remove or add the value
  if arr.indexOf(x) >= 0 then arr.splice arr.indexOf(x), 1 else arr.push x

  # Return the array
  arr
