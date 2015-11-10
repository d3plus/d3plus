validObject  = require "../../object/validate.coffee"
uniqueValues = require "../../util/uniques.coffee"

#^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
# Finds a given variable by searching through the data and attrs
#------------------------------------------------------------------------------
find = (vars, node, variable, depth) ->

  nodeObject = validObject node
  return variable node, vars if typeof variable is "function" and nodeObject

  # Checks inside the "node" variable if it is an object. If the variable is not
  # avaiable inside of the object, "node" gets reset to it's ID value to help
  # searching through the data and attributes lists.
  if nodeObject

    if variable of node
      return node[variable]


    cache = vars.data.cacheID + "_" + depth
    cacheInit node, cache, vars

    # Checks if the variable has already been fetched.
    if variable of node.d3plus.data[cache]
      return node.d3plus.data[cache][variable]

    if depth of node
      node = node[depth]
    else if vars.id.value of node
      node = node[vars.id.value]
      if depth isnt variable
        returned = checkData(vars, node, depth, vars.id.value)
      if returned is null or returned is undefined
        returned = checkAttrs(vars, node, depth, vars.id.value)
      if returned is null or returned is undefined
        return null
      else if depth is variable
        return returned
      node = returned
    else
      return null

  node = uniqueValues node if node instanceof Array and not validObject node[0]

  # Checks for unique values inside of the "node" variable if it is an Array and
  # the first item inside of the object is a keyed Object.
  if node instanceof Array and validObject node[0]
    val = uniqueValues node, variable
    return val if val.length

  # Checks inside of the visualization data array, if available, for the needed
  # variable (given the node ID).
  val = checkData(vars, node, variable, depth)
  return val if val

  # Checks inside of the attribute list, if available
  val = checkAttrs(vars, node, variable, depth)

  val

checkData = (vars, node, variable, depth) ->

  if vars.data.viz instanceof Array and variable of vars.data.keys
    val = uniqueValues filterArray(vars.data.viz, node, depth), variable
  return if val and val.length then val else null

checkAttrs = (vars, node, variable, depth) ->

  if "attrs" of vars and vars.attrs.value and variable of vars.attrs.keys

    if validObject(vars.attrs.value) and depth of vars.attrs.value
      attrList = vars.attrs.value[depth]
    else
      attrList = vars.attrs.value

    if attrList instanceof Array
      val = uniqueValues filterArray(attrList, node, depth), variable
      return val if val.length
    else if node instanceof Array
      attrList = [attrList[n] for n in node if n of attrList]
      if attrList.length
        vals = uniqueValues attrList, variable
        return vals if vals.length
    else if node of attrList
      return attrList[node][variable]

  null

# Filters a given array of data based on the current node ID.
filterArray = (arr, node, depth) ->
  if node instanceof Array
    arr.filter (d) -> node.indexOf(d[depth]) >= 0
  else
    arr.filter (d) -> d[depth] is node

cacheInit = (node, cache, vars) ->
  node.d3plus = {} unless "d3plus" of node
  node.d3plus.data = {} unless "data" of node.d3plus
  if vars.data.changed or (vars.attrs and vars.attrs.changed) or !(cache of node.d3plus.data)
    node.d3plus.data[cache] = {}
  node

valueParse = (vars, node, depth, variable, val) ->
  return val if val is null
  timeVar = "time" of vars and vars.time.value is variable
  val     = [val] unless val instanceof Array
  for v, i in val
    if timeVar and v isnt null and v.constructor isnt Date
      v = v + ""
      v += "/01/01" if v.length is 4 and parseInt(v)+"" is v
      d = new Date v
      if d isnt "Invalid Date"
        # d.setTime d.getTime() + d.getTimezoneOffset() * 60 * 1000
        val[i] = d
  val = val[0] if val.length is 1
  if val isnt null and validObject(node) and
     typeof variable is "string" and
     variable not of node
    cache = vars.data.cacheID + "_" + depth
    node.d3plus.data[cache][variable] = val
  val

fetchArray = (vars, arr, variable, depth) ->
  val = []
  for item in arr
    if validObject item
      v = find vars, item, variable, depth
      val.push valueParse vars, item, depth, variable, v
    else
      val.push item
  val = uniqueValues(val) if typeof val[0] isnt "number"
  if val.length is 1 then val[0] else val

fetch = (vars, node, variable, depth) ->

  return null unless variable
  return variable if typeof variable is "number"

  nodeObject = validObject node
  depth      = vars.id.value unless depth

  if nodeObject and node.values instanceof Array
    val = fetchArray vars, node.values, variable, depth
  else if nodeObject and node[variable] instanceof Array
    val = fetchArray vars, node[variable], variable, depth
  else if node instanceof Array
    val = fetchArray vars, node, variable, depth
  else
    val = find vars, node, variable, depth
    val = valueParse vars, node, depth, variable, val

  val

module.exports = fetch
