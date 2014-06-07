//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Custom styling and behavior for browser console statements.
//------------------------------------------------------------------------------
d3plus.console = function( type , message , style ) {

  if ( d3plus.ie ) {

    console.log( "[d3plus] " + message )

  }
  else if ( type === "groupCollapsed" ) {

    var style = style || ""

    if ( window.chrome && navigator.onLine ) {
      console[type]( "%c%c " + message
                   , "padding:3px 10px;line-height:25px;background-size:20px;background-position:top left;background-image:url('http://d3plus.org/assets/img/favicon.ico');"
                   , style+"font-weight:200;" )
    }
    else {
      console[type]( "%cD3plus%c " + message
                   , "line-height:25px;font-weight:800;font-color:#444;margin-left:0px;"
                   , style+"font-weight:200;" )
    }

  }
  else {

    var style = style || ""

    console[type]( "%c" + message , style + "font-weight:200;" )

  }

}

d3plus.console.comment = function( message , style ) {

  var style = style || "color:#aaa;"

  this( "log" , message , style )

}

d3plus.console.error = function( message , style ) {

  var style = style || "color:#D74B03;"

  this( "error" , message , style )

  this.stack()

}

d3plus.console.group = function( message , style ) {

  var style = style || "color:#888;"

  this( "groupCollapsed" , message , style )

}

d3plus.console.groupEnd = function() {
  if ( !d3plus.ie ) {
    console.groupEnd()
  }
}

d3plus.console.log = function( message , style ) {

  var style = style || "color:#444444;"

  this( "log" , message , style )

}

d3plus.console.stack = function() {

  if ( !d3plus.ie ) {

    var err = new Error()
      , stack = err.stack.split("\n")
      , style = "color:#D74B03;"

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

  var style = style || "color:#F3D261;"

  this( "warn" , message , style )

}

d3plus.console.wiki = function( message , style ) {

  var style = style || "color:#aaa;"

  this( "info" , "documentation: " + message , style )

}
