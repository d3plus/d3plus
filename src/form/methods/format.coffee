formatNumber = require "../../number/format.coffee"
locale       = require "../../core/locale/locale.coffee"
mergeObject  = require "../../object/merge.coffee"
titleCase    = require "../../string/title.coffee"

module.exports =
  accepted:   [Function, String]
  affixes:
    accepted:     [Object]
    objectAccess: false
    value:        {}
  deprecates: ["number_format", "text_format"]
  locale:
    accepted: -> d3.keys locale
    process:  (value) ->
      defaultLocale = "en_US"
      returnObject  = locale[defaultLocale]
      if value isnt defaultLocale
        returnObject = mergeObject(returnObject, locale[value])
      @language = value
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
  value: (value, opts) ->
    opts = {} unless opts
    vars = opts.vars or {}
    if vars.time and vars.time.value and opts.key is vars.time.value
      v = if value.constructor is Date then value else new Date(value)
      vars.data.time.format v
    else if typeof value is "number"
      f = @number.value or formatNumber
      f value, opts
    else if typeof value is "string"
      f = @text.value or titleCase
      f value, opts
    else
      JSON.stringify value
