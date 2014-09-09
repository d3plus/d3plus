objectMerge    = require "../object/merge.coffee"
objectValidate = require "../object/validate.coffee"

# Clones a variable
copy = (variable) ->

  # Object Logic
  if objectValidate(variable)
    objectMerge variable

  # Array Logic
  else if variable instanceof Array
    ret = []
    variable.forEach (o) ->
      ret.push copy(o)
    ret

  # Everything else just returns itself
  else
    variable

module.exports = copy
