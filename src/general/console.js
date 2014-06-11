//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Custom styling and behavior for browser console statements.
//------------------------------------------------------------------------------
d3plus.console = function( type , message , style ) {

  var style = style || ""

  if ( d3plus.ie ) {

    console.log( "[ D3plus ] " + message )

  }
  else if ( type === "groupCollapsed" ) {

    if ( window.chrome && navigator.onLine ) {
      console[type]( "%c%c " + message
                   , "padding:3px 10px;line-height:25px;background-size:20px;background-position:top left;background-image:url('http://d3plus.org/assets/img/favicon.ico');"
                   , "font-weight:200;" + style )
    }
    else {
      console[type]( "%cD3plus%c " + message
                   , "line-height:25px;font-weight:800;color:#b35c1e;margin-left:0px;"
                   , "font-weight:200;" + style )
    }

  }
  else {

    console[type]( "%c" + message , style + "font-weight:200;" )

  }

}

d3plus.console.comment = function( message ) {

  this( "log" , message , "color:#aaa;" )

}

d3plus.console.error = function( message , wiki ) {

  this( "groupCollapsed" , "ERROR: " + message , "font-weight:800;color:#D74B03;" )

  this.stack()

  this.wiki( wiki )

  this.groupEnd()

}

d3plus.console.group = function( message ) {

  this( "group" , message , "color:#888;" )

}

d3plus.console.groupCollapsed = function( message ) {

  this( "groupCollapsed" , message , "color:#888;" )

}

d3plus.console.groupEnd = function() {
  if ( !d3plus.ie ) {
    console.groupEnd()
  }
}

d3plus.console.log = function( message ) {

  this( "log" , message , "color:#444444;" )

}

d3plus.console.stack = function() {

  if ( !d3plus.ie ) {

    var err = new Error()

    if ( err.stack ) {

      var stack = err.stack.split("\n")

      stack = stack.filter(function(e){
        return e.indexOf("Error") !== 0
            && e.indexOf("d3plus.js:") < 0
            && e.indexOf("d3plus.min.js:") < 0
      })

      if ( stack.length ) {

        var splitter = window.chrome ? "at " : "@"
          , url = stack[0].split(splitter)[1]

        stack = url.split(":")
        if ( stack.length === 3 ) {
          stack.pop()
        }

        var line = stack.pop()
          , page = stack.join(":").split("/")

        page = page[page.length-1]

        var message = "line "+line+" of "+page+": "+url

        this( "log" , message , "color:#D74B03;" )

      }

    }
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

d3plus.console.warning = function( message , wiki ) {

  this( "groupCollapsed" , message , "color:#888;" )

  this.stack()

  this.wiki( wiki )

  this.groupEnd()

}

d3plus.console.wiki = function( wiki ) {

  if ( wiki && wiki in d3plus.wiki ) {
    var url = d3plus.repo + "wiki/" + d3plus.wiki[wiki]
    this( "log" , "documentation: " + url , "color:#aaa;" )
  }

}
