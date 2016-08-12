print        = require "../../core/console/print.coffee"
stringFormat = require "../../string/format.js"

module.exports =
  accepted: [undefined]
  process  : (value, vars) ->

    return value if this.initialized is false

    if vars.container.value is false
      str = vars.format.locale.value.dev.setContainer
      print.warning str, "container"
    else if vars.container.value.empty()
      str = vars.format.locale.value.dev.noContainer
      selector = vars.container.selector || "";
      print.warning stringFormat(str, "\"" + selector + "\""), "container"
    else
      print.time "total draw time" if vars.dev.value
      vars.container.value.call vars.self

    value
  value:    undefined
