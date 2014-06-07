//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Custom styling and behavior for browser console statements.
//------------------------------------------------------------------------------
d3plus.console = function( type , message , style ) {

  if ( d3plus.ie ) {

    console.log( "[d3plus] " + message )

  }
  else if ( type === "groupCollapsed" ) {

    var style = style || "font-weight:bold;"

    console[type]( "%c[d3plus]%c " + message
                 , "color:#B35C1E;font-weight:bold;"
                 , style )

  }
  else {

    var style = style || "font-weight:bold;"

    console[type]( "%c" + message , style )

  }

}

d3plus.console.comment = function( message , style ) {

  var style = style || "color:#aaa;font-weight:normal;"

  this( "log" , message , style )

}

d3plus.console.error = function( message , style ) {

  var style = style || "color:#D74B03;font-weight:bold;"

  this( "error" , message , style )

  this.stack()

}

d3plus.console.group = function( message , style ) {

  var style = style || "color:#444444;font-weight:bold;"

  this( "groupCollapsed" , message , style )

}

d3plus.console.groupEnd = function() {
  if ( !d3plus.ie ) {
    console.groupEnd()
  }
}

d3plus.console.log = function( message , style ) {

  var style = style || "color:#444444;font-weight:normal;"

  this( "log" , message , style )

}

d3plus.console.stack = function() {

  if ( !d3plus.ie ) {

    var err = new Error()
      , stack = err.stack.split("\n")
      , style = "color:#D74B03;font-weight:normal;"

    stack = stack.filter(function(e){
      return e.indexOf("Error") !== 0
          && e.indexOf("d3plus.js:") < 0
          && e.indexOf("d3plus.min.js:") < 0
    })

    var url = stack[0].split("at ")[1]

    stack = url.split(":")
    stack.pop()

    var line = stack.pop()
      , page = stack.join(":").split("/")

    page = page[page.length-1]

    var message = "line "+line+" of "+page+": "+url

    this( "info" , message , style )

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

d3plus.console.warning = function( message , style ) {

  var style = style || "color:#F3D261;font-weight:bold;"

  this( "warn" , message , style )

}

d3plus.console.wiki = function( message , style ) {

  var style = style || "color:#aaa;font-weight:normal;"

  this( "info" , "documentation: " + message , style )

}
