print       = require "../console/print.coffee"
validObject = require "../../object/validate.coffee"

# Get Key Types from Data
module.exports = (vars, type) ->

  timerString = type + " key analysis"
  print.time timerString if vars.dev.value

  vars[type].keys = {}

  get_keys = (arr) ->
    if arr instanceof Array
      for d in arr
        get_keys d
    else if validObject arr
      for k, v of arr
        if validObject v
          get_keys v
        else if !(k in vars[type].keys) and v isnt null
          vars[type].keys[k] = typeof v

  if validObject vars[type].value
    get_keys v for k, v of vars[type].value
  else
    get_keys vars[type].value

  print.time timerString if vars.dev.value
