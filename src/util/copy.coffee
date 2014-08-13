objectMerge    = require "../object/merge.coffee"
objectValidate = require "../object/validate.coffee"
#^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
# Clones a variable
#------------------------------------------------------------------------------
d3plus.util.copy = (variable) ->

  # Object Logic
  if objectValidate(variable)
    objectMerge variable

  # Array Logic
  else if variable instanceof Array
    ret = []
    variable.forEach (o) ->
      ret.push d3plus.util.copy(o)
    ret

  # Everything else just returns itself
  else
    variable
