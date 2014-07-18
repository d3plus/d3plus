//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Assigns behavior to the user's keyboard for navigation.
//------------------------------------------------------------------------------
module.exports = function ( vars ) {

  d3.select(document).on("keydown."+vars.container.id,function(){

    if (vars.open.value || vars.hover === true) {

      var key = d3.event.keyCode,
          options = vars.container.list.select("div").selectAll("div.d3plus_node"),
          index = 0

      if (typeof vars.hover == "boolean") {
        options.each(function(d,i){
          if (d.value == vars.focus) {
            index = i
          }
        })
      }
      else {
        options.each(function(d,i){
          if (d.value == vars.hover) {
            index = i
          }
        })
      }

      // Tab
      if ([9].indexOf(key) >= 0 && (!vars.search.enabled || (vars.search.enabled && !d3.event.shiftKey))) {
        vars.self.draw({"update":false}).disable()
      }
      // Down Arrow
      else if ([40].indexOf(key) >= 0) {
        if (vars.open.value) {
          if (index >= options.size()-1) {
            index = 0
          }
          else {
            index += 1
          }
        }

        if (typeof vars.hover != "boolean") {
          var hover = options.data()[index].value
        }
        else {
          var hover = vars.focus
        }

        if (vars.open.value) {
          vars.self.draw({"update":false}).hover(hover).draw(60)
        }
        else {
          vars.self.draw({"update":false}).hover(hover).enable()
        }

      }
      // Up Arrow
      else if ([38].indexOf(key) >= 0) {
        if (vars.open.value) {
          if (index <= 0) {
            index = options.size()-1
          }
          else {
            index -= 1
          }
        }

        if (typeof vars.hover != "boolean") {
          var hover = options.data()[index].value
        }
        else {
          var hover = vars.focus
        }

        if (vars.open.value) {
          vars.self.draw({"update":false}).hover(hover).draw(60)
        }
        else {
          vars.self.draw({"update":false}).hover(hover).enable()
        }

      }
      // Enter/Return
      else if ([13].indexOf(key) >= 0) {
        if (typeof vars.hover != "boolean") {
          vars.self.value(vars.hover).draw()
        }
        else {
          vars.self.hover(vars.focus).toggle()
        }
      }
      // Esc
      else if ([27].indexOf(key) >= 0) {
        if (vars.open.value) {
          vars.self.disable()
        }
        else if (vars.hover === true) {
          vars.self.hover(false).draw()
        }
      }

    }

  })

}
