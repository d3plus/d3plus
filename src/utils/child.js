//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Checks to see if element is inside of another elemebt
//------------------------------------------------------------------------------
d3plus.util.child = function(parent,child) {

  if (!parent || !child) {
    return false;
  }

  if (d3plus.util.d3selection(parent)) {
    parent = parent.node()
  }

  if (d3plus.util.d3selection(parent)) {
    child = child.node()
  }

  var node = child.parentNode;
  while (node != null) {
    if (node == parent) {
      return true;
    }
    node = node.parentNode;
  }

  return false;

}
