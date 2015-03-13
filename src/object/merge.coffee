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

  copyObject = (obj, ret, shallow) ->
    for k, v of obj
      unless typeof v is "undefined"
        if !shallow and validate v
          ret[k] = {} if typeof ret[k] isnt "object"
          copyObject v, ret[k], k.indexOf("d3plus") is 0
        else if not d3selection(v) and v instanceof Array
          ret[k] = v.slice 0
        else
          ret[k] = v

  obj3 = {}

  copyObject obj1, obj3 if obj1
  copyObject obj2, obj3 if obj2

  obj3
