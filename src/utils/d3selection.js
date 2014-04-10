//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Cross-browser detect for D3 element
//------------------------------------------------------------------------------
d3plus.util.d3selection = function(selection) {
  return d3plus.ie ?
    typeof selection == "object" && selection instanceof Array
    : selection instanceof d3.selection
}
