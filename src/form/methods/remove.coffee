module.exports =
  accepted: [undefined, Function]
  process:  (value, vars) ->
    vars.container.ui.remove() if @initialized
    delete vars.container.ui
    return
  value:    undefined
