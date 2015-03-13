# Function to process data by url or element.
module.exports = (value, vars, method) ->

  vars.history.reset() if vars.history

  if typeof value is "string"
    if value.indexOf("/") >= 0
      method.url = value
      return []
    if d3.selectAll(value).size() then d3.selectAll(value) else []
  else
    value
