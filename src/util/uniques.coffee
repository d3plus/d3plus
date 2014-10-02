fetchValue     = require "../core/fetch/value.js"
objectValidate = require "../object/validate.coffee"
# Returns list of unique values
module.exports = (data, value, vars) ->

  return [] if data is undefined
  
  if value is undefined
    return data.reduce((p, c) ->
      p.push c  if p.indexOf(c) < 0
      p
    , [])

  data = [ data ] unless data instanceof Array
  vals = []
  lookups = []

  for d in data
    if objectValidate d
      if typeof value is "function"
        val = value d
      else if vars
        val = fetchValue vars, d, value
      else
        val = d[value]
      lookup = if [ "number", "string" ].indexOf(typeof val) >= 0 then val else JSON.stringify(val)
      if lookup isnt undefined and lookups.indexOf(lookup) < 0
        vals.push val
        lookups.push lookup

  vals.sort (a, b) -> a - b
