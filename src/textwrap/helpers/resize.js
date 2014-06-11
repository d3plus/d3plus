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
      , sizes     = d3plus.font.sizes( words
                                     , { "font-size" : sizeMax + "px" }
                                     , vars.container.value )
      , maxWidth  = d3.max( sizes , function(d){ return d.width } )
      , textArea  = d3.sum( sizes , function(d){ return d.width * d.height } ) * 1.2
      , boxArea   = vars.width.value * vars.height.value

    if ( maxWidth > vars.width.value || textArea > boxArea ) {

      var areaRatio  = Math.sqrt( boxArea / textArea )
        , widthRatio = vars.width.value / maxWidth
        , sizeRatio  = d3.min([ areaRatio , widthRatio ])

      sizeMax = d3.max([ vars.size.value[0] , Math.floor( sizeMax * sizeRatio ) ])

    }
    
    if ( maxWidth * (sizeMax/vars.size.value[1]) <= vars.width.value ) {

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
