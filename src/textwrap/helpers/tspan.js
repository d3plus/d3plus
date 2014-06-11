//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Flows the text into tspans
//------------------------------------------------------------------------------
d3plus.textwrap.tspan = function( vars ) {

  var xPosition  = vars.container.value.attr("x") || "0px"
    , words      = vars.text.words.slice(0)
    , tspans     = false
    , textBox    = vars.container.value.append("tspan").text( words[0] )
                     .attr( "dy" , vars.size.value[1] + "px" )
    , textHeight = textBox.node().offsetHeight
    , line       = 1
    , newLine    = function( ) {
      return vars.container.value.append("tspan")
              .attr( "x" , xPosition )
              .attr( "dy" , vars.size.value[1] + "px" )
    }
    , truncate   = function( ) {

      if ( !textBox.empty() ) {

        words = textBox.text().match(/[^\s-]+-?/g)

        ellipsis()

      }

    }
    , ellipsis   = function( ) {

      if ( words && words.length ) {

        var lastWord = words.pop()
          , lastChar = lastWord.charAt( lastWord.length-1 )

        if ( lastWord.length === 1
        && vars.text.split.indexOf( lastWord ) >= 0 ) {
          ellipsis()
        }
        else {

          if ( vars.text.split.indexOf( lastChar ) >= 0 ) {
            lastWord = lastWord.substr( 0 , lastWord.length - 1 )
          }

          textBox.text( words.join(" ") + " " + lastWord + " ..." )

          if ( textBox.node().getComputedTextLength() > vars.width.value ) {
            ellipsis()
          }

        }

      }
      else {

        textBox.remove()
        textBox = d3.select( vars.container.value.node().lastChild )
        if ( !textBox.empty() ) truncate()

      }

    }

  for ( var i = 1 ; i < words.length ; i++ ) {

    if ( line * textHeight > vars.height.value ) {
      textBox.remove()
      if ( i !== 1 ) {
        textBox = d3.select( vars.container.value.node().lastChild )
        if ( !textBox.empty() ) truncate()
      }
      break

    }

    var current   = textBox.text()
      , lastChar = current.slice(-1)
      , next_char = vars.text.current.charAt( vars.text.current.indexOf(current) + current.length )
      , joiner    = next_char == " " ? " " : ""

    textBox.text( current + joiner + words[i] )

    if ( textBox.node().getComputedTextLength() > vars.width.value ) {

      if ( !tspans ) {
        textBox.text("")
        textBox = newLine()
      }

      textBox.text( current )

      textBox = newLine()
      textBox.text( words[i] )

      line++

    }

  }

}
