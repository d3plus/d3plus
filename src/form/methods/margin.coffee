process = require "../../core/methods/process/margin.coffee"

module.exports =
  accepted: [Number, Object, String]
  process:  (value) ->

    value     = @value if value is undefined
    userValue = value
    process value, this
    userValue

  value: 0
