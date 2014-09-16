stylesheet = require "../../../style/sheet.coffee"

module.exports = (value) ->
  if value is false or value.indexOf("fa-") < 0 or (value.indexOf("fa-") is 0 and stylesheet("font-awesome"))
    value
  else
    @fallback
