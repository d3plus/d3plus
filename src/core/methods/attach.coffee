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

initialize = (vars, obj, method, p) ->

  # Initialize a few globals.
  obj.previous    = false
  obj.changed     = false
  obj.initialized = false
  obj.callback    = false

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
            str = vars.format.locale.value.dev.deprecated
            dep = "." + dep + "()"
            rec = if p then "\"" + n + "\" in ." + p + "()" else "." + n + "()"
            doc = p or n
            print.error stringFormat(str, dep, rec), doc
            vars.self
        )(d, method)

    else if o is "global"
      vars[method] = [] unless method of vars

    else if o isnt "value"
      initialize vars, obj[o], o, method if validObject(obj[o])

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
      for s of user
        print.warning stringFormat(str, "\"" + s + "\"", s), s
        vars.self[s] user[s]

    # Set all font properties, if calling .font()

    if key is "font"
      user = {family: user} if typeof user is "string"
      starting = true

      checkValue = (o, a, m, v) ->
        if validObject(o[m]) and a of o[m]
          if validObject(o[m][a])
            if o[m][a].process
              o[m][a].value = o[m][a].process(v)
            else
              o[m][a].value = v
          else
            o[m][a] = v
        return

      checkFont = (o, a, v) ->
        if validObject(o)
          if starting
            for m of o
              checkValue o, a, m, v
          else if "font" of o
            checkValue o, a, "font", v
          starting = false
          for m of o
            checkFont o[m], a, v
        return

      for fontAttr, fontAttrValue of user
        if fontAttr isnt "secondary"
          fontAttrValue = fontAttrValue.value if validObject(fontAttrValue)
          checkFont vars, fontAttr, fontAttrValue if fontAttrValue

    # Object
    checkObject vars, key, vars, key, user

    # If passing a callback function, set it.
    vars[key].callback = callback if typeof callback is "function"

    # If the method is not chainable, return the value associated with it.
    if vars[key].chainable is false then vars[key].value else vars.self

# Detects is we should set the object or check all keys of object.
checkObject = (vars, method, object, key, value) ->

  if ["accepted", "changed", "initialized", "previous", "process"].indexOf(key) < 0

    # Determine whether or not to just set the local variable or to dig into
    # the object passed looking for keys.
    passingObject  = validObject(value)
    objectOnly     = validObject(object[key]) and "objectAccess" of object[key] and object[key]["objectAccess"] is false
    approvedObject = passingObject and (objectOnly or (("value" not of value) and (d3.keys(value)[0] not of object[key])))

    # Set value of key.
    if value is null or not passingObject or approvedObject
      setMethod vars, method, object, key, value

    # If it's an object, dig through it and set inner values.
    else if passingObject
      for d of value
        checkObject vars, method, object[key], d, value[d]

  return
