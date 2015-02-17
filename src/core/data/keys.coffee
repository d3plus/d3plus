print       = require "../console/print.coffee"
validObject = require "../../object/validate.coffee"

# Get Key Types from Data
module.exports = (vars, type) ->

  timerString = type + " key analysis"
  print.time timerString if vars.dev.value

  vars[type].keys = {}

  get_keys = (arr) ->
    if arr instanceof Array
      get_keys a for a in arr
    else if validObject arr
      for k, v of arr
        if k.indexOf("d3plus") isnt 0 and
           !(k in vars[type].keys) and
           v isnt null
          vars[type].keys[k] = typeof v

  if validObject vars[type].value
    lengthMatch = d3.keys(vars[type].value).length is vars.id.nesting.length
    for k, v of vars[type].value
      if lengthMatch and vars.id.nesting.indexOf(k) >= 0 and validObject v
        get_keys vv for kk, vv of v
      else
        get_keys v
  else
    get_keys v for k, v of vars[type].value

  print.time timerString if vars.dev.value
