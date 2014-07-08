//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Flows the text into the container
//------------------------------------------------------------------------------
d3plus.textwrap.wrap = function( vars ) {

  if ( vars.text.phrases.length ) {

    vars.text.current = vars.text.phrases.shift() + ""
    vars.text.words   = vars.text.current.match(vars.text.break)

    if ( vars.resize.value ) {
      this.resize( vars )
    }
    else {
      this.flow( vars )
    }

  }

}
