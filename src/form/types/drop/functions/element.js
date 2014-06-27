//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Overrides keyboard behavior of the original input element.
//------------------------------------------------------------------------------
d3plus.input.drop.element = function ( vars ) {

  if (vars.data.element) {

    vars.data.element.on("focus."+vars.container.id,function(){
      vars.self.draw({"update":false}).hover(true).draw()
    })

    vars.data.element.on("blur."+vars.container.id,function(){

      var search = vars.search.enabled
                 ? d3.event.relatedTarget != vars.container.select("input").node()
                 : true

      if (search) {
        vars.self.draw({"update":false}).hover(false).draw()
      }

    })

    vars.data.element.on("change."+vars.container.id,function(){
      vars.self.focus(this.value).draw()
    })

    vars.data.element.on("keydown.cancel_"+vars.container.id,function(){
      var key = d3.event.keyCode
      if (key != 9) {
        d3.event.preventDefault()
      }
    })

  }

}
