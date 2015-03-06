copy         = require "../../util/copy.coffee"
d3selection  = require "../../util/d3selection.coffee"
validObject  = require "../../object/validate.coffee"
mergeObject  = require "../../object/merge.coffee"
print        = require "../console/print.coffee"
process      = require "./process/detect.coffee"
rejected     = require "./rejected.coffee"
stringFormat = require "../../string/format.js"
updateArray  = require "../../array/update.coffee"

# Sets a method's value.
module.exports = (vars, method, object, key, value) ->

  # Create reference text for console statements.
  if key is "value" or not key or key is method
    text = "." + method + "()"
  else
    text = "\"" + key + "\" " + vars.format.locale.value.dev.of + " ." + method + "()"

  # Find appropriate "accepted" list.
  if key is "value" and "accepted" of object
    accepted = object.accepted
  else if validObject(object[key]) and "accepted" of object[key]
    accepted = object[key].accepted
  else
    accepted = [value]

  unless rejected vars, accepted, value, method, text

    # If the method we are setting has a nested "value" key, change the
    # reference object and key to reflect that.
    if validObject(object[key]) and "value" of object[key]
      parentKey = key
      object = object[key]
      key = "value"

    # If there is a process function, run it.
    value = process(vars, object, value) if key is "value" and "process" of object

    # If value has not changed, show a comment in the console.
    if (object[key] not instanceof Array) and object[key] is value and value isnt undefined
      str = vars.format.locale.value.dev.noChange
      print.comment stringFormat(str, text) if vars.dev.value
    else

      # Mark the method as being changed.
      object.changed = true
      object.loaded  = false if object.loaded
      if "history" of vars and method isnt "draw"
        c = copy(object)
        c.method = method
        vars.history.chain.push c

      # Before updating the value, store the previous one for reference.
      object.previous = object[key]

      # Set the variable!
      if "id" of vars and key is "value" and "nesting" of object
        if method isnt "id"
          object.nesting = {} if typeof object.nesting isnt "object"
          if validObject(value)
            for id of value
              value[id] = [value[id]] if typeof value[id] is "string"
            object.nesting = mergeObject(object.nesting, value)
            object.nesting[vars.id.value] = value[d3.keys(value)[0]] unless vars.id.value of object.nesting
          else if value instanceof Array
            object.nesting[vars.id.value] = value
          else
            object.nesting[vars.id.value] = [value]
          object[key] = object.nesting[vars.id.value][0]
        else
          if value instanceof Array
            object.nesting = value
            if "depth" of vars and vars.depth.value < value.length
              object[key] = value[vars.depth.value]
            else
              object[key] = value[0]
              vars.depth.value = 0  if "depth" of vars
          else
            object[key] = value
            object.nesting = [value]
            vars.depth.value = 0  if "depth" of vars
      else if method is "depth"
        if value >= vars.id.nesting.length
          vars.depth.value = vars.id.nesting.length - 1
        else if value < 0
          vars.depth.value = 0
        else
          vars.depth.value = value
        vars.id.value = vars.id.nesting[vars.depth.value]
        if typeof vars.text.nesting is "object"
          n = vars.text.nesting[vars.id.value]
          if n
            vars.text.nesting[vars.id.value] = if typeof n is "string" then [n] else n
            vars.text.value = (if n instanceof Array then n[0] else n)
      else if validObject(object[key]) and validObject(value)
        object[key] = mergeObject(object[key], value)
      else
        object[key] = value

      # Add method to data solo/mute array if applicable.
      if key is "value" and object.global
        hasValue = object[key].length > 0
        k = parentKey or key
        vars.data[k] = updateArray(vars.data[k], method) if k of vars and ((hasValue and vars.data[k].indexOf(method) < 0) or (not hasValue and vars.data[k].indexOf(method) >= 0))

      # Add method to data filter array if applicable.
      vars.data.filters.push method if key is "value" and object.dataFilter and vars.data and vars.data.filters.indexOf(method) < 0

      # Display console message, if applicable.
      if vars.dev.value and object.changed and object[key] isnt undefined
        longArray    = object[key] instanceof Array and object[key].length > 10
        d3object     = d3selection(object[key])
        typeFunction = typeof object[key] is "function"
        valString    = (if not longArray and not d3object and not typeFunction then (if typeof object[key] is "string" then object[key] else JSON.stringify(object[key])) else null)
        if valString isnt null and valString.length < 260
          str = vars.format.locale.value.dev.setLong
          print.log stringFormat(str, text, "\"" + valString + "\"")
        else
          str = vars.format.locale.value.dev.set
          print.log stringFormat(str, text)

    # If there is a callback function not associated with a URL, run it.
    if key is "value" and object.callback and not object.url
      callback = if typeof object.callback is "function" then object.callback else object.callback.value
      callback value, vars.self if callback

  return
