print = require "../../core/console/print.coffee"

module.exports =
  accepted: [undefined]
  process  : (value, vars) ->

    return value if this.initialized is false

    if vars.container.value is false
      str = vars.format.locale.value.dev.setContainer
      print.warning str, "container"
    else if vars.container.value.empty()
      str = vars.format.locale.value.dev.noContainer
      print.warning stringFormat(str, "\"" + vars.container.value + "\""), "container"
    else
      if vars.dev.value
        if vars.methodGroup
          vars.methodGroup = "wait"
          print.groupEnd()
        print.time "total draw time"

      vars.container.value.call vars.self

    value
  value:    undefined
