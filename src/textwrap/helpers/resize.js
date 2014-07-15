//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Logic to determine the best size for text
//------------------------------------------------------------------------------
d3plus.textwrap.resize = function( vars , line ) {

  if ( vars.resize.value ) {

    var words = []
    for ( var i = 0 ; i < vars.text.words.length ; i++ ) {
      var addon = i === vars.text.words.length - 1 ? "" : " "
      words.push( vars.text.words[i] + addon )
    }

    // Start by trying the largest font size
    var sizeMax   = Math.floor( vars.size.value[1] )
      , lineWidth = vars.shape.value === "circle" ? vars.width.value * 0.785
                  : vars.width.value
      , sizes     = d3plus.font.sizes( words
                                     , { "font-size" : sizeMax + "px" }
                                     , vars.container.value )
      , maxWidth  = d3.max( sizes , function(d){ return d.width } )
      , areaMod   = 1.165 + (vars.width.value/vars.height.value*0.037)
      , textArea  = d3.sum( sizes , function(d){ return d.width * d.height } ) * areaMod
      , boxArea   = vars.shape.value === "circle"
                  ? Math.PI * Math.pow( vars.width.value / 2 , 2 )
                  : lineWidth * vars.height.value

    if ( maxWidth > lineWidth || textArea > boxArea ) {

      var areaRatio  = Math.sqrt( boxArea / textArea )
        , widthRatio = lineWidth / maxWidth
        , sizeRatio  = d3.min([ areaRatio , widthRatio ])

      sizeMax = d3.max([ vars.size.value[0] , Math.floor( sizeMax * sizeRatio ) ])

    }

    var heightMax = Math.floor(vars.height.value * 0.8)

    if ( sizeMax > heightMax ) {
      sizeMax = heightMax
    }

    if ( maxWidth * (sizeMax/vars.size.value[1]) <= lineWidth ) {

      if ( sizeMax !== vars.size.value[1] ) {
        vars.self.size([ vars.size.value[0] , sizeMax ])
      }

      vars.container.value.attr( "font-size" , vars.size.value[1]+"px" )
      this.flow( vars )

    }
    else {
      this.wrap( vars )
    }

  }

}
