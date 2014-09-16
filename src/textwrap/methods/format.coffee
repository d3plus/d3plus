locale      = require "../../core/locale/locale.coffee"
mergeObject = require "../../object/merge.coffee"

module.exports =
  accepted:   [Function, String]
  locale:
    accepted: -> d3.keys locale
    process:  (value) ->
      defaultLocale = "en_US"
      returnObject  = locale[defaultLocale]
      returnObject  = mergeObject(returnObject, locale[value]) if value isnt defaultLocale
      @language     = value
      returnObject
    value: "en_US"
  process: (value, vars) ->
    if @initialized and typeof value is "string"
      vars.self.format locale: value
    else return value if typeof value is "function"
    @value
  value: "en_US"
