module.exports = (arr, value) ->
  if arr instanceof Array
    constructor = if value is undefined then value else value.constructor
    arr.indexOf(value) >= 0 or (value isnt undefined and arr.indexOf(constructor) >= 0)
  else false
