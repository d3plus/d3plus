//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Calculates the height and orientation of the dropdown list, based on
// available screen space.
//------------------------------------------------------------------------------
d3plus.input.drop.height = function ( vars ) {

  var buttonHeight = vars.container.button.container().node().offsetHeight
    , position     = vars.container.value.node().getBoundingClientRect()

  vars.height.secondary = window.innerHeight-position.top
  vars.height.secondary -= buttonHeight
  vars.height.secondary -= 10

  if ( vars.height.secondary < buttonHeight*2 ) {
    vars.height.secondary = position.top-10
    vars.self.open({"flipped": true})
  }
  else {
    vars.self.open({"flipped": false})
  }

  var scrolling = false
  if (vars.height.secondary > vars.height.max) {
    vars.height.secondary = vars.height.max
  }

}
