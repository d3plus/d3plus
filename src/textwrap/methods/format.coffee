mergeObject    = require "../../object/merge.coffee"

module.exports =
  accepted:   [Function, String]
  locale:
    accepted: -> d3.keys d3plus.locale
    process:  (value) ->
      defaultLocale = "en_US"
      returnObject  = d3plus.locale[defaultLocale]
      returnObject  = mergeObject(returnObject, d3plus.locale[value]) if value isnt defaultLocale
      @language     = value
      returnObject
    value: "en_US"
  process: (value, vars) ->
    if @initialized and typeof value is "string"
      vars.self.format locale: value
    else return value if typeof value is "function"
    @value
  value: "en_US"
