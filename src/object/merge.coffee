d3selection = require "../util/d3selection.js"

###*
 * Merge two objects to create a new one with the properties of both
 ###
d3plus.object.merge = (obj1, obj2) ->

  copyObject = (obj, ret) ->
    for a of obj
      unless typeof obj[a] is "undefined"
        if d3plus.object.validate(obj[a])
          ret[a] = {}  if typeof ret[a] isnt "object"
          copyObject obj[a], ret[a]
        else if not d3selection(obj[a]) and obj[a] instanceof Array
          ret[a] = obj[a].slice(0)
        else
          ret[a] = obj[a]

  obj3 = {}

  copyObject obj1, obj3 if obj1
  copyObject obj2, obj3 if obj2

  obj3

module.exports = d3plus.object.merge
