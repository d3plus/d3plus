d3selection = require "../../../util/d3selection.coffee"

# Function to process data by url or element.
module.exports = (value, vars, method) ->

  if typeof value isnt "string" and not d3selection(value)
    value
  else
    maybeURL = value.indexOf("/") >= 0
    if not maybeURL and d3selection(value)
      return value
    else
      if not maybeURL and not d3.selectAll(value).empty()
        return d3.selectAll(value)
      else
        method.url = value
        return []
    []
