module.exports =
  accepted:     [Object]
  objectAccess: false
  process: (value, vars) ->

    for method, setting of value
      vars.self[method](setting) if method of vars.self

    value

  value: {}
