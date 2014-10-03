stylesheet = require "../../../client/css.coffee"

module.exports = (value, vars, method) ->
  if value is false or value.indexOf("fa-") < 0 or (value.indexOf("fa-") is 0 and stylesheet("font-awesome"))
    value
  else
    method.fallback
