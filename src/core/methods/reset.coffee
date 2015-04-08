validObject = require("../../object/validate.coffee")

# Resets certain keys in global variables.
reset = (obj, method) ->
  obj.changed = false if obj.changed
  if method is "draw"
    obj.frozen = false
    obj.update = true
    obj.first = false
  for o of obj
    reset obj[o], o if o.indexOf("d3plus") < 0 and validObject(obj[o])
  return

module.exports = reset
