###*
 * Checks to see if the passed object has keys and is not an array.
 ###
d3plus.object.validate = (obj) ->
  obj isnt null and typeof obj is "object" and (obj not instanceof Array)

module.exports = d3plus.object.validate
