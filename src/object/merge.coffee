d3selection = require "../util/d3selection.coffee"
validate    = require "./validate.coffee"

###*
# Given any two objects, this method will merge the two objects together, returning a new third object. The values of the second object always overwrite the first.
# @method d3plus.object.merge
# @for d3plus.object
# @param obj1 {Object} The primary object.
# @param obj2 {Object} The secondary object to merge into the first.
# @return {Object}
###
module.exports = (obj1, obj2) ->

  copyObject = (obj, ret) ->
    for a of obj
      unless typeof obj[a] is "undefined"
        if validate(obj[a])
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
