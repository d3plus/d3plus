//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates a Button
//------------------------------------------------------------------------------
d3plus.input.button = function( vars ) {

  var self = this.button

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Bind Data to Buttons
  //----------------------------------------------------------------------------
  var button = vars.container.ui.selectAll("div.d3plus_node")
    .data(vars.data.app,function(d){
      return d[vars.id.value]
    })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Enter Buttons
  //----------------------------------------------------------------------------
  if ( vars.dev.value ) d3plus.console.time("enter")

  button.enter().append("div")
    .attr("class","d3plus_node")
    .call( self.color , vars )
    .call( self.style , vars )
    .call( self.icons , vars )
    .call( self.mouseevents , vars , self.color )

  if ( vars.dev.value ) d3plus.console.timeEnd("enter")

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Update Buttons
  //----------------------------------------------------------------------------
  if (vars.draw.update || vars.draw.timing) {

    if ( vars.dev.value ) d3plus.console.time("ordering")
    button.order()
    if ( vars.dev.value ) d3plus.console.timeEnd("ordering")

    var updatedButtons = button

  }
  else {

    var checks = [ vars.focus.previous
                 , vars.focus.value
                 , vars.hover.previous
                 , vars.hover.value ].filter(function(c){ return c })

    var updatedButtons = button.filter(function(b){
      return checks.indexOf(b[vars.id.value]) >= 0
    })

  }

  if ( vars.dev.value ) d3plus.console.time("update")
  if (vars.draw.timing) {
    updatedButtons
      .transition().duration(vars.draw.timing)
      .call( self.color , vars )
      .call( self.style , vars )
  }
  else {
    updatedButtons
      .call( self.color , vars )
      .call( self.style , vars )
  }

  updatedButtons
    .call( self.icons , vars )
    .call( self.mouseevents , vars , self.color )
  if ( vars.dev.value ) d3plus.console.timeEnd("update")

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Exit Buttons
  //----------------------------------------------------------------------------
  button.exit().remove()

}
