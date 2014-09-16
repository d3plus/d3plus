module.exports =
  accepted: [String]
  chainable: false
  process: (value, vars) ->
    container = vars.container.value
    if container and value then container.selectAll(value) else value
  value: undefined
