validObject  = require "../../object/validate.coffee"
uniqueValues = require "../../util/uniques.coffee"

#^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
# Finds a given variable by searching through the data and attrs
#------------------------------------------------------------------------------
fetch = (vars, node, variable, depth) ->

  return null unless variable
  return variable node, vars if typeof variable is "function"
  return variable if typeof variable is "number"

  depth      = vars.id.value unless depth
  nodeObject = validObject node

  # Filters a given array of data based on the current node ID.
  filterArray = (arr) ->
    if node instanceof Array
      arr.filter (d) -> node.indexOf(d[depth]) >= 0
    else
      arr.filter (d) -> d[depth] is node

  # Checks inside the "node" variable if it is an object. If the variable is not
  # avaiable inside of the object, "node" gets reset to it's ID value to help
  # searching through the data and attributes lists.
  if nodeObject

    if variable of node
      return node[variable]

    # Checks if the variable has already been fetched.
    method = vars.methods.filter (m) -> vars[m].value is variable
    if method.length
      changed = false
      for m in method
        if vars[m].changed
          changed = true
          break
      if d3plus of node and "data" of node.d3plus and variable of node.d3plus.data and !changed
        return node.d3plus.data[variable]

    node = node[depth]

  node = uniqueValues(node, depth) if node instanceof Array

  # Checks for unique values inside of the "node" variable if it is an Array and
  # the first item inside of the object is a keyed Object.
  if node instanceof Array and validObject node[0]
    val = uniqueValues node, variable
    return val if val.length

  # Checks inside of the visualization data array, if available, for the needed
  # variable (given the node ID).
  if vars.data.viz instanceof Array
    val = uniqueValues filterArray(vars.data.viz), variable
    return val if val.length

  # Checks inside of the attribute list, if available.
  if "attrs" of vars and vars.attrs.value

    if validObject(vars.attrs.value) and depth of vars.attrs.value
      attrList = vars.attrs.value[depth]
    else
      attrList = vars.attrs.value

    if attrList instanceof Array
      val = uniqueValues filterArray(attrList), variable
      return val if val.length
    else if node instanceof Array
      attrList = [attrList[n] for n in node if n of attrList]
      if attrList.length
        vals = uniqueValues(attrList, variable)
        return vals if vals.length
    else if node of attrList
      return attrList[node][variable]

  null

module.exports = (vars, node, variable, depth) ->

  nodeObject = validObject node

  if nodeObject and node.values instanceof Array
    for item in node.values
      val = fetch vars, item, variable, depth
      break if val
  else
    val = fetch vars, node, variable, depth

  if (nodeObject and typeof variable is "string" and
      variable not of node and "d3plus" of node)
    node.d3plus.data = {} unless "data" of node.d3plus
    node.d3plus.data[variable] = val

  if val instanceof Array and val.length is 1 then val[0] else val
