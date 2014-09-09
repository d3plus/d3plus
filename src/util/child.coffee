d3selection = require "./d3selection.coffee"

# Checks to see if element is inside of another element
module.exports = (parent, child) ->

  return false if not parent or not child

  parent = parent.node() if d3selection(parent)
  child = child.node() if d3selection(parent)
  node = child.parentNode

  while node isnt null
    return true if node is parent
    node = node.parentNode

  false
