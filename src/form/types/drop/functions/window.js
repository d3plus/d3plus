var child = require("../../../../util/child.coffee")

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Recursive function that applies a click event to all parent windows that
// will close the dropdown if it is open.
//------------------------------------------------------------------------------
var windowEvents = function ( vars , elem ) {

  if ( elem === undefined ) {
    var elem = window
  }

  d3.select(elem).on("click."+vars.container.id,function(){

    var element = d3.event.target || d3.event.toElement
      , parent  = element.parentNode

    if ( parent && ["d3plus_node","d3plus_drop_title"].indexOf(parent.className) >= 0 ) {
      element = parent.parentNode
    }

    if (element && parent && !child(vars.container.ui, element) && (vars.open.value || vars.hover.value)) {
      vars.self.open(false).hover(false).draw()
    }

  })

  try {
    var same_origin = window.parent.location.host === window.location.host;
  }
  catch (e) {
    var same_origin = false
  }

  if (same_origin) {
    if (elem.self !== window.top) {
      windowEvents( vars , elem.parent )
    }
  }

}

module.exports = windowEvents
