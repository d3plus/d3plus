formatNumber = require "../../number/format.js"
locale       = require "../../core/locale/locale.coffee"
mergeObject  = require "../../object/merge.coffee"
titleCase    = require "../../string/title.coffee"

module.exports =
  accepted:   [Function, String]
  deprecates: ["number_format", "text_format"]
  locale:
    accepted: -> d3.keys locale
    process:  (value) ->
      defaultLocale = "en_US"
      returnObject  = locale[defaultLocale]
      returnObject  = mergeObject(returnObject, locale[value]) if value isnt defaultLocale
      @language     = value
      returnObject
    value: "en_US"
  number:
    accepted: [false, Function]
    value:    false
  process: (value, vars) ->
    if typeof value is "string"
      vars.self.format locale: value
    else return value if typeof value is "function"
    @value
  text:
    accepted: [false, Function]
    value:    false
  value: (value, key, vars, data) ->
    vars = {} unless vars
    if vars.time and vars.time.value and key is vars.time.value
      v = if value.constructor is Date then value else new Date(value)
      vars.data.time.format v
    else if typeof value is "number"
      f = @number.value or formatNumber
      f value, key, vars, data
    else if typeof value is "string"
      f = @text.value or titleCase
      f value, key, vars, data
    else
      JSON.stringify value
