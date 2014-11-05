copy         = require "../../util/copy.coffee"
print        = require "../console/print.coffee"
process      = require "./process/detect.coffee"
setMethod    = require "./set.coffee"
stringFormat = require "../../string/format.js"
validObject  = require "../../object/validate.coffee"

# Global method shell.
module.exports = (vars, methods) ->

  #Loop through each specified method and apply it to the object.
  for method, obj of methods

    vars[method] = copy obj

    # Run initialization on all inner properties.
    vars[method].initialized = initialize vars, vars[method], method

    # Create the main set/get function.
    vars.self[method] = (createFunction)(vars, method)

initialize = (vars, obj, method) ->

  # Initialize a few globals.
  obj.previous    = false
  obj.changed     = false
  obj.initialized = false

  if "init" of obj and ("value" not of obj)
    obj.value = obj.init(vars)
    delete obj.init

  obj.value = process(vars, obj, obj.value) if "process" of obj

  for o of obj

    if o is "deprecates"

      deps = if obj[o] instanceof Array then obj[o] else [obj[o]]

      for d in deps
        vars.self[d] = ((dep, n) ->
          (x) ->
            if vars.dev.value and vars.methodGroup
              print.groupEnd()
              vars.methodGroup = false
            str = vars.format.locale.value.dev.deprecated
            dep = "." + dep + "()"
            print.error stringFormat(str, dep, "." + n + "()"), n
            vars.self
        )(d, method)

    else if o is "global"
      vars[method] = [] unless method of vars

    else initialize vars, obj[o], o if validObject(obj[o])

  true

createFunction = (vars, key) ->

  (user, callback) ->

    accepted = if "accepted" of vars[key] then vars[key].accepted else null
    accepted = accepted(vars) if typeof accepted is "function"
    accepted = [accepted] if accepted not instanceof Array

    # If no arguments have been passed, simply return the current object.
    if user is Object
      return vars[key]
    else if not arguments.length and accepted.indexOf(undefined) < 0
      return if "value" of vars[key] then vars[key].value else vars[key]

    # Warn if the user is trying to use the old .style() method.
    if key is "style" and typeof user is "object"
      str = vars.format.locale.value.dev.oldStyle
      if (vars.dev.value or (key is "dev" and user)) and not vars.methodGroup and vars.methodGroup isnt "wait"
        vars.methodGroup = true
        print.groupCollapsed "method behavior"
      for s of user
        print.warning stringFormat(str, "\"" + s + "\"", s), s
        vars.self[s] user[s]

    # Set all font properties, if calling .font()
    if key is "font" and typeof user is "string"
      user =
        family: user
    if key is "font"
      checkFont = (o, a, v, start) ->
        if validObject(o)
          if a of o
            if validObject(o[a])
              o[a].value = if o[a].process then o[a].process(v) else v
            else
              o[a] = v
          else
            for m of o
              checkFont o[m], a, v, false if m isnt "font" or start isnt true
        return
      for fontAttr, fontAttrValue of user
        fontAttrValue = fontAttrValue.value if validObject(fontAttrValue)
        checkFont vars, fontAttr, fontAttrValue, true if fontAttrValue

    # Object
    checkObject vars, key, vars, key, user

    # If passing a callback function, set it.
    vars[key].callback = callback if typeof callback is "function"

    # If the method is not chainable, return the value associated with it.
    if vars[key].chainable is false then vars[key].value else vars.self

# Detects is we should set the object or check all keys of object.
checkObject = (vars, method, object, key, value) ->

  if key isnt "accepted"

    # Determine whether or not to just set the local variable or to dig into
    # the object passed looking for keys.
    passingObject  = validObject(value)
    objectOnly     = validObject(object[key]) and "objectAccess" of object[key] and object[key]["objectAccess"] is false
    approvedObject = passingObject and (objectOnly or (("value" not of value) and (d3.keys(value)[0] not of object[key])))

    # Set value of key.
    if value is null or not passingObject or approvedObject
      if approvedObject
        setMethod vars, method, object[key], "value", value
      else
        setMethod vars, method, object, key, value

    # If it's an object, dig through it and set inner values.
    else if passingObject
      for d of value
        checkObject vars, method, object[key], d, value[d]

  return
