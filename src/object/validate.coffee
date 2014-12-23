###*
# This function returns true if the variable passed is a literal javascript keyed Object. It's a small, simple function, but it catches some edge-cases that can throw off your code (such as Arrays and `null`).
# @method d3plus.object.validate
# @for d3plus.object
# @param obj {Object} The object to validate.
# @return {Boolean}
###
module.exports = (obj) -> obj and obj.constructor is Object
