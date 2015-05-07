# Function to process data by url or element.
module.exports = (value, vars, method) ->

  vars.history.reset() if vars.history

  if value.constructor is String
    if value.indexOf("/") >= 0
      method.url = value
      return []
    elem = d3.selectAll(value)
    return elem if elem.size()
    method.url = value if value.indexOf(".") >= 0
    return []
  else
    value
