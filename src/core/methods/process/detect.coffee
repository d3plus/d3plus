copy   = require("../../../util/copy.coffee")
update = require("../../../array/update.coffee")

# Process object's value
module.exports = (vars, object, value) ->

  if object.process is Array
    update copy(object.value), value
  else if typeof object.process is "object" and typeof value is "string"
    object.process[value]
  else if typeof object.process is "function"
    object.process value, vars, object
  else
    value
