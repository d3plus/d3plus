//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Overrides keyboard behavior of the original input element.
//------------------------------------------------------------------------------
module.exports = function ( vars ) {

  if (vars.data.element.value) {

    vars.data.element.value.on("focus."+vars.container.id,function(){
      vars.self.draw({"update":false}).draw()
    })

    vars.data.element.value.on("blur."+vars.container.id,function(){

      var search = vars.search.enabled
                 ? d3.event.relatedTarget != vars.container.value.select("input").node()
                 : true

      if (search) {
        vars.self.draw({"update":false}).draw()
      }

    })

    vars.data.element.value.on("change."+vars.container.id,function(){
      vars.self.focus(this.value).draw()
    })

    vars.data.element.value.on("keydown.cancel_"+vars.container.id,function(){
      var key = d3.event.keyCode
      if (key != 9) {
        d3.event.preventDefault()
      }
    })

  }

}
