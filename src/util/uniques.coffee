objectValidate = require "../object/validate.coffee"

# Returns list of unique values
uniques = (data, value, fetch, vars, depth) ->

  return [] if data is undefined

  depth   = vars.id.value if vars and depth is undefined
  data    = [data] unless data instanceof Array
  lookups = []

  if value is undefined
    return data.reduce (p, c) ->
      lookup = JSON.stringify(c)
      if lookups.indexOf(lookup) < 0
        p.push c if p.indexOf(c) < 0
        lookups.push lookup
      p
    , []

  vals = []

  check = (v) ->
    if v isnt undefined and v isnt null

      l = JSON.stringify(v)

      if lookups.indexOf(l) < 0
        vals.push v
        lookups.push l

  if typeof fetch is "function"
    for d in data
      val = uniques fetch(vars, d, value, depth)
      val = val[0] if val.length is 1
      check val
  else if typeof value is "function"
    for d in data
      val = value d
      check val
  else
    for d in data
      if objectValidate d
        val = d[value]
        check val

  vals.sort (a, b) -> a - b

module.exports = uniques
