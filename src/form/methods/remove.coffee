module.exports =
  accepted: undefined
  process:  (value, vars) ->
    vars.container.value.remove() if @initialized
    return
  value:    undefined
