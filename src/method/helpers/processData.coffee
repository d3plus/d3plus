d3selection = require "../../util/d3selection.coffee"

# Function to process data by url or element.
d3plus.method.processData = (value, self) ->

  if typeof value isnt "string" and not d3selection(value)
    value
  else
    self = this if self is undefined
    vars = self.getVars()
    maybeURL = value.indexOf("/") >= 0
    if not maybeURL and d3selection(value)
      return value
    else
      if not maybeURL and not d3.selectAll(value).empty()
        return d3.selectAll(value)
      else
        self.url = value
        return []
    []
