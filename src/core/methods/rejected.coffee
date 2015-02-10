contains = require "../../array/contains.coffee"
format   = require "../../string/format.js"
list     = require "../../string/list.coffee"
print    = require "../console/print.coffee"

module.exports = (vars, accepted, value, method, text) ->

  accepted = accepted(vars) if typeof accepted is "function"
  accepted = [accepted] if accepted not instanceof Array

  # Check to see if the given value is allowed.
  allowed = contains accepted, value

  # If value is not allowed, show an error message in the console.
  if allowed is false and value isnt undefined

    recs = []
    val  = JSON.stringify(value)
    val  = "\"" + val + "\"" if typeof value isnt "string"

    for a in accepted
      if typeof a is "string"
        recs.push "\"" + a + "\""
      else if typeof a is "function"
        recs.push a.toString().split("()")[0].substring(9)
      else if a is undefined
        recs.push "undefined"
      else
        recs.push JSON.stringify(a)

    recs = list recs, vars.format.locale.value.ui.or

    if vars.type and ["mode", "shape"].indexOf(method) >= 0
      str = vars.format.locale.value.error.accepted
      app = vars.format.locale.value.visualization[vars.type.value] || vars.type.value
      print.warning format(str, val, method, app, recs), method
    else
      str = vars.format.locale.value.dev.accepted
      print.warning format(str, val, text, recs), method

  not allowed
