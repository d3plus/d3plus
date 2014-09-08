# Detects is we should set the object or check all keys of object.
d3plus.method.object = (vars, method, object, key, value) ->

  if [ "accepted", "getVars" ].indexOf(key) < 0

    # Determine whether or not to just set the local variable or to dig into
    # the object passed looking for keys.
    passingObject = d3plus.object.validate(value)
    objectOnly = d3plus.object.validate(object[key]) and "objectAccess" of object[key] and object[key]["objectAccess"] is false
    approvedObject = passingObject and (objectOnly or (("value" not of value) and (d3.keys(value)[0] not of object[key])))

    # Set value of key.
    if value is null or not passingObject or approvedObject
      if approvedObject
        d3plus.method.set vars, method, object[key], "value", value
      else
        d3plus.method.set vars, method, object, key, value

    # If it's an object, dig through it and set inner values.
    else if passingObject
      for d of value
        d3plus.method.object vars, method, object[key], d, value[d]
