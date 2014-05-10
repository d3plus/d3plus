//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Toggles the state of the dropdown menu.
//------------------------------------------------------------------------------
d3plus.input.drop.toggle = function ( vars ) {

  if (vars.open.value) {
    vars.self.open(false)
  }
  else {
    vars.self.open(true)
  }

  var listLength = vars.container.list.select("div")
                     .selectAll("div.d3plus_node").size()

  if ( vars.data.url && (!vars.data.loaded || vars.data.stream) ) {
    this.update( vars )
    d3plus.data.json( vars , "data" ,  vars.self.draw )
  }
  else if ( vars.data.value.length !== listLength ) {
    vars.self.draw()
  }
  else {
    this.update( vars )
  }

}
