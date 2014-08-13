objectValidate = require "../object/validate.coffee"
###*
 * Returns list of unique values
 ###
d3plus.util.uniques = (data, value) ->

  return [] if data is `undefined` or value is `undefined`

  data = [ data ] unless data instanceof Array
  vals = []
  lookups = []

  for d in data
    if objectValidate d
      val = if typeof value is "function" then value d else d[value]
      lookup = if [ "number", "string" ].indexOf(typeof val) >= 0 then val else JSON.stringify(val)
      if lookups.indexOf(lookup) < 0
        vals.push val
        lookups.push lookup

  vals.sort (a, b) -> a - b
