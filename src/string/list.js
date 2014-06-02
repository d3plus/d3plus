//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Converts an array of strings into a string list using commas and "and".
//------------------------------------------------------------------------------
d3plus.string.list = function( list , and ) {

  if ( !and ) {
    var and = d3plus.locale.en.ui.and
  }

  if (list.length == 2) {
    return list.join(" "+and+" ")
  }
  else {
    list[list.length-1] = and+" "+list[list.length-1]
    return list.join(", ")
  }

}
