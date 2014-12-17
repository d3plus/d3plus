foreign = require "./foreign.coffee"
tspan   = require "./tspan.coffee"

# Flows the text into the container
module.exports = (vars) ->
  if vars.text.html.value then foreign vars else tspan vars
  return
