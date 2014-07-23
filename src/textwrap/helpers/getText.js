//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Fetches text if not specified, and formats text to array.
//------------------------------------------------------------------------------
d3plus.textwrap.getText = function( vars ) {

  if ( !vars.text.value ) {

    var text = vars.container.value.text()

    if (text) {

      if ( text.indexOf("tspan") >= 0 ) {
        text.replace(/\<\/tspan\>\<tspan\>/g," ")
        text.replace(/\<\/tspan\>/g,"")
        text.replace(/\<tspan\>/g,"")
      }

      vars.self.text( text )

    }

  }

  if ( vars.text.value instanceof Array ) {
    vars.text.phrases = vars.text.value.filter(function(t){
      return [ "string" , "number" ].indexOf(typeof t) >= 0
    })
  }
  else {
    vars.text.phrases = [ vars.text.value + "" ]
  }

  vars.container.value.text("")

}
