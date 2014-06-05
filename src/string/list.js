//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Converts an array of strings into a string list using commas and "and".
//------------------------------------------------------------------------------
d3plus.string.list = function( list , and , max , more ) {

  if ( !(list instanceof Array) ) {
    return list
  }
  else {
    list = list.slice(0)
  }

  if ( !and ) {
    var and = d3plus.locale.en.ui.and
  }

  if ( !more ) {
    var more = d3plus.locale.en.ui.more
  }

  if ( list.length === 2 ) {
    return list.join(" "+and+" ")
  }
  else {
    
    if ( max && list.length > max ) {
      var amount = list.length - max
      list = list.slice( 0 , max )
      list[max] = d3plus.string.format( more , amount )
    }

    if ( list.length > 1 ) {
      list[list.length-1] = and+" "+list[list.length-1]
    }

    return list.join(", ")

  }

}
