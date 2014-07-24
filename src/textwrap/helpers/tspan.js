//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Flows the text into tspans
//------------------------------------------------------------------------------
d3plus.textwrap.tspan = function( vars ) {

  var xPosition  = vars.container.value.attr("x") || "0px"
    , words      = vars.text.words.slice(0)
    , tspans     = false
    , fontSize   = vars.resize.value ? vars.size.value[1] : vars.container.fontSize || vars.size.value[0]
    , textBox    = vars.container.value.append("tspan").text( words[0] )
                     .attr( "dy" , fontSize + "px" )
    , textHeight = textBox.node().offsetHeight || textBox.node().getBoundingClientRect().height
    , line       = 1
    , newLine    = function( ) {
      return vars.container.value.append("tspan")
              .attr( "x" , xPosition )
              .attr( "dy" , fontSize + "px" )
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

          var baseline = (line-1) * textHeight
            , lineWidth = vars.shape.value === "circle"
                        ? 2*Math.sqrt( baseline*( (2*(vars.width.value/2))-baseline ) )
                        : vars.width.value

          if ( textBox.node().getComputedTextLength() > lineWidth ) {
            ellipsis()
          }

        }

      }
      else {

        textBox.remove()
        textBox = d3.select( vars.container.value.node().lastChild )
        if ( !textBox.empty() ) {
          line--
          truncate()
        }

      }

    }

  if ( vars.shape.value === "circle" ) {
    vars.container.value.attr( "text-anchor" , "middle" )
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


    var baseline = (line-1) * textHeight
      , lineWidth = vars.shape.value === "circle"
                  ? 2*Math.sqrt( baseline*( (2*(vars.width.value/2))-baseline ) )
                  : vars.width.value

    if ( textBox.node().getComputedTextLength() > lineWidth ) {

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
