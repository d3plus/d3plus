module.exports = (arr, value) ->
  if arr instanceof Array
    constructor = if value is undefined or value is null then value else value.constructor
    arr.indexOf(value) >= 0 or arr.indexOf(constructor) >= 0
  else false
