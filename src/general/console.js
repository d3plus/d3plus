//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Custom styling and behavior for browser console statements.
//------------------------------------------------------------------------------
d3plus.console = function( type , message , style ) {

  if ( d3plus.ie ) {

    console.log( "[d3plus] " + message )

  }
  else {

    var style = style || "font-weight:bold;"

    console[type]( "%c[d3plus]%c " + message
                 , "color:#B35C1E;font-weight:bold;"
                 , style )

  }

}

d3plus.console.log = function( message , style ) {

  var style = style || "color:#444444;font-weight:normal;"

  this( "log" , message , style )

}

d3plus.console.comment = function( message , style ) {

  var style = style || "color:#aaa;font-weight:normal;"

  this( "log" , message , style )

}

d3plus.console.group = function( message , style ) {

  var style = style || "color:#444444;font-weight:bold;"

  this( "group" , message , style )

}

d3plus.console.warning = function( message , style ) {

  var style = style || "color:#D74B03;font-weight:bold;"

  message = "WARNING: " + message

  this( "log" , message , style )

}

d3plus.console.groupEnd = function() {

  if ( !d3plus.ie ) {

    console.groupEnd()

  }

}

d3plus.console.time = function( message ) {

  if ( !d3plus.ie ) {

    console.time( message )

  }

}

d3plus.console.timeEnd = function( message ) {

  if ( !d3plus.ie ) {

    console.timeEnd( message )

  }

}
